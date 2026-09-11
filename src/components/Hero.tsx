import mascotPoster from '../assets/mascotte/MascotteSalut.png';
import { segmentLottie } from '../assets/lottie/segments';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import SegmentLottie from './SegmentLottie';

const HEADLINE_LINE_1 = ['Le', 'jeu', 'pour', 'enfin'];
const HEADLINE_LINE_2 = [
  { words: ['comprendre'], nowrap: true },
  { words: ["l'argent"] }
];

const BLUF =
  "Imagine si Duolingo, Clash of Clans et Mario s'étaient réunis. Bienvenue dans Dodje.";

const APP_STORE_URL =
  'https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=xyz.dodje.app&hl=fr';

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      aria-hidden
      className="text-2xl"
    >
      <path d="M17.05 12.54c-.03-3.08 2.52-4.56 2.64-4.63-1.44-2.1-3.67-2.39-4.45-2.42-1.9-.19-3.7 1.11-4.66 1.11-.97 0-2.45-1.08-4.03-1.05-2.07.03-3.98 1.2-5.05 3.05-2.16 3.75-.55 9.3 1.55 12.34 1.03 1.49 2.26 3.16 3.87 3.1 1.55-.06 2.14-1 4.02-1 1.87 0 2.41 1 4.04.97 1.67-.03 2.73-1.52 3.75-3.02 1.18-1.73 1.67-3.4 1.7-3.49-.04-.02-3.25-1.25-3.38-4.96zM14 3.49c.85-1.03 1.43-2.46 1.27-3.89-1.23.05-2.72.82-3.6 1.85-.79.91-1.48 2.37-1.29 3.76 1.37.11 2.77-.69 3.62-1.72z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="currentColor"
      aria-hidden
      className="text-xl"
    >
      <path d="M3.55 2.18c-.35.2-.55.57-.55 1.02v17.6c0 .45.2.82.55 1.02L13.7 12 3.55 2.18zm11.22 8.78 2.92-2.82L6.08 1.57c-.47-.27-.9-.28-1.23-.09l9.92 9.48zm0 2.08-9.92 9.48c.33.19.76.18 1.23-.09l11.61-6.57-2.92-2.82zm1.08-1.04 3.35 3.2 1.57-.89c1.64-.93 1.64-3.69 0-4.62l-1.57-.89-3.35 3.2z" />
    </svg>
  );
}

function StoreButtons({
  className,
  stacked = false
}: {
  className?: string;
  stacked?: boolean;
}) {
  const btnWidth = stacked ? 'w-full' : 'min-w-fit flex-1';
  const btnPadding = stacked ? 'px-6 py-4' : 'px-4 sm:px-5 py-3 sm:py-3.5';
  const labelSize = stacked ? 'text-base' : 'text-sm sm:text-base';
  const kickerSize = stacked ? 'text-[0.65rem]' : 'text-[0.6rem] sm:text-[0.65rem]';

  return (
    <div className={stacked ? `w-full ${className ?? ''}` : className}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex ${btnWidth} items-center justify-center gap-3 ${btnPadding} rounded-2xl text-white font-outfit font-bold shadow-[0_12px_30px_-12px_rgba(0,0,0,0.55)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] active:scale-[0.98]`}
        style={{
          background: 'linear-gradient(to bottom, #06D001 0%, #9BEC00 100%)'
        }}
      >
        <AppleIcon />
        <span className="flex flex-col leading-tight text-left whitespace-nowrap">
          <span className={`${kickerSize} uppercase tracking-wide opacity-70`}>
            Télécharger sur
          </span>
          <span className={labelSize}>App Store</span>
        </span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex ${btnWidth} items-center justify-center gap-3 ${btnPadding} rounded-2xl bg-white text-dodje-ink font-outfit font-bold shadow-[0_12px_30px_-8px_rgba(255,255,255,0.25)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] active:scale-[0.98]`}
      >
        <GooglePlayIcon />
        <span className="flex flex-col leading-tight text-left whitespace-nowrap">
          <span className={`${kickerSize} uppercase tracking-wide opacity-70`}>
            Télécharger sur
          </span>
          <span className={labelSize}>Google Play</span>
        </span>
      </a>
    </div>
  );
}

export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden text-white"
    >
      {/* Background: subtle dot pattern only. No green blobs / halos so the
          hero reads as quietly dark instead of neon-flashy. Masked to fade
          at edges to keep continuity with neighboring sections. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)'
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-16 pt-32 pb-14 sm:pt-24 lg:pt-12 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          <div className="order-1 flex w-full flex-col items-center gap-2 lg:gap-4 lg:order-none">
            <div className="flex w-full flex-col items-center text-center">
              <h1 className="w-full font-outfit font-extrabold uppercase tracking-tight leading-[0.95] text-center text-[clamp(2.25rem,8vw,3rem)] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[clamp(4.25rem,5.4vw,6.25rem)]">
                <span className="block">
                  {HEADLINE_LINE_1.map((word, i) => (
                    <span
                      key={`l1-${i}`}
                      className="inline-block mr-[0.18em] last:mr-0"
                    >
                      {word}
                    </span>
                  ))}
                </span>
                <span className="block text-dodje-green">
                  {HEADLINE_LINE_2.map((segment, i) => (
                    <span
                      key={`l2-${i}`}
                      className={`inline-block mr-[0.18em] last:mr-0${
                        segment.nowrap ? ' whitespace-nowrap' : ''
                      }`}
                    >
                      {segment.words.map((word, j) => (
                        <span
                          key={`l2-${i}-${j}`}
                          className={`inline-block last:mr-0 ${
                            j < segment.words.length - 1 ? 'mr-[0.18em]' : ''
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </span>
                  ))}
                </span>
              </h1>

              <p className="hero-shell__bluf mt-4 font-outfit text-sm sm:text-base lg:text-lg text-white/80 max-w-xl leading-relaxed text-center">
                {BLUF}
              </p>
            </div>

            <StoreButtons
              className="hidden lg:flex flex-col sm:flex-row gap-3 sm:gap-4 mt-1"
            />
          </div>

          {/* Animation — entre le titre et les boutons sur mobile */}
          <div className="order-2 relative flex items-center justify-center min-h-[280px] sm:min-h-[360px] lg:order-none lg:min-h-[560px]">
            <SegmentLottie
              loadAnimation={segmentLottie.salut}
              alt="Mascotte Dodje qui salue"
              poster={mascotPoster}
              eager
              reducedMotion={reducedMotion}
              className="relative z-10 w-[min(100%,420px)] sm:w-[min(100%,560px)] lg:w-full lg:max-w-[640px] aspect-square select-none"
              style={{ pointerEvents: 'none' }}
            />
          </div>

          {/* CTAs mobile — sous l'animation, pleine largeur, empilés */}
          <StoreButtons
            stacked
            className="order-3 flex w-full flex-col gap-3 lg:hidden"
          />
        </div>
      </div>
    </section>
  );
}
