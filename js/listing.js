const API_BASE = "https://v2.api.noroff.dev";

const listingContainer = document.getElementById("listing");
const errorBox = document.getElementById("listing-error");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
	errorBox.textContent = "No listing ID provided.";
}

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

function renderListing(listing) {
	const title = listing.title || "Untitled";
	const description = listing.description || "No description available.";
	const endsAt = listing.endsAt
		? new Date(listing.endsAt).toLocaleString()
		: "Unknown end date";

	const media = Array.isArray(listing.media) ? listing.media : [];
	const firstImage = media.length > 0 ? media[0].url : null;

	const bids = Array.isArray(listing.bids) ? listing.bids : [];
	const bidList = bids
		.map((b) => `<li>${b.bidderName ?? "Anonymous"}: ${b.amount}</li>`)
		.join("");

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
}

async function load() {
	if (!id) return;

	listingContainer.innerHTML = "<p>Loading...</p>";
	errorBox.textContent = "";

	try {
		const listing = await fetchListing(id);
		renderListing(listing);
	} catch (error) {
		errorBox.textContent =
			error instanceof Error ? error.message : "Something went wrong.";
	}
}

load();
