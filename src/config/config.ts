const INFURA_KEY = "45ad2962c1b5465bb6fe62db0d35b42f";
interface INEARConfig {
  networkId: string;
  nodeUrl: string;
  explorerUrl: string;
  LOGIC_CONTRACT_NAME: string;
  REF_EXCHANGE_ID: string;
  WRAP_NEAR_CONTRACT_ID: string;
  XRHEA_TOKEN_ID: string;
  PYTH_ORACLE_ID: string;
  indexUrl: string;
  dataServiceUrl: string;
  txIdApiUrl: string;
  AM_CONTRACT: string;
  NBTCTokenId: string;
  WBTC_TOKEN_ID: string;
  hiddenAssets: string[];
  oneClickUrl: string;
  RELAYER_ID: string;
  HHHH: string;
}
let customNodeUrl = "";
export const setCustomNodeUrl = (nodeUrl: string) => {
  customNodeUrl = nodeUrl;
};
function getConfig() {
  let NEAR_CONFIG: INEARConfig = {
    networkId: "mainnet",
    nodeUrl: customNodeUrl || "https://free.rpc.fastnear.com",
    explorerUrl: "https://nearblocks.io",
    LOGIC_CONTRACT_NAME: "contract.main.burrow.near",
    AM_CONTRACT: "multica.near",
    RELAYER_ID: "bestdome534.near",
    REF_EXCHANGE_ID: "v2.ref-finance.near",
    PYTH_ORACLE_ID: "pyth-oracle.near",
    WRAP_NEAR_CONTRACT_ID: "wrap.near",
    XRHEA_TOKEN_ID: "xtoken.rhealab.near",
    NBTCTokenId: "nbtc.bridge.near",
    WBTC_TOKEN_ID:
      "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near",
    indexUrl: "https://api.rhea.finance",
    dataServiceUrl: "https://apidata.rhea.finance",
    txIdApiUrl: "https://api3.nearblocks.io",
    oneClickUrl: "https://1click.chaindefuser.com/v0",
    hiddenAssets: [
      "meta-token.near",
      "usn",
      "a663b02cf0a4b149d2ad41910cb81e23e1c41c32.factory.bridge.near",
      "4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near",
      "v2-nearx.stader-labs.near",
      "aurora",
      "token.burrow.near",
      "45.contract.portalbridge.near",
      "shadow_ref_v1-4179",
    ],
    HHHH: "xieqian",
  };
  return {
    NEAR: NEAR_CONFIG,
    BTC: {},
    SOLANA: {
      nodeUrl: "https://swr.xnftdata.com/rpc-proxy/",
    },
    EVM: {
      chains: {
        arbitrum: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://arbiscan.io",
          chainId: 42161,
          whChainId: 23,
          id: "0xA4B1",
          token: "ETH",
          label: "Arbitrum",
          rpcUrl: "https://public-arb-mainnet.fastnode.io",
        },
        aurora: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://explorer.aurora.dev",
          chainId: 1313161554,
          id: "0x4e454152",
          token: "ETH",
          label: "Aurora",
          rpcUrl: "https://mainnet.aurora.dev",
        },
        avalanche: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://cchain.explorer.avax.network",
          chainId: 43114,
          id: "0xa86a",
          token: "AVAX",
          label: "Avalanche",
          rpcUrl: "https://avalanche.drpc.org",
        },
        base: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://basescan.org",
          chainId: 8453,
          whChainId: 30,
          id: "0x2105",
          token: "ETH",
          label: "Base",
          rpcUrl: "https://mainnet.base.org",
        },
        ethereum: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://etherscan.io",
          chainId: 1,
          whChainId: 2,
          id: "0x1",
          token: "ETH",
          label: `Ethereum`,
          rpcUrl: "https://mainnet.gateway.tenderly.co/",
        },
        flare: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://flare-explorer.flare.network",
          chainId: 14,
          id: "0xe",
          token: "FLR",
          label: "Flare",
          rpcUrl: "https://flare-api.flare.network/ext/C/rpc",
        },
        mantle: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://explorer.mantle.xyz",
          chainId: 5000,
          id: "0x1388",
          token: "MNT",
          label: "Mantle",
          rpcUrl: "https://rpc.mantle.xyz/",
        },
        optimism: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://optimistic.etherscan.io",
          chainId: 10,
          whChainId: 24,
          id: "0xa",
          token: "ETH",
          label: "Optimism",
          rpcUrl: "https://mainnet.optimism.io",
        },
        polygon: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://polygonscan.com",
          chainId: 137,
          whChainId: 5,
          id: "0x89",
          token: "MATIC",
          label: "Polygon",
          rpcUrl: "https://rpc-mainnet.matic.quiknode.pro",
        },
        scroll: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://scrollscan.com",
          chainId: 534352,
          id: "0x82750",
          token: "ETH",
          label: "Scroll",
          rpcUrl: "https://rpc.ankr.com/scroll",
        },
        sei: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://seitrace.com",
          chainId: 1329,
          id: "0x531",
          token: "SEI",
          label: "SEI",
          rpcUrl: "https://evm-rpc.sei-apis.com",
        },
        taiko: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://taikoscan.io",
          chainId: 167000,
          id: "0x28c58",
          token: "ETH",
          label: "TAIKO",
          rpcUrl: "https://rpc.taiko.xyz",
        },
        bsc: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://bscscan.com",
          chainId: 56,
          whChainId: 4,
          id: "0x38",
          token: "BNB",
          label: "BSC",
          // rpcUrl: "https://bsc.drpc.org",
          rpcUrl: "https://api.zan.top/bsc-mainnet",
        },
        gravity: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          explorerUrl: "https://explorer.gravity.xyz",
          chainId: 1625,
          id: "0x659",
          token: "G",
          label: "Gravity",
          rpcUrl: "https://rpc.gravity.xyz",
        },
        bera: {
          network: "mainnet",
          infuraKey: INFURA_KEY,
          id: "0x138de",
          chainId: 1385,
          rpcUrl: "https://rpc.berachain.com",
          explorerUrl: "https://berascan.com/",
          token: "BERA",
          label: "BERA",
        },
      },
    },
  };
}

const config = getConfig();
// Use Proxy to make config_near dynamic
export const config_near = new Proxy({} as INEARConfig, {
  get(target, prop: string | symbol) {
    // Every time a property is accessed, get fresh config
    return getConfig().NEAR[prop as keyof INEARConfig];
  },
});

export const config_btc = config.BTC;
export const config_solana = config.SOLANA;
export const config_evm = config.EVM;
