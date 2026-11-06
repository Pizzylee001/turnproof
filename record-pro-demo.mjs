import { chromium } from "@playwright/test";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const videoDir = "/home/antigravity/turnproof/docs/demo/raw";
fs.rmSync(videoDir, { recursive: true, force: true });
fs.mkdirSync(videoDir, { recursive: true });

async function initVirtualCursor(page) {
  await page.evaluate(() => {
    let cursor = document.getElementById("demo-virtual-cursor");
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.id = "demo-virtual-cursor";
      cursor.style.position = "fixed";
      cursor.style.top = "0px";
      cursor.style.left = "0px";
      cursor.style.width = "24px";
      cursor.style.height = "24px";
      cursor.style.zIndex = "9999999";
      cursor.style.pointerEvents = "none";
      cursor.style.transform = "translate(-2px, -2px)";
      cursor.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.85));">
          <path d="M4 2L18 12L11 13L8 20L4 2Z" fill="#F08C4B" stroke="#070A12" stroke-width="1.75" stroke-linejoin="round"/>
        </svg>
        <div id="demo-cursor-ripple" style="position:absolute; top:2px; left:2px; width:0px; height:0px; border-radius:50%; background:rgba(240,140,75,0.65); pointer-events:none; transition: all 0.35s ease-out; opacity:0;"></div>
      `;
      document.body.appendChild(cursor);
    }

    window.__cursorX = 140;
    window.__cursorY = 80;

    window.__moveCursorTo = (x, y, duration = 600) => {
      return new Promise(resolve => {
        const startX = window.__cursorX;
        const startY = window.__cursorY;
        const diffX = x - startX;
        const diffY = y - startY;
        const startTime = performance.now();

        function step(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
          window.__cursorX = startX + diffX * ease;
          window.__cursorY = startY + diffY * ease;
          cursor.style.left = `${window.__cursorX}px`;
          cursor.style.top = `${window.__cursorY}px`;

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(step);
      });
    };

    window.__clickCursor = () => {
      const ripple = document.getElementById("demo-cursor-ripple");
      if (ripple) {
        ripple.style.width = "40px";
        ripple.style.height = "40px";
        ripple.style.top = "-18px";
        ripple.style.left = "-18px";
        ripple.style.opacity = "1";
        setTimeout(() => {
          ripple.style.opacity = "0";
          setTimeout(() => {
            ripple.style.width = "0px";
            ripple.style.height = "0px";
            ripple.style.top = "2px";
            ripple.style.left = "2px";
          }, 350);
        }, 180);
      }
    };
  });
}

async function moveAndClick(page, selector, moveMs = 600) {
  try {
    const loc = page.locator(selector).first();
    const count = await loc.count();
    if (count === 0) {
      console.log(`[Selector not found, skipping]: ${selector}`);
      return;
    }
    await loc.scrollIntoViewIfNeeded({ timeout: 4000 });
    const box = await loc.boundingBox();
    if (box) {
      const targetX = Math.round(box.x + box.width / 2);
      const targetY = Math.round(box.y + box.height / 2);
      await page.evaluate(({ x, y, duration }) => window.__moveCursorTo(x, y, duration), {
        x: targetX,
        y: targetY,
        duration: moveMs,
      });
      await page.waitForTimeout(100);
      await page.evaluate(() => window.__clickCursor());
    }
    await loc.click({ force: true, timeout: 3000 });
    await page.waitForTimeout(250);
  } catch (err) {
    console.warn(`Click warning for ${selector}:`, err.message);
  }
}

async function smoothScroll(page, targetY, durationMs = 900) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();
    return new Promise(resolve => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        window.scrollTo(0, startY + diff * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
  await page.waitForTimeout(250);
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} failed to respond in ${timeoutMs}ms`);
}

