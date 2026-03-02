import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ResizableImage from './ResizableImage';
import { CodeBlockHighlight } from './CodeBlockHighlight';
import { FancyCodeBlock } from './FancyCodeBlock';
import { Underline } from './Underline';
import { TextColor } from './TextColor';
import { TextHighlight } from './TextHighlight';
import { CalloutBlockquote } from './CalloutBlockquote';

export const BlockImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: 100 },
      align: { default: 'center' },
      x: { default: null }
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage);
  }
});

export function createExtensions() {
  return [
    StarterKit.configure({
      // We'll provide our own codeBlock nodeView (title, copy, line numbers).
      codeBlock: false,
      // Replace the default blockquote with our interactive callout nodeView.
      blockquote: false
    }),
    CalloutBlockquote,
    FancyCodeBlock.configure({ HTMLAttributes: { class: 'codeblock' } }),
    CodeBlockHighlight,
    Underline,
    TextColor,
    TextHighlight,
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { rel: 'noreferrer', target: '_blank' }
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    BlockImage.configure({ inline: false, allowBase64: true })
  ];
}
