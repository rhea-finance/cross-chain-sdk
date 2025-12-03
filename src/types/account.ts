export interface IFarmId {
  Supplied?: string;
  Borrowed?: string;
}
export interface AccountFarmRewardView {
  boosted_shares: string;
  unclaimed_amount: string;
  reward_token_id: string;
  asset_farm_reward: {
    reward_per_day: string;
    remaining_rewards: string;
    boosted_shares: string;
    booster_log_bases: {
      [tokenId: string]: string;
    };
  };
}

export interface IFarm {
  farm_id: IFarmId | "NetTvl";
  rewards: AccountFarmRewardView[];
}

export interface IPortfolioAssetOrigin {
  token_id: string;
  apr: string;
  balance: string;
  shares: string;
}
export interface IPositionsOrigin {
  [shadow_id: string]: {
    collateral: IPortfolioAssetOrigin[];
    borrowed: IPortfolioAssetOrigin[];
  };
}

export interface PortfolioAsset {
  apr?: string;
  balance: string;
  shares: string;
}

export interface IPositions {
  [shadow_id: string]: {
    collateral: {
      [tokenId: string]: PortfolioAsset;
    };
    borrowed: {
      [tokenId: string]: PortfolioAsset;
    };
  };
}
export interface IBoosterStaking {
  staked_booster_amount: string;
  unlock_timestamp: string;
  x_booster_amount: string;
}

export interface Farm {
  [reward_token_id: string]: AccountFarmRewardView;
}
export interface Portfolio {
  supplied: {
    [tokenId: string]: PortfolioAsset;
  };
  collateral: {
    [tokenId: string]: PortfolioAsset;
  };
  borrowed: {
    [tokenId: string]: PortfolioAsset;
  };
  positions: IPositions;
  farms: {
    supplied: {
      [tokenId: string]: Farm;
    };
    borrowed: {
      [tokenId: string]: Farm;
    };
    tokennetbalance: {
      [tokenId: string]: Farm;
    };
    netTvl: {
      [tokenId: string]: AccountFarmRewardView;
    };
  };
  staking: IBoosterStaking;
  stakings?: Record<string, IBoosterStaking>;
  hasNonFarmedAssets: boolean;
  collateralAll: {
    [tokenId: string]: PortfolioAsset;
  };
  supplies: any[];
  collaterals: any[];
  borrows: any[];
}
export interface IAccountAllPositionsDetailed {
  account_id: string;
  supplied: IPortfolioAssetOrigin[];
  farms: IFarm[];
  booster_staking: IBoosterStaking;
  booster_stakings: Record<string, IBoosterStaking>;
  has_non_farmed_assets: boolean;
  is_locked: boolean;
  positions: IPositionsOrigin;
}
