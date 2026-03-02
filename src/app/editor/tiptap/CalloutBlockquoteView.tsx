import React from 'react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { IconAlertTriangle, IconCheckCircle, IconCpu, IconFileText, IconInfo, IconMessageSquare, IconPin, IconXCircle, IconZap } from '../../../shared/ui/icons';

type IconId = 'info' | 'idea' | 'warning' | 'success' | 'error' | 'note' | 'pin' | 'message' | 'think';

type UiIcon = React.ComponentType<{ size?: number; className?: string; title?: string }>;

const ICONS: { value: IconId; label: string; Icon: UiIcon }[] = [
  { value: 'info', label: 'Info', Icon: IconInfo },
  { value: 'idea', label: 'Idea', Icon: IconZap },
  { value: 'warning', label: 'Warning', Icon: IconAlertTriangle },
  { value: 'success', label: 'Success', Icon: IconCheckCircle },
  { value: 'error', label: 'Error', Icon: IconXCircle },
  { value: 'note', label: 'Note', Icon: IconFileText },
  { value: 'pin', label: 'Pin', Icon: IconPin },
  { value: 'message', label: 'Message', Icon: IconMessageSquare },
  { value: 'think', label: 'Think', Icon: IconCpu }
];

const LEGACY_ICON_MAP: Record<string, IconId> = {
  // Legacy emoji values
  '💡': 'idea',
  '⚠️': 'warning',
  '⚠': 'warning',
  '✅': 'success',
  '❌': 'error',
  '📝': 'note',
  '📌': 'pin',
  '💬': 'message',
  '🤔': 'think'
};

function safeIconId(input: unknown): IconId {
  const raw = String(input ?? '').trim();
  const direct = ICONS.find((it) => it.value === (raw as any))?.value;
  if (direct) return direct;
  const legacy = LEGACY_ICON_MAP[raw];
  if (legacy) return legacy;
  return 'info';
}

export default function CalloutBlockquoteView(props: NodeViewProps) {
  const { node, editor, updateAttributes } = props;
  const editable = editor.isEditable;
  const raw = String(node.attrs?.icon ?? '').trim();
  const iconId = safeIconId(raw);

  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  // Normalize legacy emoji values to stable ids so they don't vary by platform.
  React.useEffect(() => {
    if (!editable) return;
    if (!raw) return;
    if (raw !== iconId) updateAttributes({ icon: iconId });
  }, [editable, raw, iconId, updateAttributes]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(e.target as any)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const Current = ICONS.find((it) => it.value === iconId)?.Icon ?? IconInfo;

  return (
    <NodeViewWrapper as="blockquote" className="calloutBlockquote" ref={rootRef as any}>
      <div className="calloutIconWrap" contentEditable={false}>
        <button
          type="button"
          className="calloutIconBtn"
          aria-label={editable ? 'Change callout icon' : 'Callout icon'}
          title={editable ? 'Change icon' : undefined}
          disabled={!editable}
          onClick={() => (editable ? setOpen((x) => !x) : null)}
        >
          <span className="calloutIconGlyph" aria-hidden="true">
            <Current size={18} />
          </span>
        </button>

        {open ? (
          <div className="calloutIconMenu" role="menu" aria-label="Callout icons">
            {ICONS.map((it) => (
              <button
                key={it.value}
                type="button"
                className={`calloutIconItem${it.value === iconId ? ' active' : ''}`}
                onClick={() => {
                  updateAttributes({ icon: it.value });
                  setOpen(false);
                }}
              >
                <span className="calloutIconItemGlyph" aria-hidden="true">
                  <it.Icon size={16} />
                </span>
                <span className="calloutIconItemLabel">{it.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="calloutBody">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
}
