import Decimal from "decimal.js";
import _ from "lodash";
import { expandTokenDecimal } from "../utils/numbers";
import { MAX_RATIO, DEFAULT_POSITION } from "../config/constantConfig";
import { getAdjustedSum } from "./common";
import { Portfolio, Assets, IAssetsView } from "../types";
export const recomputeHealthFactorBorrow = ({
  tokenId,
  amount,
  position,
  portfolio,
  assets,
}: {
  tokenId: string;
  amount: number;
  position?: string;
  portfolio: Portfolio;
  assets: IAssetsView | Assets;
}) => {
  if (_.isEmpty(assets))
    return { healthFactor: 0, maxBorrowValue: new Decimal(0) };
  if (!portfolio || !tokenId)
    return { healthFactor: 0, maxBorrowValue: new Decimal(0) };
  const asset = assets[tokenId];
  const { metadata, config } = asset;
  const decimals = (metadata?.decimals || 0) + config.extra_decimals;
  const clonedPortfolio: Portfolio = JSON.parse(JSON.stringify(portfolio));
  if (!clonedPortfolio.positions[position || DEFAULT_POSITION]) {
    clonedPortfolio.positions[position || DEFAULT_POSITION] = {
      borrowed: {
        [tokenId]: {
          balance: "0",
          shares: "0",
          apr: "0",
        },
      },
      collateral: {},
    };
  } else if (
    !clonedPortfolio.positions[position || DEFAULT_POSITION].borrowed[tokenId]
  ) {
    clonedPortfolio.positions[position || DEFAULT_POSITION].borrowed[tokenId] =
      {
        balance: "0",
        shares: "0",
        apr: "0",
      };
  }
  const newBalance = expandTokenDecimal(amount, decimals)
    .plus(
      new Decimal(
        clonedPortfolio.positions[position || DEFAULT_POSITION].borrowed[
          tokenId
        ]?.balance || 0
      )
    )
    .toFixed();
  clonedPortfolio.positions[position || DEFAULT_POSITION].borrowed[
    tokenId
  ].balance = newBalance;

  const adjustedCollateralSum = getAdjustedSum({
    type: "collateral",
    portfolio,
    assets,
  });
  const adjustedBorrowedSum = getAdjustedSum({
    type: "borrowed",
    portfolio: clonedPortfolio,
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
