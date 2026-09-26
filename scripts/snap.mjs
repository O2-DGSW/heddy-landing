#!/usr/bin/env node
// dev 서버(pnpm dev)가 떠 있는 상태에서 실행한다.
// 각 [data-section]의 진행도 0/25/50/75/100% 지점을 스크린샷으로 남긴다.
// 사용법: pnpm snap [url] [--mobile] [--only=hero,archive]
// 환경변수 PW_CHROMIUM_PATH가 있으면 그 크롬 실행 파일을 쓴다.
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const args = process.argv.slice(2);
const isMobile = args.includes("--mobile");
const onlyArg = args.find((arg) => arg.startsWith("--only="));
const only = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;
const url = args.find((arg) => !arg.startsWith("--")) ?? "http://localhost:3000";

const viewport = isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const outDir = path.resolve(".snapshots", isMobile ? "mobile" : "desktop");
const PROGRESS_STEPS = [0, 0.25, 0.5, 0.75, 1];

const run = async () => {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  });
  const page = await browser.newPage({ viewport });
  await page.goto(url, { waitUntil: "networkidle" });

  const sections = await page.$$eval("[data-section]", (nodes) =>
    nodes.map((node) => ({
      key: node.getAttribute("data-section"),
      top: node.offsetTop,
      height: node.offsetHeight,
    })),
  );

  const targets = only ? sections.filter((section) => only.includes(section.key)) : sections;

  for (const section of targets) {
    const denom = Math.max(section.height - viewport.height, 1);
    for (const p of PROGRESS_STEPS) {
      const scrollY = section.top + p * denom;
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(200);
      const fileName = `${section.key}-${Math.round(p * 100)}.png`;
      const filePath = path.join(outDir, fileName);
      await page.screenshot({ path: filePath });
      console.log(`saved ${filePath}`);
    }
  }

  await browser.close();
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
