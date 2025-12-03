import { IBusiness } from "../types/index";
import { get_nonce_deadline } from "../utils/chainsUtil";
import { intentsQuotation } from "./actionUtil/commonAction";
import { query_intents_tansfer_txs } from "./actionUtil/commonTx";

export async function prepareBusinessDataOninnerWithdraw({
  mca,
  recipient,
  tokenId,
  originAsset,
  destinationAsset,
  amountToken,
  gas_token_id,
  gas_token_amount,
}: {
  mca: string;
  recipient: string;
  tokenId: string;
  originAsset: string;
  destinationAsset: string;
  amountToken: string;
  gas_token_id: string;
  gas_token_amount: string;
}) {
  // intents start
  const quoteResult = await intentsQuotation({
    originAsset,
    destinationAsset,
    amount: amountToken,
    refundTo: mca,
    recipient,
  });
  const depositAddress =
    quoteResult?.quoteSuccessResult?.quote?.depositAddress || "";
  // intents end

  const intents_tansfer_txs = query_intents_tansfer_txs({
    tokenId,
    depositAddress,
    amountToken,
  });
  const { nonce, deadline } = await get_nonce_deadline({ accountId: mca });
  const businessMap: IBusiness = {
    nonce,
    deadline,
    tx_requests: [
      ...[
        {
          GasPayment: {
            token_id: gas_token_id,
            amount: gas_token_amount,
          },
        },
      ],
      ...intents_tansfer_txs,
    ],
  };
  return {
    businessMap,
    quoteResult,
  };
}
