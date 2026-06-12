import { useEffect, useRef, useState } from 'react';

type UseInViewOptions = {
  once?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useInView({
  once = true,
  rootMargin = '0px',
  threshold = 0
}: UseInViewOptions = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setInView(true);
        if (once) observer.disconnect();
      },
      { rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
