import axios from "axios";
import AdmZip from "adm-zip";
import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";

const ZIP_URL = "https://github.com/horlapookie/Eclipse-MD/archive/refs/heads/main.zip";
const BASE_DIR = path.resolve("./bots/eclipse");
const ZIP_PATH = path.join(BASE_DIR, "eclipse.zip");

async function downloadZip() {
  console.log("[INFO] Downloading Eclipse-MD ZIP...");

  await fs.ensureDir(BASE_DIR);

  const response = await axios({
    url: ZIP_URL,
    method: "GET",
    responseType: "arraybuffer",
  });

  await fs.writeFile(ZIP_PATH, response.data);
  console.log("[SUCCESS] ZIP downloaded");
}

async function extractZip() {
  console.log("[INFO] Extracting ZIP with adm-zip...");

  const zip = new AdmZip(ZIP_PATH);
  zip.extractAllTo(BASE_DIR, true);

  console.log("[SUCCESS] ZIP extracted");
}

function startBot() {
  const extractedFolder = fs
    .readdirSync(BASE_DIR)
    .find(f => f.startsWith("Eclipse-MD"));

  if (!extractedFolder) {
    throw new Error("Extracted project folder not found");
  }

  const BOT_DIR = path.join(BASE_DIR, extractedFolder);
  const INDEX_PATH = path.join(BOT_DIR, "index.js");
  const CONFIG_PATH = path.join(BOT_DIR, "config.js");

  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error("index.js not found in extracted ZIP");
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error("config.js not found in extracted ZIP");
  }

  console.log("[INFO] Starting Eclipse MD bot...");

  const bot = spawn("node", ["index.js"], {
    cwd: BOT_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production"
    }
  });

  bot.on("close", (code) => {
    console.log(`[BOT EXIT] Process exited with code ${code}`);
  });
}

async function main() {
  try {
    await downloadZip();
    await extractZip();
    startBot();
  } catch (err) {
    console.error("[ERROR]", err.message);
  }
}

main();
