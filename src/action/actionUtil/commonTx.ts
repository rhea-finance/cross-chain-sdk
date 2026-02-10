import Big from "big.js";
import { config_near, TOKEN_STORAGE_DEPOSIT_READ } from "../../config";
import { ChangeMethodsLogic, ISimpleWithdraw } from "../../types/index";
import { serializationObj, TGas, NDeposit } from "../../utils/chainsUtil";
import { view_on_near } from "../../chains/near";
import { findPath } from "../../view/centralized_api";

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
              recipient_id:
                simpleWithdrawData.relayerId || config_near.RELAYER_ID,
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

async function getSwapActionsList({
  tokenInAmount,
  tokenInId,
  tokenOutId,
}: {
  tokenInAmount: string | number;
  tokenInId: string;
  tokenOutId: string;
}) {
  const swapActionsList: Record<string, unknown>[] = [];
  const slippage = 0.005;
  const res = (await findPath({
    tokenIn: tokenInId,
    tokenOut: tokenOutId,
    amountIn: tokenInAmount,
    slippage,
  })) as {
    result_code?: number;
    result_data?: {
      routes?: { pools: Record<string, unknown>[] }[];
      amount_out?: string;
    };
  };
  if (res?.result_code !== 0 || !res?.result_data?.routes?.length) {
    return {
      swapActionsList: [],
      amountOut: "0",
    };
  }
  const { routes, amount_out } = res.result_data;
  routes.forEach((route: { pools: Record<string, unknown>[] }) => {
    route.pools.forEach((pool: Record<string, unknown>) => {
      if (+(pool?.amount_in || 0) === 0) {
        delete pool.amount_in;
      }
      pool.pool_id = Number(pool.pool_id);
      swapActionsList.push(pool);
    });
  });
  return {
    swapActionsList,
    amountOut: new Big(amount_out || 0)
      .mul(1 - slippage)
      .toFixed(0, Big.roundDown),
  };
}

export async function swap_tx_query({
  tokenId,
  amountToken,
  tokenOutId,
  receiverId,
}: {
  tokenId: string;
  amountToken: string;
  tokenOutId: string;
  receiverId: string;
}) {
  let swapActionsList: Record<string, unknown>[] = [];
  const { swapActionsList: res_swap, amountOut } = await getSwapActionsList({
    tokenInId: tokenId,
    tokenInAmount: amountToken,
    tokenOutId,
  });
  if (res_swap.length <= 0 || new Big(amountOut).lte(0)) {
    return {
      status: "error" as const,
      message: "No path available to make a swap",
    };
  }
  swapActionsList = res_swap;
  return {
    status: "success" as const,
    amountOut,
    swap_txs: [
      {
        FunctionCall: {
          receiver_id: tokenId,
          function_calls: [
            {
              method_name: "ft_transfer_call",
              args: serializationObj({
                receiver_id: config_near.REF_EXCHANGE_ID,
                amount: amountToken,
                msg: JSON.stringify({
                  swap_out_recipient: receiverId,
                  force: 0,
                  actions: swapActionsList,
                  skip_unwrap_near: true,
                  skip_degen_price_sync: true,
                }),
              }),
              gas: TGas(100),
              deposit: "1",
            },
          ],
        },
      },
    ],
  };
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
