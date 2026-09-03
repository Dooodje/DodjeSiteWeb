import type { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { segmentLottie } from '../assets/lottie/segments';
import SegmentLottie from './SegmentLottie';

type FeatureMedia = {
  kind: 'lottie';
  loadAnimation: () => Promise<object>;
  aspectClass: string;
  scaleClass: string;
};

type Feature = {
  index: string;
  titleLine1: string;
  titleAccent: string;
  body: string;
  media: FeatureMedia;
  alt: string;
};

const FEATURES: Feature[] = [
  {
    index: '01',
    titleLine1: 'Une expérience',
    titleAccent: 'personnalisée',
    body:
      'Tu choisis le chemin qui t’intéresse, Dodje te guide pour avancer dans le bon ordre. Tu explores les sujets à ton rythme, avec des étapes claires pour ne jamais te sentir perdu.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.experiencePersonnalisee,
      aspectClass: 'aspect-[19/10]',
      scaleClass: 'scale-[1.35] sm:scale-[1.6] lg:scale-[1.95]'
    },
    alt: 'Expérience personnalisée Dodje'
  },
  {
    index: '02',
    titleLine1: 'Un progrès',
    titleAccent: 'visible',
    body:
      'Chaque leçon te fait avancer. Tu gagnes de l’XP, tu débloques de nouvelles étapes, et tu vois clairement ce que tu comprends mieux qu’avant.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.progresVisible,
      aspectClass: 'aspect-[6/7]',
      scaleClass: 'scale-[1.1] sm:scale-[1.2] lg:scale-[1.3]'
    },
    alt: 'Progression de niveau Dodje'
  },
  {
    index: '03',
    titleLine1: 'Un apprentissage',
    titleAccent: 'ludique',
    body:
      'Avec des quiz, des défis et des récompenses à collectionner, apprendre devient plus motivant. Tu pratiques souvent, tu retiens mieux, et tu prends plaisir à continuer.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.apprentissageLudique,
      aspectClass: 'aspect-square',
      scaleClass: 'scale-[1.1] sm:scale-[1.2] lg:scale-[1.3]'
    },
    alt: 'Apprentissage ludique Dodje'
  }
];

const FEATURE_STACK_GAP = 'gap-32 lg:gap-36';
const FEATURE_ROW =
  'grid lg:grid-cols-2 gap-10 lg:gap-x-20 items-center lg:min-h-[540px]';
const VISUAL_SLOT =
  'relative flex h-[380px] sm:h-[440px] lg:h-[500px] w-full items-center justify-center overflow-visible [direction:ltr]';

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
  const floatClass = visual && float && visible && !reducedMotion ? 'segment-float' : '';

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${baseClass} ${directionClass} ${floatClass} ${
        visible ? 'is-visible' : ''
      } ${className}`.trim()}
      style={
        floatClass ? { animationDelay: `${float}s` } : undefined
      }
    >
      {children}
    </div>
  );
}

export default function Features() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section
      id="features"
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
        <h2 className="sr-only">Comment tu apprends</h2>
        <div className={`flex flex-col ${FEATURE_STACK_GAP}`}>
          {FEATURES.map((f, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={f.index}
                className={`${FEATURE_ROW} ${
                  reverse ? 'lg:[direction:rtl]' : ''
                } overflow-visible`}
              >
                <RevealBlock
                  reverse={reverse}
                  className="flex flex-col gap-4 [direction:ltr]"
                >
                  <h3 className="font-outfit font-black uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl">
                    {f.titleLine1}
                    <br />
                    <span className="text-dodje-green">{f.titleAccent}</span>
                  </h3>
                  <p className="font-outfit text-base sm:text-lg text-white/75 max-w-xl mt-2 leading-relaxed">
                    {f.body}
                  </p>
                </RevealBlock>

                <RevealBlock visual float={i * 0.35} className={VISUAL_SLOT}>
                  <div
                    className={`w-full max-w-[460px] origin-center ${f.media.scaleClass}`}
                  >
                    <SegmentLottie
                      loadAnimation={f.media.loadAnimation}
                      alt={f.alt}
                      reducedMotion={reducedMotion}
                      className={`relative z-10 w-full ${f.media.aspectClass}`}
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
