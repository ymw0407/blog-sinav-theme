import React from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { loadLocalMedia } from '../../local/mediaStore';
import { vars } from '../../../styles/tokens/theme.css';

function useResolvedSrc(src: string | undefined) {
  const [resolved, setResolved] = React.useState<string | null>(null);

  React.useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    (async () => {
      if (!src) return setResolved(null);
      if (!src.startsWith('local-media:')) return setResolved(src);
      const blob = await loadLocalMedia(src);
      if (!blob) return setResolved(null);
      const url = URL.createObjectURL(blob);
      revoked = url;
      if (!cancelled) setResolved(url);
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [src]);

  return resolved;
}

export default function ResizableImage(props: NodeViewProps) {
  const { node, selected, updateAttributes, editor } = props;
  const src = node.attrs.src as string | undefined;
  const alt = (node.attrs.alt as string | undefined) ?? '';
  const width = Number(node.attrs.width ?? 100);
  const align = (node.attrs.align as 'left' | 'center' | 'right') ?? 'center';
  const xAttr = typeof (node.attrs as any).x === 'number' ? Number((node.attrs as any).x) : null;

  const resolvedSrc = useResolvedSrc(src);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const dragState = React.useRef<{
    pointerId: number;
    handle: HTMLElement;
    mode: 'resize' | 'move';
    containerWidth: number;
    frameLeft: number;
    frameRight: number;
    frameCenter: number;
    anchor?: 'left' | 'center' | 'right';
    startClientX?: number;
    startOffsetPct?: number;
    availablePct?: number;
  } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const wPct = Math.max(20, Math.min(100, Math.round(width)));
  const baseX =
    xAttr != null && Number.isFinite(xAttr)
      ? Math.max(0, Math.min(1, xAttr))
      : align === 'left'
        ? 0
        : align === 'right'
          ? 1
          : 0.5;
  const availablePct = Math.max(0, 100 - wPct);
  const offsetPct = availablePct <= 0 ? 0 : Math.max(0, Math.min(availablePct, baseX * availablePct));

  function clampPct(p: number) {
    return Math.max(20, Math.min(100, Math.round(p)));
  }

  function snapPct(p: number) {
    const candidates = [25, 33, 50, 67, 75, 100];
    for (const c of candidates) {
      if (Math.abs(p - c) <= 2) return c;
    }
    return p;
  }

  function startDrag(e: React.PointerEvent, anchor: 'left' | 'center' | 'right') {
    const el = containerRef.current;
    const frame = frameRef.current;
    if (!el) return;
    if (!frame) return;
    const rect = el.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    if (rect.width <= 0) return;
    const handle = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
    if (!handle) return;
    dragState.current = {
      pointerId: e.pointerId,
      handle,
      mode: 'resize',
      containerWidth: rect.width,
      frameLeft: frameRect.left,
      frameRight: frameRect.right,
      frameCenter: frameRect.left + frameRect.width / 2,
      anchor
    };
    setDragging(true);
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }

  function snapX(x: number) {
    const candidates = [0, 0.5, 1];
    for (const c of candidates) {
      if (Math.abs(x - c) <= 0.035) return c;
    }
    return x;
  }

  function startMove(e: React.PointerEvent) {
    const el = containerRef.current;
    const frame = frameRef.current;
    if (!el) return;
    if (!frame) return;
    const rect = el.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    if (rect.width <= 0) return;
    const handle = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
    if (!handle) return;

    const startOffset = availablePct <= 0 ? 0 : offsetPct;
    dragState.current = {
      pointerId: e.pointerId,
      handle,
      mode: 'move',
      containerWidth: rect.width,
      frameLeft: frameRect.left,
      frameRight: frameRect.right,
      frameCenter: frameRect.left + frameRect.width / 2,
      startClientX: e.clientX,
      startOffsetPct: startOffset,
      availablePct
    };
    setDragging(true);
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const st = dragState.current;
      if (!st) return;
      if (e.pointerId !== st.pointerId) return;

      const x = e.clientX;
      const w = Math.max(1, st.containerWidth);

      if (st.mode === 'move') {
        const startClientX = st.startClientX ?? x;
        const startOffsetPct = st.startOffsetPct ?? 0;
        const avail = Math.max(0, st.availablePct ?? 0);
        if (avail <= 0) {
          updateAttributes({ x: 0 });
          return;
        }
        const deltaPct = ((x - startClientX) / w) * 100;
        const nextOffset = Math.max(0, Math.min(avail, startOffsetPct + deltaPct));
        const nextX = snapX(nextOffset / avail);
        updateAttributes({ x: nextX });
        return;
      }

      let px = 0;
      if (st.anchor === 'center') px = Math.abs(x - st.frameCenter) * 2;
      else if (st.anchor === 'left') px = x - st.frameLeft;
      else px = st.frameRight - x;

      px = Math.max(140, Math.min(w, px));
      const pct = clampPct((px / w) * 100);
      updateAttributes({ width: snapPct(pct) });
    };

    const onUp = (e: PointerEvent) => {
      const st = dragState.current;
      if (!st) return;
      if (e.pointerId !== st.pointerId) return;
      try {
        st.handle.releasePointerCapture(st.pointerId);
      } catch {
        // ignore
      }
      dragState.current = null;
      setDragging(false);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, updateAttributes]);

  return (
    <NodeViewWrapper
      as="figure"
      className="tiptapImage"
      data-selected={selected ? 'true' : 'false'}
      data-dragging={dragging ? 'true' : undefined}
      style={{ margin: '14px 0' }}
      contentEditable={false}
    >
      <div ref={containerRef} className="tiptapImageContainer">
        <div
          ref={frameRef}
          className="tiptapImageFrame"
          style={{ width: `${wPct}%`, marginLeft: `${offsetPct}%` }}
          onPointerDown={(e) => {
            // Remove the top "grab" button: drag the image/frame itself to move it left/right.
            if (!selected || !editor.isEditable) return;
            if (e.button !== 0) return;
            startMove(e);
          }}
        >
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={alt}
              className="tiptapImageEl"
              draggable={false}
            />
          ) : (
            <div className="muted">Image missing.</div>
          )}

          {selected && editor.isEditable ? (
            <>
              <div
                className="tiptapImageOutline"
                style={{ outline: `2px solid color-mix(in srgb, ${vars.color.accent} 35%, transparent)` }}
              />
              <button
                type="button"
                className="tiptapImageHandle tiptapImageHandleLeft"
                aria-label="Resize image"
                title="Drag to resize"
                onPointerDown={(e) => {
                  const anchor = align === 'center' ? 'center' : align === 'left' ? 'right' : 'left';
                  startDrag(e, anchor);
                }}
              />
              <button
                type="button"
                className="tiptapImageHandle tiptapImageHandleRight"
                aria-label="Resize image"
                title="Drag to resize"
                onPointerDown={(e) => {
                  const anchor = align === 'center' ? 'center' : align === 'left' ? 'left' : 'right';
                  startDrag(e, anchor);
                }}
              />
              <div className="tiptapImageSizeLabel" aria-hidden="true">
                {wPct}%
              </div>
            </>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
