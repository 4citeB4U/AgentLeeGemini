#!/usr/bin/env node
/**
 * Enforce authorship across the repo.
 * Auto-fix: MD/MDX YAML front matter, HTML <meta author>, package.json.
 * Validate-only: pyproject.toml and other text files (fails if violations).
 *
 * TS build notes:
 *  - Requires "module": "esnext" (or "nodenext") in tsconfig for ESM + top-level await/async IIFE.
 *  - Run with: npx ts-node enforce-authors.ts
 */

import fs from "node:fs";
import { promises as fsp, Dirent } from "node:fs";
import path from "node:path";

const ROOT: string = process.cwd();
const ALLOWED = ["rapidwebdevelop.com", "LEEWAY", "LeonardLee"] as const;
const META: string = ALLOWED.join(", ");

const isText = (p: string): boolean =>
  /\.(md|mdx|markdown|html?|json|toml|txt|yml|yaml)$/i.test(p);

async function* walk(dir: string): AsyncGenerator<string> {
  const entries: Dirent[] = await fsp.readdir(dir, { withFileTypes: true });
  for (const d of entries) {
    const p = path.join(dir, d.name);
    if (
      d.name === "node_modules" ||
      d.name === ".git" ||
      d.name === "dist" ||
      d.name === "build"
    ) {
      continue;
    }
    if (d.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

function normalizeFrontMatterAuthors(text: string): string | null {
  // Only if YAML front matter exists (--- ... --- at top)
  const m = text.match(/^---\s*[\s\S]*?---/);
  if (!m) return null;

  let block = m[0];

  // If there's an authors/author key, normalize it to authors: [ ... ]
  if (/^---[\s\S]*?authors\s*:/im.test(block)) {
    // authors: [ ... ]
    block = block.replace(
      /authors\s*:\s*\[[^\]]*\]/im,
      `authors: [${ALLOWED.join(", ")}]`
    );
    // author: ...
    block = block.replace(
      /author\s*:\s*.*$/im,
      `authors: [${ALLOWED.join(", ")}]`
    );
  } else if (/^---/.test(block)) {
    // Insert authors under the first line if no authors/author key
    block = block.replace(
      /^---\s*\n/,
      `---\nauthors: [${ALLOWED.join(", ")}]\n`
    );
  }

  return text.replace(/^---[\s\S]*?---/, block);
}

function normalizeHtmlAuthor(text: string): string | null {
  if (!/</.test(text)) return null;

  // Replace existing meta author
  if (/<meta\s+name=["']author["']\s+content=/i.test(text)) {
    return text.replace(
      /<meta\s+name=["']author["']\s+content=["'][^"']*["']\s*\/?>/gi,
      `<meta name="author" content="${META}" />`
    );
  }

  // Otherwise, insert into <head> if present
  if (/<head[^>]*>/i.test(text)) {
    return text.replace(
      /<head[^>]*>/i,
      (h) => `${h}\n    <meta name="author" content="${META}" />`
    );
  }

  return null;
}

// Minimal shape for package.json we care about
interface PkgJson {
  author?: string;
  contributors?: string[];
  [k: string]: unknown;
}

async function normalizePackageJson(p: string): Promise<boolean> {
  const raw = await fsp.readFile(p, "utf8");
  let obj: PkgJson;
  try {
    obj = JSON.parse(raw) as PkgJson;
  } catch {
    return false;
  }

  let changed = false;
  const desiredAuthor = META;
  if (obj.author !== desiredAuthor) {
    obj.author = desiredAuthor;
    changed = true;
  }

  const wantContrib = [...ALLOWED];
  const currentContrib = Array.isArray(obj.contributors) ? obj.contributors : [];

  // Compare strictly to avoid needless rewrites
  if (JSON.stringify(currentContrib) !== JSON.stringify(wantContrib)) {
    obj.contributors = wantContrib;
    changed = true;
  }

  if (changed) {
    await fsp.writeFile(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
  }
  return changed;
}

function hasForbiddenAuthors(text: string): string[] {
  const allow = new Set(ALLOWED.map((a) => a.toLowerCase()));
  const hit: string[] = [];

  const patterns: RegExp[] = [
    /authors?\s*:\s*\[([^\]]*)\]/gi, // YAML array
    /author\s*:\s*(.+)$/gim, // YAML single
    /"author"\s*:\s*"([^"]*)"/gi, // JSON
    /"contributors"\s*:\s*\[([^\]]*)\]/gi, // JSON array
    /<meta\s+name=["']author["']\s+content=["']([^"']*)["']/gi, // HTML meta
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const blob = m[1] ?? m[0];
      const names = blob
        .split(/[,\n|]+/)
        .map((s) => s.replace(/["'{}[\]\s]/g, "").trim())
        .filter(Boolean);
      for (const n of names) {
        if (n && !allow.has(n.toLowerCase())) hit.push(n);
      }
    }
  }
  return [...new Set(hit)];
}

(async () => {
  const violations: { file: string; bad: string[] }[] = [];

  for await (const p of walk(ROOT)) {
    if (!isText(p)) continue;
    const ext = path.extname(p).toLowerCase();

    // package.json: structured fix first, then validate
    if (path.basename(p) === "package.json") {
      await normalizePackageJson(p);
      const t2 = await fsp.readFile(p, "utf8");
      const bad = hasForbiddenAuthors(t2);
      if (bad.length) violations.push({ file: p, bad });
      continue;
    }

    const text = await fsp.readFile(p, "utf8");
    let newText = text;
    let updated = false;

    // MD/MDX/Markdown front matter
    if (/\.(md|mdx|markdown)$/i.test(ext)) {
      const t2 = normalizeFrontMatterAuthors(newText);
      if (t2) {
        newText = t2;
        updated = true;
      }
    }

    // HTML meta author
    if (/\.(html?)$/i.test(ext)) {
      const t3 = normalizeHtmlAuthor(newText);
      if (t3) {
        newText = t3;
        updated = true;
      }
    }

    if (updated && newText !== text) {
      await fsp.writeFile(p, newText, "utf8");
    }

    // Validate for any forbidden authors (covers TOML, YAML, misc)
    const bad = hasForbiddenAuthors(newText);
    if (bad.length) violations.push({ file: p, bad });
  }

  if (violations.length) {
    console.error("Authorship violations found:");
    for (const v of violations) {
      console.error(`- ${v.file}: ${v.bad.join(", ")}`);
    }
    process.exit(1);
  } else {
    console.log("Authorship OK: all files comply with allowlist.");
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
