import { showToast } from "./utils/toast.js";

const API_BASE = "https://v2.api.noroff.dev";
const API_KEY = "cbaa0f81-8295-47e5-9872-09e6c04de25c";

const form = document.getElementById("create-listing-form");
const errorBox = document.getElementById("create-listing-error");

const token = localStorage.getItem("auction_token");
const storedUser = localStorage.getItem("auction_user");

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");
const isEditMode = Boolean(listingId);

if (!token || !storedUser) {
	window.location.href = "login.html";
}

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

	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Failed to load listing.";
		throw new Error(message);
	}

	return data.data ?? data;
}

function populateFormFromListing(listing) {
	const titleInput = document.getElementById("listing-title");
	const descriptionInput = document.getElementById("listing-description");
	const endsAtInput = document.getElementById("listing-ends-at");
	const media1Input = document.getElementById("listing-media-1");
	const media2Input = document.getElementById("listing-media-2");
	const media3Input = document.getElementById("listing-media-3");

	if (titleInput) titleInput.value = listing.title || "";
	if (descriptionInput) descriptionInput.value = listing.description || "";

	if (endsAtInput && listing.endsAt) {
		const dt = new Date(listing.endsAt);

		endsAtInput.value = dt.toISOString().slice(0, 16);
	}

	const media = Array.isArray(listing.media) ? listing.media : [];
	if (media1Input) media1Input.value = media[0]?.url || "";
	if (media2Input) media2Input.value = media[1]?.url || "";
	if (media3Input) media3Input.value = media[2]?.url || "";
}

async function init() {
	if (!form) return;

	if (isEditMode) {
		const heading = document.querySelector("main h1");
		if (heading) heading.textContent = "Edit listing";
		document.title = "Edit listing";

		if (errorBox) errorBox.textContent = "Loading listing…";

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

if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorBox.textContent = "";

		const title = document.getElementById("listing-title").value.trim();
		const description = document
			.getElementById("listing-description")
			.value.trim();
		const endsAt = document.getElementById("listing-ends-at").value;

		const media1 = document.getElementById("listing-media-1").value.trim();
		const media2 = document.getElementById("listing-media-2").value.trim();
		const media3 = document.getElementById("listing-media-3").value.trim();

		if (!title || !endsAt) {
			errorBox.textContent = "Title and end date are required.";
			showToast("Please fill in all required fields.", "error");
			return;
		}

		const endsAtDate = new Date(endsAt);
		const nowPlus1Hour = new Date(Date.now() + 60 * 60 * 1000);

		if (endsAtDate < nowPlus1Hour) {
			errorBox.textContent =
				"The auction must end at least 1 hour in the future.";
			showToast("End date too soon.", "error");
			return;
		}

		const media = [];
		if (media1) media.push({ url: media1 });
		if (media2) media.push({ url: media2 });
		if (media3) media.push({ url: media3 });

		const newListing = {
			title,
			description,
			endsAt: endsAtDate.toISOString(),
			media,
		};

		const endpoint = isEditMode
			? `${API_BASE}/auction/listings/${listingId}`
			: `${API_BASE}/auction/listings`;

		const method = isEditMode ? "PUT" : "POST";

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

			if (!response.ok) {
				const message =
					data.errors?.[0]?.message ||
					(isEditMode
						? "Failed to update listing. Please try again."
						: "Failed to create listing. Please try again.");
				throw new Error(message);
			}

			showToast(
				isEditMode
					? "Listing updated successfully!"
					: "Listing created successfully!",
				"success"
			);

			if (!isEditMode) {
				form.reset();
			}

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

init();
