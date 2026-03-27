document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".sidebar__toggle");
  const nav = document.getElementById("site-nav");
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const nextExpanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(nextExpanded));
      nav.classList.toggle("is-open", nextExpanded);
    });
  }

  const setActiveLink = () => {
    const currentSection = sections.find((section, index) => {
      const nextSection = sections[index + 1];
      const top = section.offsetTop - 120;
      const bottom = nextSection ? nextSection.offsetTop - 120 : Number.POSITIVE_INFINITY;
      return window.scrollY >= top && window.scrollY < bottom;
    });

    navLinks.forEach((link) => {
      const isActive =
        currentSection && link.getAttribute("href") === `#${currentSection.id}`;
      link.classList.toggle("is-active", Boolean(isActive));
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 960 && nav && toggle) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  setActiveLink();
  window.addEventListener("scroll", setActiveLink, { passive: true });
  window.addEventListener("resize", setActiveLink);
});
