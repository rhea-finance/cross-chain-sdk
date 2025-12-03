import {
  ISimpleWithdraw,
  IConfig,
  ChangeMethodsLogic,
  ChangeMethodsOracle,
  IBusiness,
} from "../types/index";
import { config_near } from "../config/config";
import { serializationObj, get_nonce_deadline } from "../utils/chainsUtil";
import { TGas } from "../utils/chainsUtil";
import { get_simple_withdraw_tx } from "./actionUtil/commonTx";

export async function prepareBusinessDataOnAdjust({
  mca,
  tokenId,
  config,
  simpleWithdrawData,
  isIncreaseCollateral,
  increaseAmountBurrow,
  isDecreaseCollateral,
  decreaseAmountBurrow,
}: {
  mca: string;
  tokenId: string;
  config: IConfig;
  simpleWithdrawData: ISimpleWithdraw;
  isIncreaseCollateral?: boolean;
  increaseAmountBurrow?: string;
  isDecreaseCollateral?: boolean;
  decreaseAmountBurrow?: string;
}) {
  const enable_pyth_oracle = config.enable_pyth_oracle;
  const logicContractId = config_near.LOGIC_CONTRACT_NAME;
  const oracleContractId = config.oracle_account_id;
  const simple_withdraw_tx = get_simple_withdraw_tx({ simpleWithdrawData });
  const adjust_tx = [];
  if (isIncreaseCollateral) {
    const increaseCollateralTemplate = {
      IncreaseCollateral: {
        token_id: tokenId,
        max_amount: increaseAmountBurrow,
      },
    };
    adjust_tx.push({
      FunctionCall: {
        receiver_id: logicContractId,
        function_calls: [
          {
            method_name: enable_pyth_oracle
              ? ChangeMethodsLogic[ChangeMethodsLogic.execute_with_pyth]
              : ChangeMethodsLogic[ChangeMethodsLogic.execute],
            args: serializationObj({
              actions: [increaseCollateralTemplate],
            }),
            gas: TGas(150),
            deposit: "1",
          },
        ],
      },
    });
  } else if (isDecreaseCollateral) {
    const decreaseCollateralTemplate = {
      DecreaseCollateral: {
        token_id: tokenId,
        max_amount: decreaseAmountBurrow,
      },
    };
    adjust_tx.push({
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
                    actions: [decreaseCollateralTemplate],
                  }
                : {
                    receiver_id: logicContractId,
                    msg: JSON.stringify({
                      Execute: {
                        actions: [decreaseCollateralTemplate],
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
  }
  const { nonce, deadline } = await get_nonce_deadline({ accountId: mca });
  const businessMap: IBusiness = {
    nonce,
    deadline,
    tx_requests: [...simple_withdraw_tx, ...adjust_tx],
  };
  return businessMap;
}
