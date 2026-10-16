
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
          <a
  class="trip-book-button"
  href="#bookingForm"
  data-trip-id="${trip.id}"
  data-trip-title="${trip.title}"
  data-trip-price="${trip.price_ksh}"
  data-trip-capacity="${trip.capacity}"
>
  BOOK YOUR SPOT ↗
</a>
        </div>
      </article>
    `;
  }).join("");
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".trip-book-button");
  if (!button) return;

  event.preventDefault();

  const tripId = button.dataset.tripId;
  const tripTitle = button.dataset.tripTitle;
  const price = Number(button.dataset.tripPrice);
  const capacity = Number(button.dataset.tripCapacity);

  let modal = document.getElementById("bookingModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "bookingModal";

    modal.innerHTML = `
      <div class="booking-box">
        <button type="button" id="closeBooking"
          class="booking-close" aria-label="Close booking form">×</button>

        <p class="section-kicker">PUNISHER ADVENTURES</p>
        <h2>BOOK YOUR <span class="orange-text">SPOT.</span></h2>
        <p id="bookingTripTitle"></p>

        <form id="bookingForm">
          <label for="bookingName">Full name</label>
          <input id="bookingName" name="customer_name"
            type="text" maxlength="100" required>

          <label for="bookingPhone">M-Pesa phone number</label>
          <input id="bookingPhone" name="phone"
            type="tel" placeholder="07XXXXXXXX" maxlength="13" required>

          <label for="bookingSeats">Number of seats</label>
          <select id="bookingSeats" name="seats" required></select>

          <p id="bookingTotal" aria-live="polite"></p>
          <p id="bookingMessage" role="status"></p>

          <button type="submit" class="btn btn-primary"
            id="submitBooking">CONTINUE BOOKING ↗</button>
        </form>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #bookingModal {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,.88); display: grid;
        place-items: center; padding: 18px; overflow-y: auto;
      }
      .booking-box {
        position: relative; background: #111; color: white;
        border: 1px solid #b94b12; padding: 28px;
        width: min(100%, 460px); max-height: 90vh;
        overflow-y: auto; border-radius: 12px;
      }
      .booking-box h2 { font-size: 2rem; margin: 12px 0; }
      .booking-box label {
        display: block; margin-top: 14px; margin-bottom: 6px;
      }
      .booking-box input, .booking-box select {
        display: block; width: 100%; padding: 12px;
        background: #202020; color: white;
        border: 1px solid #555; border-radius: 6px;
      }
      .booking-close {
        position: absolute; right: 12px; top: 8px;
        background: transparent; color: white; border: 0;
        font-size: 30px; cursor: pointer;
      }
      #bookingTotal { color: #ff7a24; font-weight: 800; margin: 18px 0; }
      #bookingMessage { overflow-wrap: anywhere; }
      #submitBooking { width: 100%; cursor: pointer; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "closeBooking") {
        modal.remove();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.getElementById("bookingModal")?.remove();
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target.id !== "bookingSeats") return;
      const count = Number(e.target.value);
      const total = count * Number(modal.dataset.price);
      document.getElementById("bookingTotal").textContent =
        `Total: KSh ${total.toLocaleString("en-KE")}`;
    });
  }

  modal.dataset.tripId = tripId;
  modal.dataset.price = String(price);

  document.getElementById("bookingTripTitle").textContent =
    `${tripTitle} — KSh ${price.toLocaleString("en-KE")} per person`;

  const seatsSelect = document.getElementById("bookingSeats");
  seatsSelect.innerHTML = "";

  for (let i = 1; i <= Math.min(capacity, 20); i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `${i} seat${i === 1 ? "" : "s"}`;
    seatsSelect.appendChild(option);
  }

  seatsSelect.value = "1";
  document.getElementById("bookingTotal").textContent =
    `Total: KSh ${price.toLocaleString("en-KE")}`;

  document.getElementById("bookingMessage").textContent = "";
  document.getElementById("bookingForm").dataset.tripId = tripId;

  document.getElementById("bookingForm").onsubmit = async (e) => {
    e.preventDefault();

    const submitButton = document.getElementById("submitBooking");
    const message = document.getElementById("bookingMessage");

    const customerName = document.getElementById("bookingName").value.trim();
    let phone = document.getElementById("bookingPhone").value.trim();
    const seats = Number(seatsSelect.value);

    phone = phone.replace(/[\s-]/g, "");
    if (phone.startsWith("+")) phone = phone.slice(1);
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);

    if (!/^254[17]\d{8}$/.test(phone)) {
      message.textContent = "Enter a valid Kenyan number, e.g. 0712345678.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "SUBMITTING...";
    message.textContent = "Submitting your booking request...";

    try {
      const { data, error } = await supabaseClient.rpc("submit_booking", {
        p_trip_id: tripId,
        p_customer_name: customerName,
        p_phone: phone,
        p_seats: seats
      });

      if (error) throw error;

      if (!data || data.ok !== true) {
        message.textContent =
          data?.message || "Booking could not be created. Please try again.";
        return;
      }

      message.textContent =
        `Booking request created. Reference: ${data.booking_reference}. ` +
        `Payment is not connected yet, so do not send money manually.`;

      document.getElementById("bookingForm").reset();
    } catch (error) {
      console.error("Booking error:", error);
      message.textContent =
        "We couldn't submit your booking. Please try again later.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "CONTINUE BOOKING ↗";
    }
  };

  modal.style.display = "grid";
});

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
