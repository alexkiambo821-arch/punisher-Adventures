
const SUPABASE_URL = "https://hbqmezfzryticbtswlhy.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_7eRKA0H1fqsgZgsdvWsR1Q_sTpKJWH0";

const TURNSTILE_SITE_KEY = "0x4AAAAAAFZD-t-2UScdns5NNbYlbF6jr-I";
const CREATE_BOOKING_URL = `${SUPABASE_URL}/functions/v1/create-booking`;

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLIC_KEY
);

// ------------------------------
// Cloudflare Turnstile security
// ------------------------------

async function renderBookingTurnstile(modal) {
  const message = document.getElementById("bookingMessage");

  for (let i = 0; i < 50 && !window.turnstile; i++) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const container = document.getElementById("turnstile-container");

  if (!window.turnstile || !container) {
    if (message) {
      message.textContent =
        "Security check is unavailable. Please close and reopen the booking form.";
    }
    return;
  }

  // Do not create a second widget in the same container.
  if (modal.dataset.turnstileWidgetId) return;

  try {
    const widgetId = window.turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,

      callback: (token) => {
        modal.dataset.turnstileToken = token;
        if (message) message.textContent = "";
      },

      "expired-callback": () => {
        modal.dataset.turnstileToken = "";
        if (message) {
          message.textContent =
            "Security check expired. Please complete it again.";
        }
      },

      "error-callback": () => {
        modal.dataset.turnstileToken = "";
        if (message) {
          message.textContent =
            "Security check failed to load. Please try again.";
        }
      },
    });

    modal.dataset.turnstileWidgetId = String(widgetId);
  } catch (error) {
    console.error("Turnstile rendering error:", error);
    if (message) {
      message.textContent =
        "Could not load the security check. Please refresh and try again.";
    }
  }
}

function resetBookingTurnstile(modal) {
  modal.dataset.turnstileToken = "";

  const widgetId = modal.dataset.turnstileWidgetId;

  if (window.turnstile && widgetId) {
    try {
      window.turnstile.reset(widgetId);
    } catch (error) {
      console.error("Turnstile reset error:", error);
    }
  }
}

// ------------------------------
// Load upcoming adventures
// ------------------------------

