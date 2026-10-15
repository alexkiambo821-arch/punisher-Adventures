
document.addEventListener("DOMContentLoaded", () => {
  // Loading screen
  const loader = document.getElementById("loader");

  if (loader) {
    window.addEventListener("load", () => {
      loader.classList.add("hidden");
    });

    // Fallback so the loader doesn't stay forever
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 2500);
  }

  // Header scroll effect
  const header = document.getElementById("header");

  function updateHeader() {
    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 40);
    }
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader);

  // Mobile navigation menu
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  function closeMenu() {
    if (menuToggle && navLinks) {
      menuToggle.classList.remove("active");
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  }

  if (menuToggle && navLinks) {
    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");

      menuToggle.classList.toggle("active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        closeMenu();
      }
    });
  }

  // Automatic footer year
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // WhatsApp placeholder notice
  const whatsappButton = document.getElementById("whatsappButton");

  if (whatsappButton && whatsappButton.getAttribute("href") === "#") {
    whatsappButton.addEventListener("click", (event) => {
      event.preventDefault();
      alert("The WhatsApp contact link will work once your business number is added.");
    });
  }
});

