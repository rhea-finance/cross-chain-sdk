import _ from "lodash";

export function prepare_sign_message_solana(message: string) {
  const messageBuffer = new TextEncoder().encode(message);
  return messageBuffer;
}

export function process_signature_solana(
  signature: Uint8Array<ArrayBufferLike>
) {
  return Buffer.from(signature).toString("hex");
}
