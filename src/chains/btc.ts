export function prepare_sign_message_btc(message: string) {
  return message;
}

export function process_signature_btc(signature: string) {
  const res = Buffer.from(signature, "base64");
  const hex = res.toString("hex");
  return hex;
}
