/* ==========================================================================
   JYSA MEDIA — MAIN FRONTEND SCRIPT (main.js)
   
   Architecture Overview:
   1. Configuration & Runtime Environment
   2. Header & Navigation (Desktop Sticky + Mobile Drawer)
   3. Scroll Reveal & Section Transition Lines
   4. 3D Interactive Cube (About Us Section)
   5. Services 3D Stacked Card Deck (Desktop & Mobile/Tablet)
   6. Case Study & Team Cards Tilt Interaction
   7. "Let's Talk" Modal Dialog (Lifecycle & Global Interceptor)
   8. Contact Form Submission & Button Micro-Animation
   ========================================================================== */

/* ==========================================================================
   1. CONFIGURATION & RUNTIME ENVIRONMENT
   ========================================================================== */

/**
 * Resolves the backend API base URL:
 * - In local development (localhost / 127.0.0.1): routes to backend port 3001
 * - In production (jysamedia.in): uses same-origin relative path (/api/*)
 */
const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001"
    : "";

/** Page initialization timestamp for bot timing checks */
const pageInitTime = Date.now();

/**
 * Google Analytics 4 (GA4) Google tag / gtag.js:
 * Non-blocking deferred loading to eliminate main-thread contention during the critical first render.
 * Triggered upon first user interaction (scroll, touchstart, pointerdown, keydown)
 * or via a safe post-load idle fallback.
 * Preserves the existing inline dataLayer and gtag() configuration from <head>.
 * GA4 script is injected at most once.
 */
let ga4Loaded = false;
function loadGA4() {
  if (ga4Loaded) return;
  ga4Loaded = true;
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-RQL53KWCX2";
  document.head.appendChild(script);
}

const ga4TriggerEvents = ["scroll", "touchstart", "pointerdown", "keydown"];
ga4TriggerEvents.forEach((evt) => {
  window.addEventListener(evt, loadGA4, { once: true, passive: true });
});

window.addEventListener("load", () => {
  setTimeout(() => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadGA4);
    } else {
      loadGA4();
    }
  }, 3500);
});

/* ==========================================================================
   2. HEADER & NAVIGATION (Desktop Sticky + Mobile Drawer)
   ========================================================================== */

const header = document.querySelector("#siteHeader");
const nav = document.querySelector("#siteNav");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];

/**
 * Toggles header backdrop blur & shadow based on scroll offset.
 */
function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);
}

window.addEventListener("scroll", updateHeader, { passive: true });
if ("requestIdleCallback" in window) {
  requestIdleCallback(updateHeader);
} else {
  requestAnimationFrame(updateHeader);
}

/**
 * Closes the mobile navigation drawer and updates aria attributes.
 */
function closeMenu() {
  nav?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

nav?.querySelector(".nav-talk-cta")?.addEventListener("click", closeMenu);

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    closeMenu();
  }
});

/* ==========================================================================
   3. SCROLL REVEAL & SECTION TRANSITIONS
   ========================================================================== */

/**
 * Scroll Reveal: Adds .is-visible class when elements enter viewport.
 */
const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

/**
 * Section Transition Lines: Calculates scroll depth between homepage sections
 * to smoothly expand and fade the divider lines.
 */
const transitionSections = [
  ...document.querySelectorAll("main > .section:not(.hero)")
];

function updateSectionTransitionAnimation() {
  const viewportHeight = window.innerHeight;
  const measurements = [];

  // Phase 1: Batch all layout reads without mutating styles (eliminates forced reflow)
  for (let i = 0; i < transitionSections.length; i++) {
    const section = transitionSections[i];
    const line = section.querySelector(".section-transition-line");
    if (!line) {
      continue;
    }
    const rect = section.getBoundingClientRect();
    measurements.push({ line, bottom: rect.bottom });
  }

  // Phase 2: Batch all style writes with no interleaved reads
  const transitionZone = Math.max(viewportHeight * 0.3, 180);
  for (let i = 0; i < measurements.length; i++) {
    const { line, bottom } = measurements[i];
    const distanceFromViewportBottom = viewportHeight - bottom;
    const progress = Math.min(1, Math.max(0, distanceFromViewportBottom / transitionZone));
    const opacity = Math.min(1, progress * 3);

    line.style.setProperty("--transition-progress", progress.toFixed(3));
    line.style.setProperty("--transition-opacity", opacity.toFixed(3));
  }
}

let sectionTransitionFrame = 0;

window.addEventListener(
  "scroll",
  () => {
    if (sectionTransitionFrame) {
      return;
    }
    sectionTransitionFrame = requestAnimationFrame(() => {
      updateSectionTransitionAnimation();
      sectionTransitionFrame = 0;
    });
  },
  { passive: true }
);

window.addEventListener("resize", updateSectionTransitionAnimation);

// Defer initial layout calculations until after the initial paint to prevent startup forced reflow
if ("requestIdleCallback" in window) {
  requestIdleCallback(updateSectionTransitionAnimation);
} else {
  requestAnimationFrame(updateSectionTransitionAnimation);
}

/* ==========================================================================
   4. 3D INTERACTIVE CUBE (ABOUT US SECTION)
   ========================================================================== */

const cube = document.querySelector(".cube");

