/* =========================================================
   JYSA Media — interactions
   Keep behavior in one readable module.
   ========================================================= */

const header = document.querySelector("#siteHeader");
const nav = document.querySelector("#siteNav");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealItems = document.querySelectorAll(".reveal");
const tiltItems = document.querySelectorAll(".case-card, .team-card");
const contactForm = document.querySelector("#contactForm");
const formNote = document.querySelector("#formNote");
const pageInitTime = Date.now();
if (contactForm) contactForm.dataset.mountTime = String(pageInitTime);

/* ---------------------------------------------------------
   API configuration
   --------------------------------------------------------- */

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001"
    : ""; // same-origin in production

/**
 * Shared form submission helper.
 * Posts form data to the backend contact API and manages UI feedback.
 *
 * @param {HTMLFormElement} form
 * @param {HTMLElement}     noteEl   — the element to show success/error text
 * @param {string}          source   — 'LET\'S TALK POPUP' or 'CONTACT US'
 * @param {HTMLButtonElement} btn     — the submit button
 */
async function submitForm(form, noteEl, source, btn) {
  const formData = new FormData(form);

  const rawName = String(formData.get("name") || "").trim();
  const rawPhone = String(formData.get("phone") || "").trim();
  const rawEmail = String(formData.get("email") || "").trim();
  const rawCompany = String(formData.get("company") || "").trim();
  const rawMessage = String(formData.get("message") || "").trim();
  const hpCheck = String(formData.get("_hp_check") || "").trim();

  // Client-side quick validation before dispatching network call
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

  // Disable button and show loading state
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Sending…";
  noteEl.textContent = "";
  noteEl.style.color = "";

  try {
    const response = await fetch(`${API_BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      noteEl.style.color = "#4caf50";
      noteEl.textContent = result.message || "Message sent successfully!";
      form.reset();
    } else {
      // Show validation errors or generic error safely
      noteEl.style.color = "#ff5252";
      if (result.errors) {
        const messages = Object.values(result.errors);
        noteEl.textContent = messages.join(" ");
      } else {
        noteEl.textContent = result.error || "Something went wrong. Please try again.";
      }
    }
  } catch (_networkError) {
    noteEl.style.color = "#ff5252";
    noteEl.textContent = "Network error — please check your connection and try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

/* ---------------------------------------------------------
   Header + active navigation
   --------------------------------------------------------- */

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);

}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

/* ---------------------------------------------------------
   Homepage section-transition animation
   --------------------------------------------------------- */

const transitionSections = [
  ...document.querySelectorAll("main > .section:not(.hero)")
];

function updateSectionTransitionAnimation() {
  const viewportHeight = window.innerHeight;

  transitionSections.forEach((section) => {
    const line = section.querySelector(".section-transition-line");

    if (!line) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const distanceFromViewportBottom = viewportHeight - rect.bottom;
    const transitionZone = Math.max(viewportHeight * 0.3, 180);
    const progress = Math.min(1, Math.max(0, distanceFromViewportBottom / transitionZone));
    const opacity = Math.min(1, progress * 3);

    line.style.setProperty("--transition-progress", progress.toFixed(3));
    line.style.setProperty("--transition-opacity", opacity.toFixed(3));
  });
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
updateSectionTransitionAnimation();

/* ---------------------------------------------------------
   3D cube — continuous rotation + direct mouse response
   --------------------------------------------------------- */

const cube = document.querySelector(".cube");

if (cube) {
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let rotationX = -20;
  let rotationY = 30;
  let rotationZ = 0;
  let lastFrame = performance.now();
  let lastPointerX = null;
  let lastPointerY = null;

  function renderCube(now) {
    const deltaSeconds = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    // Keep the automatic motion running continuously.
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

      // Translate real cursor movement into visible cube rotation.
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

/* ---------------------------------------------------------
   Services — stable interactive stacked card deck
   --------------------------------------------------------- */

const servicesStack = document.querySelector("[data-services-stack]");

if (servicesStack) {
  const stackStage = servicesStack.querySelector(".services-stack-stage");
  const stackCards = [...servicesStack.querySelectorAll(".service-stack-card")];
  const stackCount = stackCards.length;
  let activeServiceIndex = 0;
  let touchStartX = null;
  let touchStartY = null;
  let isSwiping = false;
  let isCursorTargeting = false;
  let isSectionInView = false;
  let pendingTargetCardIndex = null;
  let hoverTimer = null;
  let autoTimer = null;
  let activeGhosts = [];
  let transitionCleanupTimer = null;

  const AUTO_HOLD_MS = 3800; // 2.6s reading hold + 1.2s smooth transition

  function getSlotDefinitions() {
    const width = window.innerWidth;

    if (width <= 360) {
      return {
        0:    { x: 0,   y: 0,  rotate: 0,    scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 18,  y: 8,  rotate: 2.5,  scale: 0.97, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 36,  y: 16, rotate: 5,    scale: 0.94, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 48,  y: 24, rotate: 7,    scale: 0.91, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 56,  y: 30, rotate: 7,    scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -18, y: 8,  rotate: -2.5, scale: 0.97, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -36, y: 16, rotate: -5,   scale: 0.94, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -48, y: 24, rotate: -7,   scale: 0.91, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -56, y: 30, rotate: -7,   scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    if (width <= 480) {
      return {
        0:    { x: 0,   y: 0,  rotate: 0,    scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 25,  y: 8,  rotate: 2.5,  scale: 0.97, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 50,  y: 16, rotate: 5,    scale: 0.94, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 65,  y: 24, rotate: 7.5,  scale: 0.91, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 75,  y: 30, rotate: 7.5,  scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -25, y: 8,  rotate: -2.5, scale: 0.97, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -50, y: 16, rotate: -5,   scale: 0.94, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -65, y: 24, rotate: -7.5, scale: 0.91, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -75, y: 30, rotate: -7.5, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    if (width <= 768) {
      return {
        0:    { x: 0,    y: 0,  rotate: 0,    scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 65,   y: 10, rotate: 3,    scale: 0.97, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 130,  y: 20, rotate: 6,    scale: 0.94, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 195,  y: 30, rotate: 8.5,  scale: 0.91, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 225,  y: 38, rotate: 8.5,  scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -65,  y: 10, rotate: -3,   scale: 0.97, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -130, y: 20, rotate: -6,   scale: 0.94, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -195, y: 30, rotate: -8.5, scale: 0.91, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -225, y: 38, rotate: -8.5, scale: 0.88, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    if (width <= 1100) {
      return {
        0:    { x: 0,    y: 0,  rotate: 0,    scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
        1:    { x: 105,  y: 14, rotate: 3.5,  scale: 0.98, zDepth: 18,  zIndex: 60, opacity: 1 },
        2:    { x: 210,  y: 28, rotate: 7,    scale: 0.96, zDepth: 6,   zIndex: 50, opacity: 1 },
        3:    { x: 315,  y: 42, rotate: 9.5,  scale: 0.94, zDepth: -6,  zIndex: 40, opacity: 1 },
        4:    { x: 360,  y: 50, rotate: 9.5,  scale: 0.91, zDepth: -32, zIndex: 20, opacity: 0 },
        [-1]: { x: -105, y: 14, rotate: -3.5, scale: 0.98, zDepth: 18,  zIndex: 55, opacity: 1 },
        [-2]: { x: -210, y: 28, rotate: -7,   scale: 0.96, zDepth: 6,   zIndex: 45, opacity: 1 },
        [-3]: { x: -315, y: 42, rotate: -9.5, scale: 0.94, zDepth: -6,  zIndex: 35, opacity: 1 },
        [-4]: { x: -360, y: 50, rotate: -9.5, scale: 0.91, zDepth: -32, zIndex: 20, opacity: 0 }
      };
    }

    let outerX = 530;
    let outerRotate = 8.5;

    if (width <= 1280) {
      outerX = 465;
      outerRotate = 6.2;
    } else if (width <= 1366) {
      outerX = 500;
      outerRotate = 7.2;
    }

    const exitX = Math.round(outerX + (outerX - 410) * 0.9);
    const exitRotate = +(outerRotate + 2.0).toFixed(1);

    return {
      0:    { x: 0,       y: 0,  rotate: 0,            scale: 1,    zDepth: 34,  zIndex: 70, opacity: 1 },
      1:    { x: 205,     y: 14, rotate: 3.5,          scale: 0.98, zDepth: 18,  zIndex: 60, opacity: 1 },
      2:    { x: 410,     y: 28, rotate: 7,            scale: 0.96, zDepth: 6,   zIndex: 50, opacity: 1 },
      3:    { x: outerX,  y: 42, rotate: outerRotate,  scale: 0.94, zDepth: -6,  zIndex: 40, opacity: 1 },
      4:    { x: exitX,   y: 54, rotate: exitRotate,   scale: 0.91, zDepth: -20, zIndex: 25, opacity: 0 },
      [-1]: { x: -205,    y: 14, rotate: -3.5,         scale: 0.98, zDepth: 18,  zIndex: 55, opacity: 1 },
      [-2]: { x: -410,    y: 28, rotate: -7,           scale: 0.96, zDepth: 6,   zIndex: 45, opacity: 1 },
      [-3]: { x: -outerX, y: 42, rotate: -outerRotate, scale: 0.94, zDepth: -6,  zIndex: 35, opacity: 1 },
      [-4]: { x: -exitX,  y: 54, rotate: -exitRotate,  scale: 0.91, zDepth: -20, zIndex: 25, opacity: 0 }
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
    element.style.boxShadow = isActive
      ? "0 26px 52px rgba(227, 19, 36, 0.16), 0 0 0 1px rgba(227, 19, 36, 0.05)"
      : "0 14px 30px rgba(227, 19, 36, 0.07)";
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
    stackCards.forEach((card, index) => {
      card.classList.add("is-stack-card");
      const slot = getSlotForCard(index, activeServiceIndex);
      applySlotStyles(card, slots[slot], true);
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
      // ========================================================
      // DESKTOP: EXACT APPROVED SYSTEM — 100% UNTOUCHED
      // ========================================================
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

    // ========================================================
    // MOBILE / TABLET DEDICATED SEAMLESS TRANSITION SYSTEM
    // ========================================================
    stackCards.forEach((card, i) => {
      const oldSlot = getSlotForCard(i, oldActive);
      const newSlot = getSlotForCard(i, normalizedNext);
      const isWrap = Math.abs(newSlot - oldSlot) > Math.abs(delta);

      if (!isWrap) {
        applySlotStyles(card, slots[newSlot], false);
      } else {
        // Wrapping card (e.g. Slot -3 -> Slot 3 on forward cycle, or Slot 3 -> Slot -3 on reverse cycle):
        // It glides smoothly behind the opaque central card stack directly into its destination slot.
        // Keeping zIndex: 20 and deep zDepth (-36px) guarantees it travels behind all stack cards
        // without popping, clipping, transform resets, or altering the DOM structure.
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

    // Gentle settle: when the 1200ms transition finishes, smoothly restore standard slot
    // zDepth and zIndex on all cards. Never resets transition, never causes opacity flicker.
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

  // Automatic slow cycling
  function stopAutoCycle() {
    if (autoTimer !== null) {
      window.clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function scheduleNextCycle(delay = AUTO_HOLD_MS) {
    stopAutoCycle();
    if (!isSectionInView || isCursorTargeting || isSwiping || document.hidden) {
      return;
    }

    autoTimer = window.setTimeout(() => {
      if (!isSectionInView || isCursorTargeting || isSwiping || document.hidden) {
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

  stackStage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") {
      touchStartX = event.clientX;
      touchStartY = event.clientY;
      isSwiping = true;
      stopAutoCycle();
    }
  });

  stackStage.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch" || touchStartX === null) {
      return;
    }

    const deltaX = event.clientX - touchStartX;
    const deltaY = event.clientY - (touchStartY || event.clientY);

    if (Math.abs(deltaX) > 25 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setActiveService(activeServiceIndex + (deltaX < 0 ? 1 : -1));
    }

    touchStartX = null;
    touchStartY = null;
    isSwiping = false;

    if (isSectionInView) {
      startAutoCycle(AUTO_HOLD_MS);
    }
  });

  stackStage.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "touch") {
      touchStartX = null;
      touchStartY = null;
      isSwiping = false;
      if (isSectionInView) {
        startAutoCycle(AUTO_HOLD_MS);
      }
    }
  });

  stackCards.forEach((card, cardIndex) => {
    card.addEventListener("click", (event) => {
      if (isSwiping) {
        event.preventDefault();
        event.stopPropagation();
        isSwiping = false;
        return;
      }

      const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth <= 760;
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
        if (isSectionInView && !isCursorTargeting && !isSwiping) {
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
    } else if (isSectionInView && !isCursorTargeting && !isSwiping) {
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

/* ---------------------------------------------------------
   Scroll reveal
   --------------------------------------------------------- */

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

/* ---------------------------------------------------------
   Mobile menu
   --------------------------------------------------------- */

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

/* ---------------------------------------------------------
   Desktop tilt interactions
   --------------------------------------------------------- */

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

/* ---------------------------------------------------------
   Let's Talk modal + global button handling
   --------------------------------------------------------- */

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
        <input type="text" name="name" placeholder="Name *" required maxlength="100" autocomplete="name">
        <input type="tel" name="phone" placeholder="Mobile Number *" required maxlength="20" pattern="[0-9+\\s\\-()]{7,20}" title="Please enter a valid mobile number (7–20 digits)" autocomplete="tel">
        <input type="email" name="email" placeholder="Email *" required maxlength="254" autocomplete="email">
        <input type="text" name="company" placeholder="Company" maxlength="120" autocomplete="organization">
        <textarea name="message" placeholder="How can I help you?" maxlength="3000"></textarea>
        <button class="button button-red" type="submit">SEND →</button>
        <p class="talk-modal-note" id="talkModalNote"></p>
      </form>
    </div>
  `.trim();
}

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

function openTalkModal() {
  const modal = ensureTalkModal();
  const form = modal.querySelector("#talkModalForm");
  if (form) form.dataset.mountTime = String(Date.now());
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("talk-modal-open");
  setTimeout(() => modal.querySelector('input[name="name"]')?.focus(), 50);
}

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

// Bind existing modal if already in initial DOM
const initialTalkModal = document.querySelector("#talkModal");
if (initialTalkModal) {
  bindTalkModalEvents(initialTalkModal);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTalkModal();
  }
});

// Intercept ANY Let's Talk button click anywhere on the website
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

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("openLetsTalk") === "1" || urlParams.has("openLetsTalk") || window.location.hash === "#letstalk") {
  openTalkModal();
}

/* ---------------------------------------------------------
   Contact Us form
   --------------------------------------------------------- */

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!formNote) return;

  const btn = contactForm.querySelector('button[type="submit"]');
  submitForm(contactForm, formNote, "CONTACT US", btn);
});
