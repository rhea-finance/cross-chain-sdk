import { IMetadata, ViewMethodsToken } from "../types";
import { get_all_tokens_metadata } from "./centralized_api";
import { view_on_near } from "../chains";

export const getAllMetadata = async (
  token_ids: string[]
): Promise<IMetadata[]> => {
  try {
    const tokensMap = await get_all_tokens_metadata();
    const metadata: IMetadata[] = token_ids.map(
      (token_id) => tokensMap[token_id]
    );
    const emptyMetadatas = metadata.filter((meta) => !meta);
    if (emptyMetadatas.length) {
      throw new Error("missing token metadata");
    }
    return metadata;
  } catch (err) {
    const metadata: IMetadata[] = (
      await Promise.all(token_ids.map((token_id) => getMetadata(token_id)))
    ).filter((m): m is IMetadata => !!m);
    return metadata;
  }
};

export const getMetadata = async (
  token_id: string
): Promise<IMetadata | undefined> => {
  try {
    const metadata: IMetadata = (await view_on_near({
      contractId: token_id,
      methodName: ViewMethodsToken[ViewMethodsToken.ft_metadata],
    })) as IMetadata;
    metadata.token_id = token_id;
    return metadata;
  } catch (err: any) {
    console.error(`Failed to get metadata for ${token_id} ${err.message}`);
    return undefined;
  }
};
