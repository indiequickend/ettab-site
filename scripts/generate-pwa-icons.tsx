// Regenerate PWA icon assets from public/logo.jpeg.
// Re-run manually (`npm run generate-icons`) whenever logo.jpeg changes.
// This is not part of the build - outputs are committed as static files.

import fs from "fs";
import path from "path";
import React from "react";
import { ImageResponse } from "next/og";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public/logo.jpeg");
const OUT_DIR = path.join(ROOT, "public/icons");

interface IconSpec {
  file: string;
  size: number;
  logoScale: number;
}

const ICON_SPECS: IconSpec[] = [
  { file: "icon-192.png", size: 192, logoScale: 1 },
  { file: "icon-512.png", size: 512, logoScale: 1 },
  { file: "icon-512-maskable.png", size: 512, logoScale: 0.78 },
  { file: "apple-touch-icon.png", size: 180, logoScale: 1 },
  { file: "favicon-32.png", size: 32, logoScale: 1 },
];

async function main() {
  const logoBuffer = fs.readFileSync(LOGO_PATH);
  const dataUri = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const spec of ICON_SPECS) {
    const logoSize = Math.round(spec.size * spec.logoScale);
    const response = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUri} width={logoSize} height={logoSize} alt="" />
        </div>
      ),
      { width: spec.size, height: spec.size }
    );

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(path.join(OUT_DIR, spec.file), buffer);
    console.log(`Generated ${spec.file} (${spec.size}x${spec.size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
