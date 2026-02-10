import { IChain, IWallet } from "../types/chains";
import { IIntentsQuoteResult } from "../types/common";
import { format_wallet, serializationObj } from "../utils/chainsUtil";
import { intentsQuotation } from "./actionUtil/commonAction";

export function getSupplyCustomRecipientMsg({
  useAsCollateral,
  w,
}: {
  useAsCollateral: boolean;
  w: IWallet;
}) {
  const customRecipientMsg = serializationObj({
    w: [w],
    b: {
      r: useAsCollateral ? "BurrowCollateral" : "BurrowSupply",
    },
  });
  return customRecipientMsg;
}

export async function getSupplyDepositData({
  chain,
  identityKey,
  useAsCollateral,
  originAsset,
  destinationAsset,
  amount,
  refundTo,
  recipient,
}: {
  chain: IChain;
  identityKey: string;
  useAsCollateral: boolean;
  originAsset: string;
  destinationAsset: string;
  amount: string; // raw amount
  refundTo: string;
  recipient: string;
}): Promise<IIntentsQuoteResult & { depositAddress: string }> {
  const w = format_wallet({ chain, identityKey }) as IWallet;
  const customRecipientMsg = getSupplyCustomRecipientMsg({
    useAsCollateral,
    w,
  });
  const quoteResult = await intentsQuotation({
    originAsset,
    destinationAsset,
    amount,
    refundTo,
    recipient,
    customRecipientMsg,
  });
  return {
    ...quoteResult,
    depositAddress:
      quoteResult?.quoteSuccessResult?.quote?.depositAddress || "",
  };
}
