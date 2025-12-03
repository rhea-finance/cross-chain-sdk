import {
  ISimpleWithdraw,
  IConfig,
  ChangeMethodsLogic,
  ChangeMethodsOracle,
  IBusiness,
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
  query_intents_tansfer_txs,
} from "./actionUtil/commonTx";

export async function prepareBusinessDataOnWithdraw({
  mca,
  recipient,
  tokenId,
  originAsset,
  destinationAsset,
  amountBurrow,
  amountToken,
  config,
  simpleWithdrawData,
  isDecrease,
  decreaseCollateralAmount,
}: {
  mca: string;
  recipient: string;
  tokenId: string;
  originAsset: string;
  destinationAsset: string;
  amountBurrow: string;
  amountToken: string;
  config: IConfig;
  simpleWithdrawData: ISimpleWithdraw;
  isDecrease: boolean;
  decreaseCollateralAmount: string;
}) {
  const enable_pyth_oracle = config.enable_pyth_oracle;
  const logicContractId = config_near.LOGIC_CONTRACT_NAME;
  const oracleContractId = config.oracle_account_id;
  const { nonce, deadline } = await get_nonce_deadline({ accountId: mca });
  const simple_withdraw_tx = get_simple_withdraw_tx({ simpleWithdrawData });
  const mca_register_token_tx = await query_account_register_token_tx({
    accountId: mca,
    tokenId,
  });
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

  const withdraw_tx = [];
  const withdrawAction = {
    Withdraw: {
      token_id: tokenId,
      max_amount: amountBurrow,
    },
  };
  if (isDecrease) {
    const decreaseCollateralTemplate = {
      DecreaseCollateral: {
        token_id: tokenId,
        amount: decreaseCollateralAmount,
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
            gas: TGas(150),
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
            gas: TGas(150),
            deposit: "1",
          },
        ],
      },
    });
  }

  const businessMap: IBusiness = {
    nonce,
    deadline,
    tx_requests: [
      ...simple_withdraw_tx,
      ...mca_register_token_tx,
      ...withdraw_tx,
      ...intents_tansfer_txs,
    ],
  };
  return {
    businessMap,
    quoteResult,
  };
}

/**
 * withdraw的流程
 * 同 borrow
 */
