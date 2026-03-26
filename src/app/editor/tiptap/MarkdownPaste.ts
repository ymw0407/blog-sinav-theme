import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { marked } from 'marked';

const MD_PATTERNS: RegExp[] = [
  /^#{1,6}\s+\S/m,           // Headings
  /^```/m,                    // Fenced code blocks
  /^\s*[-*+]\s+\S/m,         // Unordered lists
  /^\s*\d+\.\s+\S/m,         // Ordered lists
  /\[.+?\]\(.+?\)/,          // Links  [text](url)
  /^\s*>\s+\S/m,             // Blockquotes
  /\*\*\S[\s\S]*?\S\*\*/,    // Bold **text**
  /!\[.*?\]\(.+?\)/,         // Images ![alt](url)
];

function looksLikeMarkdown(text: string): boolean {
  let matches = 0;
  for (const p of MD_PATTERNS) {
    if (p.test(text)) matches++;
  }
  return matches >= 1;
}

/**
 * Check whether clipboard HTML is "rich" (from a web page or office app)
 * vs just styled plain text (from a code editor like VS Code).
 * Rich HTML has semantic block elements; code-editor HTML is just styled spans/divs.
 */
function isRichHtml(html: string): boolean {
  const div = document.createElement('div');
  div.innerHTML = html;
  return !!div.querySelector('h1,h2,h3,h4,h5,h6,ul,ol,table,pre,blockquote,hr');
}

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',
  priority: 1000,

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste(view, event, _slice) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const text = clipboardData.getData('text/plain');
            if (!text || !looksLikeMarkdown(text)) return false;

            // If the clipboard has rich HTML with semantic elements
            // (from a web page, not a code editor), let TipTap use that instead
            const html = clipboardData.getData('text/html');
            if (html && isRichHtml(html)) return false;

            // Don't convert if cursor is inside a code block
            const { $from } = view.state.selection;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === 'codeBlock') return false;
            }

            event.preventDefault();

            const converted = marked.parse(text, { gfm: true }) as string;
            editor.commands.insertContent(converted, {
              parseOptions: { preserveWhitespace: false }
            });

            return true;
          }
        }
      })
    ];
  }
});
