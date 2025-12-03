import { ViewMethodsLogic } from "../types";
import { view_on_near } from "../chains";
import { config_near } from "../config";

export const getBoosterTokens = async (): Promise<any> => {
  try {
    const config = (await view_on_near({
      contractId: config_near.LOGIC_CONTRACT_NAME,
      methodName: ViewMethodsLogic[ViewMethodsLogic.get_booster_tokens],
    })) as any;
    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getBoosterTokens");
  }
};
