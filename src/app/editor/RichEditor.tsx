import React from 'react';
import clsx from 'clsx';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import { createExtensions } from './tiptap/extensions';
import { isLocalMode } from '../mode';
import { saveLocalImage } from '../local/mediaStore';
import { vars } from '../../styles/tokens/theme.css';

export type DocJson = any;

type Props = {
  initialDoc?: DocJson;
  onChange?: (doc: DocJson) => void;
  onUploadImage?: (file: File) => Promise<string>;
};

function ToolbarButton(props: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={clsx('btn', props.active && 'primary')}
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.label}
      aria-label={props.label}
    >
      {props.children}
    </button>
  );
}

function ImageAlignControls({ editor }: { editor: Editor }) {
  const sel = editor.state.selection;
  const node = (sel as any).node;
  const isImage = node?.type?.name === 'image';
  if (!isImage) return null;
  const align = node.attrs?.align ?? 'center';
  return (
    <div className="editorToolbarRow editorToolbarSub">
      <span className="pill">Image</span>
      <ToolbarButton label="Align left" active={align === 'left'} onClick={() => editor.commands.updateAttributes('image', { align: 'left', x: null })}>
        L
      </ToolbarButton>
      <ToolbarButton label="Align center" active={align === 'center'} onClick={() => editor.commands.updateAttributes('image', { align: 'center', x: null })}>
        C
      </ToolbarButton>
      <ToolbarButton label="Align right" active={align === 'right'} onClick={() => editor.commands.updateAttributes('image', { align: 'right', x: null })}>
        R
      </ToolbarButton>
    </div>
  );
}

function extToLang(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'ts';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'js';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.go')) return 'go';
  if (lower.endsWith('.cpp') || lower.endsWith('.cxx') || lower.endsWith('.cc') || lower.endsWith('.hpp') || lower.endsWith('.hxx')) return 'cpp';
  if (lower.endsWith('.c') || lower.endsWith('.h')) return 'c';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  if (lower.endsWith('.sh') || lower.endsWith('.bash')) return 'bash';
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return 'md';
  return 'plain';
}

