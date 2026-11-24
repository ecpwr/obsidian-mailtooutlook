/* KENTRO Mailvorlage – Obsidian-Plugin
 * Code-Block ```mail … ``` wird als Markdown angezeigt und bekommt einen Kopier-Knopf.
 * Kopiert wird E-Mail-HTML mit festen Inline-Stilen, unabhängig vom Obsidian-Theme:
 * Arial 12 pt, Schrift #000000, Absätze ohne Abstand, zwischen zwei Blöcken genau eine Leerzeile.
 * So sieht die Mail in Outlook Classic und Outlook im Web gleich aus.
 */
const obsidian = require("obsidian");

const FONT = "font-family:Arial,sans-serif;font-size:12pt;color:#000000";
const P_STYLE = "margin:0cm;" + FONT;
const LIST_STYLE = "margin-top:0cm;margin-bottom:0cm;" + FONT;
const LI_STYLE = "margin:0cm;" + FONT;
const EMPTY_P = '<p style="' + P_STYLE + '">&nbsp;</p>';
const SKIP_CLASSES = ["list-collapse-indicator", "collapse-indicator", "list-bullet", "copy-code-button", "kentro-mail-copy", "frontmatter"];
const BLOCK_TAGS = ["P", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "TABLE", "HR", "PRE"];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");
}
function skip(el) {
  if (el.tagName === "BUTTON" || el.tagName === "SVG" || el.tagName === "svg") return true;
  return SKIP_CLASSES.some((c) => el.classList && el.classList.contains(c));
}

/* Inline-Inhalt und Listen in E-Mail-HTML umsetzen */
function conv(node) {
  if (node.nodeType === 3) return esc(node.nodeValue);
  if (node.nodeType !== 1 || skip(node)) return "";
  const kids = () => Array.from(node.childNodes).map(conv).join("");
  switch (node.tagName) {
    case "P": return '<p style="' + P_STYLE + '">' + kids() + "</p>";
    case "UL": return '<ul style="' + LIST_STYLE + '">' + kids() + "</ul>";
    case "OL": return '<ol style="' + LIST_STYLE + '">' + kids() + "</ol>";
    case "LI": {
      // In lockeren Listen steckt der Text in <p>; dort ohne Absatz, damit kein Abstand entsteht
      const inner = Array.from(node.childNodes).map((c) =>
        c.nodeType === 1 && c.tagName === "P" ? Array.from(c.childNodes).map(conv).join("") : conv(c)).join("");
      return '<li style="' + LI_STYLE + '">' + inner.trim() + "</li>";
    }
    case "STRONG": case "B": return "<strong>" + kids() + "</strong>";
    case "EM": case "I": return "<em>" + kids() + "</em>";
    case "DEL": case "S": return "<s>" + kids() + "</s>";
    case "BR": return "<br>";
    case "A": {
      const href = node.getAttribute("href") || "";
      if (!/^(https?:|mailto:|tel:)/i.test(href)) return kids();
      return '<a href="' + esc(href) + '">' + kids() + "</a>";
    }
    case "H1": case "H2": case "H3": case "H4": case "H5": case "H6":
      return '<p style="' + P_STYLE + '"><strong>' + kids() + "</strong></p>";
    case "HR": return "";
    case "IMG": return "";
    default: return kids();
  }
}

/* Oberste Blöcke einsammeln, Obsidian-Hüllen (div) aufklappen */
function topBlocks(root) {
  const out = [];
  (function walk(el) {
    for (const c of Array.from(el.children)) {
      if (skip(c)) continue;
      if (BLOCK_TAGS.includes(c.tagName)) out.push(c);
      else if (c.tagName === "DIV" || c.tagName === "SECTION") walk(c);
    }
  })(root);
  return out;
}

/* Klartext-Fassung für Programme ohne HTML */
function toPlain(node, depth) {
  if (node.nodeType === 3) return node.nodeValue.replace(/\s*\n\s*/g, "");
  if (node.nodeType !== 1 || skip(node)) return "";
  const kids = (d) => Array.from(node.childNodes).map((c) => toPlain(c, d)).join("");
  switch (node.tagName) {
    case "BR": return "\n";
    case "UL": case "OL": return "\n" + Array.from(node.children).filter((li) => li.tagName === "LI").map((li) => toPlain(li, depth + 1)).join("\n");
    case "LI": return "   ".repeat(Math.max(depth - 1, 0)) + "• " + kids(depth).replace(/^\s+/, "").replace(/\n(?!\s*•)/g, "\n" + "   ".repeat(depth));
    case "A": {
      const href = node.getAttribute("href") || "";
      const t = kids(depth);
      return /^https?:/i.test(href) && t !== href ? t + ": " + href : t;
    }
    default: return kids(depth);
  }
}

function buildClipboard(bodyEl) {
  const blocks = topBlocks(bodyEl);
  const html = '<div style="' + FONT + '">' + blocks.map(conv).filter((s) => s).join(EMPTY_P) + "</div>";
  const text = blocks.map((b) => toPlain(b, 0).replace(/^\n+/, "")).join("\n\n");
  return { html, text };
}

async function writeClipboard(html, text) {
  try {
    const { clipboard } = require("electron");
    if (clipboard && clipboard.write) { clipboard.write({ html, text }); return; }
  } catch (e) { /* Mobil: kein Electron */ }
  await navigator.clipboard.write([new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([text], { type: "text/plain" }),
  })]);
}

class KentroMailvorlage extends obsidian.Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("mail", async (source, el, ctx) => {
      const box = el.createDiv({ cls: "kentro-mail" });
      const btn = box.createEl("button", { text: "Kopieren", cls: "kentro-mail-copy" });
      const body = box.createDiv({ cls: "kentro-mail-body" });
      const child = new obsidian.MarkdownRenderChild(body);
      ctx.addChild(child);
      if (obsidian.MarkdownRenderer.render) {
        await obsidian.MarkdownRenderer.render(this.app, source, body, ctx.sourcePath, child);
      } else {
        await obsidian.MarkdownRenderer.renderMarkdown(source, body, ctx.sourcePath, child);
      }
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        try {
          const { html, text } = buildClipboard(body);
          await writeClipboard(html, text);
          btn.setText("Kopiert");
          new obsidian.Notice("Mailtext kopiert. In Outlook mit Strg+V einfügen.");
        } catch (e) {
          console.error("KENTRO Mailvorlage", e);
          btn.setText("Fehler");
          new obsidian.Notice("Kopieren fehlgeschlagen: " + e.message);
        }
        window.setTimeout(() => btn.setText("Kopieren"), 2000);
      });
    });
  }
}

module.exports = KentroMailvorlage;
