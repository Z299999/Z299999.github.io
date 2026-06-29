document.addEventListener("DOMContentLoaded", () => {
  const navLinks = Array.from(document.querySelectorAll(".sidebar__nav a[data-panel]"));
  const panelLinks = Array.from(document.querySelectorAll("a[data-panel]"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  // ---- Ordered masonry for each .photo-grid (shortest-column packing) ----
  const GAP = 6;
  const TARGET = 340; // approximate column width in px
  const grids = Array.from(document.querySelectorAll(".photo-grid")).map((grid) => ({
    grid,
    figures: Array.from(grid.querySelectorAll(".photo")),
  }));

  const layoutGrid = (g) => {
    if (!g.figures.length) return;
    const width = g.grid.clientWidth;
    if (!width) return; // hidden — lay out when its panel becomes visible
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

  const layoutVisible = () => {
    grids.forEach((g) => {
      if (g.grid.closest(".panel.is-active")) layoutGrid(g);
    });
  };

  const show = (id) => {
    const target = panels.find((p) => p.id === id) || panels[0];
    panels.forEach((p) => p.classList.toggle("is-active", p === target));
    navLinks.forEach((a) =>
      a.classList.toggle("is-active", a.getAttribute("data-panel") === target.id)
    );
    document.body.classList.toggle("theme-dark", target.id === "photography");
    document.body.classList.toggle("gallery-wide", !!target.querySelector(".photo-grid"));
    requestAnimationFrame(layoutVisible);
    window.scrollTo(0, 0);
  };

  panelLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("data-panel");
      show(id);
      history.replaceState(null, "", `#${id}`);
    });
  });

  const initial = window.location.hash.replace("#", "");
  show(panels.some((p) => p.id === initial) ? initial : panels[0].id);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutVisible, 150);
  });

  // ---- Lightbox (scoped to the clicked grid, in capture-date order) ----
  const box = document.getElementById("lightbox");
  if (box) {
    const lbImg = box.querySelector(".lightbox__img");
    let photos = [];
    let i = 0;

    const open = (list, n) => {
      photos = list;
      i = (n + photos.length) % photos.length;
      lbImg.src = photos[i].src;
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
  }
});
