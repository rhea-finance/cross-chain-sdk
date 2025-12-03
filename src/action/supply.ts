import { IWallet } from "../types/chains";
import { serializationObj } from "../utils/chainsUtil";

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
