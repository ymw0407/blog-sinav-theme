import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textHighlight: {
      // Accept either a named tone (preferred) or a CSS color (back-compat).
      setTextHighlight: (toneOrColor: string) => ReturnType;
      unsetTextHighlight: () => ReturnType;
    };
  }
}

const TONES = new Set(['sand', 'mint', 'sky', 'rose']);

export const TextHighlight = Mark.create({
  name: 'textHighlight',

  addAttributes() {
    return {
      tone: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-hl-tone') ?? null,
        renderHTML: (attrs) => {
          const tone = attrs.tone as string | null;
          if (!tone) return {};
          // Theme-aware via CSS custom properties (light/dark overrides live in CSS).
          return { 'data-hl-tone': tone, style: `background-color: var(--hl-${tone})` };
        }
      },
      color: {
        default: null,
        parseHTML: (el) => {
          const bg = (el as HTMLElement).style?.backgroundColor;
          return bg || null;
        },
        renderHTML: (attrs) => {
          const tone = attrs.tone as string | null;
          // If tone is set, tone renderHTML already set the style.
          if (tone) return {};
          const color = attrs.color as string | null;
          if (!color) return {};
          return { style: `background-color: ${color}` };
        }
      }
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-hl-tone]' }, { style: 'background-color' }, { tag: 'mark' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Use span so we can style it like Notion's marker (rounded + cloned across lines).
    return ['span', mergeAttributes(HTMLAttributes, { 'data-highlight': 'true' }), 0];
  },

  addCommands() {
    return {
      setTextHighlight:
        (toneOrColor: string) =>
        ({ commands }) =>
          TONES.has(String(toneOrColor))
            ? commands.setMark(this.name, { tone: String(toneOrColor), color: null })
            : commands.setMark(this.name, { tone: null, color: String(toneOrColor) }),
      unsetTextHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name)
    };
  }
});
