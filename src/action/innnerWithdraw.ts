import Big from "big.js";
import { IBusiness } from "../types/index";
import { get_nonce_deadline } from "../utils/chainsUtil";
import { intentsQuotation } from "./actionUtil/commonAction";
import {
  query_intents_tansfer_txs,
  swap_tx_query,
  query_account_register_token_tx,
} from "./actionUtil/commonTx";

export async function prepareBusinessDataOninnerWithdraw({
  mca,
  recipient,
  tokenId,
  originAsset,
  destinationAsset,
  amountToken,
  gas_token_id,
  gas_token_amount,
  swapTokenId,
  swapAmountToken,
}: {
  mca: string;
  recipient: string;
  tokenId: string;
  originAsset: string;
  destinationAsset: string;
  amountToken: string;
  gas_token_id: string;
  gas_token_amount: string;
  swapTokenId?: string;
  swapAmountToken?: string;
}) {
  const needsSwap = swapTokenId && swapTokenId !== tokenId;

  let swap_txs: any[] = [];
  let register_receive_token_tx: any[] = [];
  let bridgeAmount = amountToken;

  if (needsSwap) {
    const swapResult = await swap_tx_query({
      tokenId: swapTokenId,
      amountToken: swapAmountToken || amountToken,
      tokenOutId: tokenId,
      receiverId: mca,
    });

    if (swapResult.status === "error") {
      throw new Error(swapResult.message || "No path available to make a swap");
    }

    swap_txs = swapResult.swap_txs;
    bridgeAmount = new Big(swapResult.amountOut).toFixed(0, Big.roundDown);

    register_receive_token_tx = await query_account_register_token_tx({
      accountId: mca,
      tokenId,
    });
  }

  const quoteResult = await intentsQuotation({
    originAsset,
    destinationAsset,
    amount: bridgeAmount,
    refundTo: mca,
    recipient,
  });
  const depositAddress =
    quoteResult?.quoteSuccessResult?.quote?.depositAddress || "";

  const intents_tansfer_txs = query_intents_tansfer_txs({
    tokenId,
    depositAddress,
    amountToken: bridgeAmount,
  });

  const { nonce, deadline } = await get_nonce_deadline({ accountId: mca });
  const businessMap: IBusiness = {
    nonce,
    deadline,
    tx_requests: [
      {
        GasPayment: {
          token_id: gas_token_id,
          amount: gas_token_amount,
        },
      },
      ...register_receive_token_tx,
      ...swap_txs,
      ...intents_tansfer_txs,
    ],
  };
  return {
    businessMap,
    quoteResult,
  };
}
