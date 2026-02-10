export interface IDataByAddressResponse {
  created_at: string;
  deposit_address: string;
  deposit_uuid: string;
  hex: string | null;
  id: number;
  is_withdraw: number;
  ma_id: string;
  mca_id: string | null;
  near_number: string;
  pre_info: string | null;
  public_key: string | null;
  request_data: string;
  status: number;
  t_address: string | null;
  tx_hash: string | null;
  type: number;
  updated_at: string;
  application?: {
    request: { am_id: string; mca_id: string; nonce: string };
    zcash_tx: string;
    zcash_tx_pre_info: [string, string][];
    tx_hash?: string;
  };
  error_msg?: string;
}
