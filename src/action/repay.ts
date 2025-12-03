import { IWallet } from "../types/chains";
import { serializationObj } from "../utils/chainsUtil";

export function getRepayCustomRecipientMsg({ w }: { w: IWallet }) {
  const customRecipientMsg = serializationObj({
    w: [w],
    b: {
      r: "BurrowRepay",
    },
  });
  return customRecipientMsg;
}
