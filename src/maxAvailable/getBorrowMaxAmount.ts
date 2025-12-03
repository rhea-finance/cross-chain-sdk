import _ from "lodash";
import Decimal from "decimal.js";
import { Assets, IAssetsView } from "../types";
import { getAdjustedSum } from "../healthFactor/common";
import { DEFAULT_POSITION, MAX_RATIO } from "../config/constantConfig";
import { Portfolio } from "../types";

const computeBorrowMaxAmount = ({
  tokenId,
  assets,
  portfolio,
}: {
  tokenId: string;
  assets: Assets | IAssetsView;
  portfolio: Portfolio;
}) => {
  const asset = assets[tokenId];
  return Object.keys(portfolio.positions)
    .map((position: string) => {
      const adjustedCollateralSum = getAdjustedSum({
        type: "collateral",
        portfolio: portfolio,
        assets: assets,
      });
      const adjustedBorrowedSum = getAdjustedSum({
        type: "borrowed",
        portfolio: portfolio,
        assets: assets,
      });
      const volatiliyRatio = asset.config.volatility_ratio || 0;
      const price = asset.price?.usd || Infinity;
      const maxBorrowPricedForToken = adjustedCollateralSum
        .sub(adjustedBorrowedSum)
        .mul(volatiliyRatio)
        .div(MAX_RATIO)
        .mul(95)
        .div(100);
      const maxBorrowAmountTemp = maxBorrowPricedForToken.div(price);
      const maxBorrowAmount = Decimal(
        Math.max(0, maxBorrowAmountTemp.toNumber())
      );
      const maxBorrowPriced = adjustedCollateralSum.sub(adjustedBorrowedSum);
      return {
        [position]: {
          maxBorrowAmount: Math.max(maxBorrowAmount.toNumber(), 0),
          maxBorrowValue: Math.max(maxBorrowPriced.toNumber(), 0),
        },
      };
    })
    .reduce((acc, cur) => ({ ...acc, ...cur }), {});
};
export const getBorrowMaxAmount = ({
  tokenId,
  portfolio,
  assets,
}: {
  tokenId: string;
  portfolio: Portfolio;
  assets: Assets | IAssetsView;
}) => {
  if (_.isEmpty(assets) || !portfolio || !tokenId)
    return {
      [DEFAULT_POSITION]: { maxBorrowAmount: 0, maxBorrowValue: 0 },
    };
  const clonedPortfolio: Portfolio = JSON.parse(JSON.stringify(portfolio));
  const maxBorrowAmount = computeBorrowMaxAmount({
    tokenId,
    assets,
    portfolio: clonedPortfolio,
  });
  return maxBorrowAmount;
};
