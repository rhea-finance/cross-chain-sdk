import { view_on_near } from "../chains";
import { config_near } from "../config";
import { ViewMethodsLogic, ILendingData } from "../types";
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
