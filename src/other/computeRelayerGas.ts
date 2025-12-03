import _ from "lodash";
import Decimal from "decimal.js";
import { Assets, IAssetsView, Portfolio, IGasData } from "../types";
import { DEFAULT_POSITION } from "../config/constantConfig";
import {
  decimalMax,
  expandTokenDecimal,
  decimalMin,
  shrinkToken,
} from "../utils";
import { MAX_RATIO, config_near } from "../config";
import { getAdjustedSum } from "../healthFactor";
export const computeRelayerGas = ({
  nearStorageAmount,
  mca,
  relayerGasFees,
  assets,
  portfolio,
}: {
  nearStorageAmount: string | number;
  mca: string;
  relayerGasFees: Record<string, string>;
  assets: IAssetsView | Assets;
  portfolio: Portfolio;
}): IGasData | undefined => {
  if (!mca || _.isEmpty(assets) || _.isEmpty(portfolio)) return;
  const { tokenId, amount, relayerFeeUsd } = searchMatchAssetId({
    portfolio,
    assets,
    nearStorageAmount,
    relayerGasFees,
  });
  if (!tokenId) return;
  const asset = assets[tokenId];
  const { metadata, config } = asset;
  const position = DEFAULT_POSITION;
  const decimals = (metadata?.decimals || 0) + config.extra_decimals;
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
  const amountDecimal = expandTokenDecimal(amount || "0", decimals);
  const newCollateralBalance = decimalMax(
    0,
    decimalMin(
      collateralBalance,
      collateralBalance.plus(suppliedBalance).minus(amountDecimal)
    )
  );
  const newSuppliedBalance = decimalMax(
    0,
    suppliedBalance.minus(amountDecimal)
  );
  // update supplied on portfolio
  const newSuppliedBalanceMap = {
    shares: newSuppliedBalance.toFixed(),
    balance: newSuppliedBalance.toFixed(),
  };
  clonedPortfolio.supplied[tokenId] = {
    ...(clonedPortfolio.supplied[tokenId] || {}),
    ...newSuppliedBalanceMap,
  };
  // update collateral on portfolio
  const newCollateralBalanceMap = {
    shares: newCollateralBalance.toFixed(),
    balance: newCollateralBalance.toFixed(),
  };
  clonedPortfolio.collateral[tokenId] = {
    ...(clonedPortfolio.collateral[tokenId] || {}),
    ...newCollateralBalanceMap,
  };

  clonedPortfolio.positions[position].collateral[tokenId] = {
    ...clonedPortfolio.positions[position].collateral[tokenId],
    ...newCollateralBalanceMap,
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
  const healthFactorTemp = adjustedCollateralSum
    .div(adjustedBorrowedSum)
    .mul(100)
    .toNumber();
  const healthFactor =
    healthFactorTemp < MAX_RATIO ? healthFactorTemp : MAX_RATIO;
  if (healthFactor > 105) {
    const amountToken = expandTokenDecimal(
      amount,
      asset?.metadata?.decimals || 0
    ).toFixed(0, Decimal.ROUND_DOWN);
    const amountBurrow = expandTokenDecimal(
      amount,
      (asset?.config?.extra_decimals || 0) + (asset?.metadata?.decimals || 0)
    ).toFixed(0, Decimal.ROUND_DOWN);
    return {
      portfolioMinusGas: clonedPortfolio,
      tokenId,
      amount,
      relayerFeeUsd: relayerFeeUsd || 0,
      amountToken,
      amountBurrow,
      simpleWithdrawData: {
        tokenId,
        amount,
        amountToken,
        amountBurrow,
      },
    };
  }
  return;
};

function searchMatchAssetId({
  portfolio,
  assets,
  nearStorageAmount,
  relayerGasFees,
}: {
  portfolio: Portfolio;
  assets: IAssetsView | Assets;
  nearStorageAmount: string | number;
  relayerGasFees: Record<string, string>;
}) {
  const costNearUSD = new Decimal(
    assets[config_near.WRAP_NEAR_CONTRACT_ID]?.price?.usd || 0
  ).mul(nearStorageAmount || 0);
  const _suppliesUsd = Object.entries(portfolio.supplied)?.map(
    ([token_id, item]) => {
      const { balance } = item;
      const _asset = assets[token_id];
      const _price = _asset.price?.usd || 0;
      const _amount = shrinkToken(
        balance,
        (_asset?.config?.extra_decimals || 0) +
          (_asset?.metadata?.decimals || 0)
      );
      const _amount_relayer =
        shrinkToken(
          relayerGasFees[token_id] || 0,
          _asset?.metadata?.decimals || 0
        ) || 0;
      return {
        token_id,
        token_price: _price,
        token_decimals: _asset?.metadata?.decimals || 0,
        token_usd: new Decimal(_amount_relayer).gt(0)
          ? new Decimal(_price).mul(_amount).toFixed()
          : "0",
        relayerFeeUsd: new Decimal(_price).mul(_amount_relayer).toFixed(),
        totalFeeUsd: new Decimal(_price)
          .mul(_amount_relayer)
          .plus(costNearUSD)
          .toFixed(),
      };
    }
  );
  const maxSuppplied = _.maxBy(_suppliesUsd, (o) => +o.token_usd);
  if (
    new Decimal(maxSuppplied?.token_usd || 0).gt(0) &&
    new Decimal(maxSuppplied?.token_usd || 0).gte(
      maxSuppplied?.totalFeeUsd || 0
    )
  ) {
    return {
      tokenId: maxSuppplied?.token_id,
      amount: new Decimal(maxSuppplied?.token_price || 0).gt(0)
        ? new Decimal(maxSuppplied?.totalFeeUsd || 0)
            .div(maxSuppplied?.token_price || 0)
            .toFixed(maxSuppplied?.token_decimals || 0)
        : "0",
      relayerFeeUsd: maxSuppplied?.relayerFeeUsd,
    };
  } else {
    const _collateralUsd = Object.entries(
      portfolio?.positions?.[DEFAULT_POSITION]?.collateral || {}
    ).map(([token_id, _item]) => {
      const _asset = assets[token_id];
      const _price = _asset.price?.usd || 0;
      const _amount = shrinkToken(
        _item.balance,
        (_asset?.config?.extra_decimals || 0) +
          (_asset?.metadata?.decimals || 0)
      );
      const _amount_relayer =
        shrinkToken(
          relayerGasFees[token_id] || 0,
          _asset?.metadata?.decimals || 0
        ) || 0;
      return {
        token_id,
        token_price: _price,
        token_decimals: _asset?.metadata?.decimals || 0,
        token_usd: new Decimal(_amount_relayer).gt(0)
          ? new Decimal(_price).mul(_amount)
          : "0",
        relayerFeeUsd: new Decimal(_price).mul(_amount_relayer).toFixed(),
        totalFeeUsd: new Decimal(_price).mul(_amount_relayer).plus(costNearUSD),
      };
    });
    const maxCollateral = _.maxBy(_collateralUsd, (o) => +o.token_usd);
    if (
      new Decimal(maxCollateral?.token_usd || 0).gte(
        maxCollateral?.totalFeeUsd || 0
      )
    ) {
      return {
        tokenId: maxCollateral?.token_id,
        amount: new Decimal(maxCollateral?.token_price || 0).gt(0)
          ? new Decimal(maxCollateral?.totalFeeUsd || 0)
              .div(maxCollateral?.token_price || 0)
              .toFixed(maxCollateral?.token_decimals || 0)
          : "0",
        relayerFeeUsd: maxCollateral?.relayerFeeUsd,
      };
    }
  }
  return {};
}
