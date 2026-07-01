import { spawnSync } from "node:child_process";

const modes = process.argv.slice(2);
const selectedModes = modes.length > 0 ? modes : ["vite", "tsdown", "vp"];
const qwikConsumerVersion = process.env.QWIK_CONSUMER_VERSION;

if (!qwikConsumerVersion) {
  throw new Error("QWIK_CONSUMER_VERSION is required for mismatch verification");
}

for (const mode of selectedModes) {
  const result = spawnSync("bun", ["run", "scripts/verify-packed-consumer.mjs", mode], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
    env: {
      ...process.env,
      VERIFY_QWIK_MISMATCH: "1",
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Packed mismatch verification failed for ${mode}`);
  }
}
