import React from 'react';
import clsx from 'clsx';
import { IconChevronLeft, IconChevronRight } from './icons';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduced(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export default function Carousel(props: {
  slides: React.ReactNode[];
  ariaLabel: string;
  autoPlayMs?: number;
  variant?: 'default' | 'minimal';
}) {
  const { slides, ariaLabel, autoPlayMs = 7000, variant = 'default' } = props;
  const reducedMotion = usePrefersReducedMotion();
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(0);
  const pausedRef = React.useRef(false);
  const rafRef = React.useRef<number | null>(null);

  const scrollToIndex = React.useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    const target = children[idx];
    if (!target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const children = Array.from(el.children) as HTMLElement[];
        if (!children.length) return;
        const x = el.scrollLeft + el.clientWidth * 0.35;
        let next = 0;
        for (let i = 0; i < children.length; i++) {
          if (children[i]!.offsetLeft <= x) next = i;
        }
        setActive(next);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      if (pausedRef.current) return;
      const next = (active + 1) % slides.length;
      scrollToIndex(next);
    }, autoPlayMs);
    return () => window.clearInterval(t);
  }, [active, autoPlayMs, reducedMotion, scrollToIndex, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className={clsx('carousel', variant === 'minimal' && 'carouselMinimal')}
      aria-label={ariaLabel}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocusCapture={() => (pausedRef.current = true)}
      onBlurCapture={() => (pausedRef.current = false)}
    >
      {variant !== 'minimal' ? (
        <div className="carouselTop">
          <div className="carouselDots" aria-label="Slides">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={clsx('carouselDot', i === active && 'active')}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollToIndex(i)}
              />
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn iconBtn"
              aria-label="Previous slide"
              onClick={() => scrollToIndex((active - 1 + slides.length) % slides.length)}
            >
              <IconChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="btn iconBtn"
              aria-label="Next slide"
              onClick={() => scrollToIndex((active + 1) % slides.length)}
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="carouselScroller" ref={scrollerRef}>
        {slides.map((s, i) => (
          <div key={i} className="carouselSlide">
            {s}
          </div>
        ))}
      </div>
    </section>
  );
}
