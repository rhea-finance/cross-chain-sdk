import { IFarm } from "../types";
// @ts-ignore
import { omit } from "ramda";
export const hasZeroSharesFarmRewards = (farms: IFarm[]): boolean => {
  return farms.some((farm) =>
    farm.rewards.some((reward) => +reward.boosted_shares === 0)
  );
};

export const listFarmToMap = (list: any[]) =>
  list
    .map((asset) => ({ [asset.token_id]: omit(["token_id"], asset) }))
    .reduce((a, b) => ({ ...a, ...b }), {} as any);
