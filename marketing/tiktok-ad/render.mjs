// Renders index.html frame by frame with headless Chromium and pipes PNGs into ffmpeg.
// Usage: node render.mjs <out.mp4> [--fps 60] [--scale 2] [--from 0] [--to DURATION] [--stills t1,t2,...]
import { createRequire } from "module";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const out = args[0];
const fps = +opt("fps", 60), scale = +opt("scale", 2);
const stills = opt("stills", null);

const browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--disable-lcd-text", "--font-render-hinting=none"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
await page.goto("file://" + path.resolve("index.html") + "?render");
await page.evaluate(() => window.__ready);
const duration = +opt("to", await page.evaluate(() => window.DURATION));
const from = +opt("from", 0);

if (stills) {
  fs.mkdirSync(out, { recursive: true });
  for (const t of stills.split(",").map(Number)) {
    await page.evaluate((t) => window.renderFrame(t), t);
    await page.screenshot({ path: `${out}/t${t.toFixed(2)}.png` });
  }
  await browser.close(); process.exit(0);
}

const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
  "-c:v", "libx264", "-preset", opt("preset", "slow"), "-crf", opt("crf", "12"), "-pix_fmt", "yuv420p",
  "-profile:v", "high", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });

const cdp = await page.context().newCDPSession(page);
const n = Math.round((duration - from) * fps);
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  const t = from + i / fps;
  await page.evaluate((t) => window.renderFrame(t), t);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1080, height: 1920, scale } });
  const buf = Buffer.from(data, "base64");
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 60 === 0) process.stderr.write(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
