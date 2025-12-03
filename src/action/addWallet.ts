import { get_nonce_deadline } from "../utils/chainsUtil";
import { IBusiness, IWallet } from "../types/index";

export async function prepareBusinessDataOnAddWallet({
  mca,
  w,
  signature_w,
  gas_token_id,
  gas_token_amount,
}: {
  mca: string;
  gas_token_id: string;
  gas_token_amount: string;
  w: IWallet;
  signature_w: string;
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
        AddWallet: {
          wallet: w,
          signature: signature_w,
        },
      },
    ],
  };
  return businessMap;
}
