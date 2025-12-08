import { showToast } from "./utils/toast.js";

const API_BASE = "https://v2.api.noroff.dev";
const API_KEY = "cbaa0f81-8295-47e5-9872-09e6c04de25c";

const form = document.getElementById("create-listing-form");
const errorBox = document.getElementById("create-listing-error");

const token = localStorage.getItem("auction_token");
const storedUser = localStorage.getItem("auction_user");

if (!token || !storedUser) {
	window.location.href = "login.html";
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

		try {
			const response = await fetch(`${API_BASE}/auction/listings`, {
				method: "POST",
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
					"Failed to create listing. Please try again.";
				throw new Error(message);
			}

			showToast("Listing created successfully!", "success");

			form.reset();

			const created = data.data ?? data;
			if (created && created.id) {
				setTimeout(() => {
					window.location.href = `listing.html?id=${created.id}`;
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
