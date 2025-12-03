import Decimal from "decimal.js";
import { Portfolio, Assets, IAssetsView } from "../types";
import { DEFAULT_POSITION } from "../config/constantConfig";
import { expandTokenDecimal } from "../utils/numbers";
import { MAX_RATIO } from "../config/constantConfig";
const sumReducerDecimal = (sum: Decimal, cur: Decimal) => sum.add(cur);
export const getAdjustedSum = ({
  type,
  portfolio,
  assets,
}: {
  type: "borrowed" | "collateral";
  portfolio: Portfolio;
  assets: IAssetsView | Assets;
}) => {
  const positionId = DEFAULT_POSITION;
  const result = Object.keys(portfolio.positions[positionId]?.[type] || {}).map(
    (id) => {
      const asset = assets[id];
      let pricedBalance;
      const price = asset?.price
        ? new Decimal(asset.price.multiplier).div(
            new Decimal(10).pow(asset.price.decimals)
          )
        : new Decimal(0);
      pricedBalance = new Decimal(
        portfolio.positions[positionId][type][id].balance
      )
        .div(expandTokenDecimal(1, asset?.config?.extra_decimals || 0))
        .mul(price);

      return type === "borrowed"
        ? pricedBalance.div(asset?.config?.volatility_ratio || 1).mul(MAX_RATIO)
        : pricedBalance
            .mul(asset?.config?.volatility_ratio || 1)
            .div(MAX_RATIO);
    }
  );

  const sumResult = result?.reduce(sumReducerDecimal, new Decimal(0));
  return sumResult || new Decimal(0);
};
