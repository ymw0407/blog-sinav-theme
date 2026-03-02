import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { createExtensions } from '../../app/editor/tiptap/extensions';

export default function ProfileViewer({ doc }: { doc: any }) {
  const editor = useEditor({
    extensions: createExtensions(),
    content: doc ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: false,
    editorProps: {
      attributes: { class: 'tiptap tiptapRead' }
    }
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}

