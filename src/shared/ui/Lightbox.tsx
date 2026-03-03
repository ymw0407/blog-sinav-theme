import React from 'react';
import { createPortal } from 'react-dom';
import ResolvedImage from './ResolvedImage';
import { loadLocalMedia } from '../../app/local/mediaStore';
import { resolvePublicUrl } from '../lib/url';
import { IconChevronLeft, IconChevronRight, IconDownload, IconX } from './icons';

export type LightboxItem = {
  src: string;
  alt: string;
  caption?: string;
  meta?: {
    title?: string;
    intent?: string;
    date?: string;
    pinned?: boolean;
    camera?: string;
    lens?: string;
    film?: string;
    location?: string;
    note?: string;
    // Generic rows for non-gallery use-cases (e.g. Resume).
    rows?: Array<{ key: string; value: string }>;
    links?: Array<{ label?: string; url: string }>;
  };
};

export default function Lightbox(props: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange?: (next: number) => void;
  renderMetaActions?: (params: { item: LightboxItem; index: number }) => React.ReactNode;
}) {
  const { items, index, onClose, onIndexChange, renderMetaActions } = props;
  const item = index === null ? null : items[index] ?? null;
  const itemSrc = item?.src ?? null;
  const meta = item?.meta;
  const metaRows = Array.isArray(meta?.rows) ? meta!.rows!.filter((r) => r && r.key && r.value) : [];
  const metaLinks = Array.isArray(meta?.links) ? meta!.links!.filter((l) => l && l.url) : [];
  const hasMeta = Boolean(
    meta?.title ||
      meta?.intent ||
      meta?.date ||
      meta?.pinned ||
      meta?.camera ||
      meta?.lens ||
      meta?.film ||
      meta?.location ||
      meta?.note ||
      metaRows.length ||
      metaLinks.length
  );

  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const downloadRevokeRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (downloadRevokeRef.current) URL.revokeObjectURL(downloadRevokeRef.current);
      downloadRevokeRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (index === null) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [index]);

  React.useEffect(() => {
    if (index === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onIndexChange) onIndexChange((index - 1 + items.length) % items.length);
      if (e.key === 'ArrowRight' && onIndexChange) onIndexChange((index + 1) % items.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, items.length, onClose, onIndexChange]);

  React.useEffect(() => {
    let cancelled = false;

    // Reset per item and when closing.
    setDownloadUrl(null);
    if (downloadRevokeRef.current) {
      URL.revokeObjectURL(downloadRevokeRef.current);
      downloadRevokeRef.current = null;
    }

    if (!itemSrc) return () => void (cancelled = true);

    (async () => {
      if (itemSrc.startsWith('local-media:')) {
        const blob = await loadLocalMedia(itemSrc);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        downloadRevokeRef.current = url;
        if (!cancelled) setDownloadUrl(url);
        return;
      }

      // data: URLs and same-origin/static URLs are ok to use directly.
      if (!cancelled) setDownloadUrl(resolvePublicUrl(itemSrc));
    })();
    return () => {
      cancelled = true;
    };
  }, [itemSrc]);

  if (index === null) return null;
  if (typeof document === 'undefined') return null;
  if (!item) return null;

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      onPointerDown={(e) => {
        // Prevent "click-through" to underlying UI when closing.
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="lightboxPanel"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightboxTop">
          <div className="lightboxIndex">
            {index + 1} / {items.length}
          </div>
          <div className="row" style={{ gap: 8 }}>
            {onIndexChange ? (
              <>
                <button
                  className="btn iconBtn"
                  onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
                  type="button"
                  aria-label="Previous"
                  title="Previous"
                >
                  <IconChevronLeft size={18} />
                </button>
                <button
                  className="btn iconBtn"
                  onClick={() => onIndexChange((index + 1) % items.length)}
                  type="button"
                  aria-label="Next"
                  title="Next"
                >
                  <IconChevronRight size={18} />
                </button>
              </>
            ) : null}
            {downloadUrl ? (
              <a
                className="btn iconBtn"
                href={downloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download"
                title="Download"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDownload size={18} />
              </a>
            ) : null}
            <button className="btn iconBtn" onClick={onClose} type="button" aria-label="Close" title="Close">
              <IconX size={18} />
            </button>
          </div>
        </div>

        <div className="lightboxBody">
          <div className="lightboxContent">
            <div
              className="lightboxStage"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.target === e.currentTarget) onClose();
              }}
            >
              <div className="lightboxFrame" aria-hidden="true">
                <ResolvedImage src={item.src} alt={item.alt} className="lightboxImg" />
              </div>
            </div>
            {hasMeta ? (
              <aside className="lightboxMeta" aria-label="Image details">
                <div className="lightboxMetaScroll">
                  {meta?.pinned ? (
                    <div className="pill" style={{ alignSelf: 'start' }}>
                      Pinned
                    </div>
                  ) : null}
                  {meta?.date ? (
                    <div className="pill" style={{ alignSelf: 'start' }}>
                      {meta.date}
                    </div>
                  ) : null}
                  {meta?.title ? <div className="lightboxMetaTitle">{meta.title}</div> : null}
                  {meta?.intent ? <div className="lightboxMetaIntent">{meta.intent}</div> : null}
                  {meta?.camera || meta?.lens || meta?.film || meta?.location || meta?.note || metaRows.length ? (
                    <div className="lightboxMetaGrid">
                      {meta?.camera ? (
                        <>
                          <div className="lightboxMetaKey">Camera</div>
                          <div className="lightboxMetaVal">{meta.camera}</div>
                        </>
                      ) : null}
                      {meta?.lens ? (
                        <>
                          <div className="lightboxMetaKey">Lens</div>
                          <div className="lightboxMetaVal">{meta.lens}</div>
                        </>
                      ) : null}
                      {meta?.film ? (
                        <>
                          <div className="lightboxMetaKey">Film</div>
                          <div className="lightboxMetaVal">{meta.film}</div>
                        </>
                      ) : null}
                      {meta?.location ? (
                        <>
                          <div className="lightboxMetaKey">Location</div>
                          <div className="lightboxMetaVal">{meta.location}</div>
                        </>
                      ) : null}
                      {metaRows.map((r, i) => {
                        const key = `${r.key}-${i}`;
                        const looksLikeNote =
                          r.key.toLowerCase() === 'note' ||
                          r.key.toLowerCase() === 'description' ||
                          r.value.includes('\n') ||
                          r.value.length > 140;
                        return (
                          <React.Fragment key={key}>
                            <div className="lightboxMetaKey">{r.key}</div>
                            <div className={`lightboxMetaVal${looksLikeNote ? ' lightboxMetaNote' : ''}`}>{r.value}</div>
                          </React.Fragment>
                        );
                      })}
                      {meta?.note ? (
                        <>
                          <div className="lightboxMetaKey">Note</div>
                          <div className="lightboxMetaVal lightboxMetaNote">{meta.note}</div>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {metaLinks.length ? (
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                      {metaLinks.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="pill"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.label || l.url}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
                {renderMetaActions ? <div className="lightboxMetaActions">{renderMetaActions({ item, index })}</div> : null}
              </aside>
            ) : null}
          </div>
          {item.caption ? <div className="lightboxCaption">{item.caption}</div> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
