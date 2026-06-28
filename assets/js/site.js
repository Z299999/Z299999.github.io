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
