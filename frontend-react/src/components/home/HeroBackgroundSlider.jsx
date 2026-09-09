import { useState, useEffect, useRef, useCallback } from 'react';

import gaming1 from '../../assets/hero/gaming-1.jpg';
import gaming2 from '../../assets/hero/gaming-2.jpg';
import gaming3 from '../../assets/hero/gaming-3.jpg';
import gaming4 from '../../assets/hero/gaming-4.jpg';

const HERO_SLIDES = [
  { id: 'slide-1', image: gaming1, alt: 'Cyberpunk Night City Action' },
  { id: 'slide-2', image: gaming2, alt: 'Tactical Combat Battlefield' },
  { id: 'slide-3', image: gaming3, alt: 'Dark Fantasy Mountain Realm' },
  { id: 'slide-4', image: gaming4, alt: 'Futuristic PC Gaming World' },
];

export default function HeroBackgroundSlider({ activeIndex, onSlideChange }) {
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = typeof activeIndex === 'number';
  const currentIndex = isControlled ? activeIndex : internalIndex;
  const timerRef = useRef(null);

  const setSlide = useCallback((index) => {
    const nextIndex = (index + HERO_SLIDES.length) % HERO_SLIDES.length;
    if (onSlideChange) onSlideChange(nextIndex);
    if (!isControlled) setInternalIndex(nextIndex);
  }, [isControlled, onSlideChange]);

  const handleNext = () => setSlide(currentIndex + 1);
  const handlePrev = () => setSlide(currentIndex - 1);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    timerRef.current = setInterval(() => {
      setSlide(currentIndex + 1);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, setSlide]);

  return (
    <div className="hero-slider-wrapper" aria-hidden="true">
      {/* Background Image Slides */}
      <div className="hero-slides-container">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`hero-slide-item ${isActive ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${slide.image})`,
              }}
            />
          );
        })}
      </div>

      {/* Cinematic Dark Navy & Vignette Overlays */}
      <div className="hero-overlay-gradient-left" />
      <div className="hero-overlay-gradient-bottom" />
      <div className="hero-overlay-vignette" />

      {/* Subtle Prev / Next Arrow Controls */}
      <button
        type="button"
        className="hero-arrow-btn hero-arrow-prev"
        onClick={handlePrev}
        aria-label="Previous gaming slide"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        className="hero-arrow-btn hero-arrow-next"
        onClick={handleNext}
        aria-label="Next gaming slide"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Slider Pill Indicators */}
      <div className="hero-indicators-bar" role="tablist" aria-label="Hero background slides">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Slide ${idx + 1}`}
              className={`hero-indicator-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSlide(idx)}
            />
          );
        })}
      </div>

      {/* Right side aesthetic accent label */}
      <div className="hero-side-watermark">
        <span>PLAY</span>
        <span>ANALYZE</span>
        <span className="accent-line">UPGRADE</span>
      </div>
    </div>
  );
}
