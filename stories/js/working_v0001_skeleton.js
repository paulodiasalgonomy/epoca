
(function () {
  const DEFAULT_DURATION_MS = 5000;

  // Session e User dinâmicos
  const sessionId =
    typeof R3_COMMON !== "undefined" && R3_COMMON?.sessionId
      ? R3_COMMON.sessionId
      : "noSessionDefined";
  const userId =
    typeof R3_COMMON !== "undefined" && R3_COMMON?.userId
      ? R3_COMMON.userId
      : "";

  const API_URL = `https://integration.richrelevance.com/rrserver/api/personalize?apiClientKey=1ba1575b8f503e63&apiKey=c85912f892c73e30&placements=home_page.stories_01%7Chome_page.stories_02%7Chome_page.stories_03%7Chome_page.stories_04&sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(userId)}`;

  // Remove instâncias antigas
  document.getElementById("algonomy-stories-carousel")?.remove();
  document.getElementById("algonomy-stories-overlay")?.remove();

  const target = document.querySelector("#__next > main > section");
  const anchorParent = target?.parentElement || document.body;

// Estrutura inicial com placeholders (skeletons) -> evita layout shift
const container = document.createElement("div");
container.id = "algonomy-stories-carousel";
container.innerHTML = `<div class="track"></div>`;
if (target) anchorParent.insertBefore(container, target);
else document.body.prepend(container);
const track = container.querySelector(".track");

// adiciona 5 skeletons provisórios
for (let i = 0; i < 5; i++) {
  const skel = document.createElement("div");
  skel.className = "item skeleton";
  skel.innerHTML = `
    <div class="thumb skeleton-thumb"></div>
    <span class="text skeleton-text"></span>
  `;
  track.appendChild(skel);
}

  const overlay = document.createElement("div");
  overlay.id = "algonomy-stories-overlay";
  overlay.innerHTML = `
    <div class="story-wrapper">
      <div class="top-buttons">
        <button class="btn-icon pause-btn"><span class="pause-icon">⏸</span></button>
        <button class="btn-icon close-btn">&times;</button>
      </div>
      <div class="story-content"></div>
      <a class="cta-btn" target="_blank">Saiba mais</a>
      <div class="progress"></div>
      <div class="tap-left"></div>
      <div class="tap-right"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const contentEl = overlay.querySelector(".story-content");
  const progressEl = overlay.querySelector(".progress");
  const ctaBtn = overlay.querySelector(".cta-btn");

  let STORIES = [];
  let currentIndex = 0;
  let timerId = null;
  let isRunning = false;
  let isPaused = false;
  let pauseStart = null;
  let elapsedBeforePause = 0;
  let storyDuration = DEFAULT_DURATION_MS;

  // Fetch antecipado
  fetch(API_URL, { cache: "force-cache" })
    .then(res => res.json())
    .then(data => {
      data.placements.forEach(placement => {
        const creative = placement.creatives?.[0];
        if (!creative) return;
        const icon = creative.ICON;
        const contentSrc = creative.IMAGE || creative.VIDEO;
        const url = creative.URL;
        const text = creative.TEXT || "";
        const duration = creative.duration ? creative.duration * 1000 : DEFAULT_DURATION_MS;

        if (!icon || !contentSrc) return;

        // Preload
        const preload = document.createElement("link");
        preload.rel = "preload";
        preload.as = creative.VIDEO ? "video" : "image";
        preload.href = contentSrc;
        document.head.appendChild(preload);

        STORIES.push({ 
          src: contentSrc, 
          type: creative.VIDEO ? "video" : "image", 
          alt: placement.id, 
          icon, url, 
          text,
          duration 
        });
      });
      buildCarousel();
      buildProgress();
    });

  function buildCarousel() {
    track.innerHTML = ""; // remove skeletons
    STORIES.forEach((s, idx) => {
      const item = document.createElement("button");
      item.className = "item";
      item.innerHTML = `
        <div class="thumb">
          <span class="ring"></span>
          <img src="${s.icon}" alt="${s.alt || ""}" loading="eager">
        </div>
        <span class="text">${s.text}</span>
      `;
      item.addEventListener("click", () => openStory(idx));
      track.appendChild(item);
    });
  }

  function buildProgress() {
    progressEl.innerHTML = "";
    STORIES.forEach(() => {
      const seg = document.createElement("div");
      seg.className = "seg";
      const fill = document.createElement("div");
      fill.className = "fill";
      seg.appendChild(fill);
      progressEl.appendChild(seg);
    });
  }

  function setProgress(i, pct) {
    const fill = progressEl.children[i]?.querySelector(".fill");
    if (fill) fill.style.width = `${pct}%`;
  }
  function completeProgress(i) { setProgress(i, 100); }
  function resetProgress(i) { setProgress(i, 0); }

  function showStory(i, direction = "right") {
    const { src, type, alt, url, duration } = STORIES[i];
    storyDuration = duration;

    const inner = document.createElement("div");
    inner.className = `story-inner enter-${direction}`;
    inner.innerHTML =
      type === "video"
        ? `<video class="story-media" src="${src}" autoplay muted playsinline></video>`
        : `<img class="story-media" src="${src}" alt="${alt}" loading="eager">`;

    const current = contentEl.querySelector(".story-inner.active");
    if (current) {
      current.classList.remove("active");
      current.classList.add(`exit-${direction}`);
      setTimeout(() => current.remove(), 450);
    }

    contentEl.appendChild(inner);

    requestAnimationFrame(() => {
      inner.classList.add("active");
      inner.classList.remove(`enter-${direction}`);
    });

    ctaBtn.href = url || "#";
    ctaBtn.style.display = url ? "block" : "none";

    for (let k = 0; k < STORIES.length; k++) {
      if (k < i) completeProgress(k);
      else if (k === i) resetProgress(k);
      else resetProgress(k);
    }
  }

  function startTimer(startFrom = 0) {
    clearTimer();
    const startTime = performance.now() - startFrom;
    isRunning = true;
    isPaused = false;
    const tick = (now) => {
      if (!isRunning || isPaused) return;
      const elapsed = now - startTime;
      const pct = (elapsed / storyDuration) * 100;
      setProgress(currentIndex, pct);
      if (elapsed >= storyDuration) {
        completeProgress(currentIndex);
        nextStory();
      } else {
        timerId = requestAnimationFrame(tick);
      }
    };
    timerId = requestAnimationFrame(tick);
  }
  function clearTimer() { isRunning = false; if (timerId) cancelAnimationFrame(timerId); timerId = null; }

  function openStory(i) { currentIndex = i; overlay.classList.add("active"); showStory(currentIndex); startTimer(); document.body.style.overflow = "hidden"; }
  function closeStory() { clearTimer(); overlay.classList.remove("active"); document.body.style.overflow = ""; }
  function nextStory() {
    document.querySelectorAll('#algonomy-stories-carousel .ring')[currentIndex]?.classList.add("viewed");
    if (currentIndex < STORIES.length - 1) {
      currentIndex++;
      showStory(currentIndex, "right");
      startTimer();
    } else {
      closeStory();
    }
  }
  function prevStory() {
    if (currentIndex > 0) {
      currentIndex--;
      showStory(currentIndex, "left");
      startTimer();
    } else {
      showStory(currentIndex, "left");
      startTimer();
    }
  }

  function togglePause() {
    const btnIcon = overlay.querySelector(".pause-btn .pause-icon");
    const video = contentEl.querySelector("video");
    if (!isPaused) {
      isPaused = true;
      pauseStart = performance.now();
      btnIcon.textContent = "▶";
      if (video) video.pause();
    } else {
      const now = performance.now();
      elapsedBeforePause += now - pauseStart;
      btnIcon.textContent = "⏸";
      isPaused = false;
      if (video) video.play();
      startTimer(elapsedBeforePause);
    }
  }

  overlay.querySelector(".close-btn").addEventListener("click", closeStory);
  overlay.querySelector(".pause-btn").addEventListener("click", togglePause);
  overlay.querySelector(".tap-left").addEventListener("click", prevStory);
  overlay.querySelector(".tap-right").addEventListener("click", nextStory);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeStory(); });
  window.addEventListener("keydown", (e) => { if (!overlay.classList.contains("active")) return; if (e.key === "Escape") closeStory(); if (e.key === "ArrowRight") nextStory(); if (e.key === "ArrowLeft") prevStory(); });
})();

