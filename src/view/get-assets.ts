import Decimal from "decimal.js";
import {
  IPrices,
  IMetadata,
  IAssetDetailed,
  IPythInfo,
  IConfig,
  Assets,
  ViewMethodsLogic,
  Asset,
  IAssetsView,
} from "../types";
import { transformAssets } from "../utils/transformers/asstets";
import { getAllMetadata } from "./get-all-metadata";
import { getPrices, getTokenPythInfos } from "./get-prices";
import { config_near } from "../config";
import { getConfig } from "./get-config";
import { view_on_near } from "../chains/near";

const getPrice = (
  tokenId: string,
  priceResponse: IPrices | undefined,
  metadata: IMetadata | undefined
) => {
  if (!priceResponse || !metadata) {
    return { usd: "0", decimals: metadata?.decimals || 0, multiplier: "0" };
  }
  const price = priceResponse.prices.find((p) => p.asset_id === tokenId)?.price;
  if (!price)
    return { usd: "0", decimals: metadata?.decimals || 0, multiplier: "0" };
  const usd = new Decimal(
    Number(price.multiplier) / 10 ** (price.decimals - metadata.decimals)
  ).toFixed();
  return { ...price, usd };
};

export const getAssets = async ({
  assets_paged_detailed,
  token_pyth_infos,
  config,
}: {
  assets_paged_detailed: IAssetDetailed[];
  token_pyth_infos: Record<string, IPythInfo>;
  config: IConfig;
}) => {
  const hiddenAssets = config_near.hiddenAssets;
  const assets = assets_paged_detailed.filter(
    (asset) => !hiddenAssets.includes(asset.token_id)
  );
  const tokenIds = assets.map((asset) => asset.token_id);
  const metadatas: IMetadata[] = await getAllMetadata(tokenIds);
  const pricesResponse = await getPrices({ token_pyth_infos, config });
  const res: IAssetDetailed[] = [];
  for (const asset of assets) {
    const metadata = metadatas.find((m) => m.token_id === asset.token_id);
    res.push({
      ...asset,
      price: getPrice(asset.token_id, pricesResponse, metadata),
      metadata,
    });
  }
  const map = res.reduce((acc, cur) => {
    acc[cur.token_id] = cur;
    return acc;
  }, {} as Assets);
  return map;
};

export const getAssetsDetail = async (): Promise<IAssetDetailed[]> => {
  return (await view_on_near({
    contractId: config_near.LOGIC_CONTRACT_NAME,
    methodName: ViewMethodsLogic[ViewMethodsLogic.get_assets_paged_detailed],
  })) as IAssetDetailed[];
};

export const getAssetDetailByAssetId = async (
  assetId: string
): Promise<Asset | undefined> => {
  const assets_paged_detailed = await getAssetsDetail();
  const token_pyth_infos = await getTokenPythInfos();
  const config = await getConfig();
  const assets = await getAssets({
    assets_paged_detailed,
    token_pyth_infos,
    config,
  });
  const transformedAssets = transformAssets(assets);
  return transformedAssets[assetId];
};

export const getAssetDetailsView = async (): Promise<IAssetsView> => {
  const assets_paged_detailed = await getAssetsDetail();
  const token_pyth_infos = await getTokenPythInfos();
  const config = await getConfig();
  const assets = await getAssets({
    assets_paged_detailed,
    token_pyth_infos,
    config,
  });
  const transformedAssets = transformAssets(assets);
  return transformedAssets;
};