if (cube) {
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let rotationX = -20;
  let rotationY = 30;
  let rotationZ = 0;
  let lastFrame = performance.now();
  let lastPointerX = null;
  let lastPointerY = null;

  /**
   * Continuous auto-rotation animation loop.
   */
  function renderCube(now) {
    const deltaSeconds = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    rotationX += 9 * deltaSeconds;
    rotationY += 14 * deltaSeconds;
    rotationZ += 2 * deltaSeconds;

    cube.style.transform = `
      translate(-50%, -50%)
      rotateX(${rotationX}deg)
      rotateY(${rotationY}deg)
      rotateZ(${rotationZ}deg)
    `;

    requestAnimationFrame(renderCube);
  }

  // Interactive mouse drag to rotate the cube
  if (supportsFinePointer) {
    const scene = cube.closest(".about-scene");

    scene?.addEventListener("pointermove", (event) => {
      if (lastPointerX === null || lastPointerY === null) {
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        return;
      }

      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;

      rotationY += deltaX * 0.45;
      rotationX -= deltaY * 0.45;

      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    });

    scene?.addEventListener("pointerleave", () => {
      lastPointerX = null;
      lastPointerY = null;
    });
  }

  requestAnimationFrame(renderCube);
}

/* ==========================================================================
   5. SERVICES 3D STACKED CARD DECK
   ========================================================================== */

const servicesStack = document.querySelector("[data-services-stack]");