async function run() {
  console.log("Starting Next.js server on port 3000...");
  const serverProcess = spawn("npm", ["run", "start", "--", "-p", "3000"], {
    cwd: "/home/antigravity/turnproof",
    stdio: "ignore",
  });

  serverProcess.on("error", err => console.error("Server error:", err));

  try {
    await waitForServer("http://localhost:3000");
    console.log("Server ready on http://localhost:3000");

    const browser = await chromium.launch({
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: videoDir,
        size: { width: 1440, height: 900 },
      },
    });

    const page = await context.newPage();
    const runStart = Date.now();

    console.log("=== Scene 1: Stage (/) ===");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await initVirtualCursor(page);

    // 0s to 13.5s: Hero section while n1 narration plays
    await page.waitForTimeout(13500);

    // 13.8s: Scroll to audition console
    await smoothScroll(page, 460, 800);
    await page.waitForTimeout(400);

    // 14.5s: Click "Hear Up To Cut" (UI voice plays 14.5s - 19.1s)
    await moveAndClick(page, "button:has-text('Hear Up To Cut')", 500);
    await page.waitForTimeout(4600);

    // 19.5s to 28.5s: Scrub tokens while n2 narration plays
    await moveAndClick(page, "button:has-text('Alliance')", 600);
    await page.waitForTimeout(1800);
    await moveAndClick(page, "button:has-text('Repair')", 600);
    await page.waitForTimeout(1800);
    await moveAndClick(page, "button:has-text('4-9-3-A')", 600);
    await page.waitForTimeout(2000);

    // 29.0s: Switch to Bug Proof scenario (UI defect plays 29.8s - 33.8s)
    await moveAndClick(page, "button:has-text('Uncompiled Bracket Tag')", 600);
    await page.waitForTimeout(4800);

    console.log("=== Scene 2: Studio (/studio) ===");
    // 34.5s: Navigate to Studio
    await smoothScroll(page, 0, 600);
    await moveAndClick(page, "nav a[href='/studio']", 500);
    await page.waitForURL("**/studio");
    await initVirtualCursor(page);
    await page.waitForTimeout(1000);

    // 36.0s to 46.8s: View Step 01 Pre-Flight Sanitizer while n3 narration plays
    await smoothScroll(page, 380, 800);
    await page.waitForTimeout(9500);

    // 47.0s: Scroll to Step 02 Barge-In Scissor & Entity Safety Guard (n4 plays 47.5s - 57.3s)
    await smoothScroll(page, 850, 800);
    await page.waitForTimeout(10000);

    console.log("=== Scene 3: Verify (/verify) ===");
    // 58.0s: Navigate to Verify
    await smoothScroll(page, 0, 600);
    await moveAndClick(page, "nav a[href='/verify']", 500);
    await page.waitForURL("**/verify");
    await initVirtualCursor(page);
    await page.waitForTimeout(1000);

    // 59.5s to 72.5s: Active verification record while n5 narration plays
    await smoothScroll(page, 420, 800);
    await page.waitForTimeout(12000);

    // 72.8s: Scroll down and click Bug Proof scenario in matrix (n6 plays 73.5s - 82.9s)
    await smoothScroll(page, 800, 700);
    await moveAndClick(page, "button:has-text('Uncompiled Bracket Tag')", 600);
    await page.waitForTimeout(9000);

    console.log("=== Scene 4: Ledger (/ledger) ===");
    // 83.5s: Navigate to Ledger
    await smoothScroll(page, 0, 600);
    await moveAndClick(page, "nav a[href='/ledger']", 500);
    await page.waitForURL("**/ledger");
    await initVirtualCursor(page);
    await page.waitForTimeout(1000);

    // 85.0s to 95.0s: Inspect bug cards and toggle Python tab while n7 narration plays
    await moveAndClick(page, "button:has-text('Python')", 600);
    await page.waitForTimeout(4500);
    await moveAndClick(page, "button:has-text('TypeScript')", 600);
    await page.waitForTimeout(4500);

    // 95.5s to 101.5s: Scroll to benchmark table & return to top while n8 outro plays
    await smoothScroll(page, 680, 800);
    await page.waitForTimeout(2500);
    await smoothScroll(page, 0, 800);
    await page.waitForTimeout(3000);

    await context.close();
    await browser.close();

    const totalSec = (Date.now() - runStart) / 1000;
    console.log(`Screen recording finished. Duration: ${totalSec.toFixed(1)}s`);

    // Audio composition with ffmpeg
    const rawFiles = fs.readdirSync(videoDir).filter(f => f.endsWith(".webm"));
    if (rawFiles.length === 0) throw new Error("No raw video recorded");
    const rawVideoPath = path.join(videoDir, rawFiles[0]);

    const finalMp4 = "/home/antigravity/turnproof/docs/demo/turnproof-demo-walkthrough.mp4";
    const finalWebm = "/home/antigravity/turnproof/docs/demo/turnproof-demo-walkthrough.webm";

    // Audio tracks:
    // 1: Background ambient music
    // 2-9: Narration clips (n1 to n8)
    // 10: UI voice clip 1 (tp-01 cut @ 14.5s)
    // 11: UI defect clip 2 (tp-02 pause leak @ 29.8s)
    const audioTracks = [
      { file: "/home/antigravity/turnproof/docs/demo/background-music.wav", startSec: 0, dur: 104, vol: "0.22" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n1-stage-intro.wav", startSec: 0.8, dur: 12.88, vol: "1.0" },
      { file: "/home/antigravity/turnproof/public/samples/tp-01-compiled.wav", startSec: 14.5, dur: 4.62, vol: "1.0" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n2-stage-scissor.wav", startSec: 19.5, dur: 9.28, vol: "1.0" },
      { file: "/home/antigravity/turnproof/public/samples/tp-02-raw-leak.wav", startSec: 29.8, dur: 4.0, vol: "1.0" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n3-studio-compiler.wav", startSec: 36.0, dur: 10.8, vol: "1.0" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n4-studio-withheld.wav", startSec: 47.5, dur: 9.76, vol: "1.0" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n5-verify-lab.wav", startSec: 59.5, dur: 12.96, vol: "1.0" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n6-verify-matrix.wav", startSec: 73.5, dur: 9.36, vol: "1.0" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n7-ledger-export.wav", startSec: 85.0, dur: 10.08, vol: "1.0" },
      { file: "/home/antigravity/turnproof/docs/demo/narration/n8-outro.wav", startSec: 96.0, dur: 5.04, vol: "1.0" },
    ];

    const ffmpegArgs = ["-y", "-i", rawVideoPath];
    let filterInputs = "";
    const filterStrings = [];

    audioTracks.forEach((tr, idx) => {
      ffmpegArgs.push("-i", tr.file);
      const inIdx = idx + 1;
      const delayMs = Math.round(tr.startSec * 1000);
      filterStrings.push(`[${inIdx}:a]atrim=0:${tr.dur},adelay=${delayMs}|${delayMs},volume=${tr.vol},aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${inIdx}]`);
      filterInputs += `[a${inIdx}]`;
    });

    const fullFilter = `[0:v]ass=docs/demo/subtitles.ass[vout];${filterStrings.join(";")};${filterInputs}amix=inputs=${audioTracks.length}:normalize=0[aout]`;

    console.log("Encoding final MP4 with burned-in subtitles, voiceover narration, and ambient music...");
    execFileSync("/usr/bin/ffmpeg", [
      ...ffmpegArgs,
      "-filter_complex", fullFilter,
      "-map", "[vout]",
      "-map", "[aout]",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "19",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-movflags", "+faststart",
      finalMp4
    ]);

    console.log("Encoding WebM format...");
    execFileSync("/usr/bin/ffmpeg", [
      "-y",
      "-i", finalMp4,
      "-c:v", "libvpx-vp9",
      "-crf", "28",
      "-b:v", "0",
      "-c:a", "libopus",
      finalWebm
    ]);

    console.log("Done! Master demo video generated successfully:");
    console.log(`- MP4: ${finalMp4} (${(fs.statSync(finalMp4).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`- WebM: ${finalWebm} (${(fs.statSync(finalWebm).size / (1024 * 1024)).toFixed(2)} MB)`);
  } finally {
    serverProcess.kill();
  }
}

run().catch(err => {
  console.error("Master demo error:", err);
  process.exit(1);
});
