import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start server
const server = spawn("node", [path.join(__dirname, "server.js")], {
  stdio: "inherit",
  env: process.env,
});

// LISTENER TEMPORARILY DISABLED TO PREVENT RPC SPAM
// TODO: Re-enable after implementing proper rate limiting and on-demand event fetching
// const listener = spawn("node", [path.join(__dirname, "listener.js")], {
//   stdio: "inherit",
//   env: process.env,
// });

server.on("error", (err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});

// listener.on("error", (err) => {
//   console.error("❌ Listener failed to start:", err);
//   process.exit(1);
// });

// Handle graceful shutdown
process.on("SIGINT", () => {
  server.kill("SIGINT");
  // listener.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.kill("SIGTERM");
  // listener.kill("SIGTERM");
  process.exit(0);
});
