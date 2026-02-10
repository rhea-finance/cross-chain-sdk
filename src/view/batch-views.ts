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
  try {
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
    return {
      account_all_positions,
      assets_paged_detailed,
      config,
      token_pyth_infos,
    };
  } catch (e) {
    console.error("batchViews error:", e);
    return {} as any;
  }
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
