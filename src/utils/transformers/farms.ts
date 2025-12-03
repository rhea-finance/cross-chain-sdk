// @ts-ignore
import { pick } from "ramda";
import { IAssetFarmView, IFarm, AccountFarmRewardView } from "../../types";

const transformFarmRewards = (rewards: AccountFarmRewardView[]) =>
  rewards.reduce(
    (o, item) => ({
      ...o,
      [item.reward_token_id]: {
        ...pick(
          ["boosted_shares", "unclaimed_amount", "asset_farm_reward"],
          item
        ),
      },
    }),
    {}
  );

export const transformAccountFarms = (list: IFarm[]) => {
  const farms = {
    supplied: {},
    borrowed: {},
    netTvl: {},
    tokennetbalance: {},
  };

  const netTvlFarms = list.find((f) => f.farm_id === "NetTvl");
  const restFarms = list.filter((f: any) => f.farm_id !== "NetTvl");

  restFarms.forEach((farm) => {
    const [action, token] = Object.entries(farm.farm_id)
      .flat()
      .map((s: any) => s.toLowerCase());

    farms[action as keyof typeof farms] = {
      ...farms[action as keyof typeof farms],
      [token]: transformFarmRewards(farm.rewards),
    };
  });

  if (netTvlFarms) {
    farms.netTvl = transformFarmRewards(netTvlFarms.rewards);
  }

  return farms;
};

export const transformAssetFarms = (list: IAssetFarmView[]) => {
  const farms = {
    supplied: {},
    borrowed: {},
    tokennetbalance: {},
  };
  list.forEach((farm) => {
    const [action] = Object.entries(farm.farm_id)
      .flat()
      .map((s: any) => s.toLowerCase());
    farms[action as keyof typeof farms] = {
      ...farms[action as keyof typeof farms],
      ...farm.rewards,
    };
  });
  return farms;
};
