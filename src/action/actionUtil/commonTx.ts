import { config_near, TOKEN_STORAGE_DEPOSIT_READ } from "../../config";
import { ChangeMethodsLogic, ISimpleWithdraw } from "../../types/index";
import { serializationObj, TGas, NDeposit } from "../../utils/chainsUtil";
import { view_on_near } from "../../chains/near";

export function get_simple_withdraw_tx({
  simpleWithdrawData,
}: {
  simpleWithdrawData: ISimpleWithdraw;
}) {
  return [
    {
      FunctionCall: {
        receiver_id: config_near.LOGIC_CONTRACT_NAME,
        function_calls: [
          {
            method_name: ChangeMethodsLogic[ChangeMethodsLogic.simple_withdraw],
            args: serializationObj({
              token_id: simpleWithdrawData.tokenId,
              amount_with_inner_decimal: simpleWithdrawData.amountBurrow,
              recipient_id: config_near.RELAYER_ID,
            }),
            gas: TGas(100),
            deposit: "1",
          },
        ],
      },
    },
  ];
}

export async function query_account_register_token_tx({
  tokenId,
  accountId,
}: {
  tokenId: string;
  accountId: string;
}) {
  const isRegistered = await view_on_near({
    contractId: tokenId,
    methodName: "storage_balance_of",
    args: {
      account_id: accountId,
    },
  });
  return !!isRegistered
    ? []
    : [
        {
          FunctionCall: {
            receiver_id: tokenId,
            function_calls: [
              {
                method_name: "storage_deposit",
                args: serializationObj({
                  registration_only: false,
                  account_id: accountId,
                }),
                gas: TGas(10),
                deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
              },
            ],
          },
        },
      ];
}

export function query_intents_tansfer_txs({
  tokenId,
  depositAddress,
  amountToken,
}: {
  tokenId: string;
  depositAddress: string;
  amountToken: string;
}) {
  const intents_tansfer_txs = [
    {
      FunctionCall: {
        receiver_id: tokenId,
        function_calls: [
          {
            method_name: "storage_deposit",
            args: serializationObj({
              account_id: depositAddress,
              registration_only: true,
            }),
            gas: TGas(10),
            deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
          },
          {
            method_name: "ft_transfer",
            args: serializationObj({
              receiver_id: depositAddress,
              amount: amountToken,
              memo: null,
            }),
            gas: TGas(10),
            deposit: "1",
          },
        ],
        interval_block: 2,
      },
    },
  ];
  return intents_tansfer_txs;
}