if (servicesStack) {
  const stackStage = servicesStack.querySelector(".services-stack-stage");
  const stackCards = [...servicesStack.querySelectorAll(".service-stack-card")];
  const stackCount = stackCards.length;
  let activeServiceIndex = 0;
  let isCursorTargeting = false;
  let isSectionInView = false;
  let pendingTargetCardIndex = null;
  let hoverTimer = null;
  let autoTimer = null;
  let activeGhosts = [];
  let transitionCleanupTimer = null;

  // Mobile continuous drag tracking state
  let touchActive = false;
  let isDragging = false;
  let hasDragged = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastTouchX = 0;
  let lastTouchTime = 0;
  let touchVelocityX = 0;
  let startActiveIndex = 0;
  let isLockedHorizontal = false;
  let isLockedVertical = false;

  const AUTO_HOLD_MS = 3800; // 2.6s reading hold + 1.2s smooth transition

  /**
   * Responsive slot definitions mapping stack positions (-4 to +4)
   * to 3D transforms, rotation angles, z-depth, and opacity.
   */
  function getSlotDefinitions() {
    const width = window.innerWidth;

    if (width <= 360) {
      return {
        0:    { x: 0,   y: 0,  rotate: 0, scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 18,  y: 8,  rotate: 0, scale: 0.97, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 36,  y: 16, rotate: 0, scale: 0.94, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 48,  y: 24, rotate: 0, scale: 0.91, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 56,  y: 30, rotate: 0, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -18, y: 8,  rotate: 0, scale: 0.97, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -36, y: 16, rotate: 0, scale: 0.94, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -48, y: 24, rotate: 0, scale: 0.91, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -56, y: 30, rotate: 0, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    if (width <= 480) {
      return {
        0:    { x: 0,   y: 0,  rotate: 0, scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 25,  y: 8,  rotate: 0, scale: 0.97, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 50,  y: 16, rotate: 0, scale: 0.94, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 65,  y: 24, rotate: 0, scale: 0.91, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 75,  y: 30, rotate: 0, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -25, y: 8,  rotate: 0, scale: 0.97, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -50, y: 16, rotate: 0, scale: 0.94, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -65, y: 24, rotate: 0, scale: 0.91, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -75, y: 30, rotate: 0, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    if (width <= 768) {
      return {
        0:    { x: 0,    y: 0,  rotate: 0, scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 65,   y: 10, rotate: 0, scale: 0.97, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 130,  y: 20, rotate: 0, scale: 0.94, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 195,  y: 30, rotate: 0, scale: 0.91, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 225,  y: 38, rotate: 0, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -65,  y: 10, rotate: 0, scale: 0.97, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -130, y: 20, rotate: 0, scale: 0.94, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -195, y: 30, rotate: 0, scale: 0.91, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -225, y: 38, rotate: 0, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    if (width <= 1100) {
      return {
        0:    { x: 0,    y: 0,  rotate: 0, scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 105,  y: 14, rotate: 0, scale: 0.98, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 210,  y: 28, rotate: 0, scale: 0.96, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 315,  y: 42, rotate: 0, scale: 0.94, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 360,  y: 50, rotate: 0, scale: 0.91, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -105, y: 14, rotate: 0, scale: 0.98, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -210, y: 28, rotate: 0, scale: 0.96, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -315, y: 42, rotate: 0, scale: 0.94, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -360, y: 50, rotate: 0, scale: 0.91, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    let outerX = 530;

    if (width <= 1280) {
      outerX = 465;
    } else if (width <= 1366) {
      outerX = 500;
    }

    const exitX = Math.round(outerX + (outerX - 410) * 0.9);

    return {
      0:    { x: 0,       y: 0,  rotate: 0, scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
      1:    { x: 205,     y: 14, rotate: 0, scale: 0.98, zDepth: 18,  zIndex: 60, opacity: 1 },
      2:    { x: 410,     y: 28, rotate: 0, scale: 0.96, zDepth: 6,   zIndex: 50, opacity: 1 },
      3:    { x: outerX,  y: 42, rotate: 0, scale: 0.94, zDepth: -6,  zIndex: 40, opacity: 1 },
      4:    { x: exitX,   y: 54, rotate: 0, scale: 0.91, zDepth: -20, zIndex: 25, opacity: 0 },
      [-1]: { x: -205,    y: 14, rotate: 0, scale: 0.98, zDepth: 18,  zIndex: 55, opacity: 1 },
      [-2]: { x: -410,    y: 28, rotate: 0, scale: 0.96, zDepth: 6,   zIndex: 45, opacity: 1 },
      [-3]: { x: -outerX, y: 42, rotate: 0, scale: 0.94, zDepth: -6,  zIndex: 35, opacity: 1 },
      [-4]: { x: -exitX,  y: 54, rotate: 0, scale: 0.91, zDepth: -20, zIndex: 25, opacity: 0 }
    };
  }

  function getSlotForCard(cardIndex, activeIndex) {
    return ((cardIndex - activeIndex + 10) % 7) - 3;
  }

  function applySlotStyles(element, slotData, immediate = false) {
    if (immediate) {
      element.style.transition = "none";
    } else {
      element.style.transition = "";
    }

    element.style.zIndex = String(slotData.zIndex);
    element.style.opacity = String(slotData.opacity);
    element.style.transform = `
      translate3d(calc(-50% + ${slotData.x}px), calc(-50% + ${slotData.y}px), ${slotData.zDepth}px)
      rotateZ(${slotData.rotate}deg)
      rotateX(0deg)
      rotateY(0deg)
      scale(${slotData.scale})
    `;

    const isActive = slotData.zIndex === 70;
    element.classList.toggle("is-active-card", isActive);
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (isActive) {
        element.removeAttribute("aria-hidden");
        element.removeAttribute("tabindex");
      } else {
        element.setAttribute("aria-hidden", "true");
        element.setAttribute("tabindex", "-1");
      }
    } else {
      element.removeAttribute("aria-hidden");
      element.removeAttribute("tabindex");
    }
    element.style.boxShadow = isActive
      ? "0 26px 52px rgba(227, 19, 36, 0.16), 0 0 0 1px rgba(227, 19, 36, 0.05)"
      : "0 14px 30px rgba(227, 19, 36, 0.07)";
  }

  /**
   * Interpolates slot properties between two discrete slots for fluid continuous dragging.
   */
  function interpolateSlotData(slotA, slotB, t) {
    return {
      x: slotA.x + (slotB.x - slotA.x) * t,
      y: slotA.y + (slotB.y - slotA.y) * t,
      rotate: slotA.rotate + (slotB.rotate - slotA.rotate) * t,
      scale: slotA.scale + (slotB.scale - slotA.scale) * t,
      zDepth: slotA.zDepth + (slotB.zDepth - slotA.zDepth) * t,
      opacity: slotA.opacity + (slotB.opacity - slotA.opacity) * t
    };
  }

  /**
   * Calculates interpolated slot styling for any fractional slot index s in [-4, 4].
   */
  function getContinuousSlotData(slots, s) {
    const clampedS = Math.max(-4, Math.min(4, s));
    const lower = Math.floor(clampedS);
    const upper = Math.ceil(clampedS);
    if (lower === upper) {
      return slots[lower] || slots[0];
    }
    const t = clampedS - lower;
    const slotA = slots[lower] || slots[-4];
    const slotB = slots[upper] || slots[4];
    return interpolateSlotData(slotA, slotB, t);
  }

  /**
   * Updates all cards continuously to match finger movement without transitions or jitter.
   */
  function renderContinuousDeck(virtualActiveIndex) {
    const slots = getSlotDefinitions();
    stackCards.forEach((card, i) => {
      const rawOffset = i - virtualActiveIndex;
      let s = ((rawOffset % 7) + 7) % 7;
      if (s >= 3.5) s -= 7;

      const slotData = getContinuousSlotData(slots, s);
      const distFromCenter = Math.abs(s);

      card.style.transition = "none";
      const zIndex = Math.max(10, Math.round(70 - distFromCenter * 12 + (s > 0 ? 1 : 0)));
      card.style.zIndex = String(zIndex);
      card.style.opacity = String(slotData.opacity);
      card.style.transform = `
        translate3d(calc(-50% + ${slotData.x.toFixed(2)}px), calc(-50% + ${slotData.y.toFixed(2)}px), ${slotData.zDepth.toFixed(2)}px)
        rotateZ(${slotData.rotate.toFixed(2)}deg)
        rotateX(0deg)
        rotateY(0deg)
        scale(${slotData.scale.toFixed(4)})
      `;
      const isActive = distFromCenter < 0.45;
      card.style.boxShadow = isActive
        ? "0 26px 52px rgba(227, 19, 36, 0.16), 0 0 0 1px rgba(227, 19, 36, 0.05)"
        : "0 14px 30px rgba(227, 19, 36, 0.07)";
    });
  }

  /**
   * Smoothly settles the nearest card into the front/center position upon gesture release.
   */
  function settleToCard(targetIndex) {
    const normalizedTarget = ((targetIndex % stackCount) + stackCount) % stackCount;
    activeServiceIndex = normalizedTarget;
    const slots = getSlotDefinitions();

    clearGhosts();

    stackCards.forEach((card, i) => {
      const targetSlot = getSlotForCard(i, activeServiceIndex);
      const slotData = slots[targetSlot];

      card.style.transition =
        "transform 0.45s cubic-bezier(0.22, 0.78, 0.2, 1), opacity 0.45s cubic-bezier(0.22, 0.78, 0.2, 1), box-shadow 0.45s ease";
      card.style.zIndex = String(slotData.zIndex);
      card.style.opacity = String(slotData.opacity);
      card.style.transform = `
        translate3d(calc(-50% + ${slotData.x}px), calc(-50% + ${slotData.y}px), ${slotData.zDepth}px)
        rotateZ(${slotData.rotate}deg)
        rotateX(0deg)
        rotateY(0deg)
        scale(${slotData.scale})
      `;
      const isActive = slotData.zIndex === 70;
      card.classList.toggle("is-active-card", isActive);
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        if (isActive) {
          card.removeAttribute("aria-hidden");
          card.removeAttribute("tabindex");
        } else {
          card.setAttribute("aria-hidden", "true");
          card.setAttribute("tabindex", "-1");
        }
      } else {
        card.removeAttribute("aria-hidden");
        card.removeAttribute("tabindex");
      }
      card.style.boxShadow = isActive
        ? "0 26px 52px rgba(227, 19, 36, 0.16), 0 0 0 1px rgba(227, 19, 36, 0.05)"
        : "0 14px 30px rgba(227, 19, 36, 0.07)";
    });

    if (transitionCleanupTimer) {
      window.clearTimeout(transitionCleanupTimer);
    }
    transitionCleanupTimer = window.setTimeout(() => {
      stackCards.forEach((card) => {
        card.style.transition = "";
      });
      transitionCleanupTimer = null;
    }, 460);
  }

  function clearGhosts() {
    if (transitionCleanupTimer) {
      window.clearTimeout(transitionCleanupTimer);
      transitionCleanupTimer = null;
    }
    activeGhosts.forEach((ghost) => {
      if (ghost && ghost.parentNode) {
        ghost.remove();
      }
    });
    activeGhosts = [];
    if (stackStage) {
      stackStage.querySelectorAll(".service-card-ghost").forEach((g) => g.remove());
    }
  }

  function renderInitialDeck() {
    const slots = getSlotDefinitions();
    const isMobile = window.innerWidth <= 768;
    stackCards.forEach((card, index) => {
      card.classList.add("is-stack-card");
      const slot = getSlotForCard(index, activeServiceIndex);
      applySlotStyles(card, slots[slot], true);
      const isActive = slot === 0;
      card.classList.toggle("is-active-card", isActive);
      if (isMobile) {
        if (isActive) {
          card.removeAttribute("aria-hidden");
          card.removeAttribute("tabindex");
        } else {
          card.setAttribute("aria-hidden", "true");
          card.setAttribute("tabindex", "-1");
        }
      } else {
        card.removeAttribute("aria-hidden");
        card.removeAttribute("tabindex");
      }
    });
  }

  function setActiveService(nextIndex) {
    const normalizedNext = (nextIndex % stackCount + stackCount) % stackCount;
    if (normalizedNext === activeServiceIndex) {
      return;
    }

    clearGhosts();

    const slots = getSlotDefinitions();
    const oldActive = activeServiceIndex;
    let delta = (normalizedNext - oldActive) % 7;
    if (delta > 3) delta -= 7;
    if (delta < -3) delta += 7;

    const isDesktop = window.innerWidth > 1100;

    if (isDesktop) {
      // --------------------------------------------------
      // DESKTOP: Smooth ghost clone system for wraparound
      // --------------------------------------------------
      stackCards.forEach((card, i) => {
        const oldSlot = getSlotForCard(i, oldActive);
        const newSlot = getSlotForCard(i, normalizedNext);
        const isWrap = Math.abs(newSlot - oldSlot) > Math.abs(delta);

        if (!isWrap) {
          applySlotStyles(card, slots[newSlot], false);
        } else {
          if (delta > 0) {
            const ghost = card.cloneNode(true);
            ghost.classList.add("service-card-ghost");
            applySlotStyles(ghost, slots[oldSlot], true);
            stackStage.appendChild(ghost);
            activeGhosts.push(ghost);
            ghost.addEventListener("transitionend", () => {
              if (ghost.parentNode) ghost.remove();
            }, { once: true });

            void ghost.offsetHeight;
            applySlotStyles(ghost, slots[-4], false);

            applySlotStyles(card, slots[4], true);
            void card.offsetHeight;
            applySlotStyles(card, slots[newSlot], false);
          } else {
            const ghost = card.cloneNode(true);
            ghost.classList.add("service-card-ghost");
            applySlotStyles(ghost, slots[oldSlot], true);
            stackStage.appendChild(ghost);
            activeGhosts.push(ghost);
            ghost.addEventListener("transitionend", () => {
              if (ghost.parentNode) ghost.remove();
            }, { once: true });

            void ghost.offsetHeight;
            applySlotStyles(ghost, slots[4], false);

            applySlotStyles(card, slots[-4], true);
            void card.offsetHeight;
            applySlotStyles(card, slots[newSlot], false);
          }
        }
      });

      activeServiceIndex = normalizedNext;

      transitionCleanupTimer = window.setTimeout(() => {
        const currentSlots = getSlotDefinitions();
        stackCards.forEach((card, i) => {
          const currentSlot = getSlotForCard(i, activeServiceIndex);
          applySlotStyles(card, currentSlots[currentSlot], true);
        });
        requestAnimationFrame(() => {
          stackCards.forEach((card) => {
            card.style.transition = "";
          });
        });
        clearGhosts();
      }, 1220);

      return;
    }

    // --------------------------------------------------
    // MOBILE / TABLET: Seamless rear glide system
    // --------------------------------------------------
    stackCards.forEach((card, i) => {
      const oldSlot = getSlotForCard(i, oldActive);
      const newSlot = getSlotForCard(i, normalizedNext);
      const isWrap = Math.abs(newSlot - oldSlot) > Math.abs(delta);

      if (!isWrap) {
        applySlotStyles(card, slots[newSlot], false);
      } else {
        card.style.transition = "";
        card.style.zIndex = "20";
        card.style.opacity = "1";
        card.style.transform = `
          translate3d(calc(-50% + ${slots[newSlot].x}px), calc(-50% + ${slots[newSlot].y}px), -36px)
          rotateZ(${slots[newSlot].rotate}deg)
          rotateX(0deg)
          rotateY(0deg)
          scale(${slots[newSlot].scale})
        `;
        card.style.boxShadow = "0 14px 30px rgba(227, 19, 36, 0.07)";
      }
    });

    activeServiceIndex = normalizedNext;

    transitionCleanupTimer = window.setTimeout(() => {
      if (activeServiceIndex === normalizedNext) {
        const currentSlots = getSlotDefinitions();
        stackCards.forEach((card, i) => {
          const currentSlot = getSlotForCard(i, activeServiceIndex);
          card.style.zIndex = String(currentSlots[currentSlot].zIndex);
          card.style.transform = `
            translate3d(calc(-50% + ${currentSlots[currentSlot].x}px), calc(-50% + ${currentSlots[currentSlot].y}px), ${currentSlots[currentSlot].zDepth}px)
            rotateZ(${currentSlots[currentSlot].rotate}deg)
            rotateX(0deg)
            rotateY(0deg)
            scale(${currentSlots[currentSlot].scale})
          `;
        });
      }
    }, 1210);
  }

  // Auto-cycle handling
  function stopAutoCycle() {
    if (autoTimer !== null) {
      window.clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function scheduleNextCycle(delay = AUTO_HOLD_MS) {
    stopAutoCycle();
    if (!isSectionInView || isCursorTargeting || isDragging || touchActive || document.hidden) {
      return;
    }

    autoTimer = window.setTimeout(() => {
      if (!isSectionInView || isCursorTargeting || isDragging || touchActive || document.hidden) {
        return;
      }
      setActiveService(activeServiceIndex + 1);
      scheduleNextCycle(AUTO_HOLD_MS);
    }, delay);
  }

  function startAutoCycle(delay = AUTO_HOLD_MS) {
    scheduleNextCycle(delay);
  }

  function getCardIndexFromPointer(event) {
    const card = event.target.closest(".service-stack-card:not(.service-card-ghost)");
    if (card && card.dataset.serviceIndex !== undefined) {
      return parseInt(card.dataset.serviceIndex, 10);
    }

    const rect = stackStage.getBoundingClientRect();
    const slots = getSlotDefinitions();
    const localX = event.clientX - rect.left - rect.width / 2;
    const localY = event.clientY - rect.top;
    const verticalTolerance = Math.min(rect.height * 0.46, 245);

    if (Math.abs(localY - rect.height / 2) > verticalTolerance) {
      return null;
    }

    let nearestSlot = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    [-3, -2, -1, 0, 1, 2, 3].forEach((slotNum) => {
      const dist = Math.abs(localX - slots[slotNum].x);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestSlot = slotNum;
      }
    });

    const slotSpacing = slots[1].x - slots[0].x;
    const switchThreshold = Math.max(58, slotSpacing * 0.45);
    if (nearestDistance > switchThreshold) {
      return null;
    }

    return (activeServiceIndex + nearestSlot + 7) % 7;
  }

  function handlePointerHover(cardIndex) {
    if (cardIndex === null || cardIndex === activeServiceIndex) {
      if (cardIndex === activeServiceIndex) {
        if (hoverTimer) {
          window.clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        pendingTargetCardIndex = null;
      }
      return;
    }

    if (cardIndex === pendingTargetCardIndex) {
      return;
    }

    pendingTargetCardIndex = cardIndex;
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
    }

    hoverTimer = window.setTimeout(() => {
      if (isCursorTargeting && pendingTargetCardIndex !== null) {
        setActiveService(pendingTargetCardIndex);
      }
    }, 140);
  }

  // Pointer & Mouse interactions
  stackStage.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      isCursorTargeting = true;
      stopAutoCycle();
    }
  });

  stackStage.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") {
      isCursorTargeting = true;
      stopAutoCycle();
      handlePointerHover(getCardIndexFromPointer(event));
    }
  });

  function handlePointerLeave(event) {
    if (event.pointerType === "mouse") {
      if (hoverTimer) {
        window.clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      pendingTargetCardIndex = null;
      isCursorTargeting = false;
      if (isSectionInView) {
        startAutoCycle(AUTO_HOLD_MS);
      }
    }
  }

  stackStage.addEventListener("pointerleave", handlePointerLeave);
  servicesStack.addEventListener("pointerleave", handlePointerLeave);

  // Touch continuous drag interactions (mobile & tablet)
  stackStage.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }
    touchActive = true;
    isDragging = false;
    hasDragged = false;
    isLockedHorizontal = false;
    isLockedVertical = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    lastTouchX = event.clientX;
    lastTouchTime = performance.now();
    touchVelocityX = 0;
    startActiveIndex = activeServiceIndex;
    stopAutoCycle();
    if (transitionCleanupTimer) {
      window.clearTimeout(transitionCleanupTimer);
      transitionCleanupTimer = null;
    }
  });

  stackStage.addEventListener("pointermove", (event) => {
    if (!touchActive || (event.pointerType !== "touch" && event.pointerType !== "pen")) {
      return;
    }

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    if (!isLockedHorizontal && !isLockedVertical) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absY > 7 && absY > absX) {
        // Yield immediately to normal vertical page scrolling
        isLockedVertical = true;
        touchActive = false;
        if (isSectionInView) {
          startAutoCycle(AUTO_HOLD_MS);
        }
        return;
      } else if (absX > 7 && absX >= absY) {
        isLockedHorizontal = true;
        isDragging = true;
        hasDragged = true;
        try {
          stackStage.setPointerCapture(event.pointerId);
        } catch (_) {}
      }
    }

    if (!isLockedHorizontal) {
      return;
    }

    // Track horizontal velocity for flick detection
    const now = performance.now();
    const dt = now - lastTouchTime;
    if (dt > 8) {
      touchVelocityX = (event.clientX - lastTouchX) / dt;
      lastTouchX = event.clientX;
      lastTouchTime = now;
    }

    const sensitivity = Math.max(100, Math.min(window.innerWidth * 0.35, 140));
    // Finger LEFT (deltaX < 0) => progress positive => cards move LEFT, next card comes toward FRONT/CENTER
    // Finger RIGHT (deltaX > 0) => progress negative => cards move RIGHT, prev card comes toward FRONT/CENTER
    const progress = -deltaX / sensitivity;
    const virtualActiveIndex = startActiveIndex + progress;

    renderContinuousDeck(virtualActiveIndex);
  });

  function handleTouchEnd(event) {
    if (!touchActive && !isDragging) {
      return;
    }

    try {
      if (stackStage.hasPointerCapture(event.pointerId)) {
        stackStage.releasePointerCapture(event.pointerId);
      }
    } catch (_) {}

    if (isDragging) {
      const deltaX = event.clientX - dragStartX;
      const sensitivity = Math.max(100, Math.min(window.innerWidth * 0.35, 140));
      const progress = -deltaX / sensitivity;
      let targetVirtualIndex = startActiveIndex + progress;

      // Check for quick flick gesture
      if (Math.abs(touchVelocityX) > 0.32 && Math.abs(deltaX) > 15) {
        const flickBonus = touchVelocityX < 0 ? 0.45 : -0.45;
        targetVirtualIndex += flickBonus;
      }

      const nearestCard = Math.round(targetVirtualIndex);
      settleToCard(nearestCard);
    } else {
      settleToCard(activeServiceIndex);
    }

    touchActive = false;
    isDragging = false;
    isLockedHorizontal = false;
    isLockedVertical = false;

    setTimeout(() => {
      hasDragged = false;
    }, 100);

    if (isSectionInView) {
      startAutoCycle(AUTO_HOLD_MS);
    }
  }

  stackStage.addEventListener("pointerup", handleTouchEnd);
  stackStage.addEventListener("pointercancel", (event) => {
    try {
      if (stackStage.hasPointerCapture(event.pointerId)) {
        stackStage.releasePointerCapture(event.pointerId);
      }
    } catch (_) {}

    settleToCard(activeServiceIndex);
    touchActive = false;
    isDragging = false;
    hasDragged = false;
    isLockedHorizontal = false;
    isLockedVertical = false;
    if (isSectionInView) {
      startAutoCycle(AUTO_HOLD_MS);
    }
  });

  stackCards.forEach((card, cardIndex) => {
    card.addEventListener("click", (event) => {
      if (hasDragged || isDragging) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const isTouchDevice =
        window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
        window.innerWidth <= 760;

      if (isTouchDevice && cardIndex !== activeServiceIndex) {
        event.preventDefault();
        event.stopPropagation();
        setActiveService(cardIndex);
        if (isSectionInView) {
          startAutoCycle(AUTO_HOLD_MS);
        }
      }
    });
  });

  // Section visibility observer: auto-cycle only when user reaches Services section
  const servicesObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isSectionInView = entry.isIntersecting;
        if (isSectionInView && !isCursorTargeting && !isDragging && !touchActive) {
          startAutoCycle(AUTO_HOLD_MS);
        } else {
          stopAutoCycle();
        }
      });
    },
    { threshold: 0.15 }
  );

  servicesObserver.observe(servicesStack);


  // Tab visibility listener: pause when backgrounded, resume when active
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoCycle();
    } else if (isSectionInView && !isCursorTargeting && !isDragging && !touchActive) {
      startAutoCycle(AUTO_HOLD_MS);
    }
  });

  window.addEventListener("resize", () => {
    const slots = getSlotDefinitions();
    stackCards.forEach((card, i) => {
      const slot = getSlotForCard(i, activeServiceIndex);
      applySlotStyles(card, slots[slot], true);
    });
  });

  // Render initial deck immediately
  renderInitialDeck();
}

