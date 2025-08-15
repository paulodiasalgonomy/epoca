(function () {
  const STORY_DURATION_MS = 5000;
  const API_URL = "https://integration.richrelevance.com/rrserver/api/personalize?apiClientKey=1ba1575b8f503e63&apiKey=c85912f892c73e30&placements=home_page.stories_01%7Chome_page.stories_02%7Chome_page.stories_03%7Chome_page.stories_04&sessionId=contentTestDrivesession-06a42c9d9813";

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
      width: 72px; height: 72px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      cursor: pointer;
      background: #eee;
      position: relative;
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
      -webkit-mask: radial-gradient(closest-side, transparent 66%, black 70%);
      mask: radial-gradient(closest-side, transparent 66%, black 70%);
      transition: background 0.3s ease;
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
/*       width: 100%;
      max-width: 800px;
      max-height: 85vh; */
      aspect-ratio: 9 / 16;
      background: black;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #insta-stories-overlay .story-img {
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
    /* Progress bar agora embaixo */
    #insta-stories-overlay .progress {
      position: absolute;
      bottom: 8px; left: 8px; right: 8px;
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
    #insta-stories-overlay .tap-left, #insta-stories-overlay .tap-right {
      position: absolute;
      top: 0; bottom: 0;
      width: 50%;
      cursor: pointer;
    }
    #insta-stories-overlay .tap-left { left: 0; }
    #insta-stories-overlay .tap-right { right: 0; }
`;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "insta-stories-carousel";
  container.innerHTML = `<div class="track"></div>`;
  if (target) {
    anchorParent.insertBefore(container, target);
  } else {
    document.body.prepend(container);
  }
  const track = container.querySelector(".track");

  const overlay = document.createElement("div");
  overlay.id = "insta-stories-overlay";
  overlay.innerHTML = `
    <div class="story-wrapper">
      <div class="top-buttons">
        <button class="btn-icon pause-btn">⏸</button>
        <button class="btn-icon close-btn">&times;</button>
      </div>
      <img class="story-img" alt="">
      <div class="progress"></div>
      <div class="tap-left"></div>
      <div class="tap-right"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector(".story-img");
  const progressEl = overlay.querySelector(".progress");

  let IMAGES = [];
  let currentIndex = 0;
  let timerId = null;
  let isRunning = false;
  let isPaused = false;
  let pauseStart = null;
  let elapsedBeforePause = 0;

  // FETCH DA API
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      // Itera sobre os placements na ordem
      data.placements.forEach(placement => {
        const creative = placement.creatives?.[0];
        if (!creative) return;

        const icon = creative.ICON;
        const contentSrc = creative.IMAGE || creative.VIDEO;
        const url = creative.URL;

        if (!icon || !contentSrc) return;

        IMAGES.push({ src: contentSrc, alt: placement.id, icon, url });
      });

      buildCarousel();
      buildProgress();
    })
    .catch(err => console.error("Erro ao carregar stories:", err));

  function buildCarousel() {
    IMAGES.forEach((img, idx) => {
      const item = document.createElement("button");
      item.className = "item";
      item.innerHTML = `<span class="ring"></span><img src="${img.icon}" alt="${img.alt || ""}">`;
      item.addEventListener("click", () => openStory(idx));
      track.appendChild(item);
    });
  }

  function buildProgress() {
    progressEl.innerHTML = "";
    IMAGES.forEach(() => {
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

  function showImage(i) {
    const { src, alt, url } = IMAGES[i];
    imgEl.src = src;
    imgEl.alt = alt;
    imgEl.onclick = () => url && window.open(url, "_blank");
    for (let k = 0; k < IMAGES.length; k++) {
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
      if (!isRunning) return;
      if (isPaused) return;
      const elapsed = now - startTime;
      const pct = (elapsed / STORY_DURATION_MS) * 100;
      setProgress(currentIndex, pct);
      if (elapsed >= STORY_DURATION_MS) {
        completeProgress(currentIndex);
        nextStory();
      } else {
        timerId = requestAnimationFrame(tick);
      }
    };
    timerId = requestAnimationFrame(tick);
  }
  function clearTimer() { isRunning = false; if (timerId) cancelAnimationFrame(timerId); timerId = null; }

  function openStory(i) { currentIndex = i; overlay.classList.add("active"); showImage(currentIndex); startTimer(); document.body.style.overflow = "hidden"; }
  function closeStory() { clearTimer(); overlay.classList.remove("active"); document.body.style.overflow = ""; }

  function nextStory() {
    document.querySelectorAll('#insta-stories-carousel .ring')[currentIndex]?.classList.add("viewed");
    if (currentIndex < IMAGES.length - 1) { currentIndex++; showImage(currentIndex); startTimer(); }
    else { document.querySelectorAll('#insta-stories-carousel .ring')[currentIndex]?.classList.add("viewed"); closeStory(); }
  }
  function prevStory() { if (currentIndex > 0) { currentIndex--; showImage(currentIndex); startTimer(); } else { showImage(currentIndex); startTimer(); } }

  function togglePause() {
    const btn = overlay.querySelector(".pause-btn");
    if (!isPaused) { isPaused = true; pauseStart = performance.now(); btn.textContent = "▶"; }
    else { const now = performance.now(); elapsedBeforePause += now - pauseStart; btn.textContent = "⏸"; isPaused = false; startTimer(elapsedBeforePause); }
  }

  overlay.querySelector(".close-btn").addEventListener("click", closeStory);
  overlay.querySelector(".pause-btn").addEventListener("click", togglePause);
  overlay.querySelector(".tap-left").addEventListener("click", prevStory);
  overlay.querySelector(".tap-right").addEventListener("click", nextStory);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeStory(); });
  window.addEventListener("keydown", (e) => { if (!overlay.classList.contains("active")) return; if (e.key === "Escape") closeStory(); if (e.key === "ArrowRight") nextStory(); if (e.key === "ArrowLeft") prevStory(); });
})();
