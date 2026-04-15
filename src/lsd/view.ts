import Big from "big.js";
import { view_on_near } from "../chains/near";
import { toNonDivisibleNumber, toReadableNumber } from "../utils/numbers";
import {
  BSC_USDT_DECIMALS,
  BURROW_CONTRACT_ID,
  LSD_CONTRACT_ID,
  LSD_USDT_DECIMALS,
  NEAR_USDT_ADDRESS,
  NEAR_USDT_DECIMALS,
} from "./constants";
import type { BurrowAsset, LsdAmountConversion, LsdMetadata } from "./types";

export async function getLsdMetadata(): Promise<LsdMetadata> {
  const result = await view_on_near({
    contractId: LSD_CONTRACT_ID,
    methodName: "get_metadata",
    args: {},
  });

  return result as LsdMetadata;
}

export async function getLsdTotalSupply(): Promise<string> {
  const result = await view_on_near({
    contractId: LSD_CONTRACT_ID,
    methodName: "ft_total_supply",
    args: {},
  });

  return result as string;
}

export async function getBurrowAsset(
  tokenId: string = NEAR_USDT_ADDRESS
): Promise<BurrowAsset> {
  const result = await view_on_near({
    contractId: BURROW_CONTRACT_ID,
    methodName: "get_asset",
    args: {
      token_id: tokenId,
    },
  });

  return result as BurrowAsset;
}

export async function calculateLsdFromUsdt(
  usdtAmount: string
): Promise<LsdAmountConversion> {
  const [metadata, totalSupply, asset] = await Promise.all([
    getLsdMetadata(),
    getLsdTotalSupply(),
    getBurrowAsset(NEAR_USDT_ADDRESS),
  ]);

  const usdtAmountRaw = toNonDivisibleNumber(BSC_USDT_DECIMALS, usdtAmount);

  const burrowSharesAmount = new Big(usdtAmountRaw)
    .times(asset.supplied.shares)
    .div(asset.supplied.balance);

  const lsdAmount = burrowSharesAmount
    .times(totalSupply)
    .div(metadata.underlying_burrowland_shares)
    .round(0, Big.roundUp)
    .toFixed(0);

  return {
    readableAmount: toReadableNumber(LSD_USDT_DECIMALS, lsdAmount),
    amount: lsdAmount,
  };
}

export async function calculateUsdtFromLsd(
  lsdAmount: string
): Promise<LsdAmountConversion> {
  const [metadata, totalSupply, asset] = await Promise.all([
    getLsdMetadata(),
    getLsdTotalSupply(),
    getBurrowAsset(NEAR_USDT_ADDRESS),
  ]);

  const lsdAmountRaw = toNonDivisibleNumber(LSD_USDT_DECIMALS, lsdAmount);

  const burrowSharesAmount = new Big(lsdAmountRaw)
    .times(metadata.underlying_burrowland_shares)
    .div(totalSupply);

  const usdtAmountRaw = burrowSharesAmount
    .times(asset.supplied.balance)
    .div(asset.supplied.shares)
    .round(0, Big.roundDown)
    .toFixed(0);
  const readableUsdtAmount = toReadableNumber(BSC_USDT_DECIMALS, usdtAmountRaw);

  return {
    readableAmount: readableUsdtAmount,
    amount: toNonDivisibleNumber(NEAR_USDT_DECIMALS, readableUsdtAmount),
  };
}
