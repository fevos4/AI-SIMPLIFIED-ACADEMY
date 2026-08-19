'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px',
    });

    const observeElements = () => {
      const targets = document.querySelectorAll(
        '.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-left, .scroll-reveal-right, section, article, .fidel-card'
      );

      targets.forEach((el) => {
        if (!el.classList.contains('is-revealed') && !el.classList.contains('no-scroll-reveal')) {
          if (!el.classList.contains('scroll-reveal') &&
              !el.classList.contains('scroll-reveal-scale') &&
              !el.classList.contains('scroll-reveal-left') &&
              !el.classList.contains('scroll-reveal-right')) {
            el.classList.add('scroll-reveal');
          }
          observer.observe(el);
        }
      });
    };

    observeElements();

    // Re-observe if DOM updates
    const timer = setTimeout(observeElements, 400);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
