import { config_near } from "../config/config";
// @ts-ignore
import crypto from "crypto-browserify";
import {
  IRelayerResult,
  IIntentItem,
  IStatus,
  IIntentSwapDetails,
  IIntentsQuoteResult,
  QuotationParams,
} from "../types/index";
const { oneClickUrl, indexUrl } = config_near;
export const getSignature = (plaintext: string) => {
  const key = process.env.NEXT_PUBLIC_CRYPTO_KEY;
  if (!key) return;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(plaintext, "utf-8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + encrypted;
};

export const getAuthenticationHeaders = (path: string) => {
  const time = Math.round(new Date().getTime() / 1000);
  const o = { path, time };
  const str = JSON.stringify(o);
  const signature = getSignature(str);
  return {
    Authentication: signature,
  };
};

export async function get_liquidations(
  accountId: string,
  page?: number,
  pageSize?: number,
  assets?: any
) {
  try {
    const response = await fetch(
      `${config_near.dataServiceUrl}/burrow/get_burrow_liquidate_records/${accountId}?page_number=${page}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          ...getAuthenticationHeaders(
            `/burrow/get_burrow_liquidate_records/${accountId}`
          ),
        },
      }
    );

    const liquidationData: any = await response.json().catch(() => ({}));
    const unreadIds: Array<string> = [];
    liquidationData?.record_list?.forEach((d: any) => {
      if (d.RepaidAssets) {
        d.RepaidAssets?.forEach((a: any) => {
          const tokenId = a.token_id;
          const asset = assets?.data?.[tokenId];
          a.data = asset;
        });
      }
      if (d.LiquidatedAssets) {
        d.LiquidatedAssets?.forEach((a: any) => {
          const tokenId = a.token_id;
          const asset = assets?.data?.[tokenId];
          a.data = asset;
        });
      }
      if (d.isRead === false) {
        unreadIds.push(d.receipt_id);
      }
    });

    return { liquidationData, unreadIds };
  } catch (err) {
    console.error(err);
    return { liquidationData: {}, unreadIds: [] };
  }
}

export async function get_token_detail(tokenId: string, period = 1) {
  try {
    const response = (
      await fetch(
        `${config_near.dataServiceUrl}/burrow/get_token_detail/${tokenId}?period=${period}`,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            ...getAuthenticationHeaders(
              `${config_near.dataServiceUrl}/burrow/get_token_detail/${tokenId}`
            ),
          },
        }
      )
    )
      .json()
      .catch(() => {
        return [];
      });
    return response;
  } catch (err) {
    return [];
  }
}

export async function get_all_tokens_metadata() {
  const data: any = await fetch(
    `${config_near.indexUrl}/list-burrow-asset-token`
  )
    .then((res) => res.json())
    .catch(() => {
      return {};
    });
  Object.keys(data).reduce((acc, cur) => {
    const tokenMetadata = data[cur];
    tokenMetadata.token_id = cur;
    acc[cur] = tokenMetadata;
    return acc;
  }, {} as any);
  return data;
}

export async function get_interest_rate(tokenId: string) {
  try {
    const response = (
      await fetch(
        `${config_near.dataServiceUrl}/burrow/get_token_interest_rate/${tokenId}`,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            ...getAuthenticationHeaders(
              `${config_near.dataServiceUrl}/burrow/get_token_interest_rate/${tokenId}`
            ),
          },
        }
      )
    )
      .json()
      .catch(() => {
        return {};
      });
    return response;
  } catch (err) {
    return {};
  }
}

export async function get_records(
  accountId: string,
  pageNumber = 1,
  pageSize = 10
) {
  try {
    const response = (
      await fetch(
        `${config_near.indexUrl}/get-burrow-records?account_id=${accountId}&page_number=${pageNumber}&page_size=${pageSize}`,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            ...getAuthenticationHeaders(
              `${config_near.indexUrl}/get-burrow-records`
            ),
          },
        }
      )
    )
      .json()
      .catch(() => {
        return {};
      });
    return response;
  } catch (err) {
    return {};
  }
}

export async function get_tx_id(receipt_id: string) {
  try {
    const res = await fetch(
      `${config_near.txIdApiUrl}/v1/search?keyword=${receipt_id}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }
    );
    return await res.json().catch(() => ({}));
  } catch (error) {
    return {};
  }
}
export async function fetchIntentsQuotation(
  params: QuotationParams
): Promise<IIntentsQuoteResult> {
  try {
    const res_params = {
      originAsset: params?.originAsset,
      destinationAsset: params?.destinationAsset,
      amount: params?.amount,
      refundTo: params?.refundTo,
      recipient: params?.recipient,
      customRecipientMsg: params?.customRecipientMsg,
      dry: params?.dry || false,
      swapType: params.isReverse ? "EXACT_OUTPUT" : "EXACT_INPUT",
      refundType: "ORIGIN_CHAIN",
      recipientType: "DESTINATION_CHAIN",
      depositType: "ORIGIN_CHAIN",
      deadline: new Date(Date.now() + 10000 * 60 * 60 * 1000).toISOString(),
      referral: "rhea",
      quoteWaitingTimeMs: 3000,
      slippageTolerance:
        typeof params.slippageTolerance == "number"
          ? params.slippageTolerance
          : 50,
    };
    const response: any = await fetch(`${oneClickUrl}/quote`, {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(res_params),
    }).then((res) => {
      return res.json();
    });
    const quote = response?.quote;
    if (quote) {
      return {
        quoteStatus: "success",
        quoteSuccessResult: response,
      };
    } else {
      return {
        quoteStatus: "error",
        message: response?.message,
      };
    }
  } catch (error: any) {
    return {
      quoteStatus: "error",
      message: error?.message || error?.error,
    };
  }
}

