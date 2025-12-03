import { transformAssetFarms } from "./farms";
import { IFarms, IAssetsView, Assets, IAssetFarm } from "../../types/asset";

export function transformAssets(assets: Assets): IAssetsView {
  const data = Object.values(assets).reduce((map, asset) => {
    if (!asset.config) return map;
    map[asset.token_id] = {
      ...asset,
      farms: transformAssetFarms(asset.farms),
    };
    return map;
  }, {} as IAssetsView);
  return data;
}

export function transformFarms(
  allFarms: [Record<string, string>, IAssetFarm][]
): IFarms {
  const transformed = allFarms.reduce(
    (acc, cur) => {
      const [tokenData, farmData] = cur;
      const [[Type, tokenId]] = Object.entries(tokenData);
      if (Type === "Supplied") {
        acc.supplied[tokenId] = farmData.rewards;
      }
      if (Type === "Borrowed") {
        acc.borrowed[tokenId] = farmData.rewards;
      }
      if (Type === "TokenNetBalance") {
        acc.tokenNetBalance[tokenId] = farmData.rewards;
      }

      return acc;
    },
    { supplied: {}, borrowed: {}, netTvl: {}, tokenNetBalance: {} } as IFarms
  );
  return transformed;
}
