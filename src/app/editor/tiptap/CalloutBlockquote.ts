import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CalloutBlockquoteView from './CalloutBlockquoteView';

// Custom blockquote used as a Notion-like callout.
// We store a stable icon id (not a native emoji) so visuals are consistent across platforms.
export const CalloutBlockquote = Node.create({
  name: 'blockquote',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      icon: {
        default: 'info',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-icon') ?? 'info',
        renderHTML: (attrs) => {
          const icon = String(attrs.icon ?? '').trim() || 'info';
          return { 'data-icon': icon };
        }
      }
    };
  },

  parseHTML() {
    return [{ tag: 'blockquote' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleBlockquote:
        () =>
        ({ commands }: any) =>
          commands.toggleWrap(this.name)
    } as any;
  },

  addInputRules() {
    // Markdown style: typing "> " at the start of a line turns it into a callout (blockquote).
    return [wrappingInputRule({ find: /^\s*>\s$/, type: this.type })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBlockquoteView);
  }
});
