# @rhea-finance/cross-chain-sdk

Cross-chain lending SDK that supports unified lending operations across multiple blockchains, including EVM chains, Solana, Bitcoin, and NEAR.

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
  getCeateMcaFee,
  getCreateMcaFeePaged,
  getNearValue,
  getNearValuesPaged,
} from "@rhea-finance/cross-chain-sdk";
import type { IChain, IWallet } from "@rhea-finance/cross-chain-sdk";

// Get MCA by wallet - query multi-chain account based on logged-in wallet
// Parameters:
//   chain: Supported chain type, currently supports "evm", "solana", "btc"
//   identityKey: Unique identifier of the logged-in account on the specified chain
//     - evm: Account ID (e.g., "0x1234...")
//     - solana: Account ID (e.g., "ABC123...")
//     - btc: Public key (e.g., "02abc123...")
const mcaId: string | null = await getMcaByWallet({
  chain: "evm" as IChain,
  identityKey: "0x1234...",
});

// Get list wallets by MCA - query all wallets bound to a multi-chain account
const wallets: IWallet[] = await getListWalletsByMca(mcaId);

// Get create MCA fee - get creation fee for a specific asset
const createFee: string = await getCeateMcaFee("usdt.tether-token.near");

// Get create MCA fee paged - get list of creation fee tokens
const createFeeList: Record<string, string> = await getCreateMcaFeePaged();

// Get near value - get exchange rate between a specific token and NEAR
const nearValue: string = await getNearValue("usdt.tether-token.near");

// Get near values paged - get all token exchange rates with NEAR
const nearValues: Record<string, string> = await getNearValuesPaged();
```

## Operations

### Create Multi-chain Account (MCA)

The following steps describe how to create a multi-chain account:

```typescript
import type {
  IChain,
  IIntentsQuoteResult,
} from "@rhea-finance/cross-chain-sdk";
import {
  format_wallet,
  serializationObj,
  getCreateMcaCustomRecipientMsg,
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

// Step 4: Get intents quote to obtain depositAddress
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

// Step 5: Get depositAddress and transfer funds to complete MCA creation
const depositAddress = res_quote.quoteSuccessResult?.quote?.depositAddress;
// Transfer funds to depositAddress using your wallet
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
  amountBurrow: simpleWithdrawData?.amountBurrow || "0",
  amountToken: simpleWithdrawData?.amountToken || "0",
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
const simpleWithdrawData: ISimpleWithdraw | null = await getSimpleWithdrawData({
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
const simpleWithdrawData: ISimpleWithdraw | null = await getSimpleWithdrawData({
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
const simpleWithdrawData: ISimpleWithdraw | null = await getSimpleWithdrawData({
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

**Custom Recipient Messages**
- `getCreateMcaCustomRecipientMsg` - Get custom recipient message for creating MCA
- `getSupplyCustomRecipientMsg` - Get custom recipient message for supply
- `getRepayCustomRecipientMsg` - Get custom recipient message for repay

**Account Management**
- `prepareBusinessDataOnAddWallet` - Prepare add wallet business data
- `prepareBusinessDataOnRemoveWallet` - Prepare remove wallet business data
- `prepareBusinessDataOnClaim` - Prepare claim rewards business data


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
- `setCustomNodeUrl` - Set custom RPC node URL for NEAR chain. This function allows you to customize the RPC endpoint used for NEAR chain interactions.

```typescript
import { setCustomNodeUrl } from "@rhea-finance/cross-chain-sdk";

// Set custom NEAR RPC node URL
setCustomNodeUrl("https://your-custom-near-rpc-url.com");
```

### Type Definitions

```typescript
// Chain type
type IChain = "evm" | "solana" | "btc";

// Wallet type
type IWallet = { EVM: string } | { Solana: string } | { Bitcoin: string };

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

- Demo Project: [cross-chain-demo](https://github.com/xieqiancaosissi/cross-chain-demo)
- Rhea Finance: https://rhea.finance

## Contributing

Issues and Pull Requests are welcome!
