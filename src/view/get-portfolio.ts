import { IAccountAllPositionsDetailed, ViewMethodsLogic } from "../types";
import { view_on_near } from "../chains";
import { config_near } from "../config";

export const getAccountAllPositions = async (
  account_id: string
): Promise<IAccountAllPositionsDetailed> => {
  const accountDetailed = (await view_on_near({
    contractId: config_near.LOGIC_CONTRACT_NAME,
    methodName: ViewMethodsLogic[ViewMethodsLogic.get_account_all_positions],
    args: {
      account_id,
    },
  })) as IAccountAllPositionsDetailed;
  return accountDetailed;
};
