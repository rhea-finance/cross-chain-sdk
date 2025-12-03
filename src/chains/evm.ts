import _ from "lodash";

export function prepare_sign_message_evm(message: string) {
  return message;
}
export function process_signature_evm(signature: string) {
  return signature.slice(2);
}
