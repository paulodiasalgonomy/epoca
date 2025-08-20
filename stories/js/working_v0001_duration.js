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

  document.getElementById("insta-stories-carousel")?.remove();
  document.getElementById("insta-stories-overlay")?.remove();

  const target = document.querySelector("#__next > main > section");
  const anchorParent = target?.parentElement || document.body;

  const style = document.createElement("style");
  style.textContent = `
    #insta-stories-carousel {
      width: 100%;
      padding: 12px 0;
      display: flex;
      justify-content: center;
      background: transparent;
      position: relative;
    }
    #insta-stories-carousel .track {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 6px;
      -webkit-overflow-scrolling: touch;
    }
    #insta-stories-carousel .item {
      flex: 0 0 auto;
      width: 72px;
      cursor: pointer;
      background: transparent;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    #insta-stories-carousel .item .thumb {
      width: 72px; height: 72px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      background: #eee;
      position: relative;
      flex-shrink: 0;
    }
    #insta-stories-carousel .item img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }
    #insta-stories-carousel .ring {
      position: absolute; inset: -11px;
      border-radius: 9999px;
      pointer-events: none;
      padding: 2px;
      background:radial-gradient(closest-side, white 68%, transparent 70%),conic-gradient(#ff00a2, #f6a7ff, #f858ef);
      -webkit-mask: radial-gradient(closest-side, transparent 66%, black 70%);
      mask: radial-gradient(closest-side, transparent 66%, black 70%);
      transition: background 0.4s ease-in-out;
    }
    #insta-stories-carousel .item:hover .ring {
      background:
        radial-gradient(closest-side, white 68%, transparent 70%),
        conic-gradient(#ff6cff, #ff33c9, #ffc8ff, #ff66f5);
    }
    #insta-stories-carousel .ring.viewed {
      background: radial-gradient(closest-side, white 68%, transparent 70%),
                  conic-gradient(#ccc, #bbb, #aaa, #ccc);
    }
    #insta-stories-carousel .item .text {
      font-size: 12px;
      color: #333;
      text-align: center;
      max-width: 72px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }
    /* Overlay */
    #insta-stories-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999999 !important;
      padding: 16px;
    }
    #insta-stories-overlay.active { display: flex; }
    #insta-stories-overlay .story-wrapper {
      position: relative;
      aspect-ratio: 9 / 16;
      background: black;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      max-height: 90vh;
    }
    @media(max-width: 768px){
      #insta-stories-overlay .story-wrapper{ max-height:95vh; }
    }
    #insta-stories-overlay .story-media {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    #insta-stories-overlay .top-buttons {
      position: absolute;
      top: 8px; right: 8px;
      display: flex;
      gap: 6px;
      z-index: 2;
    }
    #insta-stories-overlay .btn-icon {
      background: rgba(0,0,0,0.6);
      color: white;
      border: 0;
      border-radius: 50%;
      width: 36px; height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
    }
    /* Progress bar */
    #insta-stories-overlay .progress {
      position: absolute;
      bottom: 48px; left: 8px; right: 8px;
      height: 4px;
      display: flex;
      gap: 6px;
      z-index: 2;
    }
    #insta-stories-overlay .progress .seg {
      flex: 1;
      background: rgba(255,255,255,0.15);
      border-radius: 9999px;
      overflow: hidden;
      position: relative;
    }
    #insta-stories-overlay .progress .seg .fill {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 0%;
      background: linear-gradient(to right, #ff8ce0, #ff0080);
      transition: width linear;
    }
    #insta-stories-overlay .cta-btn {
      position: absolute;
      bottom: 13%; 
      left: 50%;
      transform: translateX(-50%);
      background: #ff0080;
      color: white;
      padding: 10px 18px;
      border-radius: 20px;
      font-size: 14px;
      text-decoration: none;
      z-index: 3;
    }
    #insta-stories-overlay .tap-left, #insta-stories-overlay .tap-right {
      position: absolute;
      top: 0; bottom: 0;
      width: 50%;
      cursor: pointer;
    }
    #insta-stories-overlay .tap-left { left: 0; }
    #insta-stories-overlay .tap-right { right: 0; }


#insta-stories-overlay .story-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
  overflow: hidden;
}
#insta-stories-overlay .story-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease, opacity 0.6s ease;
  transform: scale(0.9);
  opacity: 0;
}
#insta-stories-overlay .story-inner.enter-right {
  transform: translateX(30%) scale(0.9);
  opacity: 0;
}
#insta-stories-overlay .story-inner.enter-left {
  transform: translateX(-30%) scale(0.9);
  opacity: 0;
}
#insta-stories-overlay .story-inner.active {
  transform: translateX(0) scale(1);
  opacity: 1;
}
#insta-stories-overlay .story-inner.exit-right {
  transform: translateX(-30%) scale(0.9);
  opacity: 0;
}
#insta-stories-overlay .story-inner.exit-left {
  transform: translateX(30%) scale(0.9);
  opacity: 0;
}


  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "insta-stories-carousel";
  container.innerHTML = `<div class="track"></div>`;
  if (target) anchorParent.insertBefore(container, target);
  else document.body.prepend(container);
  const track = container.querySelector(".track");

  const overlay = document.createElement("div");
  overlay.id = "insta-stories-overlay";
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

  // FETCH
  fetch(API_URL)
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
    STORIES.forEach((s, idx) => {
      const item = document.createElement("button");
      item.className = "item";
      item.innerHTML = `
        <div class="thumb">
          <span class="ring"></span>
          <img src="${s.icon}" alt="${s.alt || ""}">
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
      : `<img class="story-media" src="${src}" alt="${alt}">`;

  // Animação de saída do atual
  const current = contentEl.querySelector(".story-inner.active");
  if (current) {
    current.classList.remove("active");
    current.classList.add(`exit-${direction}`);
    setTimeout(() => current.remove(), 600);
  }

  contentEl.appendChild(inner);

  // Força reflow pra animar entrada
  requestAnimationFrame(() => {
    inner.classList.add("active");
    inner.classList.remove(`enter-${direction}`);
  });

  // CTA
  ctaBtn.href = url || "#";
  ctaBtn.style.display = url ? "block" : "none";

  // Progress
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
  document.querySelectorAll('#insta-stories-carousel .ring')[currentIndex]?.classList.add("viewed");
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
    btnIcon.textContent = "▶"; // play
    if (video) video.pause();
  } else {
    const now = performance.now();
    elapsedBeforePause += now - pauseStart;
    btnIcon.textContent = "⏸"; // pause
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
