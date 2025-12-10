import { showToast } from "./utils/toast.js";

/* Base API details */
const API_BASE = "https://v2.api.noroff.dev";
const API_KEY = "cbaa0f81-8295-47e5-9872-09e6c04de25c";

/* Elements on the page */
const listingContainer = document.getElementById("listing");
const errorBox = document.getElementById("listing-error");
const bidSection = document.getElementById("bid-section");

/* Logged-in user data */
const storedUser = localStorage.getItem("auction_user");
const currentUser = storedUser ? JSON.parse(storedUser) : null;
const token = localStorage.getItem("auction_token");

/* Get listing ID from the URL */
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

/* If no ID in URL, show error */
if (!id && errorBox) {
	errorBox.textContent = "No listing ID provided.";
}

/* Fetch a single listing including seller and bids */
async function fetchListing(id) {
	const url = `${API_BASE}/auction/listings/${id}?_seller=true&_bids=true`;

	const response = await fetch(url);
	const data = await response.json();

	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Failed to load listing";
		throw new Error(message);
	}

	return data.data ?? data;
}

/* Return the bidding section depending on login status and ownership */
function renderBidSection(listing) {
	if (!bidSection) return;

	/* If not logged in then show login/register links */
	if (!currentUser) {
		bidSection.innerHTML = `
      <p>You must be logged in to place a bid.</p>
      <p><a href="login.html">Log in</a> or <a href="register.html">register</a> to bid.</p>
    `;
		return;
	}

	/* Prevent bidding on your own listing */
	if (listing.seller && listing.seller.name === currentUser.name) {
		bidSection.innerHTML = `<p>This is your listing. You cannot bid on your own item.</p>`;
		return;
	}

	/* Show bid form */
	bidSection.innerHTML = `
    <h3>Place a bid</h3>
    <form id="bid-form">
      <label for="bid-amount">Amount</label>
      <input
        type="number"
        id="bid-amount"
        min="1"
        required
      />
      <button type="submit" class="btn btn-secondary">Place bid</button>

    </form>
    <p id="bid-error" style="color: crimson"></p>
  `;

	/* Connect submit handler */
	const bidForm = document.getElementById("bid-form");
	if (bidForm) {
		bidForm.addEventListener("submit", (event) => handleBid(event, listing));
	}
}

/* Render full listing details */
function renderListing(listing) {
	const title = listing.title || "Untitled";
	const description = listing.description || "No description available.";
	const endsAt = listing.endsAt
		? new Date(listing.endsAt).toLocaleString()
		: "Unknown end date";

	/* Use first image if available */
	const media = Array.isArray(listing.media) ? listing.media : [];
	const firstImage = media.length > 0 ? media[0].url : null;

	/* List all bids */
	const bids = Array.isArray(listing.bids) ? listing.bids : [];
	const bidList = bids
		.map((b) => `<li>${b.bidderName ?? "Anonymous"}: ${b.amount}</li>`)
		.join("");

	/* Build listing card HTML */
	listingContainer.innerHTML = `
    <article style="background:white; padding:1rem; border:1px solid #ccc">
      <h2>${title}</h2>

      ${
				firstImage
					? `<img src="${firstImage}" style="max-width:100%; height:auto; margin:1rem 0;" />`
					: ""
			}

      <p>${description}</p>
      <p><strong>Ends at:</strong> ${endsAt}</p>

      <h3>Bids</h3>
      <ul>${bidList || "<li>No bids yet.</li>"}</ul>
    </article>
  `;

	/* Show the bid form */
	renderBidSection(listing);
}

/* Handle placing a bid */
async function handleBid(event, listing) {
	event.preventDefault();

	const amountInput = document.getElementById("bid-amount");
	const errorElement = document.getElementById("bid-error");
	if (!amountInput || !errorElement) return;

	errorElement.textContent = "";

	/* Must be logged in */
	if (!token) {
		errorElement.textContent = "You must be logged in to bid.";
		showToast("You must be logged in to bid.", "error");
		return;
	}

	/* Validate bid */
	const amount = Number(amountInput.value);
	if (!amount || amount <= 0) {
		errorElement.textContent = "Please enter a valid bid amount.";
		showToast("Please enter a valid bid amount.", "error");
		return;
	}

	try {
		/* Send bid data to API */
		const response = await fetch(
			`${API_BASE}/auction/listings/${listing.id}/bids`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
					"X-Noroff-API-Key": API_KEY,
				},
				body: JSON.stringify({ amount }),
			}
		);

		const data = await response.json();

		if (!response.ok) {
			const message =
				data.errors?.[0]?.message || "Failed to place bid. Please try again.";
			throw new Error(message);
		}

		showToast("Bid placed successfully!", "success");
		amountInput.value = "";

		/* Reload listing so new bid appears */
		await load();
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Something went wrong.";
		errorElement.textContent = message;
		showToast(message, "error");
	}
}

/* Load the listing when the page opens */
async function load() {
	if (!id) return;

	listingContainer.innerHTML = "<p>Loading...</p>";
	if (errorBox) errorBox.textContent = "";

	try {
		const listing = await fetchListing(id);
		renderListing(listing);
	} catch (error) {
		if (errorBox) {
			errorBox.textContent =
				error instanceof Error ? error.message : "Something went wrong.";
		}
	}
}

/* Run on page load */
load();
