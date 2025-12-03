import { view_on_near } from "../chains/near";
import { config_near } from "../config";
import { ViewMethodsLogic, IConfig } from "../types";

export const getConfig = async (): Promise<IConfig> => {
  try {
    const config = await view_on_near({
      contractId: config_near.LOGIC_CONTRACT_NAME,
      methodName: ViewMethodsLogic[ViewMethodsLogic.get_config],
    });
    return config;
  } catch (err: any) {
    console.error(`Failed to get config`);
    return {} as IConfig;
  }
};
