import { test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const required = [
  ["rendered component label", "Library counter"],
  ["initial count", "Count: 2"],
  ["Qwik loader", "q:base"],
  ["serialized Qwik container", "q:container"],
  ["lazy click listener", "on:click"],
];

test("SSR output contains Qwik library markers", async () => {
  const htmlPath = join(process.cwd(), "dist", "index.html");
  const html = await readFile(htmlPath, "utf8");
  const missing = required.filter(([, marker]) => !html.includes(marker));

  if (missing.length > 0) {
    throw new Error(
      `SSR output is missing markers: ${missing
        .map(([label, marker]) => `${label} (${marker})`)
        .join(", ")}`,
    );
  }
});
