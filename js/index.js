/* Base API URL */
const API_BASE = "https://v2.api.noroff.dev";

/* Elements on the page */
const listingsContainer = document.getElementById("listings");
const errorBox = document.getElementById("listings-error");
const statusBox = document.getElementById("listing-status");
const pagination = document.getElementById("pagination");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

/* Stores listings for searching/filtering */
let allListings = [];
let visibleListings = [];
let currentPage = 1;
const listingsPerPage = 24;

/* Escape user/API content before inserting into innerHTML */
function escapeHtml(str) {
	return String(str)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

/* Fetch all active listings from the API */
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

function renderPagination(listings) {
	if (!pagination) return;

	const totalPages = Math.ceil(listings.length / listingsPerPage);

	if (totalPages <= 1) {
		pagination.innerHTML = "";
		return;
	}

	pagination.innerHTML = `
		<button type="button" id="prev-page" ${currentPage === 1 ? "disabled" : ""}>
			Previous
		</button>

		<span aria-live="polite">Page ${currentPage} of ${totalPages}</span>

		<button type="button" id="next-page" ${
			currentPage === totalPages ? "disabled" : ""
		}>
			Next
		</button>
	`;

	document.getElementById("prev-page")?.addEventListener("click", () => {
		currentPage -= 1;
		renderListings(listings);
	});

	document.getElementById("next-page")?.addEventListener("click", () => {
		currentPage += 1;
		renderListings(listings);
	});
}

/* Render a list of listings onto the page */
function renderListings(listings) {
	if (!listingsContainer) return;

	if (!Array.isArray(listings) || listings.length === 0) {
		listingsContainer.innerHTML = "<p>No listings found.</p>";
		if (pagination) pagination.innerHTML = "";
		if (statusBox) statusBox.textContent = "No listings found.";
		return;
	}

	const start = (currentPage - 1) * listingsPerPage;
	const end = start + listingsPerPage;
	const paginatedListings = listings.slice(start, end);

	if (statusBox) {
		statusBox.textContent = `Showing ${paginatedListings.length} of ${listings.length} listings.`;
	}

	listingsContainer.innerHTML = paginatedListings
		.map((listing) => {
			const title = escapeHtml(listing.title || "Untitled listing");
			const description = escapeHtml(listing.description || "");
			const endsAt = listing.endsAt
				? new Date(listing.endsAt).toLocaleString()
				: "No end date";

			const mediaUrl =
				Array.isArray(listing.media) && listing.media.length > 0
					? listing.media[0].url
					: "";

			const mediaAlt =
				Array.isArray(listing.media) && listing.media.length > 0
					? escapeHtml(
							listing.media[0].alt || listing.title || "Auction listing image",
						)
					: "";

			const bids = Array.isArray(listing.bids) ? listing.bids : [];
			const highestBid = bids.length
				? Math.max(...bids.map((b) => b.amount))
				: 0;

			return `
				<article class="listing-card">
					${
						mediaUrl
							? `
								<div class="listing-image-wrapper">
									<img src="${mediaUrl}" alt="${mediaAlt}" class="listing-image" />
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

	renderPagination(listings);
}

/* Apply search filter based on user text input */
function applySearchFilter() {
	const query = (searchInput?.value || "").trim().toLowerCase();

	visibleListings = query
		? allListings.filter((listing) => {
				const title = (listing.title || "").toLowerCase();
				const description = (listing.description || "").toLowerCase();

				return title.includes(query) || description.includes(query);
			})
		: allListings;

	currentPage = 1;
	renderListings(visibleListings);
}

/* Load listings when page first opens */
async function loadListings() {
	if (!listingsContainer || !errorBox) return;

	listingsContainer.innerHTML = "<p>Loading listings...</p>";
	errorBox.textContent = "";
	if (statusBox) statusBox.textContent = "Loading listings.";

	try {
		const listings = await fetchListings();
		allListings = listings;
		visibleListings = listings;
		currentPage = 1;
		renderListings(visibleListings);
	} catch (error) {
		errorBox.textContent =
			error instanceof Error ? error.message : "Something went wrong.";

		listingsContainer.innerHTML = "";
		if (pagination) pagination.innerHTML = "";
	}
}

searchBtn?.addEventListener("click", applySearchFilter);

searchInput?.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		applySearchFilter();
	}
});

searchInput?.addEventListener("input", applySearchFilter);

loadListings();
