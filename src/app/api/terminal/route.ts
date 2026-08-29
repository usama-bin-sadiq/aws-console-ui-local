import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { addTerminalHistory, getTerminalHistory } from "@/lib/db";

/**
 * Tokenizes a command string into an array of arguments,
 * respecting quoted strings (single and double quotes).
 */
function tokenize(cmd: string): string[] {
  const args: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === " " && !inSingle && !inDouble) {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}

function runCommand(
  executable: string,
  args: string[],
  env: NodeJS.ProcessEnv
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let resolved = false;
    const proc = spawn(executable, args, { env });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code: number | null) => {
      if (!resolved) {
        resolved = true;
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      }
    });

    proc.on("error", (err: Error) => {
      if (!resolved) {
        resolved = true;
        resolve({ stdout: "", stderr: err.message, exitCode: 1 });
      }
    });

    // 30-second timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill();
        resolve({ stdout, stderr: "Command timed out after 30 seconds", exitCode: 124 });
      }
    }, 30_000);
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") || "default";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const history = getTerminalHistory(sessionId, limit);
    return NextResponse.json({ history });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const command: string = (body.command || "").trim();
    const sessionId: string = body.sessionId || "default";

    // Security: only allow aws CLI commands
    if (!command.startsWith("aws ") && command !== "aws") {
      return NextResponse.json(
        { error: "Only aws CLI commands are supported", exitCode: 1 },
        { status: 400 }
      );
    }

    const tokens = tokenize(command);
    // tokens[0] is "aws", the rest are subcommand args
    const args = tokens.slice(1);

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL ?? "http://localhost:4566",
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "test",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION ?? "us-east-1",
    };

    const { stdout, stderr, exitCode } = await runCommand("aws", args, env);
    const output = stdout + (stderr ? `\n${stderr}` : "");

    // Persist to history
    addTerminalHistory(sessionId, command, output, exitCode);

    return NextResponse.json({ output, exitCode });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
