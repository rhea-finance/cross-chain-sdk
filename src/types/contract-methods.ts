export enum ViewMethodsLogic {
  // accounts
  get_account,
  get_accounts_paged,
  get_account_all_positions,
  get_margin_account,
  // assets
  get_asset,
  get_assets,
  get_assets_paged,
  get_assets_paged_detailed,
  // config
  get_config,
  get_margin_config,
  get_default_margin_base_token_limit,
  list_margin_base_token_limit,
  get_booster_tokens,
  // farms
  get_asset_farm,
  get_asset_farms,
  get_asset_farms_paged,
  storage_balance_of,
  get_all_token_pyth_infos,
  // batch views
  batch_views,
}

export enum ViewMethodsOracle {
  get_price_data,
}
export enum ViewMethodsPyth {
  get_price,
  list_prices_no_older_than,
  list_prices,
}
export enum ViewMethodsToken {
  ft_metadata,
  ft_balance_of,
  storage_balance_of,
  get_st_near_price,
  get_nearx_price,
  ft_price,
  get_high_precision_virtual_price,
  storage_balance_bounds,
}

// Change methods can modify the state. But you don't receive the returned value when called.
export enum ChangeMethodsLogic {
  execute,
  execute_with_pyth,
  storage_deposit,
  oracle_on_call,
  account_farm_claim_all,
  add_asset_farm_reward,
  register_account,
  simple_withdraw,
}
export enum ChangeMethodsOracle {
  oracle_call,
}
