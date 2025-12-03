import Decimal from "decimal.js";
import _ from "lodash";
import { expandTokenDecimal } from "../utils/numbers";
import { MAX_RATIO, DEFAULT_POSITION } from "../config/constantConfig";
import { getAdjustedSum } from "./common";
import { Portfolio, Assets, IAssetsView } from "../types";
import { decimalMax, decimalMin } from "../utils/numbers";

export const recomputeHealthFactorWithdraw = ({
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
  if (_.isEmpty(assets) || !tokenId || !portfolio) {
    return { healthFactor: 0, maxBorrowValue: new Decimal(0) };
  }
  const asset = assets[tokenId];
  const { metadata, config } = asset;
  const decimals = (metadata?.decimals || 0) + config.extra_decimals;
  const position = DEFAULT_POSITION;
  const clonedPortfolio: Portfolio = JSON.parse(JSON.stringify(portfolio));
  if (!clonedPortfolio.positions[position]) {
    clonedPortfolio.positions[position] = {
      collateral: {
        [tokenId]: {
          balance: "0",
          shares: "0",
          apr: "0",
        },
      },
      borrowed: {},
    };
  } else if (!clonedPortfolio.positions[position].collateral[tokenId]) {
    clonedPortfolio.positions[position].collateral[tokenId] = {
      balance: "0",
      shares: "0",
      apr: "0",
    };
  }

  if (!clonedPortfolio.supplied[tokenId]) {
    clonedPortfolio.supplied[tokenId] = {
      balance: "0",
      shares: "0",
      apr: "0",
    };
  }
  const collateralBalance = new Decimal(
    clonedPortfolio.positions[position].collateral[tokenId].balance
  );
  const suppliedBalance = new Decimal(
    clonedPortfolio.supplied[tokenId].balance
  );
  const amountDecimal = expandTokenDecimal(amount, decimals);

  const newCollateralBalance = decimalMax(
    0,
    decimalMin(
      collateralBalance,
      collateralBalance.plus(suppliedBalance).minus(amountDecimal)
    )
  );

  clonedPortfolio.positions[position].collateral[tokenId] = {
    ...clonedPortfolio.positions[position].collateral[tokenId],
    shares: newCollateralBalance.toFixed(),
    balance: newCollateralBalance.toFixed(),
  };
  const adjustedCollateralSum = getAdjustedSum({
    type: "collateral",
    portfolio: clonedPortfolio,
    assets,
  });
  const adjustedBorrowedSum = getAdjustedSum({
    type: "borrowed",
    portfolio,
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
