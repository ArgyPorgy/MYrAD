// Simple startup script to run both server and listener
const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting MYRAD Backend Services...\n");

// Start server
const server = spawn("node", [path.join(__dirname, "server.js")], {
  stdio: "inherit",
  env: process.env,
});

// Start listener
const listener = spawn("node", [path.join(__dirname, "listener.js")], {
  stdio: "inherit",
  env: process.env,
});

server.on("error", (err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});

listener.on("error", (err) => {
  console.error("❌ Listener failed to start:", err);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down services...");
  server.kill("SIGINT");
  listener.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down services...");
  server.kill("SIGTERM");
  listener.kill("SIGTERM");
  process.exit(0);
});

