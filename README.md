# @rhea-finance/cross-chain-sdk

Cross-chain lending SDK that supports unified lending operations across multiple blockchains, including EVM chains, Solana, Bitcoin, and NEAR.

[swap api doc](https://github.com/rhea-finance/rhea-sdk-docs/blob/main/CrossChainDexAPI.md "")

[swap sdk doc](https://github.com/rhea-finance/rhea-sdk-docs/blob/main/CrossChainDexSdk.md "")

## Features

- 🔗 **Cross-chain Support**: Supports multi-chain operations on EVM, Solana, Bitcoin, and NEAR
- 💰 **Lending Functions**: Provides complete lending functionality including Supply, Borrow, Repay, Withdraw, etc.
- 📊 **Data Queries**: Supports querying asset information, portfolio, prices, balances, and other data
- 🏥 **Health Factor**: Automatically calculates and manages lending health factors
- 💼 **Multi-chain Account (MCA)**: Supports creating and managing multi-chain accounts to unify multi-chain asset management
- 🔐 **Wallet Management**: Supports adding and removing multi-chain wallets
- 📈 **Liquidity Mining**: Supports liquidity mining and reward queries
- ⚡ **Batch Queries**: Provides batch view queries to reduce RPC call frequency

## Supported Blockchains

- **EVM Chains**: Ethereum, Arbitrum, Optimism, Base, BNB Chain, etc.
- **Solana**
- **Bitcoin**
- **NEAR Protocol**

## Installation

```bash
npm install @rhea-finance/cross-chain-sdk
# or
pnpm add @rhea-finance/cross-chain-sdk
# or
yarn add @rhea-finance/cross-chain-sdk
```

## Quick Start

### Basic Usage

```typescript
// Type imports
import type {
  ILendingData,
  IAccountAllPositionsDetailed,
  IAssetDetailed,
  IConfig,
  IPythInfo,
  IMetadata,
  IAssetFarm,
  IPrices,
  Portfolio,
} from "@rhea-finance/cross-chain-sdk";

// Function imports
import {
  batchViews,
  getAccountAllPositions,
  getAssetsDetail,
  getConfig,
  getTokenPythInfos,
  getAllMetadata,
  getMetadata,
  getBalance,
  getAllFarms,
  getPrices,
} from "@rhea-finance/cross-chain-sdk";

// Batch query - get all data at once
const lendingData: ILendingData = await batchViews(accountId);
console.log(lendingData.account_all_positions);
console.log(lendingData.assets_paged_detailed);
console.log(lendingData.config);
console.log(lendingData.token_pyth_infos);

// Individual queries - get data separately

// Get account all positions
const accountAllPositions: IAccountAllPositionsDetailed = await getAccountAllPositions(accountId);
// Get assets detail
const assetsPagedDetailed: IAssetDetailed[] = await getAssetsDetail();

// Get config
const config: IConfig = await getConfig();

// Get token pyth infos
const tokenPythInfos: Record<string, IPythInfo> = await getTokenPythInfos();

// Get metadata - batch query
const tokenIds = ["usdt.tether-token.near", "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", "zec.omft.near"];
const allMetadata: IMetadata[] = await getAllMetadata(tokenIds);

// Get metadata - single query
const metadata: IMetadata | undefined = await getMetadata("token1.near");

// Get balance - get token balance in NEAR wallet
const balance: string = await getBalance("usdt.tether-token.near", accountId);

// Get all farms - get all lending farm data
const allFarms: [Record<string, string>, IAssetFarm][] = await getAllFarms();

// Get prices - get price data for all assets in lending
const prices: IPrices | undefined = await getPrices({
  token_pyth_infos: tokenPythInfos,
  config: config,
});

```

### Multi-chain Account (MCA) Management

```typescript
// Import MCA related functions separately
import {
  getMcaByWallet,
  getListWalletsByMca,
  getCreateMcaFee,
  getCreateMcaFeePaged,
  getNearValue,
  getNearValuesPaged,
  getZcashCreateMcaDepositAddress,
  getZcashResponseDataByAddress,
} from "@rhea-finance/cIChainross-chain-sdk";
import type { , IWallet } from "@rhea-finance/cross-chain-sdk";

// Get MCA by wallet - query multi-chain account based on logged-in wallet
// Parameters:
//   chain: Supported chain type: "evm", "solana", "btc", or "zcash"
//   identityKey: Unique identifier of the logged-in account on the specified chain
//     - evm: Account ID (e.g., "0x1234...")
//     - solana: Account ID (e.g., "ABC123...")
//     - btc: Public key (e.g., "02abc123...")
//     - zcash: Public identity key
const mcaId: string | null = await getMcaByWallet({
  chain: "evm" as IChain,
  identityKey: "0x1234...",
});

// Get list wallets by MCA - query all wallets bound to a multi-chain account
const wallets: IWallet[] = await getListWalletsByMca(mcaId);

// Get create MCA fee - get creation fee for a specific asset
const createFee: string = await getCreateMcaFee("usdt.tether-token.near");

// Get create MCA fee paged - get list of creation fee tokens
const createFeeList: Record<string, string> = await getCreateMcaFeePaged();

// Get near value - get exchange rate between a specific token and NEAR
const nearValue: string = await getNearValue("usdt.tether-token.near");

// Get near values paged - get all token exchange rates with NEAR
const nearValues: Record<string, string> = await getNearValuesPaged();

// Get Zcash create MCA deposit address - get deposit address when creating MCA with Zcash (Old way)
const zcashDepositAddress: string = await getZcashCreateMcaDepositAddress("multica.near");

// Get Zcash response data by address - query Zcash deposit/creation status (Old way)
const zcashData = await getZcashResponseDataByAddress(address);
```

## Operations

### Create Multi-chain Account (MCA)

The following steps describe how to create a multi-chain account:

```typescript
import type {
  IChain,
  IIntentsQuoteResult,
  Asset,
} from "@rhea-finance/cross-chain-sdk";
import {
  format_wallet,
  serializationObj,
  getCreateMcaCustomRecipientMsg,
  getCreateMcaFeeData,
  intentsQuotation,
  prepare_sign_message_evm,
  process_signature_evm,
} from "@rhea-finance/cross-chain-sdk";

// Step 1: Create multi-chain wallet
const w = format_wallet({
  chain: "evm" as IChain,
  identityKey: "0x1234...",
});

// Step 2: Sign
// Signing content
const message = serializationObj([w]);

// Format signing content
const _message = prepare_sign_message_evm(message);

// Sign (this is a wallet SDK method, not from this SDK)
const signature = signMessage(_message);

// Process signature result
const signedMessage = process_signature_evm(signature);

// Step 3: Get customRecipientMsg
// useAsCollateral parameter determines whether these assets should be used as collateral.
const customRecipientMsg = getCreateMcaCustomRecipientMsg({
  useAsCollateral: true,
  wallets: [w],
  signedMessages: [signedMessage],
});

// Step 4: Get create MCA fee data
// Get the on-chain fee for creating an MCA account
// Parameters:
//   asset: The Asset object
//   bufferMultiple: Optional buffer multiplier (default 1.05)
const mcaFee = await getCreateMcaFeeData({
  asset: asset,
  bufferMultiple: 1.05, // optional, default 1.05
});
// mcaFee.amountRaw     - fee amount with token precision (for contract calls)
// mcaFee.amountReadable - human-readable fee amount

// Step 5: Get intents quote to obtain depositAddress
const res_quote: IIntentsQuoteResult = await intentsQuotation({
  originAsset: "nep141:xxx",
  destinationAsset: "nep141:xxx",
  amount: "14743",
  refundTo: "0xxxx",
  recipient: "multica.near",
  isReverse: false,
  dry: false,
  slippageTolerance: 50,
  customRecipientMsg: customRecipientMsg,
});

// Step 6: Get depositAddress and transfer funds to complete MCA creation
const depositAddress = res_quote.quoteSuccessResult?.quote?.depositAddress;

// Step 7: Calculate total fee
// Total fee = MCA creation fee + intents quotation fee (cross-chain bridge/swap fee)
// quoteFeeData is returned by intentsQuotation when quoteStatus is "success"
//   quoteFeeData.feeAmount - bridge/swap fee amount (readable)
//   quoteFeeData.feeUsd    - bridge/swap fee in USD
const quoteFee = res_quote.quoteFeeData;
// Total fee (readable) = mcaFee.amountReadable + quoteFee.feeAmount
// Total fee (USD)       = mcaFee amount in USD  + quoteFee.feeUsd

// Transfer funds to depositAddress using your wallet
```

### Create MCA via Zcash (Old way)

When creating an MCA account with Zcash, use `getZcashCreateMcaDepositAddress` to obtain the deposit address:

```typescript
import { getZcashCreateMcaDepositAddress } from "@rhea-finance/cross-chain-sdk";

// Get deposit address for Zcash MCA creation
// Parameters:
//   am_id: Account manager ID (e.g., "multica.near")
const depositAddress: string = await getZcashCreateMcaDepositAddress("multica.near");

// Transfer Zcash to depositAddress to complete MCA creation
```

### getZcashResponseDataByAddress (Old way)

Get Zcash deposit/creation data by address. Query the status and details of a Zcash MCA creation or adding wallet flow:

```typescript
import {
  getZcashResponseDataByAddress,
  type IDataByAddressResponse,
} from "@rhea-finance/cross-chain-sdk";

// Parameters:
//   address: Zcash deposit address
const data: IDataByAddressResponse | undefined =
  await getZcashResponseDataByAddress(address);

// data contains: deposit_address, mca_id, status, tx_hash, application, etc.
```

### Cross-chain Supply

```typescript
import {
  getSupplyCustomRecipientMsg,
  format_wallet,
  intentsQuotation,
  config_near,
} from "@rhea-finance/cross-chain-sdk";

const wallet = format_wallet({ chain, identityKey });
const customRecipientMsg = getSupplyCustomRecipientMsg({
  useAsCollateral: true,
  w: wallet,
});

const quoteResult = await intentsQuotation({
  recipient: "rhea00000x.multica.near", // or mca account address
  customRecipientMsg,
  // ... other parameters
});

// Transfer to depositAddress
const depositAddress = quoteResult.quoteSuccessResult?.quote?.depositAddress;
```

### getSupplyDepositData

Get supply deposit address and quote result, simplifies Cross-chain Supply flow:

```typescript
import { getSupplyDepositData } from "@rhea-finance/cross-chain-sdk";

// Parameters:
//   chain: Chain type, supports "evm" | "solana" | "btc"
//   identityKey: Wallet address or public key
//   useAsCollateral: Whether to use as collateral
//   originAsset: Origin asset (e.g. "nep141:usdt.tether-token.near")
//   destinationAsset: Destination asset
//   amount: Amount (raw amount)
//   refundTo: Refund address
//   recipient: MCA account address
const result = await getSupplyDepositData({
  chain: "evm",
  identityKey: "0x1234...",
  useAsCollateral: true,
  originAsset: "nep141:usdt.tether-token.near",
  destinationAsset: "nep141:wrap.near",
  amount: "1000000",
  refundTo: "rhea00000x.multica.near",
  recipient: "rhea00000x.multica.near",
});

// Transfer to depositAddress to complete Supply
const depositAddress = result.depositAddress;
// result also contains quoteResult's full quote data

// quoteFeeData - cross-chain bridge/swap fee (present when quote succeeds)
const quoteFeeData = result.quoteResult?.quoteFeeData;
// quoteFeeData.feeAmount - bridge/swap fee amount (readable)
// quoteFeeData.feeUsd    - bridge/swap fee in USD
```

### Cross-chain Repay

```typescript
import {
  getRepayCustomRecipientMsg,
  format_wallet,
  intentsQuotation,
  config_near,
} from "@rhea-finance/cross-chain-sdk";

const wallet = format_wallet({ chain, identityKey });
const customRecipientMsg = getRepayCustomRecipientMsg({
  w: wallet,
});

const quoteResult = await intentsQuotation({
  recipient: "rhea00000x.multica.near", // or mca account address
  customRecipientMsg,
  // ... other parameters
});

// Transfer to depositAddress
const depositAddress = quoteResult.quoteSuccessResult?.quote?.depositAddress;
```

### Cross-chain Borrow

```typescript
// Get simple withdraw data
// simpleWithdrawData: Extract a portion of assets from user's lending assets to pay the relayer
// User pays relayer's gas fees and NEAR required for registration
// Parameters:
//   nearStorageAmount: NEAR storage amount
//   mca: Multi-chain account ID
//   relayerGasFees: Relayer gas fees for different chains
//   assets: Assets data (from getAssets() or batchViews())
//   portfolio: Portfolio data (from getAccountAllPositions() or batchViews())
const simpleWithdrawData: ISimpleWithdraw | null = computeRelayerGas({
  nearStorageAmount,
  mca,
  relayerGasFees,
  assets,
  portfolio
})

// Prepare borrow business data
// Parameters:
//   amountBurrow: Amount of assets to withdraw from lending (precision required by lending contract)
//   amountToken: Amount of assets to withdraw from lending (precision of the token)
//   config: Configuration data (from getConfig() or batchViews())
//   simpleWithdrawData: Simple withdraw data (see above for details)
const { businessMap, quoteResult } = await prepareBusinessDataOnBorrow({
  mca,
  recipient: "0x7dxxx...",
  tokenId: "usdt.tether-token.near",
  originAsset: "nep141:usdt.tether-token.near",
  destinationAsset: "xxxx",
  amountBurrow,
  amountToken,
  config: config,
  simpleWithdrawData: simpleWithdrawData,
});

const wallet = format_wallet({ chain, identityKey });
const signedBusiness = await sign_message({
  chain,
  message: serializationObj(businessMap),
});

// Submit multi-chain lending request
const relayer_result = await postMultichainLendingRequests({
  mca_id: mca,
  wallet: serializationObj(wallet),
  request: [
    serializationObj({
      signer_wallet: wallet,
      business: businessMap,
      signature: signedBusiness,
      attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
    }),
  ],
});

// Poll transaction result
if (relayer_result?.code == 0) {
  const { status, tx_hash } = await pollingRelayerTransactionResult(
    relayer_result.data,
    2000
  );
  console.log("Transaction status:", status);
  console.log("Transaction hash:", tx_hash);
}
```

### Cross-chain Withdraw

```typescript
// Get simple withdraw data (see Cross-chain Borrow section for detailed explanation)
const simpleWithdrawData: ISimpleWithdraw | null = await computeRelayerGas({
  nearStorageAmount,
  mca,
  relayerGasFees,
  assets,
  portfolio
})

// Prepare withdraw business data
// Parameters:
//   amountBurrow: Amount of assets to withdraw from lending (precision required by lending contract)
//   amountToken: Amount of assets to withdraw from lending (precision of the token)
//   config: Configuration data (from getConfig() or batchViews())
//   simpleWithdrawData: Simple withdraw data (see Cross-chain Borrow section for details)
//   isDecrease: Whether to decrease collateral
//   decreaseCollateralAmount: Amount to decrease collateral (if isDecrease is true)
const { businessMap, quoteResult } = await prepareBusinessDataOnWithdraw({
  mca,
  recipient: "0x7dxxx...",
  tokenId: "usdt.tether-token.near",
  originAsset: "nep141:usdt.tether-token.near",
  destinationAsset: "xxxx",
  amountBurrow,
  amountToken,
  config: config,
  simpleWithdrawData,
  isDecrease: false,
  decreaseCollateralAmoun,
});

// quoteFeeData - cross-chain bridge/swap fee (present when quote succeeds)
const quoteFeeData = quoteResult?.quoteFeeData;
// quoteFeeData.feeAmount - bridge/swap fee amount (readable)
// quoteFeeData.feeUsd    - bridge/swap fee in USD

const wallet = format_wallet({ chain, identityKey });
const signedBusiness = await sign_message({
  chain,
  message: serializationObj(businessMap),
});

// Submit multi-chain lending request
const relayer_result = await postMultichainLendingRequests({
  mca_id: mca,
  wallet: serializationObj(wallet),
  request: [
    serializationObj({
      signer_wallet: wallet,
      business: businessMap,
      signature: signedBusiness,
      attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
    }),
  ],
});

// Poll transaction result
if (relayer_result?.code == 0) {
  const { status, tx_hash } = await pollingRelayerTransactionResult(
    relayer_result.data,
    2000
  );
  console.log("Transaction status:", status);
  console.log("Transaction hash:", tx_hash);
}
```

### Add Wallet to MCA

```typescript
// Step 1: the new wallet to add
const newWallet = {
  chain: "xxx",
  identityKey,
}
const add_w = format_wallet({
  chain: newWallet.chain,
  identityKey: newWallet.identityKey,
});

// Step 2: Sign the new wallet with the new wallet itself
// Signing content: mca + serialized wallet
const signature_new_wallet = await sign_message({
  chain: newWallet.chain,
  message: mca + serializationObj(add_w),
});

// Step 3: Prepare add wallet business data
// Parameters:
//   mca: Multi-chain account ID
//   w: Wallet to add (formatted using format_wallet)
//   signature_w: Signature of the new wallet (signed by the new wallet itself)
//   gas_token_id: Token ID for gas payment
//   gas_token_amount: Amount of gas token
const businessMap = await prepareBusinessDataOnAddWallet({
  mca: "rhea00000x.multica.near",
  w: add_w,
  signature_w: signature_new_wallet,
  gas_token_id: "usdt.tether-token.near",
  gas_token_amount: "1000000",
});

// Step 4: Sign the business data with the signer wallet
const signerWallet = { chain: "xxx", identityKey };
const sign_w = format_wallet({ signerWallet.chain, signerWallet.identityKey });
const signedBusiness = await sign_message({
  chain: signerWallet.chain,
  message: serializationObj(businessMap),
});

// Submit multi-chain lending request
const relayer_result = await postMultichainLendingRequests({
  mca_id: mca,
  wallet: serializationObj(sign_w),
  request: [
    serializationObj({
      signer_wallet: sign_w,
      business: businessMap,
      signature: signedBusiness,
      attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
    }),
  ],
});

// Poll transaction result
if (relayer_result?.code == 0) {
  const { status, tx_hash } = await pollingRelayerTransactionResult(
    relayer_result.data,
    2000
  );
  console.log("Transaction status:", status);
  console.log("Transaction hash:", tx_hash);
}
```

### Remove Wallet from MCA

```typescript
// Prepare remove wallet business data
// Parameters:
//   mca: Multi-chain account ID
//   w: Wallet to remove (formatted using format_wallet)
//   gas_token_id: Token ID for gas payment
//   gas_token_amount: Amount of gas token
const removeWallet = {
  chain: "xxx",
  identityKey,
}
const remove_w = format_wallet({ chain: removeWallet.chain, identityKey: removeWallet.identityKey });
const businessMap = await prepareBusinessDataOnRemoveWallet({
  mca: "rhea00000x.multica.near",
  w: _removeWallet,
  gas_token_id: "usdt.tether-token.near",
  gas_token_amount: "1000000",
});

// Sign the business data with the signer wallet
const signerWallet = { chain: "xxx", identityKey };
const _signerWallet = format_wallet({ chain: signerWallet.chain, identityKey: signerWallet.identityKey });
const signedBusiness = await sign_message({
  chain: _signerWallet.chain,
  message: serializationObj(businessMap),
});

// Submit multi-chain lending request
const relayer_result = await postMultichainLendingRequests({
  mca_id: mca,
  wallet: serializationObj(_signerWallet),
  request: [
    serializationObj({
      signer_wallet: _signerWallet,
      business: businessMap,
      signature: signedBusiness,
      attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
    }),
  ],
});

// Poll transaction result
if (relayer_result?.code == 0) {
  const { status, tx_hash } = await pollingRelayerTransactionResult(
    relayer_result.data,
    2000
  );
  console.log("Transaction status:", status);
  console.log("Transaction hash:", tx_hash);
}
```

### Adjust Collateral

```typescript
// Get simple withdraw data (see Cross-chain Borrow section for detailed explanation)
const simpleWithdrawData: ISimpleWithdraw | null = await computeRelayerGas({
  nearStorageAmount,
  mca,
  relayerGasFees,
  assets,
  portfolio
})

// Prepare adjust business data
// Parameters:
//   mca: Multi-chain account ID
//   tokenId: Token ID to adjust
//   config: Configuration data (from getConfig() or batchViews())
//   simpleWithdrawData: Simple withdraw data (see Cross-chain Borrow section for details)
//   isIncreaseCollateral: Whether to increase collateral
//   increaseAmountBurrow: Amount to increase collateral (if isIncreaseCollateral is true)
//   isDecreaseCollateral: Whether to decrease collateral
//   decreaseAmountBurrow: Amount to decrease collateral (if isDecreaseCollateral is true)
const businessMap = await prepareBusinessDataOnAdjust({
  mca: "rhea00000x.multica.near",
  tokenId: "usdt.tether-token.near",
  config: config,
  simpleWithdrawData: simpleWithdrawData,
  isIncreaseCollateral: true,
  increaseAmountBurrow,
  isDecreaseCollateral: false,
  decreaseAmountBurrow,
});

const wallet = format_wallet({ chain, identityKey });
const signedBusiness = await sign_message({
  chain,
  message: serializationObj(businessMap),
});

// Submit multi-chain lending request
const relayer_result = await postMultichainLendingRequests({
  mca_id: mca,
  wallet: serializationObj(wallet),
  request: [
    serializationObj({
      signer_wallet: wallet,
      business: businessMap,
      signature: signedBusiness,
      attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
    }),
  ],
});

// Poll transaction result
if (relayer_result?.code == 0) {
  const { status, tx_hash } = await pollingRelayerTransactionResult(
    relayer_result.data,
    2000
  );
  console.log("Transaction status:", status);
  console.log("Transaction hash:", tx_hash);
}
```

### Repay from Supplied

```typescript
// Get simple withdraw data (see Cross-chain Borrow section for detailed explanation)
const simpleWithdrawData: ISimpleWithdraw | null = await computeRelayerGas({
  nearStorageAmount,
  mca,
  relayerGasFees,
  assets,
  portfolio
})

// Prepare repay from supplied business data
// Parameters:
//   mca: Multi-chain account ID
//   tokenId: Token ID to repay
//   config: Configuration data (from getConfig() or batchViews())
//   simpleWithdrawData: Simple withdraw data (see Cross-chain Borrow section for details)
//   amountBurrow: Amount to repay (precision required by lending contract)
//   decreaseAmountBurrow: Amount to decrease collateral (precision required by lending contract)
const businessMap = await prepareBusinessDataOnRepayFromSupplied({
  mca: "rhea00000x.multica.near",
  tokenId: "usdt.tether-token.near",
  config: config,
  simpleWithdrawData: simpleWithdrawData,
  amountBurrow,
  decreaseAmountBurrow,
});

const wallet = format_wallet({ chain, identityKey });
const signedBusiness = await sign_message({
  chain,
  message: serializationObj(businessMap),
});

// Submit multi-chain lending request
const relayer_result = await postMultichainLendingRequests({
  mca_id: mca,
  wallet: serializationObj(wallet),
  request: [
    serializationObj({
      signer_wallet: wallet,
      business: businessMap,
      signature: signedBusiness,
      attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
    }),
  ],
});

// Poll transaction result
if (relayer_result?.code == 0) {
  const { status, tx_hash } = await pollingRelayerTransactionResult(
    relayer_result.data,
    2000
  );
  console.log("Transaction status:", status);
  console.log("Transaction hash:", tx_hash);
}
```

### Claim Rewards

```typescript
// Prepare claim business data
// Parameters:
//   mca: Multi-chain account ID
//   gas_token_id: Token ID for gas payment
//   gas_token_amount: Amount of gas token
const businessMap = await prepareBusinessDataOnClaim({
  mca: "rhea00000x.multica.near",
  gas_token_id: "usdt.tether-token.near",
  gas_token_amount: "1000000",
});

const wallet = format_wallet({ chain, identityKey });
const signedBusiness = await sign_message({
  chain,
  message: serializationObj(businessMap),
});

// Submit multi-chain lending request
const relayer_result = await postMultichainLendingRequests({
  mca_id: mca,
  wallet: serializationObj(wallet),
  request: [
    serializationObj({
      signer_wallet: wallet,
      business: businessMap,
      signature: signedBusiness,
      attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
    }),
  ],
});

// Poll transaction result
if (relayer_result?.code == 0) {
  const { status, tx_hash } = await pollingRelayerTransactionResult(
    relayer_result.data,
    2000
  );
  console.log("Transaction status:", status);
  console.log("Transaction hash:", tx_hash);
}
```

### Get farm details for an asset

```typescript
import {
  getFarmDetailsOfAsset,
  getAssetDetailsView,
} from "@rhea-finance/cross-chain-sdk";

// Get assets view (IAssetsView)
const assets = await getAssetDetailsView();

// Get farm details for a specific asset
const farmDetails = getFarmDetailsOfAsset({
  assets,
  assetId: "zec.omft.near",
  booster: 1.5, // optional, default 1.5
});

// farmDetails: IFarmDetailsOfAsset
console.log(farmDetails.minFarmApy);    // market farm APY (min)
console.log(farmDetails.maxFarmApy);    // max farm APY (with booster)
console.log(farmDetails.tokenNetRewards); // reward token metadata
console.log(farmDetails.canBeBooster);  // whether asset can be boosted
console.log(farmDetails.supplyApy);     // supply APR (%)
console.log(farmDetails.borrowApy);    // borrow APR (%)
```

### Cross-chain Withdraw Rewards

```typescript
import {
  prepareBusinessDataOnWithdrawRewards,
  getUnclaimedRewards,
  batchViewsData,
  getSimpleWithdrawData,
  format_wallet,
  serializationObj,
  NDeposit,
  TOKEN_STORAGE_DEPOSIT_READ,
  postMultichainLendingRequests,
  pollingRelayerTransactionResult,
} from "@rhea-finance/cross-chain-sdk";

// Get assets, portfolio and config (e.g. for MCA)
const mca = "your_mca_id";
const { assetsView, portfolioView, config } = await batchViewsData(mca);

// Get unclaimed rewards and pick one to withdraw
const unclaimedRewards = getUnclaimedRewards({ portfolioView, assetsView });
const unclaimedReward = unclaimedRewards[0];

// Get simple withdraw data (relayer gas)
const gasData = await getSimpleWithdrawData({
  nearStorageAmount: "0.00125",
  mca,
  assets: assetsView,
  portfolio: portfolioView,
  businessNum: 2, // optional
});
const simpleWithdrawData = gasData?.simpleWithdrawData ?? null;

// Prepare withdraw rewards business data
const receiveTokenId = "zec.omft.near";
const originAsset = "1cs_v1:near:nep141:zec.omft.near";
const destinationAsset = "nep141:zec.omft.near";
const recipient = "t1dsFgNR2nr99MJ7Dq2Wwk3d4EnUs43ATqY";

const res = await prepareBusinessDataOnWithdrawRewards({
  mca,
  rewardTokenId: unclaimedReward?.rewardTokenId,
  amountBurrow: unclaimedReward?.amountBurrow,
  amountToken: unclaimedReward?.amountToken,
  config,
  simpleWithdrawData,
  receiveTokenId,
  originAsset,
  destinationAsset,
  recipient,
});

if (res.status === "success") {
  const { businessMap, businessMapExtra } = res;
  const signedBusiness = await sign_message({
    message: JSON.stringify(businessMap),
  });
  const signedBusinessExtra = await sign_message({
    message: JSON.stringify(businessMapExtra),
  });

  const wallet = format_wallet({ chain, identityKey });
  const relayer_result = await postMultichainLendingRequests({
    mca_id: mca,
    wallet: serializationObj(wallet),
    request: [
      serializationObj({
        signer_wallet: wallet,
        business: businessMap,
        signature: signedBusiness,
        attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
      }),
      serializationObj({
        signer_wallet: wallet,
        business: businessMapExtra,
        signature: signedBusinessExtra,
        attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
      }),
    ],
  });

  if (relayer_result?.code === 0) {
    const { status, tx_hash } = await pollingRelayerTransactionResult(
      relayer_result.data,
      2000
    );
    console.log("Transaction status:", status);
    console.log("Transaction hash:", tx_hash);
  }
} else {
  console.error("Prepare failed:", res.message);
}
```

### LSD Intents Supply and Withdraw

The LSD module prepares the two-leg Intents route used by the LSD page in the demo project:

- Supply: BSC USDT -> NEAR USDT -> LSD -> BSC lsdUSDT
- Withdraw: BSC lsdUSDT -> NEAR LSD -> USDT -> BSC USDT

The SDK prepares quotes and transfer data, but it does not send EVM wallet transactions. Your app should use its own wallet integration to transfer the returned token amount to the returned `depositAddress`.

```typescript
import {
  BSC_CHAIN_ID,
  calculateLsdFromUsdt,
  calculateUsdtFromLsd,
  getLsdBalances,
  getLsdIntentsOrderHistory,
  pollLsdIntentsTransactionStatuses,
  prepareLsdSupplyByIntents,
  prepareLsdWithdrawByIntents,
  quoteLsdSupplyByIntents,
  quoteLsdWithdrawByIntents,
} from "@rhea-finance/cross-chain-sdk";

// This is app-side wallet code, not provided by the SDK.
async function transferToken(params: {
  tokenAddress: string;
  depositAddress: string;
  chain: "bsc";
  amount: string;
}) {
  // Example:
  // await erc20Contract.transfer(params.depositAddress, params.amount);
}

const accountAddress = "0x...";

// Optional: pass your own BSC RPC if the default RPC is unstable.
const balances = await getLsdBalances({
  accountAddress,
  rpcUrl: "https://your-bsc-rpc.example",
});
console.log(balances.usdt);
console.log(balances.lsdUsdt);

// Query LSD intents order history for the current wallet.
// The SDK returns a lightweight record_list with:
//   timestamp
//   status
//   quoteRequest.originAsset / destinationAsset / recipient / refundTo / customRecipientMsg
//   quote (all fields)
const history = await getLsdIntentsOrderHistory({
  accountId: accountAddress,
  pageSize: 10,
});
console.log(history.total_size);
console.log(history.record_list[0]?.status);
console.log(history.record_list[0]?.quote.depositAddress);

// Exchange conversion helpers return both readable and raw values.
const lsdFromUsdt = await calculateLsdFromUsdt("100");
console.log(lsdFromUsdt.readableAmount); // readable lsdUSDT amount for display
console.log(lsdFromUsdt.amount); // raw lsdUSDT amount with token precision

const usdtFromLsd = await calculateUsdtFromLsd("50");
console.log(usdtFromLsd.readableAmount); // readable USDT amount for display
console.log(usdtFromLsd.amount); // raw NEAR USDT amount for Intents quote

// Quote supply. Amounts are human-readable strings.
const supplyQuote = await quoteLsdSupplyByIntents({
  accountAddress,
  amount: "100",
});
console.log(supplyQuote.estimatedReceive);
console.log(supplyQuote.bridgeFeeUsd);

// Prepare supply transfer data.
const preparedSupply = await prepareLsdSupplyByIntents({
  accountAddress,
  amount: "100",
  onStatusChange(stage) {
    console.log("Supply prepare stage:", stage);
  },
});

if (preparedSupply.status !== "success" || !preparedSupply.transferData) {
  throw new Error(preparedSupply.message || "Failed to prepare LSD supply");
}

await transferToken({
  tokenAddress: preparedSupply.transferData.tokenAddress,
  depositAddress: preparedSupply.transferData.depositAddress,
  chain: preparedSupply.transferData.chain,
  amount: preparedSupply.transferData.amount,
});

if (!preparedSupply.intentsDepositAddresses) {
  throw new Error("Missing Intents deposit addresses");
}

const supplyStatuses = await pollLsdIntentsTransactionStatuses({
  originDepositAddress:
    preparedSupply.intentsDepositAddresses.originDepositAddress,
  returnDepositAddress:
    preparedSupply.intentsDepositAddresses.returnDepositAddress,
});

if (
  supplyStatuses.origin.status !== "success" ||
  supplyStatuses.return.status !== "success"
) {
  throw new Error(
    `LSD supply failed: origin=${supplyStatuses.origin.status}, return=${supplyStatuses.return.status}`
  );
}

// Quote withdraw.
const withdrawQuote = await quoteLsdWithdrawByIntents({
  accountAddress,
  amount: "50",
});
console.log(withdrawQuote.estimatedReceive);
console.log(withdrawQuote.bridgeFeeUsd);

// Prepare withdraw transfer data.
const preparedWithdraw = await prepareLsdWithdrawByIntents({
  accountAddress,
  amount: "50",
});

if (preparedWithdraw.status !== "success" || !preparedWithdraw.transferData) {
  throw new Error(
    preparedWithdraw.message || "Failed to prepare LSD withdraw"
  );
}

await transferToken({
  tokenAddress: preparedWithdraw.transferData.tokenAddress,
  depositAddress: preparedWithdraw.transferData.depositAddress,
  chain: preparedWithdraw.transferData.chain,
  amount: preparedWithdraw.transferData.amount,
});

if (!preparedWithdraw.intentsDepositAddresses) {
  throw new Error("Missing Intents deposit addresses");
}

const withdrawStatuses = await pollLsdIntentsTransactionStatuses({
  originDepositAddress:
    preparedWithdraw.intentsDepositAddresses.originDepositAddress,
  returnDepositAddress:
    preparedWithdraw.intentsDepositAddresses.returnDepositAddress,
});

if (
  withdrawStatuses.origin.status !== "success" ||
  withdrawStatuses.return.status !== "success"
) {
  throw new Error(
    `LSD withdraw failed: origin=${withdrawStatuses.origin.status}, return=${withdrawStatuses.return.status}`
  );
}
```

## Core API

### Actions

#### Account Management

- `createMca` - Create multi-chain account
- `addWallet` - Add wallet to MCA
- `removeWallet` - Remove wallet from MCA

#### Lending Operations

- `supply` - Supply (deposit)
- `borrow` - Borrow
- `repay` - Repay
- `repayFromSupplied` - Repay from supplied assets
- `withdraw` - Withdraw
- `adjust` - Adjust collateral
- `innnerWithdraw` - Inner withdraw
- `claim` - Claim rewards

### Views

- `batchViews` - Batch query views (account, assets, config, etc.)
- `getAssets` - Get asset list
- `getPrices` - Get price information
- `getBalance` - Get balance
- `getFarms` - Get liquidity mining information
- `getFarmDetailsOfAsset` - Get farm details (APY, rewards, canBeBooster) for an asset
- `getConfig` - Get configuration
- `getBoosterTokens` - Get booster token information
- `getTokenDetail` - Get token details
- `getLiquidations` - Get liquidation information
- `getMultichainLendingHistory` - Get multi-chain lending history

#### Health Factor Calculation
- `recomputeHealthFactorSupply` - Calculate health factor after supply
- `recomputeHealthFactorBorrow` - Calculate health factor after borrow
- `recomputeHealthFactorRepay` - Calculate health factor after repay
- `recomputeHealthFactorWithdraw` - Calculate health factor after withdraw
- `recomputeHealthFactorAdjust` - Calculate health factor after adjusting collateral

#### Maximum Available Amount
- `getBorrowMaxAmount` - Get maximum borrowable amount
- `getWithdrawMaxAmount` - Get maximum withdrawable amount

#### Core Utilities

**Lending Operations**
- `prepareBusinessDataOnBorrow` - Prepare borrow business data
- `prepareBusinessDataOnWithdraw` - Prepare withdraw business data
- `prepareBusinessDataOnAdjust` - Prepare adjust collateral business data
- `prepareBusinessDataOnRepayFromSupplied` - Prepare repay from supplied business data
- `prepareBusinessDataOninnerWithdraw` - Prepare inner withdraw business data

**MCA Creation**
- `getCreateMcaCustomRecipientMsg` - Get custom recipient message for creating MCA
- `getCreateMcaFeeData` - Get the on-chain fee for creating an MCA account. Returns `{ amountRaw, amountReadable }`. Parameters: `asset` (Asset object), `bufferMultiple` (optional, default 1.5)
- `getZcashCreateMcaDepositAddress` - Get deposit address when creating MCA with Zcash (Old way)
- `getZcashResponseDataByAddress` - Get Zcash deposit/creation data by address (Old way)

**Custom Recipient Messages**
- `getSupplyCustomRecipientMsg` - Get custom recipient message for supply
- `getSupplyDepositData` - Get supply deposit address and quote result
- `getRepayCustomRecipientMsg` - Get custom recipient message for repay

**Account Management**
- `prepareBusinessDataOnAddWallet` - Prepare add wallet business data
- `prepareBusinessDataOnRemoveWallet` - Prepare remove wallet business data
- `prepareBusinessDataOnClaim` - Prepare claim rewards business data
- `prepareBusinessDataOnWithdrawRewards` - Prepare cross-chain withdraw rewards business data


**Intents Quotation**
- `intentsQuotation` - Get cross-chain swap/bridge quote. Returns `IIntentsQuoteResult` which includes:
  - `quoteStatus` - `"success"` or `"error"`
  - `quoteSuccessResult` - Quote details (depositAddress, amounts, etc.)
  - `quoteFeeData` - Fee data for the cross-chain bridge/swap (only present when `quoteStatus` is `"success"`):
    - `feeAmount` - Bridge/swap fee amount (readable, = amountInFormatted - amountOutFormatted)
    - `feeUsd` - Bridge/swap fee in USD (= amountInUsd - amountOutUsd)

**General Utilities**
- `format_wallet` - Format wallet address
- `serializationObj` - Serialize object
- `computeRelayerGas` - Calculate relayer gas fee
- `pollingTransactionStatus` - Poll transaction status
- `postMultichainLendingRequests` - Submit multi-chain lending request
- `pollingRelayerTransactionResult` - Poll relayer transaction result

### Chain Interaction

- `view_on_near` - Call NEAR contract view method
- `getAccountBalance` - Get NEAR account balance

### Chain Configuration

- `config_near` - NEAR chain configuration
- `config_evm` - EVM chain configuration
- `config_solana` - Solana chain configuration
- `config_btc` - Bitcoin chain configuration
- `setSdkEnv` - Switch SDK environment between `prd` and `stg`
- `getSdkEnv` - Get current SDK environment
- `setCustomNodeUrl` - Set custom RPC node URL for NEAR chain. This function allows you to customize the RPC endpoint used for NEAR chain interactions.
- `setCustomNodeUrls` - Set multiple custom NEAR RPC node URLs. The SDK falls back to the next URL when the active RPC is rate limited or unavailable.

```typescript
import {
  setSdkEnv,
  getSdkEnv,
  setCustomNodeUrl,
  setCustomNodeUrls,
} from "@rhea-finance/cross-chain-sdk";

// Default environment is prd
console.log(getSdkEnv()); // "prd"

// Switch to stg
setSdkEnv("stg");
console.log(getSdkEnv()); // "stg"

// Switch back to prd
setSdkEnv("prd");
console.log(getSdkEnv()); // "prd"

// Set custom NEAR RPC node URL for the current environment
setCustomNodeUrl("https://your-custom-near-rpc-url.com");

// Set custom NEAR RPC failover URLs for the current environment
setCustomNodeUrls([
  "https://your-primary-near-rpc-url.com",
  "https://your-secondary-near-rpc-url.com",
]);
```

Notes:
- The default SDK environment is `prd`.
- `setSdkEnv("stg" | "prd")` only switches the SDK environment.
- `setCustomNodeUrl(...)` only overrides the NEAR RPC URL of the current environment and does not switch between `stg` and `prd`.
- By default, NEAR view and balance calls use `https://free.rpc.fastnear.com` first and fall back to `https://nearinner.deltarpc.com` on transient failures such as HTTP 429, HTTP 408, HTTP 5xx, or network errors.

### Type Definitions

```typescript
// Chain type
type IChain = "evm" | "solana" | "btc" | "zcash";

// Wallet type
type IWallet =
  | { EVM: string }
  | { Solana: string }
  | { Bitcoin: string }
  | { Zcash: string };

```

## Usage Examples

Check out the [cross-chain-demo](./../cross-chain-demo) project for more complete usage examples.

### Example 1: Query Account Data

```typescript
import { batchViews  } from "@rhea-finance/cross-chain-sdk";

async function fetchAccountData(mcaId: string) {
  // Batch query
  const lendingData = await batchViews(mcaId);
  
  return {
    assets: lendingData.assets_paged_detailed,
    config: lendingData.config,
  };
}
```
```

## Development

### Build

```bash
pnpm build
```

### Development Mode (watch file changes)

```bash
pnpm dev
```

### Type Check

```bash
pnpm type-check
```

### Code Formatting

```bash
pnpm prettier:fix
```

## Dependencies

Main dependencies include:

- `ethers` - EVM chain interaction
- `@solana/web3.js` - Solana chain interaction
- `near-api-js` - NEAR chain interaction
- `btc-wallet` - Bitcoin wallet support
- `bignumber.js` / `big.js` / `decimal.js` - Big number calculations
- `lodash` - Utility functions

## License

MIT

## Related Links

- Demo Project: [cross-chain-demo](https://github.com/rhea-finance/cross-chain-demo)
- Rhea Finance: https://rhea.finance

## Contributing

Issues and Pull Requests are welcome!
