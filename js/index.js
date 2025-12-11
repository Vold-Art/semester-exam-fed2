/* Base API URL */
const API_BASE = "https://v2.api.noroff.dev";

/* Elements on the page */
const listingsContainer = document.getElementById("listings");
const errorBox = document.getElementById("listings-error");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

/* Stores all listings for searching/filtering */
let allListings = [];

/* Fetch all active listings from the API */
async function fetchListings() {
	const url = `${API_BASE}/auction/listings?_active=true&sort=created&sortOrder=desc&_bids=true&_seller=true`;

	const response = await fetch(url);
	const data = await response.json();

	/* Show error if request failed */
	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Failed to load listings";
		throw new Error(message);
	}

	return data.data ?? data;
}

/* Render a list of listings onto the page */
function renderListings(listings) {
	if (!listingsContainer) return;

	/* If nothing matches the filter/search */
	if (!Array.isArray(listings) || listings.length === 0) {
		listingsContainer.innerHTML = "<p>No listings found.</p>";
		return;
	}

	/* Build HTML for each listing */
	listingsContainer.innerHTML = listings
		.map((listing) => {
			const title = listing.title || "Untitled listing";
			const description = listing.description || "";
			const endsAt = listing.endsAt
				? new Date(listing.endsAt).toLocaleString()
				: "No end date";

			/* Use first media image if present */
			const mediaUrl =
				Array.isArray(listing.media) && listing.media.length > 0
					? listing.media[0].url
					: "";

			/* Find highest bid */
			const bids = Array.isArray(listing.bids) ? listing.bids : [];
			const highestBid = bids.length
				? Math.max(...bids.map((b) => b.amount))
				: 0;

			/* Listing card HTML */
			return `
  <article class="listing-card">
    ${
			mediaUrl
				? `
      <div class="listing-image-wrapper">
        <img src="${mediaUrl}" alt="${title}" class="listing-image" />
      </div>
      `
				: ""
		}
    <div class="listing-content">
      <h2 class="listing-title">
        <a href="listing.html?id=${listing.id}" class="listing-link">
          ${title}
        </a>
      </h2>
      <p class="listing-description">${description}</p>
      <div class="listing-meta">
        <p><strong>Ends at:</strong> ${endsAt}</p>
        <p><strong>Highest bid:</strong> ${highestBid}</p>
      </div>
    </div>
  </article>
`;
		})
		.join("");
}

/* Apply search filter based on user text input */
function applySearchFilter() {
	if (!Array.isArray(allListings) || allListings.length === 0) return;

	const query = (searchInput?.value || "").trim().toLowerCase();

	/* Show all if search box is empty */
	if (!query) {
		renderListings(allListings);
		return;
	}

	/* Filter listings where title or description includes the search text */
	const filtered = allListings.filter((listing) => {
		const title = (listing.title || "").toLowerCase();
		const description = (listing.description || "").toLowerCase();

		return title.includes(query) || description.includes(query);
	});

	renderListings(filtered);
}

/* Load listings when page first opens */
async function loadListings() {
	if (!listingsContainer || !errorBox) return;

	listingsContainer.innerHTML = "<p>Loading listings...</p>";
	errorBox.textContent = "";

	try {
		const listings = await fetchListings();
		allListings = listings;
		renderListings(listings);
	} catch (error) {
		/* Display error and stop rendering */
		errorBox.textContent =
			error instanceof Error ? error.message : "Something went wrong.";
		listingsContainer.innerHTML = "";
	}
}

/* Search button click event */
if (searchBtn) {
	searchBtn.addEventListener("click", () => {
		applySearchFilter();
	});
}

/* Allow live search + Enter key */
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

/* Run initial load of listings */
loadListings();
