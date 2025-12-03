import { Portfolio } from "./account";
interface ITransferAction {
  receiver_id: string;
  amount: string;
}
interface IGasPaymentAction {
  token_id: string;
  amount: string;
}
interface FunctionCallArgs {
  method_name: string;
  args: string;
  gas: string;
  deposit?: string;
}
interface IFunctionCall {
  receiver_id: string;
  function_calls: FunctionCallArgs[];
  interval_block?: number;
}

interface ITxRequest {
  AddWallet?: {
    wallet: IWallet;
    signature: string;
  };
  RemoveWallet?: IWallet;
  GasPayment?: IGasPaymentAction;
  Transfer?: ITransferAction;
  FunctionCall?: IFunctionCall;
}

export type IWallet =
  | { EVM: string }
  | { Solana: string }
  | { Bitcoin: string };

export type IChain = "evm" | "solana" | "btc";
export interface IBusiness {
  nonce: string;
  deadline: string;
  tx_requests: ITxRequest[];
}

export interface IIntentItem {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price: number;
  priceUpdatedAt: string;
  contractAddress?: string;
  icon?: string;
  chainLabel?: string;
  chainIcon?: string;
  chainIdEVM?: string;
  balanceRead?: string;
  balanceRaw?: string;
  balanceUSD?: string;
}

export interface ISimpleWithdraw {
  tokenId: string;
  amount: string | number;
  amountToken: string | number;
  amountBurrow: string | number;
}

export interface IRelayerResult {
  id: number;
  mca_id: string;
  wallet: string;
  request: string;
  request_hash: string;
  status: number;
  leased_to: string;
  lease_until: string;
  tx_record: any;
  request_result: string;
  created_at: string;
  updated_at: string;
  completed_at: string;
  batch_id: string;
  sequence: number;
  batch_status: number;
}

export interface IIntentSwapDetails {
  intentHashes: string[];
  nearTxHashes: string[];
  amountIn: string;
  amountInFormatted: string;
  amountInUsd: string;
  amountOut: string;
  amountOutFormatted: string;
  amountOutUsd: string;
  slippage: string | number;
  refundedAmount: string;
  refundedAmountFormatted: string;
  refundedAmountUsd: string;
  originChainTxHashes: {
    hash: string;
  }[];
  destinationChainTxHashes: {
    hash: string;
  }[];
}

export interface IGasData {
  portfolioMinusGas: Portfolio;
  tokenId: string;
  amount: string | number;
  amountToken: string | number;
  amountBurrow: string | number;
  relayerFeeUsd: string | number;
  simpleWithdrawData: {
    tokenId: string;
    amount: string;
    amountToken: string;
    amountBurrow: string;
  };
}
