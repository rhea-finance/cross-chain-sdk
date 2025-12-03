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
}

export interface IExecutionResult {
  status: IStatus;
  tx_hash?: string;
  message?: string;
  depositAddress?: string;
  quoteResult?: IIntentsQuoteResult;
}
