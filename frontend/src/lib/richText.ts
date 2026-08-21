export type RichBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; alt: string; src: string }
  | { type: "video"; url: string }
  | { type: "html"; skipped: true };

const FENCE = /^```([a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)\n```$/;
const IMAGE_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const TABLE_ROW = /^\|.+\|$/;

function splitCells(line: string) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isDividerRow(line: string) {
  const cells = splitCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function looksLikeUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

export function parseRichBody(paragraphs: string[]): RichBlock[] {
  const blocks: RichBlock[] = [];
  for (const raw of paragraphs) {
    const text = raw.trim();
    if (!text) {
      continue;
    }

    const fence = text.match(FENCE);
    if (fence) {
      blocks.push({ type: "code", language: fence[1] || "text", code: fence[2] ?? "" });
      continue;
    }

    if (text.startsWith("## ")) {
      blocks.push({ type: "heading", text: text.slice(3).trim() });
      continue;
    }
    if (text.startsWith("# ")) {
      blocks.push({ type: "heading", text: text.slice(2).trim() });
      continue;
    }
    if (text.startsWith("> ")) {
      blocks.push({ type: "callout", text: text.replace(/^>\s?/gm, "").trim() });
      continue;
    }

    const image = text.match(IMAGE_ONLY);
    if (image) {
      blocks.push({ type: "image", alt: image[1] ?? "", src: image[2] ?? "" });
      continue;
    }

    if (looksLikeUrl(text) && /youtube|youtu\.be|vimeo/i.test(text)) {
      blocks.push({ type: "video", url: text });
      continue;
    }
    if (/^video:\s+\S+/i.test(text)) {
      blocks.push({ type: "video", url: text.replace(/^video:\s+/i, "").trim() });
      continue;
    }

    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length >= 2 && lines.every((line) => TABLE_ROW.test(line))) {
      const bodyLines = isDividerRow(lines[1] ?? "") ? [lines[0]!, ...lines.slice(2)] : lines;
      const headers = splitCells(bodyLines[0] ?? "");
      const rows = bodyLines.slice(1).map(splitCells);
      if (headers.length > 0) {
        blocks.push({ type: "table", headers, rows });
        continue;
      }
    }

    if (lines.length > 0 && lines.every((line) => line.startsWith("- ") || line.startsWith("* "))) {
      blocks.push({ type: "list", items: lines.map((line) => line.slice(2).trim()) });
      continue;
    }
    if (lines.length > 0 && lines.every((line) => /^\d+\.\s/.test(line))) {
      blocks.push({ type: "ordered-list", items: lines.map((line) => line.replace(/^\d+\.\s/, "").trim()) });
      continue;
    }

    blocks.push({ type: "paragraph", text });
  }
  return blocks;
}
