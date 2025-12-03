import { ViewMethodsLogic, IAssetFarm } from "../types";
import { view_on_near } from "../chains/near";
import { config_near } from "../config";

const getAllFarms = async (): Promise<
  [Record<string, string>, IAssetFarm][]
> => {
  try {
    const farms = await view_on_near({
      contractId: config_near.LOGIC_CONTRACT_NAME,
      methodName: ViewMethodsLogic[ViewMethodsLogic.get_asset_farms_paged],
    });

    return farms;
  } catch (e) {
    console.error(e);
    throw new Error("getAllFarms");
  }
};

export { getAllFarms };
