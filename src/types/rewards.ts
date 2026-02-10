import type { Portfolio } from "./account";
import type { IAssetsView, Asset } from "./asset";
import { IConfig } from "./burrow";
import { IBusiness, ISimpleWithdraw } from "./chains";
import { IIntentsQuoteResult } from "./common";

export interface PrepareWithdrawRewardsParams {
  mca: string;
  rewardTokenId: string;
  amountBurrow: string;
  amountToken: string;
  isDecrease?: boolean;
  config: IConfig;
  simpleWithdrawData: ISimpleWithdraw | null;
  receiveTokenId: string;
  originAsset: string;
  destinationAsset: string;
  recipient: string;
  claimAndWithdraw?: boolean;
  signerChain?: string;
}

export type PrepareWithdrawRewardsResult =
  | {
      status: "success";
      businessMap: IBusiness;
      businessMapExtra: IBusiness;
      registerLength: number;
      quoteResult: IIntentsQuoteResult;
    }
  | {
      status: "error";
      message: string;
    };

export interface IUnclaimedRewardsParams {
  portfolioView: Portfolio | null | undefined;
  assetsView: IAssetsView | null | undefined;
}

export interface IUnclaimedRewardItem {
  rewardTokenId: string;
  amountBurrow: string;
  amountToken: string;
  amountRead?: string;
  amountUsd?: string;
  rewardTokenAssetView?: Asset;
}
