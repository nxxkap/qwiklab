import { test } from "bun:test";
import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = Number(process.env.SSR_TEST_PORT ?? 4179);
const url = `http://${host}:${port}/`;
const required = [
  ["rendered component label", "Library counter"],
  ["initial count", "Count: 2"],
  ["Qwik loader", "q:base"],
  ["serialized Qwik container", "q:container"],
  ["lazy click listener", "on:click"],
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startPreviewServer() {
  const server = spawn(
    "bun",
    ["x", "--no-install", "vite", "preview", "--host", host, "--port", String(port), "--strictPort"],
    {
      cwd: process.cwd(),
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  return {
    server,
    getOutput: () => output,
  };
}

async function stopServer(server) {
  if (server.exitCode !== null || server.killed) {
    return;
  }

  const exited = new Promise((resolve) => {
    server.once("exit", resolve);
  });

  try {
    if (process.platform === "win32") {
      server.kill("SIGTERM");
    } else {
      process.kill(-server.pid, "SIGTERM");
    }
  } catch {
    server.kill("SIGTERM");
  }

  await Promise.race([exited, delay(2_000)]);

  if (server.exitCode === null && !server.killed) {
    try {
      if (process.platform === "win32") {
        server.kill("SIGKILL");
      } else {
        process.kill(-server.pid, "SIGKILL");
      }
    } catch {
      server.kill("SIGKILL");
    }
  }
}

async function waitForServer(getOutput) {
  const deadline = Date.now() + 15_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.text();
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }

  throw new Error(`Preview server did not respond: ${lastError?.message}\n${getOutput()}`);
}

test("SSR output contains Qwik library markers", async () => {
  const { server, getOutput } = startPreviewServer();
  try {
    const html = await waitForServer(getOutput);
    const missing = required.filter(([, marker]) => !html.includes(marker));

    if (missing.length > 0) {
      throw new Error(
        `SSR output is missing markers: ${missing
          .map(([label, marker]) => `${label} (${marker})`)
          .join(", ")}`,
      );
    }
  } finally {
    await stopServer(server);
  }
});
