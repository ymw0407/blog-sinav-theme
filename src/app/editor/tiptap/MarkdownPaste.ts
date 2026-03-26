import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { marked } from 'marked';

/**
 * Detect whether plain text looks like markdown content.
 * We check for structural patterns (headings, lists, code blocks, etc.)
 * so that normal prose isn't accidentally converted.
 */
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

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste(view, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            // Rich paste (from browser / office app) – let TipTap handle natively
            const html = clipboardData.getData('text/html');
            if (html && html.trim()) return false;

            const text = clipboardData.getData('text/plain');
            if (!text) return false;

            // Don't convert if cursor is inside a code block
            const { $from } = view.state.selection;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === 'codeBlock') return false;
            }

            if (!looksLikeMarkdown(text)) return false;

            event.preventDefault();

            const converted = marked.parse(text, { async: false, gfm: true }) as string;
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
