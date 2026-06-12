import { StrictMode, Suspense, lazy, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import Hero from './components/Hero';
import './index.css';
import '../script.js';

// Below-fold islands lazy-load so the initial bundle only ships Hero +
// React. Lottie / Stats / Pillars / Features only fetch their chunk when
// their section enters the viewport.
const Stats = lazy(() => import('./components/Stats'));
const Pillars = lazy(() => import('./components/Pillars'));
const App = lazy(() => import('./App'));
const Features = lazy(() => import('./components/Features'));

type Island = { id: string; render: () => JSX.Element; eager?: boolean };

const islands: Island[] = [
  { id: 'hero-root', render: () => <Hero />, eager: true },
  { id: 'stats-root', render: () => <Stats /> },
  { id: 'pillars-root', render: () => <Pillars /> },
  { id: 'carousel-root', render: () => <App /> },
  { id: 'features-root', render: () => <Features /> }
];

function mountIsland(el: HTMLElement, render: () => JSX.Element, eager?: boolean) {
  const node = eager
    ? render()
    : <Suspense fallback={null}>{render()}</Suspense>;

  createRoot(el).render(<StrictMode>{node}</StrictMode>);
}

function mountWhenNearViewport(el: HTMLElement, render: () => JSX.Element) {
  if (!('IntersectionObserver' in window)) {
    mountIsland(el, render);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      mountIsland(el, render);
    },
    {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.12
    }
  );

  observer.observe(el);
}

const SCROLL_TO_KEY = 'dodje-scroll-to';

function getScrollTarget(): string | null {
  const fromStorage = sessionStorage.getItem(SCROLL_TO_KEY);
  if (fromStorage) {
    sessionStorage.removeItem(SCROLL_TO_KEY);
    return fromStorage;
  }

  const hash = window.location.hash.slice(1);
  if (hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return hash;
  }

  return null;
}

const scrollTarget = getScrollTarget();
const sectionIslandMap: Record<string, string> = {
  stats: 'stats-root',
  pillars: 'pillars-root',
  batiments: 'carousel-root',
  features: 'features-root'
};

function shouldEagerMount(islandId: string): boolean {
  if (!scrollTarget) return false;
  return sectionIslandMap[scrollTarget] === islandId;
}

function scrollToSection(retries = 30) {
  if (!scrollTarget) return;

  const target = document.getElementById(scrollTarget);
  if (target) {
    const offsetTop = target.offsetTop - 80;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    return;
  }

  if (retries > 0) {
    window.setTimeout(() => scrollToSection(retries - 1), 100);
  }
}

for (const { id, render, eager } of islands) {
  const el = document.getElementById(id);
  if (!el) continue;

  if (eager || shouldEagerMount(id)) {
    mountIsland(el, render, true);
  } else {
    mountWhenNearViewport(el, render);
  }
}

if (scrollTarget) {
  scrollToSection();
}
