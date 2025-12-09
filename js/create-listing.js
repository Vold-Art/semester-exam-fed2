import { showToast } from "./utils/toast.js";

/* Base API info */
const API_BASE = "https://v2.api.noroff.dev";
const API_KEY = "cbaa0f81-8295-47e5-9872-09e6c04de25c";

/* Form + error elements */
const form = document.getElementById("create-listing-form");
const errorBox = document.getElementById("create-listing-error");

/* Logged-in user info */
const token = localStorage.getItem("auction_token");
const storedUser = localStorage.getItem("auction_user");

/* Check if you are editing or creating */
const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");
const isEditMode = Boolean(listingId);

/* Redirect if not logged in */
if (!token || !storedUser) {
	window.location.href = "login.html";
}

/* Fetch listing data when editing */
async function fetchListingToEdit(id) {
	const url = `${API_BASE}/auction/listings/${id}`;

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			"X-Noroff-API-Key": API_KEY,
		},
	});

	const data = await response.json();

	/* Throw error if request failed */
	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Failed to load listing.";
		throw new Error(message);
	}

	return data.data ?? data;
}

/* Fill the form with existing listing data */
function populateFormFromListing(listing) {
	const titleInput = document.getElementById("listing-title");
	const descriptionInput = document.getElementById("listing-description");
	const endsAtInput = document.getElementById("listing-ends-at");
	const media1Input = document.getElementById("listing-media-1");
	const media2Input = document.getElementById("listing-media-2");
	const media3Input = document.getElementById("listing-media-3");

	if (titleInput) titleInput.value = listing.title || "";
	if (descriptionInput) descriptionInput.value = listing.description || "";

	/* Format date/time for input field */
	if (endsAtInput && listing.endsAt) {
		const dt = new Date(listing.endsAt);
		endsAtInput.value = dt.toISOString().slice(0, 16);
	}

	/* Fill media URL inputs */
	const media = Array.isArray(listing.media) ? listing.media : [];
	if (media1Input) media1Input.value = media[0]?.url || "";
	if (media2Input) media2Input.value = media[1]?.url || "";
	if (media3Input) media3Input.value = media[2]?.url || "";
}

/* Initialize the page */
async function init() {
	if (!form) return;

	if (isEditMode) {
		/* Update page heading */
		const heading = document.querySelector("main h1");
		if (heading) heading.textContent = "Edit listing";
		document.title = "Edit listing";

		if (errorBox) errorBox.textContent = "Loading listing…";

		/* Load existing listing data */
		try {
			const listing = await fetchListingToEdit(listingId);
			populateFormFromListing(listing);
			if (errorBox) errorBox.textContent = "";
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to load listing.";
			if (errorBox) errorBox.textContent = message;
			showToast(message, "error");
		}
	}
}

/* Handle form submit (create or update) */
if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorBox.textContent = "";

		/* Get form values */
		const title = document.getElementById("listing-title").value.trim();
		const description = document
			.getElementById("listing-description")
			.value.trim();
		const endsAt = document.getElementById("listing-ends-at").value;

		const media1 = document.getElementById("listing-media-1").value.trim();
		const media2 = document.getElementById("listing-media-2").value.trim();
		const media3 = document.getElementById("listing-media-3").value.trim();

		/* Validate required fields */
		if (!title || !endsAt) {
			errorBox.textContent = "Title and end date are required.";
			showToast("Please fill in all required fields.", "error");
			return;
		}

		/* Ensure end date is at least 1 hour in the future */
		const endsAtDate = new Date(endsAt);
		const nowPlus1Hour = new Date(Date.now() + 60 * 60 * 1000);

		if (endsAtDate < nowPlus1Hour) {
			errorBox.textContent =
				"The auction must end at least 1 hour in the future.";
			showToast("End date too soon.", "error");
			return;
		}

		/* Build media array (only include filled inputs) */
		const media = [];
		if (media1) media.push({ url: media1 });
		if (media2) media.push({ url: media2 });
		if (media3) media.push({ url: media3 });

		/* Prepare listing structure */
		const newListing = {
			title,
			description,
			endsAt: endsAtDate.toISOString(),
			media,
		};

		/* Setup endpoint + method depending on create/edit mode */
		const endpoint = isEditMode
			? `${API_BASE}/auction/listings/${listingId}`
			: `${API_BASE}/auction/listings`;

		const method = isEditMode ? "PUT" : "POST";

		/* Send request */
		try {
			const response = await fetch(endpoint, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
					"X-Noroff-API-Key": API_KEY,
				},
				body: JSON.stringify(newListing),
			});

			const data = await response.json();

			/* Handle errors */
			if (!response.ok) {
				const message =
					data.errors?.[0]?.message ||
					(isEditMode
						? "Failed to update listing. Please try again."
						: "Failed to create listing. Please try again.");
				throw new Error(message);
			}

			/* Success message */
			showToast(
				isEditMode
					? "Listing updated successfully!"
					: "Listing created successfully!",
				"success"
			);

			/* Clear form when creating new listing */
			if (!isEditMode) {
				form.reset();
			}

			/* Redirect to the listing page */
			const resultListing = data.data ?? data;
			if (resultListing && resultListing.id) {
				setTimeout(() => {
					window.location.href = `listing.html?id=${resultListing.id}`;
				}, 800);
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Something went wrong.";
			errorBox.textContent = message;
			showToast(message, "error");
		}
	});
}

/* Run initialization */
init();
