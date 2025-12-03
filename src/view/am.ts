import { config_near } from "../config";
import { view_on_near } from "../chains";
import { format_wallet } from "../utils/chainsUtil";
import { IChain } from "../types/chains";

export async function getMcaByWallet({
  chain,
  identityKey,
}: {
  chain: IChain;
  identityKey: string;
}) {
  const w = format_wallet({
    chain,
    identityKey,
  });
  const res = await view_on_near({
    contractId: config_near.AM_CONTRACT,
    methodName: "get_mca_by_wallet",
    args: {
      wallet: w,
    },
  });
  return res;
}

export async function getListWalletsByMca(mca: string) {
  const res = await view_on_near({
    contractId: config_near.AM_CONTRACT,
    methodName: "list_wallets_by_mca",
    args: {
      mca_id: mca,
    },
  });
  return res;
}

export async function getCeateMcaFee(token_id: string) {
  const res = await view_on_near({
    contractId: config_near.AM_CONTRACT,
    methodName: "get_create_mca_fee",
    args: {
      token_id,
    },
  });
  return res;
}

export async function getCreateMcaFeePaged() {
  const res = await view_on_near({
    contractId: config_near.AM_CONTRACT,
    methodName: "get_create_mca_fee_paged",
  });
  return res;
}

export async function getNearValue(token_id: string) {
  const res = await view_on_near({
    contractId: config_near.AM_CONTRACT,
    methodName: "get_near_value",
    args: {
      token_id,
    },
  });
  return res;
}

export async function getNearValuesPaged() {
  const res = await view_on_near({
    contractId: config_near.AM_CONTRACT,
    methodName: "get_near_values_paged",
  });
  return res;
}
