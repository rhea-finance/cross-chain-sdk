import { IBusiness } from "../types/index";
import { config_near } from "../config/config";
import { serializationObj, get_nonce_deadline } from "../utils/chainsUtil";
import { TGas } from "../utils/chainsUtil";

export async function prepareBusinessDataOnClaim({
  mca,
  gas_token_id,
  gas_token_amount,
}: {
  mca: string;
  gas_token_id: string;
  gas_token_amount: string;
}) {
  const { nonce, deadline } = await get_nonce_deadline({ accountId: mca });
  const gas_payment_tx = [
    {
      GasPayment: {
        token_id: gas_token_id,
        amount: gas_token_amount,
      },
    },
  ];
  const claim_all_tx = [
    {
      FunctionCall: {
        receiver_id: config_near.LOGIC_CONTRACT_NAME,
        function_calls: [
          {
            method_name: "account_farm_claim_all",
            args: serializationObj({}),
            gas: TGas(100),
            deposit: "0",
          },
        ],
      },
    },
  ];
  const businessMap: IBusiness = {
    nonce,
    deadline,
    tx_requests: [...gas_payment_tx, ...claim_all_tx],
  };
  return businessMap;
}
