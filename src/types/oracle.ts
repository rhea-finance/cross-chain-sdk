export interface IPrice {
  decimals: number;
  multiplier: string;
  usd?: string;
}

export interface IAssetPrice {
  asset_id: string;
  price: IPrice | null;
}

export interface IPrices {
  prices: IAssetPrice[];
  recency_duration_sec: number;
  timestamp: string;
}
export interface IPythInfo {
  decimals: number;
  fraction_digits: number;
  price_identifier: string;
  extra_call: string;
  default_price: {
    multiplier: string;
    decimals: number;
  } | null;
}

export interface IPythPrice {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}