/* ==========================================================================
   6. CASE STUDY & TEAM CARDS TILT INTERACTION
   ========================================================================== */

const tiltItems = document.querySelectorAll(".case-card, .team-card");

tiltItems.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (window.innerWidth < 900) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.transform = `
      perspective(700px)
      rotateX(${y * -3}deg)
      rotateY(${x * 3}deg)
      translateY(-7px)
    `;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

/* ==========================================================================
   7. "LET'S TALK" MODAL DIALOG (Lifecycle & Global Interceptor)
   ========================================================================== */

/**
 * Generates the modal markup dynamically if not present in initial DOM
 * (e.g. on service or sub-pages).
 */
function getTalkModalMarkup() {
  return `
    <div class="talk-modal-backdrop" data-talk-close></div>
    <div class="talk-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="talkModalTitle">
      <button class="talk-modal-close" type="button" aria-label="Close Let's Talk form" data-talk-close>×</button>
      <p class="eyebrow"><span class="dot"></span>LET'S TALK</p>
      <h2 id="talkModalTitle" class="section-title">LET'S GROW<br><span class="text-red">YOUR BRAND.</span></h2>
      <a class="talk-modal-email" href="mailto:hello@jysamedia.in">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
          <path d="m4.5 7 7.5 6 7.5-6"></path>
        </svg>
        <span>hello@jysamedia.in</span>
      </a>
      <form class="talk-modal-form" id="talkModalForm">
        <input type="text" name="_hp_check" style="display:none !important; position:absolute; left:-9999px; width:0; height:0;" tabindex="-1" autocomplete="off" aria-hidden="true">
        <label for="talkModalName" class="sr-only">Name *</label>
        <input type="text" id="talkModalName" name="name" placeholder="Name *" required maxlength="100" autocomplete="name" aria-label="Name *">
        <label for="talkModalPhone" class="sr-only">Mobile Number *</label>
        <input type="tel" id="talkModalPhone" name="phone" placeholder="Mobile Number *" required maxlength="20" pattern="[0-9+\\s\\-()]{7,20}" title="Please enter a valid mobile number (7–20 digits)" autocomplete="tel" aria-label="Mobile Number *">
        <label for="talkModalEmail" class="sr-only">Email *</label>
        <input type="email" id="talkModalEmail" name="email" placeholder="Email *" required maxlength="254" autocomplete="email" aria-label="Email *">
        <label for="talkModalCompany" class="sr-only">Company</label>
        <input type="text" id="talkModalCompany" name="company" placeholder="Company" maxlength="120" autocomplete="organization" aria-label="Company">
        <label for="talkModalMessage" class="sr-only">How can I help you?</label>
        <textarea id="talkModalMessage" name="message" placeholder="How can I help you?" maxlength="3000" aria-label="How can I help you?"></textarea>
        <button class="button button-red" type="submit">SEND →</button>
        <p class="talk-modal-note" id="talkModalNote"></p>
      </form>
    </div>
  `.trim();
}

