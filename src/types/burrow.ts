export interface IConfig {
  booster_decimals: number;
  booster_token_id: string;
  force_closing_enabled: number;
  max_num_assets: number;
  maximum_recency_duration_sec: number;
  maximum_staking_duration_sec: number;
  maximum_staleness_duration_sec: number;
  minimum_staking_duration_sec: number;
  oracle_account_id: string;
  ref_exchange_id: string;
  owner_id: string;
  x_booster_multiplier_at_maximum_staking_duration: number;
  boost_suppress_factor: number;
  enable_price_oracle: boolean;
  enable_pyth_oracle: boolean;
  meme_oracle_account_id: string;
  meme_ref_exchange_id: string;
}

export type TokenAction = "Supply" | "Borrow" | "Repay" | "Adjust" | "Withdraw";
