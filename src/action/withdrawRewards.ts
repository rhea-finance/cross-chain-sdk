import Decimal from "decimal.js";
import Big from "big.js";
import {
  IBusiness,
  ChangeMethodsLogic,
  ChangeMethodsOracle,
  PrepareWithdrawRewardsParams,
  PrepareWithdrawRewardsResult,
} from "../types/index";
import { config_near } from "../config/config";
import {
  serializationObj,
  get_nonce_deadline,
  TGas,
} from "../utils/chainsUtil";
import { intentsQuotation } from "./actionUtil/commonAction";
import {
  get_simple_withdraw_tx,
  query_account_register_token_tx,
  swap_tx_query,
  query_intents_tansfer_txs,
} from "./actionUtil/commonTx";

export async function prepareBusinessDataOnWithdrawRewards({
  mca,
  rewardTokenId,
  amountBurrow,
  amountToken,
  isDecrease,
  config,
  simpleWithdrawData,
  receiveTokenId,
  originAsset,
  destinationAsset,
  recipient,
  claimAndWithdraw = true,
  signerChain,
}: PrepareWithdrawRewardsParams): Promise<PrepareWithdrawRewardsResult> {
  try {
    const enable_pyth_oracle = config.enable_pyth_oracle;
    const logicContractId = config_near.LOGIC_CONTRACT_NAME;
    const oracleContractId = config.oracle_account_id;

    const simple_withdraw_tx =
      simpleWithdrawData && signerChain !== "near"
        ? get_simple_withdraw_tx({ simpleWithdrawData })
        : [];

    const claim_all_tx = [
      {
        FunctionCall: {
          receiver_id: config_near.LOGIC_CONTRACT_NAME,
          function_calls: [
            {
              method_name: "account_farm_claim_all",
              args: serializationObj({}),
              gas: TGas(20),
              deposit: "0",
            },
          ],
        },
      },
    ];
    const swapResult = await swap_tx_query({
      tokenId: rewardTokenId,
      amountToken,
      tokenOutId: receiveTokenId,
      receiverId: mca,
    });

    if (swapResult.status === "error") {
      return {
        status: "error",
        message: swapResult.message || "No path available to make a swap",
      };
    }
    const { swap_txs, amountOut } = swapResult;

    const mca_register_reward_token_tx = await query_account_register_token_tx({
      accountId: mca,
      tokenId: rewardTokenId,
    });
    const mca_register_receive_token_tx = await query_account_register_token_tx(
      {
        accountId: mca,
        tokenId: receiveTokenId,
      }
    );

    const withdrawAction = {
      Withdraw: {
        token_id: rewardTokenId,
        max_amount: amountBurrow,
      },
    };

    const withdraw_tx = [];
    if (isDecrease) {
      const decreaseCollateralTemplate = {
        DecreaseCollateral: {
          token_id: rewardTokenId,
        },
      };
      withdraw_tx.push({
        FunctionCall: {
          receiver_id: enable_pyth_oracle ? logicContractId : oracleContractId,
          function_calls: [
            {
              method_name: enable_pyth_oracle
                ? ChangeMethodsLogic[ChangeMethodsLogic.execute_with_pyth]
                : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
              args: serializationObj(
                enable_pyth_oracle
                  ? {
                      actions: [decreaseCollateralTemplate, withdrawAction],
                    }
                  : {
                      receiver_id: logicContractId,
                      msg: JSON.stringify({
                        Execute: {
                          actions: [decreaseCollateralTemplate, withdrawAction],
                        },
                      }),
                    }
              ),
              gas: TGas(120),
              deposit: "1",
            },
          ],
        },
      });
    } else {
      withdraw_tx.push({
        FunctionCall: {
          receiver_id: logicContractId,
          function_calls: [
            {
              method_name: ChangeMethodsLogic[ChangeMethodsLogic.execute],
              args: serializationObj({
                actions: [withdrawAction],
              }),
              gas: TGas(120),
              deposit: "1",
            },
          ],
        },
      });
    }

    const bridgeTokenAmount = new Big(amountOut).toFixed(0, Decimal.ROUND_DOWN);
    const quoteResult = await intentsQuotation({
      originAsset,
      destinationAsset,
      amount: bridgeTokenAmount,
      refundTo: mca,
      recipient,
    });
    const depositAddress =
      quoteResult?.quoteSuccessResult?.quote?.depositAddress || "";

    if (!depositAddress) {
      return {
        status: "error",
        message: quoteResult?.message || "Failed to get deposit address",
      };
    }

    const intents_tansfer_txs = query_intents_tansfer_txs({
      tokenId: receiveTokenId,
      depositAddress,
      amountToken: bridgeTokenAmount,
    });

    const { nonce, deadline } = await get_nonce_deadline({ accountId: mca });

    const businessMap: IBusiness = {
      nonce,
      deadline,
      tx_requests: [
        ...simple_withdraw_tx, // gas 100
        ...(claimAndWithdraw ? claim_all_tx : []), // gas 20
        ...mca_register_reward_token_tx, // gas 10
        ...withdraw_tx, // gas 120
      ],
    };

    const businessMapExtra: IBusiness = {
      nonce: new Big(nonce).plus(1).toFixed(0),
      deadline,
      tx_requests: [
        ...mca_register_receive_token_tx, // gas 10
        ...swap_txs, // gas 100
        ...intents_tansfer_txs, // gas 20
      ],
    };

    const registerLength =
      mca_register_reward_token_tx.length +
      mca_register_receive_token_tx.length;

    return {
      status: "success",
      businessMap,
      businessMapExtra,
      registerLength,
      quoteResult,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
