#!/usr/bin/env node
/**
 * Expo connection diagnostic - runs before expo start to capture network state.
 * Writes NDJSON to .cursor/debug.log for debugging "request timed out" errors.
 * Usage: node scripts/expo-connection-diagnostic.js [tunnel]
 */
const os = require('os');
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', '.cursor', 'debug.log');
const isTunnel = process.argv[2] === 'tunnel';
const SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/21947e22-268b-4b4b-b2a2-66fa85bca94d';

function writeLog(entry) {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}

// #region agent log
writeLog({
  hypothesisId: 'fix-verify',
  sessionId: 'debug-session',
  runId: isTunnel ? 'expo-start-tunnel' : 'expo-start-diagnostic',
  location: 'expo-connection-diagnostic.js:mode',
  message: 'Expo start mode',
  data: { tunnelMode: isTunnel, fix: isTunnel ? 'Tunnel bypasses firewall/AP isolation' : 'Standard LAN mode' },
  timestamp: Date.now(),
});
// #endregion

// Hypotheses being tested:
// H1: Network interfaces - what IPs does this machine have?
// H2: IP mismatch - does 10.13.246.184 (from error URL) match current machine IP?
// H3: Port/firewall - deferred (expo binds on start)
// H4: Hotspot scenario - Mac on phone hotspot gets 172.20.x; 10.x suggests different WiFi
// H5: Stale URL - phone may have cached old exp:// URL from when Mac was on different network

// #region agent log
const interfaces = os.networkInterfaces();
const ipAddresses = [];
for (const [name, addrs] of Object.entries(interfaces)) {
  for (const addr of addrs || []) {
    if (addr.family === 'IPv4' && !addr.internal) {
      ipAddresses.push({ interface: name, address: addr.address });
    }
  }
}
writeLog({
  hypothesisId: 'H1',
  sessionId: 'debug-session',
  runId: isTunnel ? 'expo-start-tunnel' : 'expo-start-diagnostic',
  location: 'expo-connection-diagnostic.js:startup',
  message: 'Network interfaces at expo start',
  data: { ipAddresses, hostname: os.hostname(), expectedInUrl: '10.13.246.184' },
  timestamp: Date.now()
});
// #endregion

// #region agent log
const urlIp = '10.13.246.184';
const ipMatches = ipAddresses.some((i) => i.address === urlIp);
writeLog({
  hypothesisId: 'H2',
  sessionId: 'debug-session',
  runId: isTunnel ? 'expo-start-tunnel' : 'expo-start-diagnostic',
  location: 'expo-connection-diagnostic.js:ip-match',
  message: 'Does URL IP match current machine IP?',
  data: { urlIp, ipMatches, currentIps: ipAddresses.map((i) => i.address) },
  timestamp: Date.now()
});
// #endregion

// #region agent log
writeLog({
  hypothesisId: 'H3',
  sessionId: 'debug-session',
  runId: isTunnel ? 'expo-start-tunnel' : 'expo-start-diagnostic',
  location: 'expo-connection-diagnostic.js:port-check',
  message: 'Port 8082 availability (Expo default)',
  data: { note: 'Port check deferred - expo will bind when started' },
  timestamp: Date.now()
});
// #endregion

// #region agent log
const in10Range = ipAddresses.some((i) => i.address.startsWith('10.'));
const potentialHotspotRange = ipAddresses.some((i) =>
  i.address.startsWith('172.20.') || i.address.startsWith('192.168.43') || i.address.startsWith('192.168.44')
);
writeLog({
  hypothesisId: 'H4',
  sessionId: 'debug-session',
  runId: isTunnel ? 'expo-start-tunnel' : 'expo-start-diagnostic',
  location: 'expo-connection-diagnostic.js:network-type',
  message: 'Network type inference for hotspot scenario',
  data: {
    ipAddresses: ipAddresses.map((i) => i.address),
    in10Range,
    potentialHotspotRange,
    note: '10.x = typical WiFi; 172.20.x/192.168.43.x = typical phone hotspot',
  },
  timestamp: Date.now(),
});
// #endregion

// #region agent log
writeLog({
  hypothesisId: 'H5',
  sessionId: 'debug-session',
  runId: isTunnel ? 'expo-start-tunnel' : 'expo-start-diagnostic',
  location: 'expo-connection-diagnostic.js:recommendation',
  message: 'Stale URL / tunnel recommendation',
  data: {
    errorUrlIp: '10.13.246.184',
    currentMachineIps: ipAddresses.map((i) => i.address),
    recommendation: ipMatches
      ? 'IP matches - check firewall or use tunnel'
      : 'IP mismatch - phone has stale URL. Use QR code from THIS run or: npx expo start --tunnel',
  },
  timestamp: Date.now(),
});
// #endregion
