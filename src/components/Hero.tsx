import { ArrowDown, Sparkles } from 'lucide-react';
import salutMp4 from '../../assets/anime/Salut.mp4';
import salutWebm from '../../assets/anime/Salut.webm';

const HEADLINE_LINE_1 = ['Comprends', 'ton', 'argent'];
const HEADLINE_LINE_2 = ['simplement', 'et', 'gratuitement.'];

const TRUST_NOTE =
  'Contenus éducatifs uniquement, sans conseil financier personnalisé.';

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

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden text-white"
      style={{ minHeight: '100svh' }}
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

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-16 pt-12 pb-4 lg:pt-12 lg:pb-6 flex flex-col gap-2 lg:gap-3">
       <div className="grid lg:grid-cols-[0.8fr_1.4fr] gap-3 lg:gap-10 items-center">
        {/* LEFT: Text + CTAs */}
        <div className="flex flex-col gap-2 lg:gap-3">
          {/* Eyebrow chip */}
          <div
            className="inline-flex items-center gap-2 self-start rounded-full
                       border border-white/15 bg-white/5 backdrop-blur
                       px-3.5 py-1.5 text-xs sm:text-sm font-arboria
                       motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
          >
            <Sparkles size={14} className="text-dodje-green" />
            <span className="text-white/80">Disponible sur iOS &amp; Android</span>
          </div>

          {/* Headline */}
          <h1 className="font-arboria font-black uppercase tracking-tight leading-[0.92] text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem]">
            <span className="block">
              {HEADLINE_LINE_1.map((word, i) => (
                <span
                  key={`l1-${i}`}
                  className="inline-block mr-[0.18em] last:mr-0 motion-safe:animate-[heroWord_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
                  style={{ animationDelay: `${180 + i * 70}ms` }}
                >
                  {word}
                </span>
              ))}
            </span>
            <span className="block text-dodje-green">
              {HEADLINE_LINE_2.map((word, i) => (
                <span
                  key={`l2-${i}`}
                  className="inline-block mr-[0.18em] last:mr-0 motion-safe:animate-[heroWord_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
                  style={{ animationDelay: `${390 + i * 70}ms` }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="font-arboria text-lg sm:text-xl lg:text-[1.35rem] text-white/75 max-w-xl leading-relaxed motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
            style={{ animationDelay: '700ms' }}
          >
            Dodje est l’app de finance pour débutants qui t’aide à comprendre
            ton argent facilement, même si tu pars de zéro.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-1 motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
            style={{ animationDelay: '850ms' }}
          >
            <a
              href="https://apps.apple.com/us/app/dodje-%C3%A9ducation-financi%C3%A8re/id6743447215"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-5 py-3.5 rounded-2xl text-dodje-ink font-arboria font-bold shadow-[0_12px_30px_-12px_rgba(0,0,0,0.55)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(to bottom, #9BEC00 0%, #06D001 100%)'
              }}
            >
              <AppleIcon />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[0.65rem] uppercase tracking-wide opacity-70">
                  Télécharger sur
                </span>
                <span className="text-base">App Store</span>
              </span>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=xyz.dodje.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white text-dodje-ink font-arboria font-bold shadow-[0_12px_30px_-8px_rgba(255,255,255,0.25)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] active:scale-[0.98]"
            >
              <GooglePlayIcon />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[0.65rem] uppercase tracking-wide opacity-70">
                  Disponible sur
                </span>
                <span className="text-base">Google Play</span>
              </span>
            </a>
          </div>

          {/* Trust note */}
          <p
            className="text-xs sm:text-sm font-arboria text-white/55 max-w-xl mt-2 motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
            style={{ animationDelay: '1000ms' }}
          >
            {TRUST_NOTE}
          </p>
        </div>

        {/* RIGHT: Mascotte with floating bob.
            Green halo behind mascot removed for a calmer, less neon look. */}
        <div className="relative flex items-center justify-center min-h-[420px] lg:min-h-[1040px]">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Mascotte Dodje qui salue"
            width={1200}
            height={1200}
            style={{
              transform: 'translateZ(0)',
              pointerEvents: 'none'
            }}
            className="relative z-10 w-[560px] sm:w-[820px] lg:w-[1080px] xl:w-[1200px] max-w-full select-none drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)] motion-safe:animate-[heroMascot_900ms_cubic-bezier(0.4,0,0.2,1)_300ms_both]"
          >
            <source src={salutWebm} type="video/webm" />
            <source src={salutMp4} type="video/mp4" />
          </video>
        </div>
       </div>

        {/* Scroll cue — placed under the trust note, horizontally centered
            across the viewport (in flow so it follows the trust note vertically
            on every breakpoint instead of being anchored to the viewport). */}
        <a
          href="#stats"
          aria-label="Découvre la suite"
          className="mx-auto mt-2 z-20 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors motion-safe:animate-[heroFadeIn_800ms_ease_1400ms_both]"
        >
          <span className="text-[0.7rem] uppercase tracking-[0.25em] font-arboria">
            Découvre
          </span>
          <span
            className="inline-flex motion-safe:animate-[scrollCue_1.8s_ease-in-out_infinite]"
          >
            <ArrowDown size={20} strokeWidth={2.25} />
          </span>
        </a>
      </div>
    </section>
  );
}
