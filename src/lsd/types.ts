import type { IIntentSwapDetails } from "../types/chains";
import type { IIntentsQuoteResult, IStatus } from "../types/common";

export interface LsdMetadata {
  underlying_token_id: string;
  underlying_burrowland_shares: string;
  burrowland_id: string;
  rewards: Record<string, string>;
  swap_msg_template: Record<string, string>;
  protocol_fee_rate: number;
  acc_protocol_fee: string;
}

export interface BurrowAsset {
  token_id: string;
  supplied: {
    shares: string;
    balance: string;
  };
  borrowed: {
    shares: string;
    balance: string;
  };
}

export interface LsdBalances {
  usdt: string;
  lsdUsdt: string;
}

export interface LsdBalancesParams {
  accountAddress?: string;
  rpcUrl?: string;
}

export interface LsdAmountConversion {
  readableAmount: string;
  amount: string;
}

export interface LsdPreparedTransfer {
  chain: "bsc";
  chainId: string;
  tokenAddress: string;
  tokenSymbol: "USDT" | "lsdUSDT";
  decimals: number;
  amount: string;
  depositAddress: string;
}

export interface LsdIntentsDepositAddresses {
  originDepositAddress: string;
  returnDepositAddress: string;
}

export type LsdIntentsTransactionStatus =
  | "success"
  | "refunded"
  | "failed"
  | "not_started";

export interface LsdIntentsTransactionStatusResult {
  depositAddress: string;
  status: LsdIntentsTransactionStatus;
  swapDetails?: IIntentSwapDetails;
}

export interface LsdIntentsTransactionStatusesResult {
  origin: LsdIntentsTransactionStatusResult;
  return: LsdIntentsTransactionStatusResult;
}

export type LsdPreparationStage =
  | "quoting_origin"
  | "calculating_lsd"
  | "quoting_return"
  | "completed"
  | "failed";

export interface LsdIntentsQuote {
  direction: "supply" | "withdraw";
  inputAmount: string;
  estimatedReceive: string;
  bridgeFeeUsd: string;
  inputToken: "USDT" | "lsdUSDT";
  outputToken: "USDT" | "lsdUSDT";
  intermediateAmount?: string;
  firstQuote?: IIntentsQuoteResult;
  secondQuote?: IIntentsQuoteResult;
}

export interface LsdPrepareResult {
  status: IStatus;
  stage: LsdPreparationStage;
  depositAddress?: string;
  intentsDepositAddresses?: LsdIntentsDepositAddresses;
  quote?: LsdIntentsQuote;
  transferData?: LsdPreparedTransfer;
  message?: string;
}

export interface LsdPrepareParams {
  accountAddress: string;
  amount: string;
  dry?: boolean;
  slippageTolerance?: number;
  onStatusChange?: (stage: LsdPreparationStage) => void;
}
