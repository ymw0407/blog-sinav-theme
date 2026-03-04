import React from 'react';
import ResolvedImage from './ResolvedImage';
import { IconPin } from './icons';

export type JustifiedItem = {
  key: string;
  src: string;
  alt: string;
  caption?: string;
  pinned?: boolean;
};

type IndexedItem = JustifiedItem & { index: number };
type Row = { height: number; items: { item: IndexedItem; width: number }[] };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildRows(params: {
  items: IndexedItem[];
  ratios: Map<string, number>;
  width: number;
  gap: number;
  targetRowHeight: number;
  minRowHeight: number;
  maxRowHeight: number;
}) {
  const { items, ratios, width, gap, targetRowHeight, minRowHeight, maxRowHeight } = params;
  const rows: Row[] = [];

  let current: IndexedItem[] = [];
  let sum = 0;

  const flush = (mode: 'justify' | 'last') => {
    if (!current.length) return;
    const gaps = gap * Math.max(0, current.length - 1);
    const avail = Math.max(1, width - gaps);
    const ideal = avail / Math.max(0.001, sum);

    let height =
      mode === 'justify'
        ? ideal
        : // Last row should never overflow horizontally. Allow it to be shorter than `minRowHeight` if needed.
          Math.min(targetRowHeight, ideal);

    // Avoid overflow on single-item rows (e.g. panoramas) by allowing them to be shorter than `minRowHeight`.
    const effectiveMin = mode === 'justify' && current.length > 1 ? minRowHeight : Math.min(minRowHeight, ideal);
    height = clamp(height, effectiveMin, maxRowHeight);
    const rowItems = current.map((it) => {
      const r = ratios.get(it.src) ?? 4 / 3;
      return { item: it, width: Math.max(1, r * height) };
    });
    rows.push({ height, items: rowItems });
    current = [];
    sum = 0;
  };

  for (const it of items) {
    const r = ratios.get(it.src) ?? 4 / 3;

    if (current.length > 0) {
      const nextN = current.length + 1;
      const nextGaps = gap * Math.max(0, nextN - 1);
      const nextAvail = Math.max(1, width - nextGaps);
      const nextIdeal = nextAvail / Math.max(0.001, sum + r);
      // If adding this item would force the row below the minimum height, start a new row.
      if (nextIdeal < minRowHeight) {
        flush('justify');
      }
    }

    current.push(it);
    sum += r;
    const n = current.length;
    const expected = sum * targetRowHeight + gap * Math.max(0, n - 1);
    if (expected >= width) flush('justify');
  }
  flush('last');
  return rows;
}

export default function JustifiedGrid(props: {
  items: JustifiedItem[];
  onItemClick?: (item: JustifiedItem, index: number) => void;
  onItemFocus?: (item: JustifiedItem, index: number) => void;
  gap?: number;
  variant?: 'default' | 'featured';
  density?: 'default' | 'compact';
  maxRows?: number;
}) {
  const gap = props.gap ?? 8;
  const variant = props.variant ?? 'default';
  const density = props.density ?? 'default';
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState(0);
  const [ratios, setRatios] = React.useState<Map<string, number>>(() => new Map());

  const indexedItems = React.useMemo(
    () => props.items.map((it, index) => ({ ...it, index })),
    [props.items]
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.getBoundingClientRect().width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const dims = React.useMemo(() => {
    const width = Math.max(1, w);
    // The "featured" variant is used in the Landing carousel where we must keep a stable footprint.
    // It intentionally allows shorter rows so 4 items can fit without being clipped.
    if (variant === 'featured') {
      const targetRowHeight = width < 520 ? 220 : width < 980 ? 245 : 270;
      const minRowHeight = width < 520 ? 160 : 170;
      const maxRowHeight = width < 520 ? 290 : 330;
      return { width, targetRowHeight, minRowHeight, maxRowHeight };
    }

    const compact = density === 'compact';
    const targetRowHeight = compact ? (width < 520 ? 180 : width < 980 ? 250 : 320) : width < 520 ? 240 : width < 980 ? 295 : 340;
    const minRowHeight = compact ? (width < 520 ? 140 : width < 980 ? 200 : 270) : width < 520 ? 200 : width < 980 ? 245 : 290;
    const maxRowHeight = compact ? (width < 520 ? 260 : width < 980 ? 340 : 440) : width < 520 ? 340 : width < 980 ? 420 : 520;
    return { width, targetRowHeight, minRowHeight, maxRowHeight };
  }, [w, variant, density]);

  const rows = React.useMemo(
    () =>
      buildRows({
        items: indexedItems,
        ratios,
        width: dims.width,
        gap,
        targetRowHeight: dims.targetRowHeight,
        minRowHeight: dims.minRowHeight,
        maxRowHeight: dims.maxRowHeight
      }),
    [indexedItems, ratios, dims.width, dims.targetRowHeight, dims.minRowHeight, dims.maxRowHeight, gap]
  );

  const rowsToRender = React.useMemo(() => {
    const mr = props.maxRows;
    if (!mr || mr <= 0) return rows;
    return rows.slice(0, mr);
  }, [rows, props.maxRows]);

  return (
    <div ref={ref} className="justifiedGrid">
      {rowsToRender.map((row, rowIdx) => (
        <div key={rowIdx} className="justifiedRow" style={{ gap, height: row.height }}>
          {row.items.map(({ item, width: itemW }) => {
            return (
              <button
                key={item.key}
                type="button"
                className="justifiedItem"
                style={{ width: itemW, height: row.height }}
                data-pinned={item.pinned ? 'true' : undefined}
                onClick={() => (props.onItemClick ? props.onItemClick(item, item.index) : null)}
                onMouseEnter={() => (props.onItemFocus ? props.onItemFocus(item, item.index) : null)}
                onFocus={() => (props.onItemFocus ? props.onItemFocus(item, item.index) : null)}
                aria-label={item.alt || item.caption || 'Open image'}
              >
                {item.pinned ? (
                  <div className="justifiedPin" aria-hidden="true" title="Pinned">
                    <IconPin size={14} />
                  </div>
                ) : null}
                <div className="justifiedMat">
                  <ResolvedImage
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const nw = img.naturalWidth || 0;
                      const nh = img.naturalHeight || 0;
                      if (nw <= 0 || nh <= 0) return;
                      const r = nw / nh;
                      setRatios((prev) => {
                        const cur = prev.get(item.src);
                        if (cur && Math.abs(cur - r) < 0.001) return prev;
                        const next = new Map(prev);
                        next.set(item.src, r);
                        return next;
                      });
                    }}
                  />
                </div>
                {item.caption ? (
                  <div className="justifiedCaption" aria-hidden="true">
                    {item.caption}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
