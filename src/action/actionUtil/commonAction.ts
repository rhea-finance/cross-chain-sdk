import { IWallet, IBusiness } from "../../types/index";
import { NDeposit } from "../../utils/chainsUtil";
import {
  fetchIntentsQuotation,
  postMultichainLendingRequests,
  pollingRelayerTransactionResult,
} from "../../view";
import { TOKEN_STORAGE_DEPOSIT_READ } from "../../config/constantConfig";

export async function intentsQuotation({
  originAsset,
  destinationAsset,
  amount,
  refundTo,
  recipient,
  customRecipientMsg,
  isReverse,
  dry,
  slippageTolerance,
}: {
  originAsset: string;
  destinationAsset: string;
  amount: string;
  refundTo: string;
  recipient: string;
  customRecipientMsg?: string;
  isReverse?: boolean;
  dry?: boolean;
  slippageTolerance?: number;
}) {
  const res_quote = await fetchIntentsQuotation({
    originAsset,
    destinationAsset,
    amount,
    refundTo,
    recipient,
    isReverse,
    dry,
    slippageTolerance,
    ...(customRecipientMsg ? { customRecipientMsg } : {}),
  });
  return res_quote;
}

export async function submitSignedTransactionToRelayer({
  mca,
  w,
  signedBusiness,
  business,
  reportData,
  pollingInterval,
}: {
  mca: string;
  w: IWallet;
  signedBusiness: string;
  business: IBusiness;
  reportData?: string;
  pollingInterval?: number;
}) {
  try {
    const relayer_result = await postMultichainLendingRequests({
      mca_id: mca,
      wallet: JSON.stringify(w),
      request: [
        JSON.stringify({
          signer_wallet: w,
          business: business,
          signature: signedBusiness,
          attach_deposit: NDeposit(TOKEN_STORAGE_DEPOSIT_READ),
        }),
      ],
      page_display_data: reportData || "",
    });
    if (relayer_result?.code == 0) {
      const { status, tx_hash } = await pollingRelayerTransactionResult(
        relayer_result.data,
        pollingInterval || 2000
      );
      return {
        status,
        tx_hash,
        message: status == "error" ? "Relayer execution failed" : "",
      };
    }
    return {
      status: "error",
      message: relayer_result?.msg,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error?.message || error?.error,
    };
  }
}
