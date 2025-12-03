import { IPrice } from "./oracle";
export interface IPool {
  shares: string;
  balance: string;
}
export interface IAssetConfig {
  reserve_ratio: number;
  target_utilization: number;
  target_utilization_rate: string;
  max_utilization_rate: string;
  volatility_ratio: number;
  extra_decimals: number;
  can_deposit: boolean;
  can_withdraw: boolean;
  can_use_as_collateral: boolean;
  can_borrow: boolean;
  net_tvl_multiplier: number;
  holding_position_fee_rate: string;
  min_borrowed_amount?: string;
}

export interface IMetadata {
  token_id: string;
  icon: string;
  name: string;
  symbol: string;
  decimals: number;
  tokens?: any;
}
export interface IAssetFarmReward {
  /// The amount of reward distributed per day.
  reward_per_day: string;
  booster_log_bases: Record<string, string>;
  /// The amount of rewards remaining to distribute.
  remaining_rewards: string;
  /// The total number of boosted shares.
  boosted_shares: string;
}

export interface IAssetFarm {
  block_timestamp: string;
  rewards: Record<string, IAssetFarmReward>;
}

export interface IAssetFarmView {
  farm_id: Record<string, string>;
  rewards: Record<string, IAssetFarmReward>;
}

export interface IAssetDetailed {
  token_id: string;
  /// Total supplied including collateral, but excluding reserved.
  supplied: IPool;
  /// Total borrowed.
  borrowed: IPool;
  /// The amount reserved for the stability. This amount can also be borrowed and affects
  /// borrowing rate.
  reserved: string;
  /// When the asset was last updated. It's always going to be the current block timestamp.
  last_update_timestamp: string;
  /// The asset config.
  config: IAssetConfig;
  /// Current supply APR
  supply_apr: string;
  /// Current borrow APR
  borrow_apr: string;
  /// Asset farms
  farms: IAssetFarmView[];
  prot_fee: string;
  isLpToken: boolean;
  margin_debt: IPool;
  margin_pending_debt: string;
  margin_position: string;
  uahpi: string;
  price: IPrice;
  metadata?: IMetadata;
}
export type Asset = Omit<IAssetDetailed, "farms"> & {
  farms: {
    supplied: {
      [token: string]: IAssetFarmReward;
    };
    borrowed: {
      [token: string]: IAssetFarmReward;
    };
    tokennetbalance: {
      [token: string]: IAssetFarmReward;
    };
  };
};
export interface Assets {
  [id: string]: IAssetDetailed;
}
export interface IAssetsView {
  [id: string]: Asset;
}

export interface IFarms {
  supplied: Record<string, Record<string, IAssetFarmReward>>;
  borrowed: Record<string, Record<string, IAssetFarmReward>>;
  tokenNetBalance: Record<string, Record<string, IAssetFarmReward>>;
  netTvl: Record<string, Record<string, IAssetFarmReward>>;
}
