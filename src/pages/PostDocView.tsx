import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { createExtensions } from '../app/editor/tiptap/extensions';

export default function PostDocView({ doc }: { doc: any }) {
  const editor = useEditor({
    extensions: createExtensions(),
    content: doc,
    editable: false,
    editorProps: { attributes: { class: 'tiptap tiptapRead' } }
  });

  React.useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(doc);
  }, [doc, editor]);

  if (!editor) return <div className="muted">Loading...</div>;
  return <EditorContent editor={editor} />;
}


