import { IAccountAllPositionsDetailed } from "./account";
import { IPythInfo } from "./oracle";
import { IConfig } from "./burrow";
import { IAssetDetailed } from "./asset";

export interface ILendingData {
  account_all_positions?: IAccountAllPositionsDetailed;
  assets_paged_detailed: IAssetDetailed[];
  config: IConfig;
  token_pyth_infos: Record<string, IPythInfo>;
}
export type IStatus = "success" | "error";

/**
 * Application fee attached to an intents quote.
 * `fee` is in basis points (1/100th of a percent); 100 = 1%.
 */
export interface IAppFee {
  recipient: string;
  fee: number;
}

export interface QuotationParams {
  originAsset: string;
  destinationAsset: string;
  amount: string;
  refundTo: string;
  recipient: string;
  customRecipientMsg?: string;
  isReverse?: boolean;
  dry?: boolean;
  slippageTolerance?: number;
  authorization?: string;
  /** Per-call app fees; overrides the value set via setIntentsQuoteConfig. */
  appFees?: IAppFee[];
  /** Escape hatch for arbitrary 1Click fields, spread last into the request. */
  extraParams?: Record<string, unknown>;
}

export interface IntentsOrdersParams {
  refundTo: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface IIntentsQuote {
  quote: {
    amountIn: string;
    amountInFormatted: string;
    amountInUsd: string;
    amountOut: string;
    amountOutFormatted: string;
    amountOutUsd: string;
    deadline: string;
    depositAddress: string;
    minAmountIn: string;
    minAmountOut: string;
    timeEstimate: string;
    timeWhenInactive: string;
  };
  quoteRequest: {
    amount: string;
    customRecipientMsg: string;
    deadline: string;
    depositMode: string;
    depositType: string;
    destinationAsset: string;
    dry: boolean;
    originAsset: string;
    quoteWaitingTimeMs: number;
    recipient: string;
    recipientType: string;
    referral: string;
    refundTo: string;
    refundType: string;
    slippageTolerance: number;
    swapType: string;
  };
}

export interface IIntentsQuoteResult {
  quoteStatus: "success" | "error";
  quoteSuccessResult?: IIntentsQuote;
  message?: string;
  quoteFeeData?: {
    feeAmount: string;
    feeUsd: string;
  };
}

export interface IExecutionResult {
  status: IStatus;
  tx_hash?: string;
  message?: string;
  depositAddress?: string;
  quoteResult?: IIntentsQuoteResult;
}
