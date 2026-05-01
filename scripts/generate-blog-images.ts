import { createHash } from "crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// ── Config from env ──────────────────────────────────────────────────

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_REGION = process.env.S3_REGION ?? "nyc3";

if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
  console.log(
    "S3 env vars not configured (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY)."
  );
  console.log("Skipping image generation. Set these env vars to enable it.");
  process.exit(0);
}

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: false,
});

// ── Types ────────────────────────────────────────────────────────────

interface ImageDirective {
  prompt: string;
  alt: string;
  style: string;
  fullMatch: string;
  startIndex: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

function parseImageDirectives(content: string): ImageDirective[] {
  const directives: ImageDirective[] = [];
  const regex = /:::ai-image\n([\s\S]*?):::/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    const props: Record<string, string> = {};

    for (const line of block.split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (key && value) props[key] = value;
    }

    if (props.prompt) {
      directives.push({
        prompt: props.prompt,
        alt: props.alt ?? "Blog illustration",
        style: props.style ?? "illustration",
        fullMatch: match[0],
        startIndex: match.index,
      });
    }
  }

  return directives;
}

async function s3ObjectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToS3(key: string, body: Buffer): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/png",
      ACL: "public-read",
    })
  );

  // Construct the public URL
  const endpoint = S3_ENDPOINT!.replace("https://", "");
  return `https://${S3_BUCKET}.${endpoint}/${key}`;
}

async function generateImage(
  prompt: string,
  style: string
): Promise<Buffer | null> {
  const fullPrompt = `${prompt}. Style: ${style}`;

  try {
    console.log(`    Generating image via starflask...`);
    const result = execSync(
      `npx starflask jobs create image --payload '${JSON.stringify({ prompt: fullPrompt })}' --wait`,
      { encoding: "utf-8", timeout: 120_000 }
    );

    // Parse the output URL from starflask
    const urlMatch = result.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp)/i);
    if (!urlMatch) {
      console.log(`    Warning: Could not parse image URL from starflask output`);
      return null;
    }

    // Download the generated image
    const response = await fetch(urlMatch[0]);
    if (!response.ok) {
      console.log(`    Warning: Failed to download generated image`);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (err) {
    console.log(
      `    Warning: Image generation failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const seedDir = join(import.meta.dirname ?? ".", "..", "seed");

  if (!existsSync(seedDir)) {
    console.error(`Seed directory not found: ${seedDir}`);
    process.exit(1);
  }

  const mdFiles = readdirSync(seedDir).filter((f) => f.endsWith(".md"));
  console.log(`Found ${mdFiles.length} markdown files in ${seedDir}\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let firstImageUrls: Record<string, string> = {};

  for (const file of mdFiles) {
    const filePath = join(seedDir, file);
    let content = readFileSync(filePath, "utf-8");
    const directives = parseImageDirectives(content);

    if (directives.length === 0) {
      console.log(`${file}: no :::ai-image::: directives found`);
      continue;
    }

    console.log(`${file}: ${directives.length} image directive(s)`);
    let modified = false;
    let isFirst = true;

    for (const directive of directives) {
      const hash = hashPrompt(directive.prompt);
      const s3Key = `blog-images/${hash}.png`;

      console.log(`  [${hash}] "${directive.prompt.slice(0, 60)}..."`);

      // Check if already on S3
      const exists = await s3ObjectExists(s3Key);
      let imageUrl: string;

      if (exists) {
        const endpoint = S3_ENDPOINT!.replace("https://", "");
        imageUrl = `https://${S3_BUCKET}.${endpoint}/${s3Key}`;
        console.log(`    Already exists on S3, skipping generation`);
        skipped++;
      } else {
        const imageBuffer = await generateImage(
          directive.prompt,
          directive.style
        );

        if (!imageBuffer) {
          console.log(`    Skipping (generation failed)`);
          failed++;
          continue;
        }

        imageUrl = await uploadToS3(s3Key, imageBuffer);
        console.log(`    Uploaded to ${imageUrl}`);
        generated++;
      }

      // Track first image per file for cover_image_url
      if (isFirst) {
        firstImageUrls[file] = imageUrl;
        isFirst = false;
      }

      // Replace the directive with a markdown image
      const markdownImage = `![${directive.alt}](${imageUrl})`;
      content = content.replace(directive.fullMatch, markdownImage);
      modified = true;
    }

    if (modified) {
      writeFileSync(filePath, content, "utf-8");
      console.log(`  Updated ${file}\n`);
    }
  }

  // Update cover_image_url in frontmatter for files that got images
  for (const [file, url] of Object.entries(firstImageUrls)) {
    const filePath = join(seedDir, file);
    let content = readFileSync(filePath, "utf-8");

    // Replace empty cover_image_url with the first generated image URL
    content = content.replace(/^cover_image_url:\s*$/m, `cover_image_url: ${url}`);
    writeFileSync(filePath, content, "utf-8");
    console.log(`Set cover_image_url for ${file}`);
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
