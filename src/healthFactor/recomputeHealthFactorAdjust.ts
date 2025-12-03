import Decimal from "decimal.js";
import _ from "lodash";
import { expandTokenDecimal } from "../utils/numbers";
import { MAX_RATIO, DEFAULT_POSITION } from "../config/constantConfig";
import { getAdjustedSum } from "./common";
import { Portfolio, Assets, IAssetsView } from "../types";

export const recomputeHealthFactorAdjust = ({
  tokenId,
  amount,
  portfolio,
  assets,
}: {
  tokenId: string;
  amount: number;
  portfolio: Portfolio;
  assets: IAssetsView | Assets;
}) => {
  if (_.isEmpty(assets))
    return { healthFactor: 0, maxBorrowValue: new Decimal(0) };
  if (!portfolio || !tokenId)
    return { healthFactor: 0, maxBorrowValue: new Decimal(0) };
  const asset = assets[tokenId];
  const { metadata, config } = asset;
  const position = DEFAULT_POSITION;

  const decimals = (metadata?.decimals || 0) + config.extra_decimals;

  const newBalance = expandTokenDecimal(amount, decimals).toFixed();

  const clonedPortfolio: Portfolio = JSON.parse(JSON.stringify(portfolio));

  if (!clonedPortfolio.positions[position]) {
    clonedPortfolio.positions[position] = {
      collateral: {
        [tokenId]: {
          balance: newBalance,
          shares: newBalance,
          apr: "0",
        },
      },
      borrowed: {},
    };
  } else if (!clonedPortfolio.positions[position].collateral[tokenId]) {
    clonedPortfolio.positions[position].collateral[tokenId] = {
      balance: newBalance,
      shares: newBalance,
      apr: "0",
    };
  }
  clonedPortfolio.positions[position].collateral[tokenId] = {
    ...clonedPortfolio.positions[position].collateral[tokenId],
    balance: newBalance,
    shares: newBalance,
  };

  const adjustedCollateralSum = getAdjustedSum({
    type: "collateral",
    portfolio: clonedPortfolio,
    assets,
  });
  const adjustedBorrowedSum = getAdjustedSum({
    type: "borrowed",
    portfolio: portfolio,
    assets,
  });

  const maxBorrowValue = adjustedCollateralSum.sub(adjustedBorrowedSum);
  const healthFactorTemp = adjustedCollateralSum
    .div(adjustedBorrowedSum)
    .mul(100)
    .toNumber();
  const healthFactor =
    healthFactorTemp < MAX_RATIO ? healthFactorTemp : MAX_RATIO;
  return { healthFactor, maxBorrowValue };
};