/**
 * Ensures the Let's Talk modal container exists in the DOM.
 */
function ensureTalkModal() {
  let modal = document.querySelector("#talkModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "talk-modal";
    modal.id = "talkModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = getTalkModalMarkup();
    document.body.appendChild(modal);
    bindTalkModalEvents(modal);
  }
  return modal;
}

/**
 * Opens the Let's Talk modal dialog.
 */
function openTalkModal() {
  const modal = ensureTalkModal();
  const form = modal.querySelector("#talkModalForm");
  if (form) form.dataset.mountTime = String(Date.now());
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("talk-modal-open");
  setTimeout(() => modal.querySelector('input[name="name"]')?.focus(), 50);
}

/**
 * Closes the Let's Talk modal dialog.
 */
function closeTalkModal() {
  const modal = document.querySelector("#talkModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("talk-modal-open");
  if (window.location.search.includes("openLetsTalk")) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, "", cleanUrl || "/");
  }
}

/**
 * Binds backdrop close and form submission events to a modal instance.
 */
function bindTalkModalEvents(modal) {
  modal.querySelectorAll("[data-talk-close]").forEach((target) => {
    target.addEventListener("click", closeTalkModal);
  });

  const form = modal.querySelector("#talkModalForm");
  const note = modal.querySelector("#talkModalNote");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!note) return;
    const btn = form.querySelector('button[type="submit"]');
    submitForm(form, note, "LET'S TALK POPUP", btn);
  });
}

