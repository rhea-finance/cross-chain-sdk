import Decimal from "decimal.js";
import _ from "lodash";
import { shrinkToken, expandTokenDecimal } from "../utils/numbers";
import { DEFAULT_POSITION } from "../config/constantConfig";
import { decimalMax, decimalMin } from "../utils/numbers";
import { Assets, IAssetsView, Portfolio } from "../types";
import { getAdjustedSum } from "../healthFactor/common";
export const computeWithdrawMaxAmount = ({
  tokenId,
  assets,
  portfolio,
}: {
  tokenId: string;
  assets: Assets | IAssetsView;
  portfolio: Portfolio;
}) => {
  const asset = assets[tokenId];
  const position = DEFAULT_POSITION;
  const assetPrice = asset.price
    ? new Decimal(asset.price.usd || "0")
    : new Decimal(0);
  const suppliedBalance = new Decimal(
    portfolio.supplied[tokenId]?.balance || 0
  );
  const collateralBalance = new Decimal(
    portfolio.positions[position]?.collateral?.[tokenId]?.balance || 0
  );

  let maxAmount = suppliedBalance;
  // has debt
  if (portfolio.borrows.length > 0 && collateralBalance.gt(0)) {
    const clonedPortfolio: Portfolio = JSON.parse(JSON.stringify(portfolio));
    clonedPortfolio.positions[position].collateral[tokenId] = {
      apr: "0",
      balance: "0",
      shares: "0",
    };
    const _adjustedCollateralSum = getAdjustedSum({
      type: "collateral",
      portfolio: clonedPortfolio,
      assets,
    });
    const adjustedBorrowedSum = getAdjustedSum({
      type: "borrowed",
      portfolio,
      assets,
    });
    const healthFactor = _adjustedCollateralSum
      .div(adjustedBorrowedSum)
      .mul(100)
      .toNumber();
    if (healthFactor <= 105) {
      const adjustedCollateralSum = getAdjustedSum({
        type: "collateral",
        portfolio,
        assets,
      });
      const adjustedPricedDiff = decimalMax(
        0,
        adjustedCollateralSum.sub(adjustedBorrowedSum)
      );
      const safeAdjustedPricedDiff = adjustedPricedDiff.mul(999).div(1000);

      const safePricedDiff = safeAdjustedPricedDiff
        .div(asset.config.volatility_ratio)
        .mul(10000);
      const safeDiff = safePricedDiff
        .div(assetPrice)
        .mul(
          expandTokenDecimal(
            1,
            asset.config.extra_decimals + (asset?.metadata?.decimals || 0)
          )
        )
        .trunc();
      maxAmount = maxAmount.add(decimalMin(safeDiff, collateralBalance));
    } else {
      maxAmount = suppliedBalance.plus(collateralBalance);
    }
  } else {
    maxAmount = suppliedBalance.plus(collateralBalance);
  }

  return {
    maxAmount,
    canWithdrawAll: maxAmount.eq(suppliedBalance.plus(collateralBalance)),
  };
};

export const getWithdrawMaxAmount = ({
  tokenId,
  assets,
  portfolio,
}: {
  tokenId: string;
  assets: Assets | IAssetsView;
  portfolio: Portfolio;
}) => {
  const asset = assets[tokenId];
  const { metadata, config } = asset;
  const decimals = (metadata?.decimals || 0) + config.extra_decimals;
  const { maxAmount } = computeWithdrawMaxAmount({
    tokenId,
    assets,
    portfolio,
  });
  return Number(shrinkToken(maxAmount.toFixed(), decimals));
};