export async function fetchIntentsTransactionStatus(depositAddress: string) {
  try {
    const response = await fetch(
      `${oneClickUrl}/status?depositAddress=${depositAddress}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }
    ).then((res) => {
      return res.json();
    });
    return response;
  } catch (error) {
    console.error("Error fetchIntentsTransactionStatus:", error);
    return null;
  }
}

export async function fetchIntentsTokens(): Promise<IIntentItem[]> {
  try {
    const response = await fetch(`${oneClickUrl}/tokens`, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }).then((res) => {
      return res.json();
    });
    return response as IIntentItem[];
  } catch (error) {
    console.error("Error fetching fetchIntentsTokens:", error);
    return [];
  }
}

type IIntentsStatus = "success" | "refunded" | "failed";
export async function pollingTransactionStatus(
  depositAddress: string
): Promise<{
  status: IIntentsStatus;
  swapDetails: IIntentSwapDetails;
}> {
  let isOver = false;
  let status: any;
  let swapDetails: any;
  while (!isOver) {
    const resString = await fetchIntentsTransactionStatus(depositAddress);
    const parsed: any = resString || {};
    status = parsed?.status?.toLowerCase();
    if (status == "success" || status == "refunded" || status == "failed") {
      isOver = true;
      swapDetails = parsed?.swapDetails || {};
    } else {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 5000);
      });
    }
  }
  return {
    status,
    swapDetails,
  };
}

export async function getMultichainLendingConfig(): Promise<
  Record<string, string>[]
> {
  try {
    const response = await fetch(`${indexUrl}/get_multichain_lending_config`, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }).then((res) => {
      return res.json();
    });
    return response as Record<string, string>[];
  } catch (error) {
    console.error("Error fetching get_multichain_lending_config:", error);
    return [];
  }
}

export async function postMultichainLendingRequests({
  mca_id,
  wallet,
  request,
  page_display_data,
}: {
  mca_id: string;
  wallet: string;
  request: string[];
  page_display_data: string;
}): Promise<{
  code: number;
  data: string;
  msg: string;
}> {
  try {
    const params = {
      mca_id,
      wallet,
      request,
      page_display_data,
    };
    const response = await fetch(`${indexUrl}/multichain_lending_requests`, {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(params),
    }).then((res) => {
      return res.json();
    });
    return response as any;
  } catch (error) {
    console.error("Error fetching get_multichain_lending_config:", error);
    return null as any;
  }
}

export async function getMultichainLendingData(
  batch_id: string
): Promise<IRelayerResult[]> {
  try {
    const response = await fetch(
      `${indexUrl}/get_multichain_lending_data?batch_id=${batch_id}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }
    ).then((res) => {
      return res.json();
    });
    return response as IRelayerResult[];
  } catch (error) {
    console.error("Error fetching get_multichain_lending_data:", error);
    return [];
  }
}

/**
 * 0（pending）1（processing) 2（complete）
 * tx_hash: The transaction has been recorded on the blockchain.
 * tx_err_msg: err msg on blockchain
 * other_err_msg: err msg on offChain
 */
export async function pollingRelayerTransactionResult(
  batch_id: string,
  interval?: number
): Promise<{
  status: IStatus;
  tx_hash: string;
}> {
  let isOver = false;
  let status: any;
  let tx_hash;
  while (!isOver) {
    const res = await getMultichainLendingData(batch_id);
    const isComplete = res.every((item) => item.batch_status == 2);
    if (isComplete) {
      isOver = true;
      const requestResult = res.map((item) => JSON.parse(item.request_result));
      const isSuccess = requestResult.every(
        (result) => !(result.other_err_msg || result.tx_err_msg)
      );
      status = isSuccess ? "success" : "error";
      tx_hash = requestResult[requestResult.length - 1].tx_hash;
    } else {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, interval || 5000);
      });
    }
  }
  return {
    status,
    tx_hash,
  };
}

export async function getMultichainLendingHistory({
  mca_id,
  page_number,
  page_size,
}: {
  mca_id: string;
  page_number: number;
  page_size: number;
}) {
  try {
    const response = await fetch(
      `${indexUrl}/get_multichain_lending_history?mca_id=${mca_id}&page_number=${page_number}&page_size=${page_size}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }
    ).then((res) => {
      return res.json();
    });
    return response;
  } catch (error) {
    console.error("Error fetching get_multichain_lending_history:", error);
    return null;
  }
}

export async function postMultichainLendingReport({
  mca_id,
  wallet,
  request_hash,
  page_display_data,
}: {
  mca_id: string;
  wallet: string;
  request_hash: string;
  page_display_data: string;
}): Promise<{
  code: number;
  data: string;
  msg: string;
}> {
  try {
    const params = {
      mca_id,
      wallet,
      request_hash,
      page_display_data,
    };
    const response = await fetch(`${indexUrl}/multichain_lending_report`, {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(params),
    }).then((res) => {
      return res.json();
    });
    return response as any;
  } catch (error) {
    console.error("Error fetching get_multichain_lending_config:", error);
    return null as any;
  }
}

// get_multichain_lending_tokens_data?chains=bsc,stellar
export async function getMultichainTokensByChains(
  chains: string
): Promise<IIntentItem[]> {
  try {
    const response = await fetch(
      `${indexUrl}/get_multichain_lending_tokens_data?chains=${chains}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }
    ).then((res) => {
      return res.json();
    });
    return response as IIntentItem[];
  } catch (error) {
    console.error("Error fetching get_multichain_lending_tokens_data:", error);
    return [];
  }
}
