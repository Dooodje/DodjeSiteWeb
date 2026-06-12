import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Lottie from 'lottie-react';

export type CarouselItem = {
  id: string;
  /** Lottie animation data (parsed JSON) for the building. */
  building: object;
  /** Small kicker shown above the title in the info panel (e.g. "Ton job"). */
  tagline: string;
  /** Building name (e.g. "L'atelier"). */
  title: string;
  /** Long-form description. */
  description: string;
};

type Role = 'center' | 'left' | 'right' | 'back' | 'hidden';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DURATION_MS = 650;

const TRANSITION = [
  `transform ${DURATION_MS}ms ${EASE}`,
  `filter ${DURATION_MS}ms ${EASE}`,
  `opacity ${DURATION_MS}ms ${EASE}`,
  `left ${DURATION_MS}ms ${EASE}`
].join(', ');

function useViewportFlags(): { isMobile: boolean; isShort: boolean } {
  const [flags, setFlags] = useState(() => ({
    isMobile: typeof window === 'undefined' ? false : window.innerWidth < 640,
    isShort: typeof window === 'undefined' ? false : window.innerHeight < 740
  }));

  useEffect(() => {
    const onResize = () => {
      setFlags({
        isMobile: window.innerWidth < 640,
        isShort: window.innerHeight < 740
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return flags;
}

function getRoleStyles(role: Role, isMobile: boolean, isShort: boolean): CSSProperties {
  // Buildings live in a dedicated flex stage above the info panel, so
  // percentages are relative to that stage — not the full section.
  const centerScale = isMobile ? (isShort ? 1.05 : 1.12) : 1.35;

  switch (role) {
    case 'center':
      return {
        transform: `translateX(-50%) scale(${centerScale})`,
        filter: 'none',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: isMobile ? (isShort ? '68%' : '72%') : '78%',
        bottom: isMobile ? '-6%' : '-8%'
      };
    case 'left':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '18%' : '28%',
        height: isMobile ? '22%' : '30%',
        bottom: isMobile ? '8%' : '10%'
      };
    case 'right':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '82%' : '72%',
        height: isMobile ? '22%' : '30%',
        bottom: isMobile ? '8%' : '10%'
      };
    case 'back':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 1,
        zIndex: 5,
        left: '50%',
        height: isMobile ? '18%' : '26%',
        bottom: isMobile ? '8%' : '10%'
      };
    case 'hidden':
    default:
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(6px)',
        opacity: 0,
        zIndex: 1,
        left: '50%',
        height: isMobile ? '18%' : '26%',
        bottom: isMobile ? '8%' : '10%',
        pointerEvents: 'none'
      };
  }
}

function resolveRole(index: number, active: number, n: number): Role {
  if (index === active) return 'center';
  if (index === (active + n - 1) % n) return 'left';
  if (index === (active + 1) % n) return 'right';
  if (index === (active + 2) % n) return 'back';
  return 'hidden';
}

export type CharacterCarouselProps = {
  items: CarouselItem[];
  className?: string;
};

const LOTTIE_RENDERER_OPTS = { preserveAspectRatio: 'xMidYMid meet' };

export default function CharacterCarousel({ items, className }: CharacterCarouselProps) {
  const n = items.length;
  const { isMobile, isShort } = useViewportFlags();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const navigate = (dir: 'next' | 'prev') => {
    if (isAnimating || n <= 1) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (dir === 'next' ? (prev + 1) % n : (prev + n - 1) % n));
    window.setTimeout(() => setIsAnimating(false), DURATION_MS);
  };

  const active = items[activeIndex];

  return (
    <div className={`relative w-full h-full flex flex-col ${className ?? ''}`}>
      {/* Buildings stage — flex child above the card, never overlaps it. */}
      <div className="relative flex-1 min-h-[140px] w-full overflow-hidden">
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
        {items.map((item, index) => {
          const role = resolveRole(index, activeIndex, n);
          const roleStyles = getRoleStyles(role, isMobile, isShort);
          const style: CSSProperties = {
            position: 'absolute',
            aspectRatio: '0.6 / 1',
            transition: TRANSITION,
            willChange: 'transform, filter, opacity',
            ...roleStyles
          };
          const isCenter = role === 'center';
          return (
            <div
              key={item.id}
              style={style}
              aria-hidden={!isCenter}
              data-role={role}
            >
              <Lottie
                animationData={item.building}
                loop
                autoplay
                rendererSettings={LOTTIE_RENDERER_OPTS}
                style={{
                  width: '100%',
                  height: '100%',
                  filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.45))'
                }}
              />
            </div>
          );
        })}
        </div>

        {/* Navigation buttons — desktop only, anchored bottom-left of stage. */}
        <div
          className="absolute hidden sm:flex bottom-6 left-6 lg:bottom-10 lg:left-10 items-center gap-3"
          style={{ zIndex: 60 }}
        >
          <button
            type="button"
            onClick={() => navigate('prev')}
            aria-label="Précédent"
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/80 bg-transparent text-white hover:bg-white/15 hover:scale-[1.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ transition: 'transform 150ms ease, background-color 150ms ease' }}
          >
            <ArrowLeft size={26} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => navigate('next')}
            aria-label="Suivant"
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/80 bg-transparent text-white hover:bg-white/15 hover:scale-[1.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ transition: 'transform 150ms ease, background-color 150ms ease' }}
          >
            <ArrowRight size={26} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {/* Info content — in document flow below buildings. */}
      <div
        className="relative pointer-events-auto z-[50] shrink-0 mx-auto
                   w-[min(540px,calc(100%-48px))]
                   mb-[max(1.5rem,env(safe-area-inset-bottom))] sm:mb-14
                   px-5 py-4 sm:px-6 sm:py-5
                   text-center"
      >
        <div
          key={active.id}
          className="flex flex-col gap-2 animate-[panelEnter_500ms_cubic-bezier(0.4,0,0.2,1)]"
        >
          <p className="font-arboria text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-dodje-green">
            {active.tagline}
          </p>
          <h3 className="font-arboria font-black text-3xl sm:text-4xl leading-[1.05] text-white">
            {active.title}
          </h3>
          <p className="font-arboria text-[0.7rem] uppercase tracking-widest text-white/50 mt-3">
            {activeIndex + 1} / {n}
          </p>
          <div className="flex sm:hidden items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => navigate('prev')}
              aria-label="Précédent"
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white/80 bg-transparent text-white hover:bg-white/15 hover:scale-[1.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ transition: 'transform 150ms ease, background-color 150ms ease' }}
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={() => navigate('next')}
              aria-label="Suivant"
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white/80 bg-transparent text-white hover:bg-white/15 hover:scale-[1.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ transition: 'transform 150ms ease, background-color 150ms ease' }}
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
