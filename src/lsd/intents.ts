import Big from "big.js";
import { intentsQuotation } from "../action/actionUtil/commonAction";
import { pollingTransactionStatus } from "../view";
import type { IIntentsQuoteResult } from "../types/common";
import { toNonDivisibleNumber, toReadableNumber } from "../utils/numbers";
import {
  BSC_CHAIN_ID,
  BSC_LSD_USDT_ADDRESS,
  BSC_NRUSDT_INTENTS_ASSET_ID,
  BSC_USDT_ADDRESS,
  BSC_USDT_DECIMALS,
  BSC_USDT_INTENTS_ASSET_ID,
  LSD_CONTRACT_ID,
  LSD_USDT_DECIMALS,
  NEAR_NRUSDT_INTENTS_ASSET_ID,
  NEAR_USDT_DECIMALS,
  NEAR_USDT_INTENTS_ASSET_ID,
} from "./constants";
import { calculateLsdFromUsdt, calculateUsdtFromLsd } from "./view";
import type {
  LsdIntentsQuote,
  LsdPreparationStage,
  LsdPrepareParams,
  LsdPrepareResult,
  LsdPreparedTransfer,
} from "./types";

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

function emitStage(
  stage: LsdPreparationStage,
  onStatusChange?: (stage: LsdPreparationStage) => void
) {
  onStatusChange?.(stage);
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

      return total.plus(
        new Big(quote.amountInUsd || 0).minus(quote.amountOutUsd || 0)
      );
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
function buildPreparedTransfer(params: {
  tokenAddress: string;
  tokenSymbol: "USDT" | "lsdUSDT";
  decimals: number;
  amount: string;
  depositAddress: string;
}): LsdPreparedTransfer {
  return {
    chain: "bsc",
    chainId: BSC_CHAIN_ID,
    tokenAddress: params.tokenAddress,
    tokenSymbol: params.tokenSymbol,
    decimals: params.decimals,
    amount: params.amount,
    depositAddress: params.depositAddress,
  };
}

export async function quoteLsdSupplyByIntents(
  params: LsdQuoteParams
): Promise<LsdIntentsQuote> {
  // Add validation for the input amount
  assertValidQuoteInput(params);

  const supplyAmountRaw = toNonDivisibleNumber(
    BSC_USDT_DECIMALS,
    params.amount
  );

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

export async function prepareLsdSupplyByIntents(
  params: LsdPrepareParams
): Promise<LsdPrepareResult> {
  try {
    assertValidQuoteInput(params);

    emitStage("quoting_origin", params.onStatusChange);
    const supplyAmountRaw = toNonDivisibleNumber(
      BSC_USDT_DECIMALS,
      params.amount
    );

    const firstQuote = await quoteBscUsdtToNearUsdt({
      amount: supplyAmountRaw,
      refundTo: params.accountAddress,
      recipient: LSD_CONTRACT_ID,
      dry: params.dry,
      slippageTolerance: params.slippageTolerance,
    });
    const firstQuoteData = assertQuoteSuccess(firstQuote, "LSD supply origin");

    emitStage("calculating_lsd", params.onStatusChange);
    const nearUsdtReadable = toReadableNumber(
      NEAR_USDT_DECIMALS,
      firstQuoteData.minAmountOut
    );
    const lsdAmount = await calculateLsdFromUsdt(nearUsdtReadable);

    emitStage("quoting_return", params.onStatusChange);
    const secondQuote = await quoteNearLsdToBscLsd({
      amount: lsdAmount,
      refundTo: LSD_CONTRACT_ID,
      recipient: params.accountAddress,
      dry: params.dry,
      slippageTolerance: params.slippageTolerance,
    });
    const secondQuoteData = assertQuoteSuccess(
      secondQuote,
      "LSD supply return"
    );

    const finalQuote = await quoteBscUsdtToNearUsdt({
      amount: supplyAmountRaw,
      refundTo: params.accountAddress,
      recipient: LSD_CONTRACT_ID,
      customRecipientMsg: secondQuoteData.depositAddress,
      dry: params.dry,
      slippageTolerance: params.slippageTolerance,
    });
    const finalQuoteData = assertQuoteSuccess(finalQuote, "LSD supply final");

    const quote: LsdIntentsQuote = {
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

    const transferData = buildPreparedTransfer({
      tokenAddress: BSC_USDT_ADDRESS,
      tokenSymbol: "USDT",
      decimals: BSC_USDT_DECIMALS,
      amount: finalQuoteData.amountIn,
      depositAddress: finalQuoteData.depositAddress,
    });

    emitStage("completed", params.onStatusChange);
    return {
      status: "success",
      stage: "completed",
      depositAddress: finalQuoteData.depositAddress,
      quote,
      transferData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitStage("failed", params.onStatusChange);
    return {
      status: "error",
      stage: "failed",
      message,
    };
  }
}

export async function prepareLsdWithdrawByIntents(
  params: LsdPrepareParams
): Promise<LsdPrepareResult> {
  try {
    assertValidQuoteInput(params);

    emitStage("quoting_origin", params.onStatusChange);
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
    const firstQuoteData = assertQuoteSuccess(
      firstQuote,
      "LSD withdraw origin"
    );

    emitStage("calculating_lsd", params.onStatusChange);
    const nearLsdReadable = toReadableNumber(
      LSD_USDT_DECIMALS,
      firstQuoteData.minAmountOut
    );
    const usdtAmount = await calculateUsdtFromLsd(nearLsdReadable);

    emitStage("quoting_return", params.onStatusChange);
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

    const finalQuote = await quoteBscLsdToNearLsd({
      amount: withdrawAmountRaw,
      refundTo: params.accountAddress,
      recipient: LSD_CONTRACT_ID,
      customRecipientMsg: secondQuoteData.depositAddress,
      dry: params.dry,
      slippageTolerance: params.slippageTolerance,
    });
    const finalQuoteData = assertQuoteSuccess(finalQuote, "LSD withdraw final");

    const quote: LsdIntentsQuote = {
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

    const transferData = buildPreparedTransfer({
      tokenAddress: BSC_LSD_USDT_ADDRESS,
      tokenSymbol: "lsdUSDT",
      decimals: LSD_USDT_DECIMALS,
      amount: finalQuoteData.amountIn,
      depositAddress: finalQuoteData.depositAddress,
    });

    emitStage("completed", params.onStatusChange);
    return {
      status: "success",
      stage: "completed",
      depositAddress: finalQuoteData.depositAddress,
      quote,
      transferData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitStage("failed", params.onStatusChange);
    return {
      status: "error",
      stage: "failed",
      message,
    };
  }
}

export async function pollLsdIntentsTransactionStatus(params: {
  depositAddress: string;
}) {
  if (!params.depositAddress) {
    throw new Error("depositAddress is required");
  }

  return pollingTransactionStatus(params.depositAddress);
}
