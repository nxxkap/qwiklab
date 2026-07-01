import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type * as QwikServer from "@builder.io/qwik/server";

export interface LibraryServerBoundaryInfo {
  qwikVersion: string;
  loaderBytes: number;
}

const nodeRequire = createRequire(import.meta.url);

function loadQwikServer(): typeof QwikServer | undefined {
  try {
    return nodeRequire("@builder.io/qwik/server") as typeof QwikServer;
  } catch {
    return undefined;
  }
}

function readPublishedLoaderBytes(): number {
  return readFileSync(nodeRequire.resolve("@builder.io/qwik/qwikloader.js"), "utf8")
    .length;
}

function readPublishedQwikVersion(): string {
  const packageJson = nodeRequire("@builder.io/qwik/package.json") as {
    version?: string;
  };
  return packageJson.version ?? "unknown";
}

export function getLibraryServerBoundaryInfo(): LibraryServerBoundaryInfo {
  const qwikServer = loadQwikServer();

  return {
    loaderBytes:
      qwikServer?.getQwikLoaderScript().length ?? readPublishedLoaderBytes(),
    qwikVersion: qwikServer?.versions.qwik ?? readPublishedQwikVersion(),
  };
}
