import { useEffect, useRef, useState, type CSSProperties, type ComponentType } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { LottieComponentProps } from 'lottie-react';

export type CarouselItem = {
  id: string;
  buildingSrc: () => Promise<object>;
  tagline: string;
  title: string;
  description: string;
};

type StageDims = { width: number; height: number };

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DURATION_MS = 650;

const TRANSITION = [
  `transform ${DURATION_MS}ms ${EASE}`,
  `opacity ${DURATION_MS}ms ${EASE}`,
  `height ${DURATION_MS}ms ${EASE}`,
  `width ${DURATION_MS}ms ${EASE}`
].join(', ');

const LOTTIE_RENDERER_OPTS = { preserveAspectRatio: 'xMidYMid meet' };

type LottieComponent = ComponentType<LottieComponentProps>;

function getCenterStyles(stage: StageDims): CSSProperties {
  return {
    left: '50%',
    top: 0,
    width: stage.width || undefined,
    height: stage.height || undefined,
    transform: 'translateX(-50%)',
    transformOrigin: '50% 50%',
    filter: 'none',
    opacity: 1,
    zIndex: 20
  };
}

export type CharacterCarouselProps = {
  items: CarouselItem[];
  className?: string;
};

export default function CharacterCarousel({ items, className }: CharacterCarouselProps) {
  const n = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [Lottie, setLottie] = useState<LottieComponent | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<object | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageDims, setStageDims] = useState<StageDims>({ width: 0, height: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      setStageDims({
        width: stage.clientWidth,
        height: stage.clientHeight
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('lottie-react').then((mod) => {
      if (!cancelled) setLottie(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setActiveBuilding(null);
    items[activeIndex].buildingSrc().then((data) => {
      if (!cancelled) setActiveBuilding(data);
    });
    return () => {
      cancelled = true;
    };
  }, [activeIndex, items]);

  const navigate = (dir: 'next' | 'prev') => {
    if (isAnimating || n <= 1) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (dir === 'next' ? (prev + 1) % n : (prev + n - 1) % n));
    window.setTimeout(() => setIsAnimating(false), DURATION_MS);
  };

  const active = items[activeIndex];
  const navBtnClass =
    'rounded-full flex items-center justify-center border-2 border-white/80 bg-transparent text-white hover:bg-white/15 hover:scale-[1.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';
  const navBtnStyle = { transition: 'transform 150ms ease, background-color 150ms ease' } as const;

  return (
    <div className={`flex h-full min-h-0 w-full flex-col ${className ?? ''}`}>
      <div ref={stageRef} className="relative min-h-0 flex-1 w-full">
        <div className="absolute inset-0">
          <div
            key={active.id}
            style={{
              position: 'absolute',
              transition: TRANSITION,
              willChange: 'transform, opacity, width, height',
              ...getCenterStyles(stageDims)
            }}
          >
            {Lottie && activeBuilding ? (
              <Lottie
                animationData={activeBuilding}
                loop
                autoplay
                rendererSettings={LOTTIE_RENDERER_OPTS}
                style={{
                  width: '100%',
                  height: '100%',
                  filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))'
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="relative z-10 shrink-0 mx-auto w-[min(540px,calc(100%-24px))] px-3 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pt-2 sm:pb-4 text-center pointer-events-auto"
      >
        <div
          key={active.id}
          className="animate-[panelEnter_500ms_cubic-bezier(0.4,0,0.2,1)]"
        >
          <p className="font-outfit text-[0.6rem] sm:text-sm font-medium uppercase tracking-[0.18em] text-dodje-green">
            {active.tagline}
          </p>
          <h3 className="font-outfit font-black text-xl sm:text-4xl leading-[1.05] text-white">
            {active.title}
          </h3>
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-1.5 sm:mt-2">
            <button
              type="button"
              onClick={() => navigate('prev')}
              aria-label="Précédent"
              className={`${navBtnClass} w-10 h-10 sm:w-14 sm:h-14`}
              style={navBtnStyle}
            >
              <ArrowLeft size={22} strokeWidth={2.25} className="sm:hidden" />
              <ArrowLeft size={26} strokeWidth={2.25} className="hidden sm:block" />
            </button>
            <p className="font-outfit text-[0.65rem] sm:text-xs uppercase tracking-widest text-white/50 min-w-[2.5rem]">
              {activeIndex + 1} / {n}
            </p>
            <button
              type="button"
              onClick={() => navigate('next')}
              aria-label="Suivant"
              className={`${navBtnClass} w-10 h-10 sm:w-14 sm:h-14`}
              style={navBtnStyle}
            >
              <ArrowRight size={20} strokeWidth={2.25} className="sm:hidden" />
              <ArrowRight size={26} strokeWidth={2.25} className="hidden sm:block" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
