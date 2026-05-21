#!/usr/bin/env node
/**
 * start-tunnel-strict
 *
 * Goal: make `npm run start:tunnel` testing reliable by:
 * - choosing a free port (avoid port prompts + stale QR)
 * - retrying tunnel startup a couple times if ngrok fails
 * - failing fast when tunnel can't come up (so you don't scan old QR payloads)
 */

const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const projectRoot = path.join(__dirname, "..");

const READY_PATTERNS = [
  /Tunnel ready/i,
  /Tunnel connected/i,
  /Your native app is running at/i,
];

const ERROR_PATTERNS = [
  /failed to start tunnel/i,
  /remote gone away/i,
  /ERR_NGROK/i,
  /ngrok/i,
];

function extractConnectionTarget(line) {
  const match = line.match(/(?:exps?|https?):\/\/\S+/i);
  if (!match || !match[0]) return null;
  // Trim trailing punctuation/noise that sometimes appears in terminal output.
  return match[0].replace(/[),.;]+$/, "");
}

function getEnvInt(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    // We only care about bind success; immediately release it.
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findFreePort({ startPort, endPort }) {
  for (let port = startPort; port <= endPort; port++) {
    // Keep it deterministic so the user sees consistent behavior.
    // (Also avoids port prompts that can cause stale QR payloads.)
    // eslint-disable-next-line no-await-in-loop
    const ok = await isPortAvailable(port);
    if (ok) return port;
  }

  // Fallback: random ports above the range.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const port = endPort + 1 + Math.floor(Math.random() * 1000);
    // eslint-disable-next-line no-await-in-loop
    const ok = await isPortAvailable(port);
    if (ok) return port;
  }
}

function runExpoStart({ port }) {
  return new Promise((resolve, reject) => {
    const expoArgs = ["expo", "start", "--tunnel", "--clear", "--port", String(port)];

    const child = spawn("npx", expoArgs, {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let buffer = "";
    let ready = false;
    let printedConnectionTarget = false;
    let connectionTarget = null;

    const startTimeoutMs = getEnvInt("TUNNEL_START_TIMEOUT_MS", 60000);
    const timeout = setTimeout(() => {
      if (ready) return;
      // If tunnel never became ready, kill and retry.
      try {
        child.kill("SIGINT");
      } catch {
        // ignore
      }
      reject(new Error(`Tunnel did not become ready within ${startTimeoutMs}ms (port ${port})`));
    }, startTimeoutMs);

    const onLine = (line) => {
      if (!line) return;

      // Capture the full device connection URL if Expo prints one.
      const discoveredTarget = extractConnectionTarget(line);
      if (discoveredTarget) {
        connectionTarget = discoveredTarget;
        if (ready && !printedConnectionTarget) {
          printedConnectionTarget = true;
          console.log(`\nConnection target (for this run): ${connectionTarget}\n`);
        }
      }

      if (!ready && READY_PATTERNS.some((r) => r.test(line))) {
        ready = true;
        clearTimeout(timeout);

        if (!printedConnectionTarget) {
          if (connectionTarget) {
            printedConnectionTarget = true;
            // Keep this single line so it's easy to copy/paste into Expo Go if needed.
            console.log(`\nConnection target (for this run): ${connectionTarget}\n`);
          } else {
            console.log("\nConnection target not printed by Expo yet; watch for it below or scan the QR shown above.\n");
          }
        }
      }

      if (!ready && ERROR_PATTERNS.some((r) => r.test(line))) {
        // Tunnel failure detected early.
        clearTimeout(timeout);
        try {
          child.kill("SIGINT");
        } catch {
          // ignore
        }
        reject(new Error(`Tunnel failed to start (port ${port}): ${line.trim()}`));
      }
    };

    const handleChunk = (chunk, streamName) => {
      const text = chunk.toString();
      // Keep the user's terminal output live.
      if (streamName === "stdout") process.stdout.write(text);
      else process.stderr.write(text);

      buffer += text;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const l of lines) onLine(l);
    };

    child.stdout.on("data", (chunk) => handleChunk(chunk, "stdout"));
    child.stderr.on("data", (chunk) => handleChunk(chunk, "stderr"));

    child.on("exit", (code, signal) => {
      clearTimeout(timeout);
      if (ready) {
        // Expo should normally keep running; if it exits after being ready, forward the exit code.
        resolve({ code, signal });
        return;
      }
      reject(new Error(`Expo exited before tunnel became ready (port ${port}, code ${code}, signal ${signal})`));
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  const retries = getEnvInt("TUNNEL_RETRIES", 3);
  const portStart = getEnvInt("TUNNEL_PORT_START", 8081);
  const portEnd = getEnvInt("TUNNEL_PORT_END", 8199);

  for (let attempt = 1; attempt <= retries; attempt++) {
    // Pick a free port per attempt so a previous failed run can't "poison" the QR payload.
    const port = await findFreePort({ startPort: portStart, endPort: portEnd });

    console.log(`\nAttempt ${attempt}/${retries}: starting tunnel on port ${port}...\n`);

    // Optional but useful: keep the project’s existing diagnostics log consistent.
    // (If this fails, we still attempt to run Expo.)
    try {
      spawn("node", ["scripts/expo-connection-diagnostic.js", "tunnel"], {
        cwd: projectRoot,
        stdio: "ignore",
        env: process.env,
      });
    } catch {
      // ignore
    }

    try {
      await runExpoStart({ port });
      // If Expo exits after becoming ready, just end.
      return;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.error(`Tunnel attempt failed: ${msg}`);
      if (attempt === retries) {
        console.error("\nGiving up. Either ngrok/network is having issues, or iOS Expo Go can't reach the tunnel/URL.");
        console.error("Try: (1) retry later, (2) switch networks/hotspot, (3) use `npm start` (LAN) if Local Network is enabled.");
        process.exitCode = 1;
        return;
      }
      // Small backoff so ngrok has time to recover.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

