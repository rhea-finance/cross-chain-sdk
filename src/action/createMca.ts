import { IWallet } from "../types/chains";

export function getCreateMcaCustomRecipientMsg({
  useAsCollateral,
  wallets,
  signedMessages,
}: {
  useAsCollateral: boolean;
  wallets: IWallet[];
  signedMessages: string[];
}) {
  const customRecipientMsg = JSON.stringify({
    w: wallets,
    b: {
      r: useAsCollateral
        ? "BurrowRegisterAndCollateral"
        : "BurrowRegisterAndSupply",
    },
    s: signedMessages,
  });
  return customRecipientMsg;
}

/**
 * 创建的流程
 * 1. SDK使用者需要用每一个待绑定的钱包对钱包列表进行签名。
 * 2. 签名完成后, 组织customRecipientMsg内容，进行intents试算，获得转账地址 depositAddress
 * 3. SDK使用者进行转账
 * 4. 多余的资金会自动进入用户的lending账户里
 */
