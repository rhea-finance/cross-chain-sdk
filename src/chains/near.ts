import Decimal from "decimal.js";
import { keyStores, connect } from "near-api-js";
import { config_near } from "../config";

async function getAccountConnection(accountId?: string) {
  let keyStore: keyStores.KeyStore;
  if (typeof (globalThis as any)["window"] === "undefined") {
    keyStore = new keyStores.InMemoryKeyStore();
  } else {
    keyStore = new keyStores.BrowserLocalStorageKeyStore();
  }
  const connection = await connect({
    keyStore,
    networkId: config_near.networkId,
    nodeUrl: config_near.nodeUrl,
  });
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
  const account = await getAccountConnection();
  const res = await account.viewFunction({
    contractId,
    methodName,
    args,
  });
  return res;
}

export async function getAccountBalance(accountId: string) {
  const account = await getAccountConnection(accountId);
  const { available, total } = await account.getAccountBalance();
  const accountBalance = Decimal.max(available, 0).toFixed();
  const totalAccountBalance = Decimal.max(total, 0).toFixed();
  return {
    accountBalance,
    totalAccountBalance,
  };
}