export default function RichEditor({ initialDoc, onChange, onUploadImage }: Props) {
  const local = isLocalMode();

  const uploadAndInsertImage = React.useCallback(
    async (file: File, editorInstance: any) => {
      try {
        let src: string | null = null;
        if (onUploadImage) {
          try {
            src = await onUploadImage(file);
          } catch (e) {
            if (!local) throw e;
          }
        }
        if (!src) src = await saveLocalImage(file);
        editorInstance
          ?.chain()
          .focus()
          .insertContent({ type: 'image', attrs: { src, alt: file.name, width: 100, align: 'center', x: null } })
          .run();
        editorInstance?.commands.createParagraphNear();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    },
    [local, onUploadImage]
  );

  const editor = useEditor({
    extensions: createExtensions(),
    content: initialDoc ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: { class: 'tiptap tiptapEdit' },
      handleDrop: (_view, event) => {
        const dt = event.dataTransfer;
        if (!dt?.files?.length) return false;
        const images = Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
        if (!images.length) return false;
        event.preventDefault();

        (async () => {
          for (const file of images) await uploadAndInsertImage(file, editor);
        })().catch(() => {});

        return true;
      }
    },
    onUpdate: ({ editor }) => onChange?.(editor.getJSON())
  });

  if (!editor) return <div className="muted">Loading editor...</div>;

  const textColors = [
    { label: 'Default', value: '' },
    { label: 'Accent', value: `color-mix(in srgb, ${vars.color.accent} 78%, ${vars.color.fg})` },
    { label: 'Sage', value: '#2f6f5b' },
    { label: 'Amber', value: '#9a5b12' },
    { label: 'Rose', value: '#9b2c4a' }
  ];

  const highlightColors = [
    { label: 'No highlight', tone: '' },
    { label: 'Sand', tone: 'sand' },
    { label: 'Mint', tone: 'mint' },
    { label: 'Sky', tone: 'sky' },
    { label: 'Rose', tone: 'rose' }
  ];

  return (
    <div className="card" style={{ padding: 12 }}>
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 120 }}
        shouldShow={({ editor }) => {
          if (!editor.isEditable) return false;
          const { selection, doc } = editor.state;
          if (selection.empty) return false;

          // Only show for real text selections. This hides the bubble when dragging non-text UI
          // inside NodeViews (ex: callout icon button) or when selecting images.
          if (!(selection instanceof TextSelection)) return false;

          const text = doc.textBetween(selection.from, selection.to, '\n', '\n');
          if (!text || !text.trim()) return false;

          // If the selection is only emoji/pictographs, the bubble looks awkward and rarely helps.
          // (Still keep the bubble for normal text, including mixed emoji+text.)
          try {
            const cleaned = text.replace(/\s/g, '');
            if (cleaned && [...cleaned].every((ch) => /\p{Extended_Pictographic}/u.test(ch))) return false;
          } catch {
            // ignore environments without unicode properties
          }

          return !editor.isActive('codeBlock');
        }}
      >
        <div className="editorBubble" role="toolbar" aria-label="Selection toolbar">
          {/** Keep the bubble menu compact: no Callout toggle here (Callout is created via "> "). */}
          <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            B
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            I
          </ToolbarButton>
          <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            U
          </ToolbarButton>

          <div className="editorBubbleSep" aria-hidden="true" />

          {textColors.map((c) => {
            const active = c.value ? editor.getAttributes('textColor')?.color === c.value : !editor.isActive('textColor');
            return (
            <button
              key={c.label}
              type="button"
              className="editorColorDot"
              aria-label={`Text color ${c.label}`}
              title={`Text: ${c.label}`}
              data-active={active ? 'true' : undefined}
              style={{
                background: c.value ? c.value : `color-mix(in srgb, ${vars.color.fg} 26%, transparent)`,
                borderColor: `color-mix(in srgb, ${vars.color.fg} 18%, transparent)`
              }}
              onClick={() => {
                if (!c.value) editor.chain().focus().unsetTextColor().run();
                else editor.chain().focus().setTextColor(c.value).run();
              }}
            />
            );
          })}

          <div className="editorBubbleSep" aria-hidden="true" />

          {highlightColors.map((c) => {
            const cur = editor.getAttributes('textHighlight') ?? {};
            const curTone = String((cur as any).tone ?? '');
            const active = c.tone ? curTone === c.tone : !editor.isActive('textHighlight');
            const swatch = c.tone ? `var(--hl-${c.tone})` : `color-mix(in srgb, ${vars.color.fg} 12%, transparent)`;
            return (
            <button
              key={c.label}
              type="button"
              className="editorColorDot"
              aria-label={`Highlight ${c.label}`}
              title={`Highlight: ${c.label}`}
              data-active={active ? 'true' : undefined}
              style={{
                background: swatch,
                borderColor: `color-mix(in srgb, ${vars.color.fg} 18%, transparent)`
              }}
              onClick={() => {
                if (!c.tone) editor.chain().focus().unsetTextHighlight().run();
                else editor.chain().focus().setTextHighlight(c.tone).run();
              }}
            />
            );
          })}
        </div>
      </BubbleMenu>

      <div className="editorInsertRow" style={{ marginBottom: 10 }}>
        <label className="pill editorToolbarUpload" style={{ cursor: 'pointer' }}>
          + Image
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await uploadAndInsertImage(file, editor);
              e.target.value = '';
            }}
          />
        </label>

        <label className="pill editorToolbarUpload" style={{ cursor: 'pointer' }}>
          + Code file
          <input
            type="file"
            accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html,.py,.go,.c,.h,.cc,.cpp,.cxx,.hpp,.sql,.yml,.yaml,.sh,text/plain"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const lang = extToLang(file.name);
              editor
                .chain()
                .focus()
                .insertContent({
                  type: 'codeBlock',
                  attrs: { language: lang, title: file.name },
                  content: [{ type: 'text', text: text.replace(/\r\n/g, '\n') }]
                })
                .run();
              editor.commands.createParagraphNear();
              e.target.value = '';
            }}
          />
        </label>

      </div>

      <ImageAlignControls editor={editor} />

      <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Drag and drop images here. Code blocks support title, copy, and line numbers.
      </div>

      <div style={{ marginTop: 10 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
