import { get_nonce_deadline } from "../utils/chainsUtil";
import { IBusiness, IWallet } from "../types/index";

export async function prepareBusinessDataOnRemoveWallet({
  mca,
  w,
  gas_token_id,
  gas_token_amount,
}: {
  mca: string;
  gas_token_id: string;
  gas_token_amount: string;
  w: IWallet;
}) {
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
      {
        RemoveWallet: w,
      },
    ],
  };
  return businessMap;
}
