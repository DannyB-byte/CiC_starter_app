import chokidar from "chokidar";
import waitOn from "wait-on";
import { spawn } from "node:child_process";

let running = false;
let pending = false;
let timer;

function execute(command) {
  return new Promise(resolve => {
    const child = spawn(command, {
      shell: true,
      stdio: "inherit"
    });

    child.on("error", () => resolve(1));
    child.on("close", code => resolve(code ?? 1));
  });
}

async function runTests() {
  if (running) {
    pending = true;
    return;
  }

  running = true;

  try {
    do {
      pending = false;

      console.log("\n=== CiC AUTOMATED QA ===");
      console.log(new Date().toLocaleString());

      const started = Date.now();

      const unit = await execute("npm run test:unit");
      const browser = await execute("npm run test:mobile");

      const elapsed = ((Date.now() - started) / 1000).toFixed(1);

      if (unit === 0 && browser === 0) {
        console.log(`[PASS] QA completed in ${elapsed}s`);
      } else {
        console.error(`[FAIL] QA completed in ${elapsed}s`);
        console.error("Review test-results and terminal output.");
      }

      console.log("[QA] Watching source files...");

    } while (pending);
  } finally {
    running = false;
  }
}

console.log("[QA] Waiting for development server...");

await waitOn({
  resources: ["http://127.0.0.1:5173"],
  timeout: 60000
});

const watcher = chokidar.watch(
  ["src", "public", "tests", "index.html"],
  {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  }
);

watcher.on("all", (event, path) => {
  console.log(`[CHANGE] ${event}: ${path}`);

  clearTimeout(timer);

  timer = setTimeout(() => {
    runTests().catch(console.error);
  }, 2500);
});

watcher.on("error", console.error);

await new Promise(resolve => watcher.once("ready", resolve));

await runTests();