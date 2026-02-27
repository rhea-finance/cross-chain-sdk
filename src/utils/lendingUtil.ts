import Big from "big.js";
import Decimal from "decimal.js";
import {
  IFarm,
  IUnclaimedRewardsParams,
  IUnclaimedRewardItem,
  IGasData,
  IGetSimpleWithdrawDataParams,
  Asset,
} from "../types";
import { toReadableNumber } from "./numbers";
// @ts-ignore
import { omit } from "ramda";
import { getMultichainLendingConfig } from "../view/centralized_api";
import { getCreateMcaFeePaged, getNearValuesPaged } from "../view/am";
import { computeRelayerGas } from "../other/computeRelayerGas";

export const hasZeroSharesFarmRewards = (farms: IFarm[]): boolean => {
  return farms.some((farm) =>
    farm.rewards.some((reward) => +reward.boosted_shares === 0)
  );
};

export const listFarmToMap = (list: any[]) =>
  list
    .map((asset) => ({ [asset.token_id]: omit(["token_id"], asset) }))
    .reduce((a, b) => ({ ...a, ...b }), {} as any);

export function getUnclaimedRewards({
  portfolioView,
  assetsView,
}: IUnclaimedRewardsParams): IUnclaimedRewardItem[] {
  const tokennetbalance = portfolioView?.farms?.tokennetbalance;
  if (!tokennetbalance) return [];
  const sumByToken: Record<string, string> = {};
  const add = (rewardTokenId: string, unclaimedAmount: string) => {
    if (!unclaimedAmount || unclaimedAmount === "0") return;
    sumByToken[rewardTokenId] = Big(sumByToken[rewardTokenId] || "0")
      .plus(unclaimedAmount)
      .toFixed(0);
  };

  Object.values(tokennetbalance).forEach((farm) => {
    Object.entries(farm).forEach(([rewardTokenId, data]) => {
      add(
        rewardTokenId,
        (data as { unclaimed_amount?: string })?.unclaimed_amount || "0"
      );
    });
  });

  return Object.entries(sumByToken)
    .filter(([, amount]) => amount !== "0")
    .map(([rewardTokenId, amount]) => {
      const asset = assetsView?.[rewardTokenId];
      const extra_decimals = asset?.config?.extra_decimals ?? 0;
      const decimals = new Decimal(asset?.metadata?.decimals ?? 0)
        .plus(extra_decimals)
        .toNumber();
      const amountToken = new Decimal(
        toReadableNumber(extra_decimals, amount)
      ).toFixed(0, Decimal.ROUND_DOWN);
      const amountRead = new Decimal(
        toReadableNumber(decimals, amount)
      ).toFixed();
      const amountUsd = new Decimal(amountRead)
        .mul(asset?.price?.usd ?? 0)
        .toFixed();
      return {
        rewardTokenId,
        amountBurrow: amount,
        amountToken,
        amountRead,
        amountUsd,
        rewardTokenAssetView: asset,
      };
    });
}

export async function getSimpleWithdrawData(
  params: IGetSimpleWithdrawDataParams
): Promise<IGasData | undefined> {
  const res = await getMultichainLendingConfig();
  const target_relayer = res.find(
    (item) => item["key"] === "COLLECT_FEE_ACCOUNT_ID"
  );
  const target_gas = res.find((item) => item["key"] === "GAS_FEE");
  const target_version = res.find((item) => item["key"] === "MCA_VERSION");

  const result_gas = target_gas?.value
    ? (JSON.parse(target_gas["value"]) as Record<string, string>)
    : undefined;
  const result_relayer = target_relayer?.["value"];
  const result_version = target_version?.["value"];

  if (!result_gas) return undefined;

  const result = computeRelayerGas({
    nearStorageAmount: params.nearStorageAmount,
    mca: params.mca,
    relayerGasFees: result_gas,
    assets: params.assets,
    portfolio: params.portfolio,
    businessNum: params.businessNum,
  });
  if (result?.simpleWithdrawData) {
    result.simpleWithdrawData.relayerId = result_relayer;
  }
  return result;
}

export async function getCreateMcaFeeData({
  bufferMultiple = 1.05,
  asset,
}: {
  bufferMultiple?: number;
  asset: Asset;
}) {
  const feeList = await getCreateMcaFeePaged();
  const nearValueList = await getNearValuesPaged();

  const tokenId = asset.token_id;
  const mcaFee = feeList[tokenId] || "0";
  const nearValue = nearValueList[tokenId] || "0";

  const totalFee = Big(mcaFee)
    .plus(Big(nearValue).mul(0.1))
    .toFixed(0, Big.roundDown);

  const decimals = asset.metadata?.decimals ?? 0;
  const amountRaw = Big(totalFee).mul(bufferMultiple).toFixed(0, Big.roundDown);
  const amountReadable = toReadableNumber(decimals, amountRaw);

  return {
    amountRaw,
    amountReadable,
  };
}
