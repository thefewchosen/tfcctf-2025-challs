import SSH_File_Download from "../../../pkg/ssh-client";
import type { ssh_ctx } from "../../../pkg/ssh-client";
import { promises as fs } from "fs";

export async function POST(request: Request) {
  const ssh_ctxData: ssh_ctx = await request.json();
  ssh_ctxData.username = process.env.SSH_USERNAME || "";
  console.log(ssh_ctxData);

  const result = await SSH_File_Download(ssh_ctxData);

  if (result.ok) {
    try {
      const path = result.path;
      const data = await fs.readFile(path, "utf8");
      console.log("Content:", data);
      return new Response(JSON.stringify({ ok: true, content: data }), { status: 200 });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ ok: false, error: err.message }),
        { status: 500 }
      );
    }
  } else {
    return new Response(JSON.stringify(result), { status: 500 });
  }
}