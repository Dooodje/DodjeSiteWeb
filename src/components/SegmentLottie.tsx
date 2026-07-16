import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import type { LottieComponentProps, LottieRefCurrentProps } from 'lottie-react';

type SegmentLottieProps = {
  loadAnimation: () => Promise<object>;
  alt: string;
  loop?: boolean;
  reducedMotion?: boolean | null;
  alignBottom?: boolean;
  /** Static image shown until Lottie is ready (avoids empty flash). */
  poster?: string;
  /** Start loading immediately (above-the-fold), skip IntersectionObserver gate. */
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
};

type LottieComponent = ComponentType<LottieComponentProps>;

export default function SegmentLottie({
  loadAnimation,
  alt,
  loop = true,
  reducedMotion = false,
  alignBottom = false,
  poster,
  eager = false,
  className,
  style
}: SegmentLottieProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [Lottie, setLottie] = useState<LottieComponent | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isVisible, setIsVisible] = useState(eager);
  const [isReady, setIsReady] = useState(false);

  const syncPlayback = useCallback(() => {
    const instance = lottieRef.current;
    if (!instance || !isReady) return;

    if (isVisible && !reducedMotion) {
      instance.play();
    } else {
      instance.pause();
    }
  }, [isVisible, isReady, reducedMotion]);

  useEffect(() => {
    if (eager) {
      setIsVisible(true);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: '120px 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!isVisible || Lottie) return;

    let cancelled = false;
    import('lottie-react').then((mod) => {
      if (!cancelled) setLottie(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [isVisible, Lottie]);

  useEffect(() => {
    if (!isVisible || animationData) return;

    let cancelled = false;
    loadAnimation().then((data) => {
      if (!cancelled) setAnimationData(data);
    });

    return () => {
      cancelled = true;
    };
  }, [isVisible, animationData, loadAnimation]);

  useEffect(() => {
    setIsReady(false);
  }, [animationData]);

  useEffect(() => {
    syncPlayback();
  }, [syncPlayback]);

  const showLottie = Lottie !== null && animationData !== null;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{ ...style, position: style?.position ?? 'relative' }}
    >
      {poster && !showLottie ? (
        <img
          src={poster}
          alt=""
          aria-hidden
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.45))'
          }}
        />
      ) : null}
      {showLottie ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={loop && !reducedMotion}
          autoplay={!reducedMotion}
          onDOMLoaded={() => setIsReady(true)}
          rendererSettings={{
            preserveAspectRatio: alignBottom ? 'xMidYMax meet' : 'xMidYMid meet'
          }}
          style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.45))'
          }}
        />
      ) : null}
    </div>
  );
}
