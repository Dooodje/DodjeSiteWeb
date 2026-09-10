import type { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { segmentLottie } from '../assets/lottie/segments';
import SegmentLottie from './SegmentLottie';

type PillarMedia = {
  kind: 'lottie';
  loadAnimation: () => Promise<object>;
  aspectClass: string;
  scaleClass: string;
};

type Pillar = {
  number: string;
  titleLine1: string;
  titleAccent: string;
  body: string;
  media: PillarMedia;
  alt: string;
};

const PILLARS: Pillar[] = [
  {
    number: '01',
    titleLine1: 'Un parcours',
    titleAccent: 'progressif',
    body:
      'Avec Dodje, tu avances à ton rythme. Tu commences par les bases, tu débloques de nouveaux mondes, et tu comprends enfin la finance sans te sentir perdu.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.parcours,
      aspectClass: 'aspect-square',
      scaleClass: 'lg:scale-[1.3]'
    },
    alt: 'Parcours d’apprentissage progressif'
  },
  {
    number: '02',
    titleLine1: 'Ton argent',
    titleAccent: 'en clair',
    body:
      'On parle souvent d’argent, mais rarement de façon simple. Dodje traduit chaque notion en décision de jeu : investir tes Dodjis dans le phare, c’est comprendre les placements ; les laisser dormir dans la réserve, c’est subir l’inflation.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.mouvementNecessaire,
      aspectClass: 'aspect-square',
      scaleClass: 'lg:scale-[1.15]'
    },
    alt: 'Notification Dodje — ton argent en clair'
  },
  {
    number: '03',
    titleLine1: 'Gratuit. Simple.',
    titleAccent: 'Ludique.',
    body:
      'Apprendre avec Dodje, c’est gratuit, clair et motivant. Les leçons sont courtes, les quiz te font pratiquer, et chaque Dodji gagné te donne envie de continuer à construire ton île.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.gratuitSimpleLudique,
      aspectClass: 'aspect-square',
      scaleClass: 'lg:scale-[1.7]'
    },
    alt: 'Daily reward Dodje — gratuit, simple et ludique'
  }
];

/** Same vertical rhythm as Features. */
const PILLAR_STACK_GAP = 'gap-32 lg:gap-36';
const PILLAR_ROW =
  'grid lg:grid-cols-2 gap-10 lg:gap-x-20 items-center lg:min-h-[540px] overflow-hidden lg:overflow-visible';
const VISUAL_SLOT =
  'relative z-0 flex h-[380px] sm:h-[440px] lg:h-[500px] w-full items-center justify-center overflow-hidden lg:overflow-visible [direction:ltr]';

type RevealBlockProps = {
  reverse?: boolean;
  visual?: boolean;
  float?: number;
  className?: string;
  children: ReactNode;
};

function RevealBlock({
  reverse = false,
  visual = false,
  float = 0,
  className = '',
  children
}: RevealBlockProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView({
    rootMargin: '-10% 0px',
    threshold: 0.15,
    once: true
  });

  const visible = reducedMotion || inView;
  const baseClass = visual ? 'reveal-visual' : 'reveal-text';
  const directionClass = !visual && reverse ? 'reveal-text--reverse' : '';
  const floatClass = visual && float > 0 && visible && !reducedMotion ? 'segment-float' : '';

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${baseClass} ${directionClass} ${floatClass} ${
        visible ? 'is-visible' : ''
      } ${className}`.trim()}
      style={floatClass ? { animationDelay: `${float}s` } : undefined}
    >
      {children}
    </div>
  );
}

export default function Pillars() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section
      id="pillars"
      className="relative w-full overflow-x-hidden text-white py-24 sm:py-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <h2 className="sr-only">Pourquoi un jeu plutôt qu'un cours ?</h2>
        <div className={`flex flex-col ${PILLAR_STACK_GAP}`}>
          {PILLARS.map((pillar, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={pillar.number}
                className={`${PILLAR_ROW} ${
                  reverse ? 'lg:[direction:rtl]' : ''
                }`}
              >
                <RevealBlock
                  reverse={reverse}
                  className="relative z-20 flex flex-col gap-4 [direction:ltr]"
                >
                  <h3 className="font-outfit font-black uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl">
                    {pillar.titleLine1}
                    <br />
                    <span className="text-dodje-green">
                      {pillar.titleAccent}
                    </span>
                  </h3>
                  <p className="font-outfit text-base sm:text-lg text-white/75 max-w-xl mt-2 leading-relaxed">
                    {pillar.body}
                  </p>
                </RevealBlock>

                <RevealBlock visual float={i * 0.4} className={VISUAL_SLOT}>
                  <div
                    className={`w-full max-w-[460px] origin-center ${pillar.media.scaleClass}`}
                  >
                    <SegmentLottie
                      loadAnimation={pillar.media.loadAnimation}
                      alt={pillar.alt}
                      reducedMotion={reducedMotion}
                      className={`relative z-10 w-full ${pillar.media.aspectClass}`}
                    />
                  </div>
                </RevealBlock>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
