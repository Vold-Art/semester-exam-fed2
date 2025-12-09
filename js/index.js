const API_BASE = "https://v2.api.noroff.dev";

const listingsContainer = document.getElementById("listings");
const errorBox = document.getElementById("listings-error");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

let allListings = [];

async function fetchListings() {
	const url = `${API_BASE}/auction/listings?_active=true&sort=created&sortOrder=desc&_bids=true&_seller=true`;

	const response = await fetch(url);
	const data = await response.json();

	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Failed to load listings";
		throw new Error(message);
	}

	return data.data ?? data;
}

function renderListings(listings) {
	if (!listingsContainer) return;

	if (!Array.isArray(listings) || listings.length === 0) {
		listingsContainer.innerHTML = "<p>No listings found.</p>";
		return;
	}

	listingsContainer.innerHTML = listings
		.map((listing) => {
			const title = listing.title || "Untitled listing";
			const description = listing.description || "";
			const endsAt = listing.endsAt
				? new Date(listing.endsAt).toLocaleString()
				: "No end date";

			const mediaUrl =
				Array.isArray(listing.media) && listing.media.length > 0
					? listing.media[0].url
					: "";

			const bids = Array.isArray(listing.bids) ? listing.bids : [];
			const highestBid = bids.length
				? Math.max(...bids.map((b) => b.amount))
				: 0;

			return `
  <article style="border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; background: white;">
    <h2>
      <a href="listing.html?id=${listing.id}">
        ${title}
      </a>
    </h2>
    ${
			mediaUrl
				? `<img src="${mediaUrl}" alt="" style="max-width: 100%; height: auto; margin: 0.5rem 0;" />`
				: ""
		}
    <p>${description}</p>
    <p><strong>Ends at:</strong> ${endsAt}</p>
    <p><strong>Highest bid:</strong> ${highestBid}</p>
  </article>
`;
		})
		.join("");
}

function applySearchFilter() {
	if (!Array.isArray(allListings) || allListings.length === 0) {
		return;
	}

	const query = (searchInput?.value || "").trim().toLowerCase();

	if (!query) {
		renderListings(allListings);
		return;
	}

	const filtered = allListings.filter((listing) => {
		const title = (listing.title || "").toLowerCase();
		const description = (listing.description || "").toLowerCase();

		return title.includes(query) || description.includes(query);
	});

	renderListings(filtered);
}

async function loadListings() {
	if (!listingsContainer || !errorBox) return;

	listingsContainer.innerHTML = "<p>Loading listings...</p>";
	errorBox.textContent = "";

	try {
		const listings = await fetchListings();
		allListings = listings;
		renderListings(listings);
	} catch (error) {
		errorBox.textContent =
			error instanceof Error ? error.message : "Something went wrong.";
		listingsContainer.innerHTML = "";
	}
}

if (searchBtn) {
	searchBtn.addEventListener("click", () => {
		applySearchFilter();
	});
}

if (searchInput) {
	searchInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			applySearchFilter();
		}
	});

	searchInput.addEventListener("input", () => {
		applySearchFilter();
	});
}

loadListings();
