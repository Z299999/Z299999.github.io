// Homepage panel switching. Masonry + lightbox live in gallery.js (shared).
//
// Every panel is also a real path (/research/, /writing/, ...): tools/build_pages.py
// writes a copy of index.html per panel with that panel already active, so a
// shared link previews and indexes as its own page. Once a page is loaded,
// switching stays in place: a click pushes the matching path, Back/Forward pop
// it, and the old /#research links still open the right panel (and are then
// rewritten to the real path).
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = Array.from(document.querySelectorAll(".sidebar__nav a[data-panel]"));
  const panelLinks = Array.from(document.querySelectorAll("a[data-panel]"));
  const panels = Array.from(document.querySelectorAll(".panel"));
  if (!panels.length) return; // not the panelled page (e.g. /van/)
  const home = panels[0].id;

  const has = (id) => panels.some((p) => p.id === id);
  const pathFor = (id) => (id === home ? "/" : `/${id}/`);
  const idFromLocation = () => {
    const hash = window.location.hash.replace("#", "");
    if (has(hash)) return hash;
    const seg = window.location.pathname.split("/").filter(Boolean)[0];
    return has(seg) ? seg : home;
  };

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
      // a modified click wants a new tab/window: the href is a real path, let it go
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      const id = link.getAttribute("data-panel");
      show(id);
      history.pushState(null, "", pathFor(id));
    });
  });

  window.addEventListener("popstate", () => show(idFromLocation()));

  const initial = idFromLocation();
  show(initial);
  if (window.location.hash) history.replaceState(null, "", pathFor(initial));
});
