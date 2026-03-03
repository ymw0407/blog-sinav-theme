import React from 'react';
import clsx from 'clsx';
import { loadLocalMedia } from '../../app/local/mediaStore';
import { resolvePublicUrl } from '../lib/url';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

const EMPTY_IMG =
  'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='; // 1x1 transparent

export default function ResolvedImage({ src, ...rest }: Props) {
  const isLocal = src.startsWith('local-media:');
  const [near, setNear] = React.useState(() => !isLocal);
  const [resolved, setResolved] = React.useState<string>(() => (isLocal ? EMPTY_IMG : resolvePublicUrl(src)));
  const [loaded, setLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const { className, onLoad, ...imgProps } = rest;

  React.useEffect(() => {
    const local = src.startsWith('local-media:');
    setNear(!local);
    setResolved(local ? EMPTY_IMG : resolvePublicUrl(src));
  }, [src]);

  React.useEffect(() => {
    if (!isLocal) return;
    const el = imgRef.current;
    if (!el) return;

    // If it's already near the viewport, resolve immediately (helps above-the-fold / lightbox).
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
      if (!src.startsWith('local-media:')) return setResolved(resolvePublicUrl(src));
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
    const el = imgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [resolved]);

  return (
    <img
      ref={imgRef}
      src={resolved}
      className={clsx('imgSmooth', className)}
      data-loaded={loaded ? 'true' : undefined}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      decoding={(imgProps as any).decoding ?? 'async'}
      {...imgProps}
    />
  );
}
