import { CodeBlock } from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';
import FancyCodeBlockView from './FancyCodeBlockView';

export const FancyCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      title: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-title') ?? '',
        renderHTML: (attrs: Record<string, unknown>) => {
          const title = String(attrs.title ?? '').trim();
          return title ? { 'data-title': title } : {};
        }
      },
      language: {
        default: 'plain',
        parseHTML: (element: HTMLElement) => {
          const lang = element.getAttribute('data-language');
          if (lang) return lang;
          const code = element.querySelector?.('code');
          const cls = (code?.getAttribute?.('class') ?? '').toString();
          const m = cls.match(/language-([a-z0-9_-]+)/i);
          return m?.[1] ?? 'plain';
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          const lang = String(attrs.language ?? 'plain');
          if (!lang || lang === 'plain') return {};
          return { 'data-language': lang };
        }
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FancyCodeBlockView);
  }
});

