import { view_on_near } from "../chains/near";
import { ViewMethodsToken } from "../types/contract-methods";

const getBalance = async (
  tokenId: string,
  accountId: string
): Promise<string> => {
  try {
    const balanceInYocto = (await view_on_near({
      contractId: tokenId,
      methodName: ViewMethodsToken[ViewMethodsToken.ft_balance_of],
      args: {
        account_id: accountId,
      },
    })) as string;
    return balanceInYocto;
  } catch (err: any) {
    console.error(
      `Failed to get balance for ${accountId} on ${tokenId} ${err.message}`
    );
    return "0";
  }
};
export { getBalance };
