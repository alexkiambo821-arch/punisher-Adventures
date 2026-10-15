
const SUPABASE_URL = "https://hbqmezfzryticbtswlhy.supabase.co/rest/v1/";
const SUPABASE_PUBLIC_KEY = "sb_publishable_7eRKA0H1fqsgZgsdvWsR1Q_sTpKJWH0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLIC_KEY
);

// Test the connection by loading active trips.
async function testTripsConnection() {
  const { data, error } = await supabaseClient
    .from("trips")
    .select("id, title, travel_date, return_date, price_ksh, capacity")
    .eq("is_active", true)
    .order("travel_date", { ascending: true });

  if (error) {
    console.error("Punisher Adventures database error:", error.message);
    return;
  }

  console.log("Supabase connected! Active trips:", data);
}

testTripsConnection();

document.addEventListener("DOMContentLoaded", () => {
  // Loading screen
  const loader = document.getElementById("loader");

  if (loader) {
    const hideLoader = () => {
      loader.classList.add("hidden");
    };

    window.addEventListener("load", hideLoader);
    setTimeout(hideLoader, 2500);
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
    if (!menuToggle || !navLinks) return;

    menuToggle.classList.remove("active");
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
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
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  // Automatic footer year
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
});
