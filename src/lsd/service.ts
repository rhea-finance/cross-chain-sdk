import { ethers } from "ethers";
import { config_evm } from "../config";
import {
  BSC_LSD_USDT_ADDRESS,
  BSC_USDT_ADDRESS,
  BSC_USDT_DECIMALS,
  LSD_USDT_DECIMALS,
} from "./constants";
import type { LsdBalances } from "./types";

const ERC20_BALANCE_OF_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

async function getBscTokenBalance(params: {
  accountAddress: string;
  tokenAddress: string;
  decimals: number;
}): Promise<string> {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      config_evm.chains.bsc.rpcUrl
    );
    const contract = new ethers.Contract(
      params.tokenAddress,
      ERC20_BALANCE_OF_ABI,
      provider
    );
    const balance = await contract.balanceOf(params.accountAddress);

    return ethers.utils.formatUnits(balance, params.decimals);
  } catch (error) {
    console.error("Failed to get BSC token balance", error);
    return "0";
  }
}

export async function getLsdBalances(params: {
  accountAddress?: string;
}): Promise<LsdBalances> {
  if (!params.accountAddress) {
    return {
      usdt: "0",
      lsdUsdt: "0",
    };
  }

  const [usdt, lsdUsdt] = await Promise.all([
    getBscTokenBalance({
      accountAddress: params.accountAddress,
      tokenAddress: BSC_USDT_ADDRESS,
      decimals: BSC_USDT_DECIMALS,
    }),
    getBscTokenBalance({
      accountAddress: params.accountAddress,
      tokenAddress: BSC_LSD_USDT_ADDRESS,
      decimals: LSD_USDT_DECIMALS,
    }),
  ]);

  return {
    usdt,
    lsdUsdt,
  };
}