// Bind existing modal if already in initial HTML
const initialTalkModal = document.querySelector("#talkModal");
if (initialTalkModal) {
  bindTalkModalEvents(initialTalkModal);
}

// Close on Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTalkModal();
  }
});

// Intercept ANY "Let's Talk" button/link clicked anywhere across the page
document.addEventListener("click", (event) => {
  const btn = event.target.closest("a, button");
  if (!btn) return;
  if (btn.closest("#talkModal")) return;

  const text = (btn.textContent || "").trim().toUpperCase();
  const href = (btn.getAttribute("href") || "").toLowerCase();

  if (
    btn.id === "headerTalkButton" ||
    text.includes("LET'S TALK") ||
    text.includes("LET’S TALK") ||
    href.includes("openletstalk") ||
    href.includes("#letstalk")
  ) {
    event.preventDefault();
    event.stopPropagation();
    openTalkModal();
  }
});

// Auto-open modal if URL has ?openLetsTalk=1 or #letstalk
const urlParams = new URLSearchParams(window.location.search);
if (
  urlParams.get("openLetsTalk") === "1" ||
  urlParams.has("openLetsTalk") ||
  window.location.hash === "#letstalk"
) {
  openTalkModal();
}

/* ==========================================================================
   8. CONTACT FORM SUBMISSION & BUTTON MICRO-ANIMATION
   ========================================================================== */