async function loadUpcomingTrips() {
  const tripGrid = document.getElementById("tripGrid");

  if (!tripGrid) {
    console.error("Trip display area not found. Check the HTML.");
    return;
  }

  tripGrid.innerHTML = "<p>Loading upcoming adventures...</p>";

  const { data, error } = await supabaseClient
    .from("trips")
    .select(
      "id, title, travel_date, return_date, price_ksh, capacity, boarding_point"
    )
    .eq("is_active", true)
    .order("travel_date", { ascending: true });

  if (error) {
    console.error("Could not load trips:", error.message);
    tripGrid.innerHTML =
      "<p>Our adventures are temporarily unavailable. Please try again later.</p>";
    return;
  }

  if (!data || data.length === 0) {
    tripGrid.innerHTML =
      "<p>No upcoming adventures at the moment. Check back soon!</p>";
    return;
  }

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });

  tripGrid.innerHTML = data
    .map((trip) => {
      const date = dateFormatter.format(new Date(trip.travel_date));

      return `
        <article class="trip-card">
          <div class="trip-card-tag">UPCOMING ADVENTURE</div>
          <h3>${escapeHTML(trip.title)}</h3>
          <p class="trip-date">📅 ${date}</p>
          <p>📍 ${escapeHTML(trip.boarding_point || "")}</p>
          <p>👥 ${Number(trip.capacity)} seats total</p>

          <div class="trip-card-bottom">
            <div class="trip-price">
              <span>FROM</span>
              <strong>KSh ${Number(trip.price_ksh).toLocaleString("en-KE")}</strong>
              <small>per person</small>
            </div>

            <a
              class="trip-book-button"
              href="#bookingForm"
              data-trip-id="${escapeHTML(trip.id)}"
              data-trip-title="${escapeHTML(trip.title)}"
              data-trip-price="${Number(trip.price_ksh)}"
              data-trip-capacity="${Number(trip.capacity)}"
            >
              BOOK YOUR SPOT ↗
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

// Escape database text before inserting it into HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

// ------------------------------
// Booking modal
// ------------------------------

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".trip-book-button");
  if (!button) return;

  event.preventDefault();

  const tripId = button.dataset.tripId;
  const tripTitle = button.dataset.tripTitle;
  const price = Number(button.dataset.tripPrice);
  const capacity = Number(button.dataset.tripCapacity);

  if (!tripId || !Number.isFinite(price) || capacity < 1) {
    alert("This trip's booking details are unavailable. Please try again.");
    return;
  }

  let modal = document.getElementById("bookingModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "bookingModal";

    modal.innerHTML = `
      <div class="booking-box">
        <button
          type="button"
          id="closeBooking"
          class="booking-close"
          aria-label="Close booking form"
        >×</button>

        <p class="section-kicker">PUNISHER ADVENTURES</p>
        <h2>BOOK YOUR <span class="orange-text">SPOT.</span></h2>
        <p id="bookingTripTitle"></p>

        <form id="bookingForm">
          <label for="bookingName">Full name</label>
          <input
            id="bookingName"
            name="customer_name"
            type="text"
            maxlength="100"
            autocomplete="name"
            required
          >

          <label for="bookingPhone">M-Pesa phone number</label>
          <input
            id="bookingPhone"
            name="phone"
            type="tel"
            placeholder="07XXXXXXXX"
            maxlength="13"
            autocomplete="tel"
            required
          >

          <label for="bookingSeats">Number of seats</label>
          <select id="bookingSeats" name="seats" required></select>

          <p id="bookingTotal" aria-live="polite"></p>

          <div id="turnstile-container" style="margin: 16px 0;"></div>

          <p id="bookingMessage" role="status" aria-live="polite"></p>

          <button
            type="submit"
            class="btn btn-primary"
            id="submitBooking"
          >CONTINUE BOOKING ↗</button>
        </form>
      </div>
    `;

    const style = document.createElement("style");
    style.id = "bookingModalStyles";
    style.textContent = `
      #bookingModal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, .88);
        display: grid;
        place-items: center;
        padding: 18px;
        overflow-y: auto;
      }

      .booking-box {
        position: relative;
        background: #111;
        color: white;
        border: 1px solid #b94b12;
        padding: 28px;
        width: min(100%, 460px);
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 12px;
      }

      .booking-box h2 {
        font-size: 2rem;
        margin: 12px 0;
      }

      .booking-box label {
        display: block;
        margin-top: 14px;
        margin-bottom: 6px;
      }

      .booking-box input,
      .booking-box select {
        display: block;
        box-sizing: border-box;
        width: 100%;
        padding: 12px;
        background: #202020;
        color: white;
        border: 1px solid #555;
        border-radius: 6px;
      }

      .booking-close {
        position: absolute;
        right: 12px;
        top: 8px;
        background: transparent;
        color: white;
        border: 0;
        font-size: 30px;
        cursor: pointer;
      }

      #bookingTotal {
        color: #ff7a24;
        font-weight: 800;
        margin: 18px 0;
      }

      #bookingMessage {
        overflow-wrap: anywhere;
      }

      #submitBooking {
        width: 100%;
        cursor: pointer;
      }

      #submitBooking:disabled {
        opacity: .65;
        cursor: wait;
      }

      @media (max-width: 480px) {
        .booking-box {
          padding: 22px 16px;
        }

        .booking-box h2 {
          font-size: 1.65rem;
        }
      }
    `;

    if (!document.getElementById("bookingModalStyles")) {
      document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "closeBooking") {
        modal.remove();
      }
    });

    modal.addEventListener("change", (e) => {
      if (e.target.id !== "bookingSeats") return;

      const count = Number(e.target.value);
      const total = count * Number(modal.dataset.price);

      document.getElementById("bookingTotal").textContent =
        `Total: KSh ${total.toLocaleString("en-KE")}`;
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.getElementById("bookingModal")?.remove();
      }
    });

    // Create the security widget when the modal is first created.
    renderBookingTurnstile(modal);
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

  const message = document.getElementById("bookingMessage");
  const form = document.getElementById("bookingForm");
  const submitButton = document.getElementById("submitBooking");

  message.textContent = "";

  form.onsubmit = async (e) => {
    e.preventDefault();

    const customerName = document.getElementById("bookingName").value.trim();
    let phone = document.getElementById("bookingPhone").value.trim();
    const seats = Number(seatsSelect.value);

    if (!customerName) {
      message.textContent = "Please enter your full name.";
      return;
    }

    if (customerName.length > 100) {
      message.textContent = "Your name is too long.";
      return;
    }

    phone = phone.replace(/[\s-]/g, "");
    if (phone.startsWith("+")) phone = phone.slice(1);
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);

    if (!/^254[17]\d{8}$/.test(phone)) {
      message.textContent =
        "Enter a valid Kenyan number, e.g. 0712345678.";
      return;
    }

    if (!Number.isInteger(seats) || seats < 1 || seats > capacity) {
      message.textContent = "Please select a valid number of seats.";
      return;
    }

    const turnstileToken = modal.dataset.turnstileToken;

    if (!turnstileToken) {
      message.textContent = "Please complete the security check first.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "SUBMITTING...";
    message.textContent = "Submitting your booking request...";

    let verificationAttempted = false;

    try {
      verificationAttempted = true;

      const response = await fetch(CREATE_BOOKING_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLIC_KEY,
        },
        body: JSON.stringify({
          turnstileToken,
          p_trip_id: tripId,
          p_customer_name: customerName,
          p_phone: phone,
          p_seats: seats,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Unexpected server response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Booking failed. Please try again."
        );
      }

      if (!data || data.ok !== true) {
        throw new Error(
          data?.message || "Booking could not be created. Please try again."
        );
      }

      message.textContent =
        `Booking request created. Reference: ${data.booking_reference}. ` +
        "Payment is not connected yet, so do not send money manually.";

      form.reset();
      seatsSelect.value = "1";

      document.getElementById("bookingTotal").textContent =
        `Total: KSh ${price.toLocaleString("en-KE")}`;
    } catch (error) {
      console.error("Booking error:", error);

      message.textContent =
        error?.message || "Booking failed. Please try again.";
    } finally {
      // Turnstile tokens are single-use. Reset after every server attempt.
      if (verificationAttempted) {
        resetBookingTurnstile(modal);
      }

      submitButton.disabled = false;
      submitButton.textContent = "CONTINUE BOOKING ↗";
    }
  };

  modal.style.display = "grid";
});

// ------------------------------
// Page setup
// ------------------------------

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
