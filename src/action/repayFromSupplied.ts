import Decimal from "decimal.js";
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

export async function prepareBusinessDataOnRepayFromSupplied({
  mca,
  tokenId,
  config,
  simpleWithdrawData,
  amountBurrow,
  decreaseAmountBurrow,
}: {
  mca: string;
  tokenId: string;
  config: IConfig;
  simpleWithdrawData: ISimpleWithdraw;
  amountBurrow: string;
  decreaseAmountBurrow: string;
}) {
  const enable_pyth_oracle = config.enable_pyth_oracle;
  const logicContractId = config_near.LOGIC_CONTRACT_NAME;
  const oracleContractId = config.oracle_account_id;
  const simple_withdraw_tx = get_simple_withdraw_tx({ simpleWithdrawData });
  const repay_tx = [];
  const repayTemplate = {
    Repay: {
      token_id: tokenId,
      amount: amountBurrow,
    },
  };
  const decreaseCollateralTemplate = {
    DecreaseCollateral: {
      token_id: tokenId,
      amount: decreaseAmountBurrow,
    },
  };
  repay_tx.push({
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
                  actions: [
                    ...(new Decimal(decreaseAmountBurrow).gt(0)
                      ? [decreaseCollateralTemplate]
                      : []),
                    repayTemplate,
                  ],
                }
              : {
                  receiver_id: logicContractId,
                  msg: JSON.stringify({
                    Execute: {
                      actions: [
                        ...(new Decimal(decreaseAmountBurrow).gt(0)
                          ? [decreaseCollateralTemplate]
                          : []),
                        repayTemplate,
                      ],
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
  const { nonce, deadline } = await get_nonce_deadline({ accountId: mca });
  const businessMap: IBusiness = {
    nonce,
    deadline,
    tx_requests: [...simple_withdraw_tx, ...repay_tx],
  };
  return businessMap;
}
