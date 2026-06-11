import { StrictMode, Suspense, lazy, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import Hero from './components/Hero';
import './index.css';

// Below-fold islands lazy-load so the initial bundle only ships Hero +
// React + framer-motion. Lottie / Stats / Pillars / Features only fetch
// their chunk when the user scrolls past Hero.
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

for (const { id, render, eager } of islands) {
  const el = document.getElementById(id);
  if (!el) continue;
  const node = eager
    ? render()
    : <Suspense fallback={null}>{render()}</Suspense>;
  createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
