import Decimal from "decimal.js";
import {
  IPythPrice,
  IConfig,
  IPrices,
  IPythInfo,
  ViewMethodsPyth,
  IAssetPrice,
  IPrice,
  ViewMethodsOracle,
  ViewMethodsToken,
  ViewMethodsLogic,
} from "../types";
import { config_near } from "../config";
import { view_on_near } from "../chains";
import { FRACTION_DIGITS } from "../config/constantConfig";
const getPrices = async ({
  token_pyth_infos,
  config,
}: {
  token_pyth_infos: Record<string, IPythInfo>;
  config: IConfig;
}): Promise<IPrices | undefined> => {
  const { enable_pyth_oracle } = config;
  if (enable_pyth_oracle) {
    const pythResponse = await getPythPrices(token_pyth_infos);
    return pythResponse;
  } else {
    const oracleResponse = await getOraclePrices();
    return oracleResponse;
  }
};
const getPythPrices = async (token_pyth_infos: Record<string, IPythInfo>) => {
  const nearTokenId = "wrap.near";
  const XRHEA_TOKEN = "xtoken.rhealab.near";
  const NEARX_TOKEN = "v2-nearx.stader-labs.near";
  const LINEAR_TOKEN = "linear-protocol.near";
  const STNEAR_TOKEN = "meta-pool.near";
  const RNEAR_TOKEN = "lst.rhealab.near";
  const COINList = token_pyth_infos;

  try {
    const array_coins = Object.entries(COINList);
    let near_pyth_price_obj: IPythPrice = {
      price: "0",
      conf: "0",
      expo: 0,
      publish_time: 0,
    };
    let rhea_pyth_price_obj: IPythPrice = {
      price: "0",
      conf: "0",
      expo: 0,
      publish_time: 0,
    };
    const identifiers = array_coins.map((coin) => coin[1].price_identifier);
    const list_prices_map = await view_on_near({
      contractId: config_near.PYTH_ORACLE_ID,
      methodName: ViewMethodsPyth[ViewMethodsPyth.list_prices_no_older_than],
      args: {
        price_ids: identifiers,
        age: 60,
      },
    });
    const price_array = array_coins.map(
      (coin) => list_prices_map[coin[1].price_identifier]
    );
    const format_price: IAssetPrice[] = price_array.map(
      (priceObject: IPythPrice, index) => {
        const coin = array_coins[index];
        if (!priceObject) {
          if (coin[1].default_price) {
            return {
              asset_id: coin[0],
              price: coin[1].default_price as IPrice,
            };
          }
          return {
            asset_id: coin[0],
            price: {
              multiplier: "0",
              decimals: coin[1].decimals + coin[1].fraction_digits,
            },
          };
        }
        const { price, expo } = priceObject;
        const p = new Decimal(10).pow(expo).mul(price).toNumber();
        if (coin[0] === nearTokenId) {
          near_pyth_price_obj = priceObject;
        }
        if (coin[0] === XRHEA_TOKEN) {
          rhea_pyth_price_obj = priceObject;
        }
        coin[1].fraction_digits = coin[1].fraction_digits || FRACTION_DIGITS;
        const discrepancy_denominator = new Decimal(10)
          .pow(coin[1].fraction_digits)
          .toNumber();
        const object = {
          asset_id: coin[0],
          price: {
            multiplier: new Decimal(p).mul(discrepancy_denominator).toFixed(0),
            decimals: coin[1].decimals + coin[1].fraction_digits,
          },
        };
        return object;
      }
    );
    const format_price_map: any = format_price.reduce(
      (acc, p: IAssetPrice) => ({ ...acc, [p.asset_id]: p }),
      {}
    );
    // Enable special price calculation for LST tokens (rNEAR, NEARX, STNEAR, LINEAR)
    // These tokens use NEAR price * proportion ratio instead of direct Pyth price
    const do_it = true;
    if (do_it && near_pyth_price_obj) {
      const near_price = new Decimal(10)
        .pow(near_pyth_price_obj.expo)
        .mul(near_pyth_price_obj.price);
      const nearx_proportion = (await view_on_near({
        contractId: NEARX_TOKEN,
        methodName: ViewMethodsToken[ViewMethodsToken.get_nearx_price],
      })) as string;
      const stnear_proportion = (await view_on_near({
        contractId: STNEAR_TOKEN,
        methodName: ViewMethodsToken[ViewMethodsToken.get_st_near_price],
      })) as string;
      const linear_proportion = (await view_on_near({
        contractId: LINEAR_TOKEN,
        methodName: ViewMethodsToken[ViewMethodsToken.ft_price],
      })) as string;
      const rnear_proportion = (await view_on_near({
        contractId: RNEAR_TOKEN,
        methodName: ViewMethodsToken[ViewMethodsToken.ft_price],
      })) as string;
      const nearx_price = new Decimal(near_price)
        .mul(nearx_proportion)
        .div(new Decimal(10).pow(24));
      const stnear_price = new Decimal(near_price)
        .mul(stnear_proportion)
        .div(new Decimal(10).pow(24));
      const linear_price = new Decimal(near_price)
        .mul(linear_proportion)
        .div(new Decimal(10).pow(24));
      const rnear_price = new Decimal(near_price)
        .mul(rnear_proportion)
        .div(new Decimal(10).pow(24));
      format_price_map[NEARX_TOKEN] = {
        asset_id: NEARX_TOKEN,
        price: {
          multiplier: nearx_price
            .mul(new Decimal(10).pow(FRACTION_DIGITS))
            .toFixed(0),
          decimals: 24 + FRACTION_DIGITS,
        },
      };
      format_price_map[STNEAR_TOKEN] = {
        asset_id: STNEAR_TOKEN,
        price: {
          multiplier: stnear_price
            .mul(new Decimal(10).pow(FRACTION_DIGITS))
            .toFixed(0),
          decimals: 24 + FRACTION_DIGITS,
        },
      };
      format_price_map[LINEAR_TOKEN] = {
        asset_id: LINEAR_TOKEN,
        price: {
          multiplier: linear_price
            .mul(new Decimal(10).pow(FRACTION_DIGITS))
            .toFixed(0),
          decimals: 24 + FRACTION_DIGITS,
        },
      };
      format_price_map[RNEAR_TOKEN] = {
        asset_id: RNEAR_TOKEN,
        price: {
          multiplier: rnear_price
            .mul(new Decimal(10).pow(FRACTION_DIGITS))
            .toFixed(0),
          decimals: 24 + FRACTION_DIGITS,
        },
      };
    }
    if (do_it && rhea_pyth_price_obj) {
      const rhea_price = new Decimal(10)
        .pow(rhea_pyth_price_obj.expo)
        .mul(rhea_pyth_price_obj.price);
      const xrhea_proportion = (await view_on_near({
        contractId: XRHEA_TOKEN,
        methodName:
          ViewMethodsToken[ViewMethodsToken.get_high_precision_virtual_price],
      })) as string;
      const xrhea_price = new Decimal(rhea_price)
        .mul(xrhea_proportion)
        .div(new Decimal(10).pow(24));
      format_price_map[XRHEA_TOKEN] = {
        asset_id: XRHEA_TOKEN,
        price: {
          multiplier: xrhea_price
            .mul(new Decimal(10).pow(FRACTION_DIGITS))
            .toFixed(0),
          decimals: 18 + FRACTION_DIGITS,
        },
      };
    }
    return {
      prices: Object.values(format_price_map) as IAssetPrice[],
      recency_duration_sec: 0,
      timestamp: "0",
    };
  } catch (error) {
    return undefined;
  }
};
const getOraclePrices = async () => {
  try {
    const priceResponse: IPrices = (await view_on_near({
      contractId: config_near.LOGIC_CONTRACT_NAME,
      methodName: ViewMethodsOracle[ViewMethodsOracle.get_price_data],
    })) as IPrices;

    if (priceResponse) {
      priceResponse.prices = priceResponse?.prices?.map(
        (assetPrice: IAssetPrice) => ({
          ...assetPrice,
          price: assetPrice.price,
        })
      );
    }
    return priceResponse;
  } catch (err: any) {
    console.error("Getting prices failed: ", err.message);
    return undefined;
  }
};

const getTokenPythInfos = async () => {
  return (await view_on_near({
    contractId: config_near.LOGIC_CONTRACT_NAME,
    methodName: ViewMethodsLogic[ViewMethodsLogic.get_all_token_pyth_infos],
  })) as Record<string, IPythInfo>;
};

export { getPrices, getTokenPythInfos };
