// Homepage panel switching. Masonry + lightbox live in gallery.js (shared).
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
    document.body.classList.toggle("gallery-wide", !!target.querySelector(".photo-grid"));
    if (window.relayoutGalleries) requestAnimationFrame(window.relayoutGalleries);
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
});
