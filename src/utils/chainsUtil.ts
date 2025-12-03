import Decimal from "decimal.js";
import _ from "lodash";
import { IChain } from "../types/chains";
import { view_on_near } from "../chains";

export function format_wallet({
  chain,
  identityKey,
}: {
  chain: IChain;
  identityKey: string;
}) {
  let w;
  if (chain == "evm") {
    w = { EVM: identityKey.slice(2) };
  } else if (chain == "solana") {
    w = { Solana: identityKey };
  } else if (chain == "btc") {
    w = { Bitcoin: identityKey };
  }
  return w;
}

export async function get_nonce_deadline({ accountId }: { accountId: string }) {
  const nonce = await view_on_near({
    contractId: accountId,
    methodName: "get_nonce",
  });
  const deadline = Math.floor(
    new Date(new Date().getTime() + 5 * 60 * 1000).getTime()
  ).toString();
  return {
    nonce,
    deadline,
  };
}

export function TGas(gas: string | number) {
  return new Decimal(gas).mul(1000000000000).toFixed();
}
export function NDeposit(deposit: string | number) {
  return new Decimal(deposit).mul(1000000000000000000000000).toFixed();
}
export function serializationObj(params: any) {
  return JSON.stringify(params || {});
}
