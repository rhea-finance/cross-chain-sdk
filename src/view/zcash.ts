import { config_near } from "../config/config";
import { IDataByAddressResponse } from "../types/zcash";

export async function getZcashCreateMcaDepositAddress(
  am_id: string
): Promise<string> {
  const response = await fetch(
    `${config_near.indexUrl}/mca_creation_via_zcash?am_id=${am_id}`
  );
  if (!response.ok) {
    throw new Error("Failed to get Zcash address for MCA creation");
  }
  const res: any = await response.json();
  return res?.data || "";
}

export async function getZcashResponseDataByAddress(
  address: string
): Promise<IDataByAddressResponse | undefined> {
  const response = await fetch(
    `${config_near.indexUrl}/v3/zcash/get_data_by_mca_id?address=${address}`
  );
  if (!response.ok) {
    throw new Error("Failed to get data by address");
  }
  const res = (await response.json()) as { data?: IDataByAddressResponse };
  return res?.data;
}

export async function getPublicKeyByTAddress(
  tAddress: string
): Promise<string> {
  const response = await fetch(
    `${config_near.indexUrl}/zcash_get_public_key?t_address=${tAddress}`
  );
  if (!response.ok) {
    throw new Error("Failed to get T address by public key");
  }
  const res = (await response.json()) as any;
  return res?.data || "";
}
