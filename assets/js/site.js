document.addEventListener("DOMContentLoaded", () => {
  const navLinks = Array.from(document.querySelectorAll(".sidebar__nav a[data-panel]"));
  const panelLinks = Array.from(document.querySelectorAll("a[data-panel]"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  const show = (id) => {
    const target = panels.find((p) => p.id === id) || panels[0];
    panels.forEach((p) => p.classList.toggle("is-active", p === target));
    navLinks.forEach((a) =>
      a.classList.toggle("is-active", a.getAttribute("data-panel") === target.id)
    );
    document.body.classList.toggle("theme-dark", target.id === "photography");
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

  // Lightbox for the Photography gallery
  const box = document.getElementById("lightbox");
  if (box) {
    const lbImg = box.querySelector(".lightbox__img");
    const photos = Array.from(document.querySelectorAll("#photography .photo img"));
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
