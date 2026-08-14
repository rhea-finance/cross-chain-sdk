import { view_on_near } from "../chains";
import { config_near } from "../config";
import {
  ViewMethodsLogic,
  ILendingData,
  IConfig,
  IBatchViewsWithTransformsResult,
} from "../types";
import { getAssets } from "./get-assets";
import { transformAssets } from "../utils/transformers/asstets";
import { transformPortfolio } from "../utils";

export async function batchViews(
  account_id?: string | undefined
): Promise<ILendingData> {
  const res = await view_on_near({
    contractId: config_near.LOGIC_CONTRACT_NAME,
    methodName: ViewMethodsLogic[ViewMethodsLogic.batch_views],
    args: {
      ...(account_id ? { account_id } : {}),
      assets: true,
      config: true,
      token_pyth_infos: true,
    },
  });

  if (!Array.isArray(res)) {
    throw new Error("Invalid batch_views response: expected an array");
  }

  const [
    account_all_positions,
    ,
    assets_paged_detailed,
    config,
    ,
    ,
    ,
    token_pyth_infos,
  ] = res;

  if (
    !Array.isArray(assets_paged_detailed) ||
    !config ||
    typeof config !== "object" ||
    Array.isArray(config) ||
    !token_pyth_infos ||
    typeof token_pyth_infos !== "object" ||
    Array.isArray(token_pyth_infos)
  ) {
    throw new Error(
      "Invalid batch_views response: required lending data is missing"
    );
  }

  return {
    account_all_positions,
    assets_paged_detailed,
    config,
    token_pyth_infos,
  };
}

export async function batchViewsData(
  account_id?: string
): Promise<IBatchViewsWithTransformsResult> {
  const {
    account_all_positions,
    assets_paged_detailed,
    config,
    token_pyth_infos,
  } = await batchViews(account_id);

  const assets = await getAssets({
    assets_paged_detailed: assets_paged_detailed ?? [],
    token_pyth_infos: token_pyth_infos ?? {},
    config: config ?? ({} as IConfig),
  });
  const assetsView = transformAssets(assets);

  const portfolioView = account_all_positions
    ? transformPortfolio(account_all_positions)
    : undefined;

  return {
    assetsView,
    portfolioView,
    config: config ?? ({} as IConfig),
  };
}