const contactForm = document.querySelector("#contactForm");
const formNote = document.querySelector("#formNote");

if (contactForm) {
  contactForm.dataset.mountTime = String(pageInitTime);

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!formNote) return;
    const btn = contactForm.querySelector('button[type="submit"]');
    submitForm(contactForm, formNote, "CONTACT US", btn);
  });
}

/**
 * Shared form submission handler.
 * Manages:
 * - Client-side validation
 * - In-flight duplicate prevention
 * - Dimension freeze (zero layout shift)
 * - Button-level success micro-animation (SVG checkmark + "Message Sent")
 * - Error recovery without false success
 *
 * @param {HTMLFormElement}   form    — The form element submitted
 * @param {HTMLElement}       noteEl  — Error message display element
 * @param {string}            source  — 'LET'S TALK POPUP' or 'CONTACT US'
 * @param {HTMLButtonElement} btn     — The submit button
 */
async function submitForm(form, noteEl, source, btn) {
  // Guard against duplicate in-flight submissions
  if (form.dataset.submitting === "true" || btn.disabled) {
    return;
  }

  const formData = new FormData(form);

  const rawName = String(formData.get("name") || "").trim();
  const rawPhone = String(formData.get("phone") || "").trim();
  const rawEmail = String(formData.get("email") || "").trim();
  const rawCompany = String(formData.get("company") || "").trim();
  const rawMessage = String(formData.get("message") || "").trim();
  const hpCheck = String(formData.get("_hp_check") || "").trim();

  // 1. Client-side quick validation before dispatching network call
  if (!rawName) {
    noteEl.style.color = "#ff5252";
    noteEl.textContent = "Please enter your name.";
    form.querySelector('[name="name"]')?.focus();
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!rawEmail || !emailPattern.test(rawEmail) || rawEmail.length > 254) {
    noteEl.style.color = "#ff5252";
    noteEl.textContent = "Please enter a valid email address.";
    form.querySelector('[name="email"]')?.focus();
    return;
  }

  const phoneDigits = rawPhone.replace(/\D/g, "");
  const phonePattern = /^[+]?[0-9\s\-()]{7,20}$/;
  if (!rawPhone || !phonePattern.test(rawPhone) || phoneDigits.length < 7 || rawPhone.length > 20) {
    noteEl.style.color = "#ff5252";
    noteEl.textContent = "Please enter a valid mobile number (7–20 digits).";
    form.querySelector('[name="phone"]')?.focus();
    return;
  }

  if (rawCompany.length > 120) {
    noteEl.style.color = "#ff5252";
    noteEl.textContent = "Company name cannot exceed 120 characters.";
    return;
  }

  if (rawMessage.length > 3000) {
    noteEl.style.color = "#ff5252";
    noteEl.textContent = "Message cannot exceed 3000 characters.";
    return;
  }

  // 2. Lock button state and dimensions to prevent layout shift
  form.dataset.submitting = "true";
  const originalHtml = btn.innerHTML;
  btn.disabled = true;

  const initialHeight = btn.offsetHeight;
  if (initialHeight > 0) {
    btn.style.minHeight = `${initialHeight}px`;
  }

  // 3. Smooth transition to Sending state inside button
  btn.innerHTML = '<span class="button-state-wrap is-entering"><span class="button-state-text">Sending…</span></span>';
  noteEl.textContent = "";
  noteEl.style.color = "";

  const mountTime = Number(form.dataset.mountTime || pageInitTime);
  const elapsedMs = Math.max(0, Date.now() - mountTime);

  const payload = {
    name: rawName,
    phone: rawPhone,
    email: rawEmail,
    company: rawCompany,
    message: rawMessage,
    formSource: source,
    _hp_check: hpCheck,
    _ts_check: String(elapsedMs),
  };

  let isSuccess = false;

  try {
    const response = await fetch(`${API_BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      isSuccess = true;
      form.reset();
      noteEl.textContent = "";

      // 4. Smooth transition into Success state inside the button
      const currentWrap = btn.querySelector(".button-state-wrap");
      if (currentWrap) {
        currentWrap.classList.add("is-leaving");
      }

      setTimeout(() => {
        btn.innerHTML = `
          <span class="button-state-wrap is-entering" aria-live="polite">
            <svg class="button-success-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 8.5L6.5 12L13 4.5"/>
            </svg>
            <span class="button-state-text">Message Sent</span>
          </span>
        `.trim();
      }, currentWrap ? 140 : 0);

      // 5. Clean restoration after 4.5s or on next user input interaction
      let resetTimer = setTimeout(restoreToNormal, 4500);

      function restoreToNormal() {
        if (resetTimer) {
          clearTimeout(resetTimer);
          resetTimer = null;
        }
        form.removeEventListener("input", onFormInput);

        const successWrap = btn.querySelector(".button-state-wrap");
        if (successWrap) {
          successWrap.classList.add("is-leaving");
          setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            btn.style.minHeight = "";
            form.dataset.submitting = "false";
          }, 140);
        } else {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
          btn.style.minHeight = "";
          form.dataset.submitting = "false";
        }
      }

      function onFormInput() {
        restoreToNormal();
      }

      form.addEventListener("input", onFormInput, { once: true });
    } else {
      // 6. Handle backend rejection — restore button immediately, show error
      noteEl.style.color = "#ff5252";
      if (result.errors) {
        const messages = Object.values(result.errors);
        noteEl.textContent = messages.join(" ");
      } else {
        noteEl.textContent = result.error || "Something went wrong. Please try again.";
      }
      btn.innerHTML = originalHtml;
      btn.disabled = false;
      btn.style.minHeight = "";
      form.dataset.submitting = "false";
    }
  } catch (_networkError) {
    // 7. Handle network drop — restore button immediately, show network error
    noteEl.style.color = "#ff5252";
    noteEl.textContent = "Network error — please check your connection and try again.";
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    btn.style.minHeight = "";
    form.dataset.submitting = "false";
  } finally {
    if (!isSuccess) {
      form.dataset.submitting = "false";
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      btn.style.minHeight = "";
    }
  }
}
