import Decimal from "decimal.js";
import { Buffer } from "buffer";
import { keyStores, connect, Near, providers } from "near-api-js";
import { config_near, getSdkEnv } from "../config";

const activeNearNodeUrls: Partial<Record<string, string>> = {};

function getNearNodeUrls(): string[] {
  const configuredUrls =
    config_near.nodeUrls && config_near.nodeUrls.length
      ? config_near.nodeUrls
      : [config_near.nodeUrl];
  return Array.from(new Set(configuredUrls.filter(Boolean)));
}

function getActiveNearNodeUrl(nodeUrls: string[]): string {
  const env = getSdkEnv();
  const activeNodeUrl = activeNearNodeUrls[env];
  if (activeNodeUrl && nodeUrls.includes(activeNodeUrl)) {
    return activeNodeUrl;
  }
  return nodeUrls[0];
}

function getNearNodeUrlAttempts(nodeUrls: string[]): string[] {
  const activeNodeUrl = getActiveNearNodeUrl(nodeUrls);
  return [
    activeNodeUrl,
    ...nodeUrls.filter((nodeUrl) => nodeUrl !== activeNodeUrl),
  ];
}

function setActiveNearNodeUrl(nodeUrl: string) {
  activeNearNodeUrls[getSdkEnv()] = nodeUrl;
}

function isTransientNearRpcError(error: unknown): boolean {
  const maybeError = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    type?: string;
    name?: string;
    message?: string;
  };
  const status = maybeError.status ?? maybeError.statusCode;
  if (
    status === 408 ||
    status === 429 ||
    (typeof status === "number" && status >= 500)
  ) {
    return true;
  }

  const errorText = [
    maybeError.code,
    maybeError.type,
    maybeError.name,
    maybeError.message,
    String(error),
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "RetriesExceeded",
    "TooManyRequests",
    "Failed to fetch",
    "FetchError",
    "NetworkError",
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "fetch failed",
  ].some((pattern) => errorText.includes(pattern));
}

function formatNearRpcError(nodeUrl: string, error: unknown): string {
  const maybeError = error as {
    status?: number;
    statusCode?: number;
    message?: string;
  };
  const status = maybeError.status ?? maybeError.statusCode;
  const statusText = status ? `HTTP ${status}: ` : "";
  return `${nodeUrl} -> ${statusText}${maybeError.message || String(error)}`;
}

function createNearRpcHttpError(
  nodeUrl: string,
  status: number,
  body: string
): Error {
  const error = new Error(
    `NEAR RPC ${nodeUrl} returned HTTP ${status}: ${body}`
  );
  Object.assign(error, { status, statusCode: status });
  return error;
}

async function sendNearRpc<T>(
  nodeUrl: string,
  method: string,
  params: Record<string, any>
): Promise<T> {
  const response = await fetch(nodeUrl, {
    method: "POST",
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "dontcare",
      method,
      params,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw createNearRpcHttpError(
      nodeUrl,
      response.status,
      await response.text()
    );
  }

  const payload = await response.json();
  if (payload.error) {
    const error = new Error(
      `NEAR RPC ${nodeUrl} returned error: ${JSON.stringify(payload.error)}`
    );
    Object.assign(error, {
      type: payload.error.name,
      code: payload.error.code,
    });
    throw error;
  }

  return payload.result;
}

async function withNearRpcFailover<T>(
  operation: (nodeUrl: string) => Promise<T>
): Promise<T> {
  const nodeUrls = getNearNodeUrls();
  if (!nodeUrls.length) {
    throw new Error("No NEAR RPC node URLs configured");
  }

  const attempts = getNearNodeUrlAttempts(nodeUrls);
  const transientErrors: string[] = [];

  for (const nodeUrl of attempts) {
    try {
      const result = await operation(nodeUrl);
      setActiveNearNodeUrl(nodeUrl);
      return result;
    } catch (error) {
      if (!isTransientNearRpcError(error)) {
        throw error;
      }

      transientErrors.push(formatNearRpcError(nodeUrl, error));
      if (attempts.length === 1) {
        throw error;
      }
    }
  }

  throw new Error(
    `NEAR RPC request failed for all configured endpoints: ${transientErrors.join(
      "; "
    )}`
  );
}

export async function getNearConnection(
  nodeUrl = config_near.nodeUrl
): Promise<Near> {
  let keyStore: keyStores.KeyStore;
  if (typeof (globalThis as any)["window"] === "undefined") {
    keyStore = new keyStores.InMemoryKeyStore();
  } else {
    keyStore = new keyStores.BrowserLocalStorageKeyStore();
  }
  const connection = await connect({
    keyStore,
    networkId: config_near.networkId,
    nodeUrl,
    provider: new providers.JsonRpcProvider(
      { url: nodeUrl },
      { retries: 1, wait: 0, backoff: 1 }
    ),
  });
  return connection;
}

export async function getAccountConnection(
  accountId?: string,
  nodeUrl?: string
) {
  const connection = await getNearConnection(nodeUrl);
  const account = await connection.account(
    accountId || config_near.LOGIC_CONTRACT_NAME
  );
  return account;
}

export async function view_on_near({
  contractId,
  methodName,
  args = {},
}: {
  contractId: string;
  methodName: string;
  args?: Record<string, any>;
}) {
  return withNearRpcFailover(async (nodeUrl) => {
    const response = await sendNearRpc<{ result?: number[] }>(
      nodeUrl,
      "query",
      {
        request_type: "call_function",
        finality: "optimistic",
        account_id: contractId,
        method_name: methodName,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      }
    );

    return (
      response.result &&
      response.result.length > 0 &&
      JSON.parse(Buffer.from(response.result).toString())
    );
  });
}

export async function getAccountBalance(accountId: string) {
  return withNearRpcFailover(async (nodeUrl) => {
    const protocolConfig = await sendNearRpc<{
      runtime_config: { storage_amount_per_byte: string };
    }>(nodeUrl, "EXPERIMENTAL_protocol_config", { finality: "final" });
    const state = await sendNearRpc<{
      amount: string;
      locked: string;
      storage_usage: number;
    }>(nodeUrl, "query", {
      request_type: "view_account",
      finality: "optimistic",
      account_id: accountId,
    });

    const costPerByte = BigInt(
      protocolConfig.runtime_config.storage_amount_per_byte
    );
    const stateStaked = BigInt(state.storage_usage) * costPerByte;
    const staked = BigInt(state.locked);
    const total = (BigInt(state.amount) + staked).toString();
    const available = (
      BigInt(total) - (staked > stateStaked ? staked : stateStaked)
    ).toString();
    const accountBalance = Decimal.max(available, 0).toFixed();
    const totalAccountBalance = Decimal.max(total, 0).toFixed();
    return {
      accountBalance,
      totalAccountBalance,
    };
  });
}
