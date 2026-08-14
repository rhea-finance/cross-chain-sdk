import assert from "node:assert/strict";

const nodeUrls = [
  "https://primary-rpc.invalid",
  "https://fallback-rpc.invalid",
];
const requests = [];
const originalFetch = globalThis.fetch;
let responseMode = "rpc-errors";

globalThis.fetch = async (input) => {
  const url = String(input);
  requests.push(url);

  if (responseMode === "invalid-data") {
    return Response.json({
      jsonrpc: "2.0",
      id: "dontcare",
      result: {
        result: Array.from(Buffer.from(JSON.stringify({}))),
      },
    });
  }

  return new Response("temporarily unavailable", {
    status: url === nodeUrls[0] ? 429 : 503,
  });
};

try {
  const { batchViews, setCustomNodeUrls, setSdkEnv } = await import(
    "../dist/index.js"
  );

  setSdkEnv("prd");
  setCustomNodeUrls(nodeUrls);

  await assert.rejects(batchViews(), (error) => {
    assert.match(
      error.message,
      /NEAR RPC request failed for all configured endpoints/
    );
    assert.match(error.message, /primary-rpc\.invalid/);
    assert.match(error.message, /fallback-rpc\.invalid/);
    return true;
  });

  assert.deepEqual(requests, nodeUrls);
  console.log("batchViews propagates the NEAR RPC failover error");

  responseMode = "invalid-data";
  requests.length = 0;
  setCustomNodeUrls([nodeUrls[0]]);

  await assert.rejects(
    batchViews(),
    /Invalid batch_views response: expected an array/
  );
  assert.deepEqual(requests, [nodeUrls[0]]);
  console.log("batchViews rejects malformed lending data");
} finally {
  globalThis.fetch = originalFetch;
}
