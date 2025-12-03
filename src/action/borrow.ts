import Decimal from "decimal.js";
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

export async function prepareBusinessDataOnBorrow({
  mca,
  recipient,
  tokenId,
  originAsset,
  destinationAsset,
  amountBurrow,
  amountToken,
  config,
  simpleWithdrawData,
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
  const borrowTemplate = {
    Execute: {
      actions: [
        {
          Borrow: {
            token_id: tokenId,
            amount: new Decimal(amountBurrow).toFixed(),
          },
        },
        {
          Withdraw: {
            token_id: tokenId,
            max_amount: new Decimal(amountBurrow).toFixed(),
          },
        },
      ],
    },
  };
  const borrow_tx = [
    {
      FunctionCall: {
        receiver_id: enable_pyth_oracle ? logicContractId : oracleContractId,
        function_calls: [
          {
            method_name: enable_pyth_oracle
              ? ChangeMethodsLogic[ChangeMethodsLogic.execute_with_pyth]
              : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
            args: serializationObj(
              config.enable_pyth_oracle
                ? {
                    actions: borrowTemplate.Execute.actions,
                  }
                : {
                    receiver_id: logicContractId,
                    msg: JSON.stringify(borrowTemplate),
                  }
            ),
            gas: TGas(150),
            deposit: "1",
          },
        ],
      },
    },
  ];

  const businessMap: IBusiness = {
    nonce,
    deadline,
    tx_requests: [
      ...simple_withdraw_tx,
      ...mca_register_token_tx,
      ...borrow_tx,
      ...intents_tansfer_txs,
    ],
  };
  return {
    businessMap,
    quoteResult,
  };
}

/**
 * borrow的流程
 * 1. 准备borrow交易
 * 2. SDK使用者 将borrow交易序列化，使用mca绑定的任意钱包去签名序列化的borrow交易
 * 3. 签名完成后, 交给relayer上链
 * 4. 轮训relayer查询
 * 5. 返回relayer查询结果
 */
