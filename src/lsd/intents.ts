import Big from "big.js";
import { intentsQuotation } from "../action/actionUtil/commonAction";
import type { IIntentsQuoteResult } from "../types/common";
import { toNonDivisibleNumber, toReadableNumber } from "../utils/numbers";
import {
  BSC_NRUSDT_INTENTS_ASSET_ID,
  BSC_USDT_DECIMALS,
  BSC_USDT_INTENTS_ASSET_ID,
  LSD_CONTRACT_ID,
  LSD_USDT_DECIMALS,
  NEAR_NRUSDT_INTENTS_ASSET_ID,
  NEAR_USDT_DECIMALS,
  NEAR_USDT_INTENTS_ASSET_ID,
} from "./constants";
import { calculateLsdFromUsdt, calculateUsdtFromLsd } from "./view";
import type { LsdIntentsQuote } from "./types";

type QuoteLegParams = {
  amount: string;
  refundTo: string;
  recipient: string;
  dry?: boolean;
  slippageTolerance?: number;
  customRecipientMsg?: string;
};

type LsdQuoteParams = {
  accountAddress: string;
  amount: string;
  dry?: boolean;
  slippageTolerance?: number;
};

function assertConfiguredAssetId(assetId: string, label: string) {
  if (assetId.startsWith("TODO_SET_")) {
    throw new Error(`${label} is not configured yet`);
  }
}

function assertValidQuoteInput(params: LsdQuoteParams) {
  if (!params.accountAddress) {
    throw new Error("accountAddress is required");
  }

  if (!params.amount) {
    throw new Error("amount is required");
  }

  let amountBig: Big;
  try {
    amountBig = new Big(params.amount);
  } catch {
    throw new Error("amount is invalid");
  }

  if (amountBig.lte(0)) {
    throw new Error("amount must be greater than 0");
  }
}

function assertQuoteSuccess(
  result: IIntentsQuoteResult,
  label: string
): NonNullable<IIntentsQuoteResult["quoteSuccessResult"]>["quote"] {
  const quote = result.quoteSuccessResult?.quote;

  if (result.quoteStatus !== "success" || !quote) {
    throw new Error(result.message || `Failed to get ${label} quote`);
  }

  return quote;
}

function sumBridgeFeeUsd(...quotes: IIntentsQuoteResult[]): string {
  return quotes
    .reduce((total, current) => {
      const quote = current.quoteSuccessResult?.quote;
      if (!quote) return total;

      return total.plus(new Big(quote.amountInUsd || 0).minus(quote.amountOutUsd || 0));
    }, new Big(0))
    .toFixed();
}

