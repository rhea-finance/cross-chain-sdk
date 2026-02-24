import Decimal from "decimal.js";
import {
  ViewMethodsLogic,
  IAssetFarm,
  Asset,
  IAssetsView,
  IMetadata,
  IFarmDetailsOfAsset,
} from "../types";
import { view_on_near } from "../chains/near";
import { config_near } from "../config";
import { shrinkToken } from "../utils/numbers";

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

/**
 * Get farm details for an asset (onlyMarket / market APY scenario).
 * Uses asset.farms.tokennetbalance; no filterSentOutFarms.
 * Returns details for the asset identified by assetId (asset = assets[assetId]).
 */
function getFarmDetailsOfAsset({
  assets,
  assetId,
  booster = 1.5,
}: {
  assets: IAssetsView;
  assetId: string;
  booster?: number;
}): IFarmDetailsOfAsset {
  const asset = assets[assetId];
  if (!asset) {
    return {
      minFarmApy: 0,
      maxFarmApy: 0,
      tokenNetRewards: [],
      canBeBooster: false,
      supplyApy: 0,
      borrowApy: 0,
    };
  }

  const tokenNetFarms = asset.farms.tokennetbalance || {};
  const assetDecimals =
    (asset.metadata?.decimals ?? 0) + (asset.config?.extra_decimals ?? 0);

  const rewardMetas: IMetadata[] = [];
  for (const rewardTokenId of Object.keys(tokenNetFarms)) {
    const rewardAsset = assets[rewardTokenId];
    if (rewardAsset?.metadata) rewardMetas.push(rewardAsset.metadata);
  }

  const firstFarm = Object.values(tokenNetFarms)[0];
  const canBeBooster = !!(
    firstFarm?.booster_log_bases &&
    Object.keys(firstFarm.booster_log_bases).length > 0
  );

  const marketFarmApy = Object.entries(tokenNetFarms).reduce(
    (acc, [rewardTokenId, farmData]) => {
      const rewardAsset = assets[rewardTokenId];
      if (!rewardAsset) return acc;
      const rewardAPY = new Decimal(farmData.reward_per_day)
        .div(
          new Decimal(10).pow(
            (rewardAsset.metadata?.decimals ?? 0) +
              (rewardAsset.config?.extra_decimals ?? 0)
          )
        )
        .mul(365)
        .mul(rewardAsset.price?.usd || "0")
        .div(
          new Decimal(shrinkToken(farmData.boosted_shares, assetDecimals)).mul(
            asset.price?.usd || "0"
          )
        )
        .mul(100);
      return acc.plus(rewardAPY);
    },
    new Decimal(0)
  );
  const supplyApr = new Decimal(asset.supply_apr || 0).mul(100).toNumber();
  const borrowApr = new Decimal(asset.borrow_apr || 0).mul(100).toNumber();
  return {
    minFarmApy: marketFarmApy.toNumber(),
    maxFarmApy: marketFarmApy.mul(booster).toNumber(),
    supplyApy: supplyApr,
    borrowApy: borrowApr,
    tokenNetRewards: rewardMetas,
    canBeBooster,
  };
}

export { getAllFarms, getFarmDetailsOfAsset };
