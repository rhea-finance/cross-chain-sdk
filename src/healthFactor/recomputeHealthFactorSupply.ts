import Decimal from "decimal.js";
import _ from "lodash";
import { expandTokenDecimal } from "../utils/numbers";
import { MAX_RATIO, DEFAULT_POSITION } from "../config/constantConfig";
import { getAdjustedSum } from "./common";
import { Portfolio, Assets, IAssetsView } from "../types";

export const recomputeHealthFactorSupply = ({
  tokenId,
  amount,
  portfolio,
  assets,
  useAsCollateral,
}: {
  tokenId: string;
  amount: number;
  portfolio: Portfolio;
  assets: IAssetsView | Assets;
  useAsCollateral: boolean;
}) => {
  if (_.isEmpty(assets) || !tokenId || !portfolio)
    return { healthFactor: 0, maxBorrowValue: new Decimal(0) };
  const asset = assets[tokenId];
  const { metadata, config } = asset;
  const decimals = (metadata?.decimals || 0) + config.extra_decimals;
  const position = DEFAULT_POSITION;
  const clonedPortfolio: Portfolio = JSON.parse(JSON.stringify(portfolio));
  const amountDecimal = expandTokenDecimal(amount, decimals);
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
  const collateralBalance = new Decimal(
    clonedPortfolio.positions[position].collateral[tokenId].balance
  );
  const newBalance = collateralBalance.plus(
    useAsCollateral ? amountDecimal : 0
  );
  clonedPortfolio.positions[position].collateral[tokenId] = {
    ...clonedPortfolio.positions[position].collateral[tokenId],
    shares: newBalance.toFixed(),
    balance: newBalance.toFixed(),
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
