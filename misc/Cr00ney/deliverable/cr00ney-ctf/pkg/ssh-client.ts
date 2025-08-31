import Client from "ssh2-sftp-client";
import { basename, join, resolve } from "path";
import fs from "node:fs";
import fsp from "node:fs/promises";

export interface ssh_ctx {
  host: string;
  username: string;
  filename: string;
  keyPath: string;
  downloadPath: string;
}

const BLOCKED_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs",
  ".ts", ".tsx", ".jsx",
  ".vue", ".svelte",
  ".php", ".py", ".rb", ".sh", ".pl",
  ".go", ".rs", ".java", ".cs",
  ".c", ".cc", ".cpp", ".h", ".hpp",
  ".rb", ".pm",
  ".ps1", ".bat", ".cmd",
  ".lua", ".perl",
  ".html", ".htm", ".css", ".xml", ".xhtml",
  ".wasm", ".local"
]);

function hasBlockedExtension(name: string): boolean {
  const lower = name.toLowerCase();

  const lastDot = lower.lastIndexOf(".");
  if (lastDot !== -1) {
    const ext = lower.slice(lastDot);
    if (BLOCKED_EXTENSIONS.has(ext)) return true;
  }

  const parts = lower.split(".");
  for (let i = 1; i < parts.length; i++) {
    const ext = "." + parts.slice(i).join(".");
    const finalToken = "." + parts.slice(i).pop();
    if (finalToken && BLOCKED_EXTENSIONS.has(finalToken)) return true;
  }

  return false;
}

export default async function SSH_File_Download(ctx: ssh_ctx) {
  const { host, username, filename, keyPath } = ctx;

  const safeRemoteName = basename(filename);
  const safeLocalName = filename;

  if (hasBlockedExtension(safeRemoteName) || hasBlockedExtension(safeLocalName)) {
    return { ok: false, message: "Refused: writing code files is not allowed." };
  }

  try {
    await fsp.mkdir("/app/downloads", { recursive: true });
  } catch (_) {}

  const localPath = "/app/downloads" + "/" +safeLocalName;


  const remotePath = "/app/" + safeRemoteName;

  const sftp = new Client();
  try {
    await sftp.connect({
      host,
      username,
      privateKey: fs.readFileSync(keyPath),
    });

    await sftp.fastGet(remotePath, localPath);
    await sftp.end();

    try { await fsp.chmod(localPath, 0o600); } catch {}

    return {
      ok: true,
      message: "Successfully downloaded the file",
      path: localPath,
    };
  } catch (error: any) {
    try { await sftp.end(); } catch {}
    return { ok: false, message: error?.message || "SFTP error" };
  }
}