document.addEventListener("DOMContentLoaded", () => {
  // Statistics counter configuration
  const statCounters = [
    {
      element: document.querySelector(".aiq-stat-value:nth-of-type(1)"),
      finalValue: 12077,
      duration: 2000,
      increment: 100,
    },
    {
      element: document.querySelector(".aiq-stat-value:nth-of-type(2)"),
      finalValue: 5320,
      duration: 1500,
      increment: 50,
    },
    {
      element: document.querySelector(".aiq-stat-value:nth-of-type(3)"),
      finalValue: 34,
      duration: 1000,
      increment: 1,
    },
    {
      element: document.querySelector(".aiq-stat-value:nth-of-type(4)"),
      finalValue: 1200000,
      duration: 2500,
      increment: 5000,
      formatter: (value) => value.toLocaleString(),
    },
  ];

  // Intersection Observer setup for scroll-triggered animation
  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        statCounters.forEach((counter) => {
          animateCounter(counter);
        });
        observer.disconnect();
      }
    });
  }, observerOptions);

  // Observe the stats section
  const statsSection = document.querySelector(".aiq-stats-section");
  if (statsSection) {
    observer.observe(statsSection);
  }

  /**
   * Smoothly animates a counter from 0 to final value
   * @param {Object} config - Counter configuration
   * @param {HTMLElement} config.element - DOM element to animate
   * @param {number} config.finalValue - Target value
   * @param {number} config.duration - Animation duration in ms
   * @param {number} config.increment - Value increment per frame
   * @param {Function} [config.formatter] - Optional value formatter
   */
  function animateCounter({
    element,
    finalValue,
    duration,
    increment,
    formatter,
  }) {
    const startTime = performance.now();
    const step = (timestamp) => {
      const runtime = timestamp - startTime;
      const progress = Math.min(runtime / duration, 1);
      const currentValue = Math.floor(progress * finalValue);

      // Apply formatting if provided
      element.textContent = formatter
        ? formatter(currentValue)
        : currentValue.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure final value is exact
        element.textContent = formatter
          ? formatter(finalValue)
          : finalValue.toLocaleString();
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Fallback for browsers without IntersectionObserver
   */
  if (!("IntersectionObserver" in window)) {
    statCounters.forEach((counter) => {
      animateCounter(counter);
    });
  }
});
