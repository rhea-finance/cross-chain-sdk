import assert from "node:assert/strict";

const nodeUrls = [
  "https://primary-rpc.invalid",
  "https://fallback-rpc.invalid",
];
const requests = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input) => {
  const url = String(input);
  requests.push(url);

  if (url === nodeUrls[0]) {
    return new Response("rate limited", { status: 429 });
  }

  return Response.json({
    jsonrpc: "2.0",
    id: "dontcare",
    result: {
      result: Array.from(Buffer.from(JSON.stringify({ ok: true }))),
    },
  });
};

try {
  const { setCustomNodeUrls, setSdkEnv, view_on_near } = await import(
    "../dist/index.js"
  );

  setSdkEnv("prd");
  setCustomNodeUrls(nodeUrls);

  const firstResult = await view_on_near({
    contractId: "contract.near",
    methodName: "get_value",
  });
  assert.deepEqual(firstResult, { ok: true });
  assert.deepEqual(requests, nodeUrls);

  requests.length = 0;
  const secondResult = await view_on_near({
    contractId: "contract.near",
    methodName: "get_value",
  });
  assert.deepEqual(secondResult, { ok: true });
  assert.deepEqual(requests, [nodeUrls[1]]);

  console.log("NEAR RPC fails over and keeps the working endpoint active");
} finally {
  globalThis.fetch = originalFetch;
}
