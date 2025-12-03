import Decimal from "decimal.js";
import _ from "lodash";
import { expandTokenDecimal } from "../utils/numbers";
import { MAX_RATIO, DEFAULT_POSITION } from "../config/constantConfig";
import { getAdjustedSum } from "./common";
import { Portfolio, Assets, IAssetsView } from "../types";
import { decimalMax, decimalMin } from "../utils/numbers";
export const recomputeHealthFactorRepayFromDeposits = ({
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
  if (
    _.isEmpty(assets) ||
    !tokenId ||
    !portfolio ||
    !portfolio?.positions?.[DEFAULT_POSITION]?.borrowed?.[tokenId]
  )
    return { healthFactor: 0, maxBorrowValue: new Decimal(0) };
  const asset = assets[tokenId];
  const { metadata, config } = asset;
  const decimals = (metadata?.decimals || 0) + config.extra_decimals;
  const amountDecimal = expandTokenDecimal(amount, decimals);
  const position = DEFAULT_POSITION;
  const clonedPortfolio: Portfolio = JSON.parse(JSON.stringify(portfolio));
  // new borrowed balance
  const borrowedBalance = new Decimal(
    clonedPortfolio.positions[position].borrowed[tokenId].balance
  );
  const newBorrowedBalance = decimalMax(
    0,
    borrowedBalance.minus(amountDecimal)
  );
  // new collateral balance
  const collateralBalance = new Decimal(
    clonedPortfolio.positions[position]?.collateral?.[tokenId]?.balance || 0
  );
  const suppliedBalance = new Decimal(
    clonedPortfolio.supplied?.[tokenId]?.balance || 0
  );

  const newCollateralBalance = decimalMax(
    0,
    decimalMin(
      collateralBalance,
      collateralBalance.plus(suppliedBalance).minus(amountDecimal)
    )
  );
  // update collateral balance in position
  if (newCollateralBalance.lt(collateralBalance)) {
    clonedPortfolio.positions[position].collateral[tokenId] = {
      ...clonedPortfolio.positions[position].collateral[tokenId],
      shares: newCollateralBalance.toFixed(),
      balance: newCollateralBalance.toFixed(),
    };
  }

  // update borrowed balance in position
  clonedPortfolio.positions[position].borrowed[tokenId].balance =
    newBorrowedBalance.toFixed();
  const adjustedCollateralSum = getAdjustedSum({
    type: "collateral",
    portfolio: clonedPortfolio,
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