async function quoteBscUsdtToNearUsdt(
  params: QuoteLegParams
): Promise<IIntentsQuoteResult> {
  return intentsQuotation({
    originAsset: BSC_USDT_INTENTS_ASSET_ID,
    destinationAsset: NEAR_USDT_INTENTS_ASSET_ID,
    amount: params.amount,
    refundTo: params.refundTo,
    recipient: params.recipient,
    customRecipientMsg: params.customRecipientMsg,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
}

async function quoteNearLsdToBscLsd(
  params: QuoteLegParams
): Promise<IIntentsQuoteResult> {
  assertConfiguredAssetId(
    NEAR_NRUSDT_INTENTS_ASSET_ID,
    "NEAR_NRUSDT_INTENTS_ASSET_ID"
  );
  assertConfiguredAssetId(
    BSC_NRUSDT_INTENTS_ASSET_ID,
    "BSC_NRUSDT_INTENTS_ASSET_ID"
  );

  return intentsQuotation({
    originAsset: NEAR_NRUSDT_INTENTS_ASSET_ID,
    destinationAsset: BSC_NRUSDT_INTENTS_ASSET_ID,
    amount: params.amount,
    refundTo: params.refundTo,
    recipient: params.recipient,
    customRecipientMsg: params.customRecipientMsg,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
}

async function quoteBscLsdToNearLsd(
  params: QuoteLegParams
): Promise<IIntentsQuoteResult> {
  assertConfiguredAssetId(
    BSC_NRUSDT_INTENTS_ASSET_ID,
    "BSC_NRUSDT_INTENTS_ASSET_ID"
  );
  assertConfiguredAssetId(
    NEAR_NRUSDT_INTENTS_ASSET_ID,
    "NEAR_NRUSDT_INTENTS_ASSET_ID"
  );

  return intentsQuotation({
    originAsset: BSC_NRUSDT_INTENTS_ASSET_ID,
    destinationAsset: NEAR_NRUSDT_INTENTS_ASSET_ID,
    amount: params.amount,
    refundTo: params.refundTo,
    recipient: params.recipient,
    customRecipientMsg: params.customRecipientMsg,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
}

async function quoteNearUsdtToBscUsdt(
  params: QuoteLegParams
): Promise<IIntentsQuoteResult> {
  return intentsQuotation({
    originAsset: NEAR_USDT_INTENTS_ASSET_ID,
    destinationAsset: BSC_USDT_INTENTS_ASSET_ID,
    amount: params.amount,
    refundTo: params.refundTo,
    recipient: params.recipient,
    customRecipientMsg: params.customRecipientMsg,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
}

export async function quoteLsdSupplyByIntents(
  params: LsdQuoteParams
): Promise<LsdIntentsQuote> {
  // Add validation for the input amount
  assertValidQuoteInput(params);

  const supplyAmountRaw = toNonDivisibleNumber(BSC_USDT_DECIMALS, params.amount);

  const firstQuote = await quoteBscUsdtToNearUsdt({
    amount: supplyAmountRaw,
    refundTo: params.accountAddress,
    recipient: LSD_CONTRACT_ID,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
  const firstQuoteData = assertQuoteSuccess(firstQuote, "LSD supply origin");

  const nearUsdtReadable = toReadableNumber(
    NEAR_USDT_DECIMALS,
    firstQuoteData.minAmountOut
  );
  const lsdAmount = await calculateLsdFromUsdt(nearUsdtReadable);

  const secondQuote = await quoteNearLsdToBscLsd({
    amount: lsdAmount,
    refundTo: LSD_CONTRACT_ID,
    recipient: params.accountAddress,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
  // Assert that the second quote was successful
  const secondQuoteData = assertQuoteSuccess(secondQuote, "LSD supply return");

  return {
    direction: "supply",
    inputAmount: params.amount,
    estimatedReceive: secondQuoteData.amountOutFormatted || "0",
    bridgeFeeUsd: sumBridgeFeeUsd(firstQuote, secondQuote),
    inputToken: "USDT",
    outputToken: "lsdUSDT",
    intermediateAmount: lsdAmount,
    firstQuote,
    secondQuote,
  };
}

export async function quoteLsdWithdrawByIntents(
  params: LsdQuoteParams
): Promise<LsdIntentsQuote> {
  assertValidQuoteInput(params);

  const withdrawAmountRaw = toNonDivisibleNumber(
    LSD_USDT_DECIMALS,
    params.amount
  );

  const firstQuote = await quoteBscLsdToNearLsd({
    amount: withdrawAmountRaw,
    refundTo: params.accountAddress,
    recipient: LSD_CONTRACT_ID,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
  const firstQuoteData = assertQuoteSuccess(firstQuote, "LSD withdraw origin");

  const nearLsdReadable = toReadableNumber(
    LSD_USDT_DECIMALS,
    firstQuoteData.minAmountOut
  );
  const usdtAmount = await calculateUsdtFromLsd(nearLsdReadable);

  const secondQuote = await quoteNearUsdtToBscUsdt({
    amount: usdtAmount,
    refundTo: LSD_CONTRACT_ID,
    recipient: params.accountAddress,
    dry: params.dry,
    slippageTolerance: params.slippageTolerance,
  });
  const secondQuoteData = assertQuoteSuccess(
    secondQuote,
    "LSD withdraw return"
  );

  return {
    direction: "withdraw",
    inputAmount: params.amount,
    estimatedReceive: secondQuoteData.amountOutFormatted || "0",
    bridgeFeeUsd: sumBridgeFeeUsd(firstQuote, secondQuote),
    inputToken: "lsdUSDT",
    outputToken: "USDT",
    intermediateAmount: usdtAmount,
    firstQuote,
    secondQuote,
  };
}
