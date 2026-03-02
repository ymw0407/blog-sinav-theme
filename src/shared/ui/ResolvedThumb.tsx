import React from 'react';
import clsx from 'clsx';
import { loadLocalMedia } from '../../app/local/mediaStore';

type Props = {
  src: string;
  alt: string;
  loading?: 'eager' | 'lazy';
};

const EMPTY_IMG =
  'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='; // 1x1 transparent

export default function ResolvedThumb({ src, alt, loading }: Props) {
  const isLocal = src.startsWith('local-media:');
  const [near, setNear] = React.useState(() => !isLocal);
  const [resolved, setResolved] = React.useState<string>(() => (isLocal ? EMPTY_IMG : src));
  const [loaded, setLoaded] = React.useState(false);
  const fgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const local = src.startsWith('local-media:');
    setNear(!local);
    setResolved(local ? EMPTY_IMG : src);
  }, [src]);

  React.useEffect(() => {
    if (!isLocal) return;
    const el = fgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 1200 && rect.bottom > -1200) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: '1200px 0px', threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isLocal, src]);

  React.useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    (async () => {
      if (!src.startsWith('local-media:')) return setResolved(src);
      if (!near) return;
      const blob = await loadLocalMedia(src);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      revoked = url;
      if (!cancelled) setResolved(url);
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [src, near]);

  React.useEffect(() => {
    setLoaded(false);
  }, [resolved]);

  React.useEffect(() => {
    const el = fgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [resolved]);

  return (
    <>
      <img className={clsx('thumbBg', 'imgSmooth')} src={resolved} alt="" aria-hidden="true" data-loaded={loaded ? 'true' : undefined} />
      <img
        ref={fgRef}
        className={clsx('thumbFg', 'imgSmooth')}
        src={resolved}
        alt={alt}
        loading={loading}
        decoding="async"
        data-loaded={loaded ? 'true' : undefined}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
