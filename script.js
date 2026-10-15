
const SUPABASE_URL = "https://hbqmezfzryticbtswlhy.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_7eRKA0H1fqsgZgsdvWsR1Q_sTpKJWH0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLIC_KEY
);


async function loadUpcomingTrips() {
  const tripGrid = document.getElementById("tripGrid");

  if (!tripGrid) {
    console.error("Trip display area not found. Check the HTML.");
    return;
  }

  tripGrid.innerHTML = "<p>Loading upcoming adventures...</p>";

  const { data, error } = await supabaseClient
    .from("trips")
    .select("id, title, travel_date, return_date, price_ksh, capacity, boarding_point")
    .eq("is_active", true)
    .order("travel_date", { ascending: true });

  if (error) {
    console.error("Could not load trips:", error.message);
    tripGrid.innerHTML =
      "<p>Our adventures are temporarily unavailable. Please try again later.</p>";
    return;
  }

  if (!data || data.length === 0) {
    tripGrid.innerHTML = "<p>No upcoming adventures at the moment. Check back soon!</p>";
    return;
  }

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Nairobi"
  });

  tripGrid.innerHTML = data.map((trip) => {
    const date = dateFormatter.format(new Date(trip.travel_date));

    return `
      <article class="trip-card">
        <div class="trip-card-tag">UPCOMING ADVENTURE</div>
        <h3>${trip.title}</h3>
        <p class="trip-date">📅 ${date}</p>
        <p>📍 ${trip.boarding_point}</p>
        <p>👥 ${trip.capacity} seats total</p>
        <div class="trip-card-bottom">
          <div class="trip-price">
            <span>FROM</span>
            <strong>KSh ${Number(trip.price_ksh).toLocaleString("en-KE")}</strong>
            <small>per person</small>
          </div>
          <a class="trip-book-button" href="#contact">BOOK YOUR SPOT ↗</a>
        </div>
      </article>
    `;
  }).join("");
}

loadUpcomingTrips();


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
