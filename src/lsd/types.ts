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

export interface LsdBalances {
  usdt: string;
  lsdUsdt: string;
}

export type LsdExecutionStage =
  | "quoting_origin"
  | "calculating_lsd"
  | "quoting_return"
  | "transferring"
  | "polling"
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

export interface LsdExecutionResult {
  status: IStatus;
  stage: LsdExecutionStage;
  txHash?: string;
  depositAddress?: string;
  finalStatus?: "success" | "refunded" | "failed";
  quote?: LsdIntentsQuote;
  message?: string;
}
