import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type CarouselItem = {
  id: string;
  image: string;
  tagline: string;
  title: string;
  description: string;
};

export type CharacterCarouselProps = {
  items: CarouselItem[];
  className?: string;
};

export default function CharacterCarousel({ items, className }: CharacterCarouselProps) {
  const n = items.length;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    items.forEach((item) => {
      const img = new Image();
      img.src = item.image;
    });
  }, [items]);

  const navigate = (dir: 'next' | 'prev') => {
    if (n <= 1) return;
    setActiveIndex((prev) => (dir === 'next' ? (prev + 1) % n : (prev + n - 1) % n));
  };

  const active = items[activeIndex];
  const navBtnClass =
    'rounded-full flex items-center justify-center border-2 border-white/80 bg-transparent text-white hover:bg-white/15 hover:scale-[1.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';
  const navBtnStyle = { transition: 'transform 150ms ease, background-color 150ms ease' } as const;
  const imageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))'
  };

  return (
    <div className={`flex h-full min-h-0 w-full flex-col ${className ?? ''}`}>
      <div className="relative min-h-0 flex-1 w-full">
        {items.map((item, index) => (
          <img
            key={item.id}
            src={item.image}
            alt={index === activeIndex ? item.title : ''}
            aria-hidden={index !== activeIndex}
            width={1080}
            height={1080}
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'low'}
            draggable={false}
            className="absolute inset-0 m-auto select-none"
            style={{
              ...imageStyle,
              opacity: index === activeIndex ? 1 : 0,
              zIndex: index === activeIndex ? 1 : 0,
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 shrink-0 mx-auto w-[min(540px,calc(100%-24px))] px-3 pt-1 pb-[max(5.5rem,calc(var(--mobile-floating-bar-height,4.75rem)+0.75rem+env(safe-area-inset-bottom)))] sm:pt-2 sm:pb-4 text-center pointer-events-auto">
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
  );
}
