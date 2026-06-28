document.addEventListener("DOMContentLoaded", () => {
  const navLinks = Array.from(document.querySelectorAll(".sidebar__nav a[data-panel]"));
  const panelLinks = Array.from(document.querySelectorAll("a[data-panel]"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  // ---- Ordered masonry: fill the shortest column so newest stay at the top ----
  const grid = document.querySelector("#photography .photo-grid");
  const figuresInOrder = grid ? Array.from(grid.querySelectorAll(".photo")) : [];
  const GAP = 6;
  const TARGET = 340; // approximate column width in px

  const layoutGallery = () => {
    if (!grid || !figuresInOrder.length) return;
    const width = grid.clientWidth;
    if (!width) return; // panel is hidden — lay out when it becomes visible
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

    figuresInOrder.forEach((fig) => {
      const img = fig.querySelector("img");
      const w = parseInt(img.getAttribute("width"), 10) || 1;
      const h = parseInt(img.getAttribute("height"), 10) || 1;
      let mi = 0;
      for (let i = 1; i < n; i++) if (heights[i] < heights[mi]) mi = i;
      cols[mi].appendChild(fig);
      heights[mi] += colW * (h / w) + GAP;
    });

    grid.classList.add("js-masonry");
    grid.replaceChildren(...cols);
  };

  const show = (id) => {
    const target = panels.find((p) => p.id === id) || panels[0];
    panels.forEach((p) => p.classList.toggle("is-active", p === target));
    navLinks.forEach((a) =>
      a.classList.toggle("is-active", a.getAttribute("data-panel") === target.id)
    );
    document.body.classList.toggle("theme-dark", target.id === "photography");
    if (target.id === "photography") requestAnimationFrame(layoutGallery);
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
    resizeTimer = setTimeout(layoutGallery, 150);
  });

  // ---- Lightbox (navigates in the original newest -> oldest order) ----
  const box = document.getElementById("lightbox");
  if (box) {
    const lbImg = box.querySelector(".lightbox__img");
    const photos = figuresInOrder.map((f) => f.querySelector("img"));
    let i = 0;

    const open = (n) => {
      i = (n + photos.length) % photos.length;
      lbImg.src = photos[i].src;
      box.hidden = false;
    };
    const close = () => {
      box.hidden = true;
      lbImg.removeAttribute("src");
    };

    photos.forEach((p, n) => p.addEventListener("click", () => open(n)));
    box.querySelector(".lightbox__next").addEventListener("click", (e) => {
      e.stopPropagation();
      open(i + 1);
    });
    box.querySelector(".lightbox__prev").addEventListener("click", (e) => {
      e.stopPropagation();
      open(i - 1);
    });
    box.querySelector(".lightbox__close").addEventListener("click", close);
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", (e) => {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") open(i + 1);
      else if (e.key === "ArrowLeft") open(i - 1);
    });
  }
});
