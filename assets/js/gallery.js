// Shared masonry + lightbox for every .photo-grid on a page.
// Used by the homepage (index.html) and the standalone Van build page.
(function () {
  const GAP = 6;
  const TARGET = 340; // approximate column width in px
  let grids = [];

  const layoutGrid = (g) => {
    if (!g.figures.length) return;
    const width = g.grid.clientWidth;
    if (!width) return; // hidden — lay out once its container becomes visible
    const n = Math.max(1, Math.round(width / TARGET));
    const colW = (width - GAP * (n - 1)) / n;
    const cols = [];
    const heights = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElement("div");
      c.className = "photo-col";
      cols.push(c);
      heights.push(0);
    }
    g.figures.forEach((fig) => {
      const img = fig.querySelector("img");
      const w = parseInt(img.getAttribute("width"), 10) || 1;
      const h = parseInt(img.getAttribute("height"), 10) || 1;
      let mi = 0;
      for (let i = 1; i < n; i++) if (heights[i] < heights[mi]) mi = i;
      cols[mi].appendChild(fig);
      heights[mi] += colW * (h / w) + GAP;
    });
    g.grid.classList.add("js-masonry");
    g.grid.replaceChildren(...cols);
  };

  const relayout = () => grids.forEach((g) => layoutGrid(g));
  window.relayoutGalleries = relayout;

  document.addEventListener("DOMContentLoaded", () => {
    grids = Array.from(document.querySelectorAll(".photo-grid")).map((grid) => ({
      grid,
      figures: Array.from(grid.querySelectorAll(".photo")),
    }));
    relayout();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(relayout, 150);
    });

    // ---- Lightbox (scoped to the clicked grid, shows the photo id) ----
    const box = document.getElementById("lightbox");
    if (!box) return;
    const lbImg = box.querySelector(".lightbox__img");
    const caption = box.querySelector(".lightbox__caption");
    let photos = [];
    let i = 0;

    const open = (list, n) => {
      photos = list;
      i = (n + photos.length) % photos.length;
      lbImg.src = photos[i].src;
      const m = photos[i].getAttribute("src").match(/([a-z]\d+)\.jpg/i);
      if (caption) caption.textContent = m ? m[1] : "";
      box.hidden = false;
    };
    const close = () => {
      box.hidden = true;
      lbImg.removeAttribute("src");
    };

    grids.forEach((g) => {
      const imgs = g.figures.map((f) => f.querySelector("img"));
      imgs.forEach((p, n) => p.addEventListener("click", () => open(imgs, n)));
    });
    const posters = Array.from(document.querySelectorAll("img.film__poster"));
    posters.forEach((p, n) => p.addEventListener("click", () => open(posters, n)));
    const figures = Array.from(document.querySelectorAll("img.entry__img"));
    figures.forEach((p, n) => p.addEventListener("click", () => open(figures, n)));

    box.querySelector(".lightbox__next").addEventListener("click", (e) => {
      e.stopPropagation();
      open(photos, i + 1);
    });
    box.querySelector(".lightbox__prev").addEventListener("click", (e) => {
      e.stopPropagation();
      open(photos, i - 1);
    });
    box.querySelector(".lightbox__close").addEventListener("click", close);
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", (e) => {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") open(photos, i + 1);
      else if (e.key === "ArrowLeft") open(photos, i - 1);
    });
  });
})();
