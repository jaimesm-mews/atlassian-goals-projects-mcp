/**
 * Parse Atlassian Document Format (ADF) to plain text.
 */

interface AdfNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: AdfNode[];
}

export function parseAdfToPlainText(adf: unknown): string {
  if (!adf || typeof adf !== "object") {
    if (typeof adf === "string") {
      try {
        return parseAdfToPlainText(JSON.parse(adf));
      } catch {
        return adf;
      }
    }
    return "";
  }

  let text = "";

  function extractText(node: AdfNode): void {
    if (node.text) text += node.text + " ";
    if (node.attrs && typeof node.attrs.text === "string")
      text += node.attrs.text + " ";
    if (node.content) node.content.forEach(extractText);
  }

  try {
    extractText(adf as AdfNode);
  } catch {
    return "";
  }
  return text.replace(/\s+/g, " ").trim();
}

export function parseAdfField(raw: unknown): string {
  if (typeof raw === "string" && raw.trimStart().startsWith("{")) {
    try {
      return parseAdfToPlainText(JSON.parse(raw));
    } catch {
      return raw;
    }
  }
  if (typeof raw === "object" && raw !== null) {
    return parseAdfToPlainText(raw);
  }
  return typeof raw === "string" ? raw : "";
}
