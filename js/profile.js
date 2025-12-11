import { showToast } from "./utils/toast.js";

/* Sections on the profile page */
const profileInfo = document.getElementById("profile-info");
const myListingsSection = document.getElementById("my-listings");
const myBidsSection = document.getElementById("my-bids");
const errorBox = document.getElementById("profile-error");

/* Edit profile form elements */
const profileEditForm = document.getElementById("profile-edit-form");
const profileEditError = document.getElementById("profile-edit-error");

/* Base API info */
const API_BASE = "https://v2.api.noroff.dev";
const API_KEY = "cbaa0f81-8295-47e5-9872-09e6c04de25c";

/* Logged-in user info */
const storedUser = localStorage.getItem("auction_user");
const token = localStorage.getItem("auction_token");
const currentUser = storedUser ? JSON.parse(storedUser) : null;

/* Redirect if user is not logged in */
if (!currentUser || !token) {
	window.location.href = "login.html";
}

/* Render main profile card */
function renderProfileInfo(profile) {
	if (!profileInfo) return;

	const name = profile.name || "Unknown user";
	const email = profile.email || "";
	const credits = profile.credits ?? 0;
	const bio = profile.bio || "No bio set yet.";

	const avatarUrl =
		profile.avatar && profile.avatar.url
			? profile.avatar.url
			: "https://placehold.co/80x80?text=Avatar";

	const bannerUrl =
		profile.banner && profile.banner.url
			? profile.banner.url
			: "https://placehold.co/600x150?text=Banner";

	profileInfo.innerHTML = `
    <article style="background:white; padding:1rem; border:1px solid #ccc; margin-bottom: 1rem;">
      <div style="margin-bottom: 1rem;">
        <img 
          src="${bannerUrl}" 
          alt="Profile banner" 
          style="width:100%; max-height:150px; object-fit:cover; margin-bottom:0.5rem;"
        />
        <div style="display:flex; align-items:center; gap:1rem;">
          <img 
            src="${avatarUrl}" 
            alt="Avatar for ${name}" 
            style="width:80px; height:80px; border-radius:50%; object-fit:cover;"
          />
          <div>
            <h2 style="margin:0;">${name}</h2>
            <p style="margin:0;">${email}</p>
            <p style="margin:0.25rem 0 0;">
              <strong>${credits}</strong> credits
            </p>
          </div>
        </div>
      </div>

      <section>
        <h3>Bio</h3>
        <p>${bio}</p>
      </section>
    </article>
  `;
}

/* Prefill the edit profile form with current data */
function prefillProfileEditForm(profile) {
	if (!profileEditForm) return;

	const avatarInput = document.getElementById("profile-avatar-url");
	const bannerInput = document.getElementById("profile-banner-url");
	const bioInput = document.getElementById("profile-bio");

	if (avatarInput) {
		avatarInput.value = (profile.avatar && profile.avatar.url) || "";
	}

	if (bannerInput) {
		bannerInput.value = (profile.banner && profile.banner.url) || "";
	}

	if (bioInput) {
		bioInput.value = profile.bio || "";
	}
}

/* Fetch the logged-in user's profile */
async function fetchProfile(name) {
	const url = `${API_BASE}/auction/profiles/${encodeURIComponent(
		name
	)}?_listings=false&_bids=false`;

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			"X-Noroff-API-Key": API_KEY,
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await response.json();

	if (!response.ok) {
		const message =
			data.errors?.[0]?.message || "Failed to load profile information.";
		throw new Error(message);
	}

	return data.data ?? data;
}

/* Fetch listings created by this user */
async function fetchMyListings(name) {
	const url = `${API_BASE}/auction/profiles/${encodeURIComponent(
		name
	)}/listings?sort=created&sortOrder=desc&_bids=true`;

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			"X-Noroff-API-Key": API_KEY,
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await response.json();

	if (!response.ok) {
		const message =
			data.errors?.[0]?.message || "Failed to load your listings.";
		throw new Error(message);
	}

	return data.data ?? data;
}

/* Fetch bids placed by this user */
async function fetchMyBids(name) {
	const url = `${API_BASE}/auction/profiles/${encodeURIComponent(
		name
	)}/bids?_listings=true&sort=created&sortOrder=desc`;

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			"X-Noroff-API-Key": API_KEY,
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await response.json();

	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Failed to load your bids.";
		throw new Error(message);
	}

	return data.data ?? data;
}

/* Delete a listing created by the current user */
async function deleteListing(id) {
	const confirmed = window.confirm(
		"Are you sure you want to delete this listing? This cannot be undone."
	);
	if (!confirmed) return;

	try {
		const response = await fetch(`${API_BASE}/auction/listings/${id}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				"X-Noroff-API-Key": API_KEY,
			},
		});

		if (!response.ok) {
			const data = await response.json();
			const message = data.errors?.[0]?.message || "Failed to delete listing.";
			throw new Error(message);
		}

		showToast("Listing deleted.", "success");

		/* Reload profile sections after delete */
		await loadProfilePage();
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Something went wrong.";
		if (errorBox) errorBox.textContent = message;
		showToast(message, "error");
	}
}

/* Render all listings created by the user */
function renderMyListings(listings) {
	if (!myListingsSection) return;

	if (!Array.isArray(listings) || listings.length === 0) {
		myListingsSection.innerHTML = `<p>You haven't created any listings yet.</p>`;
		return;
	}

	myListingsSection.innerHTML = listings
		.map((listing) => {
			const title = listing.title || "Untitled listing";
			const description = listing.description || "";
			const endsAt = listing.endsAt
				? new Date(listing.endsAt).toLocaleString()
				: "No end date";

			const media = Array.isArray(listing.media) ? listing.media : [];
			const firstImage = media.length > 0 ? media[0].url : null;

			const bids = Array.isArray(listing.bids) ? listing.bids : [];
			const highestBid = bids.length
				? Math.max(...bids.map((b) => b.amount))
				: 0;

			return `
        <article class="profile-card">
          <h3>
            <a href="listing.html?id=${listing.id}">
              ${title}
            </a>
          </h3>

          ${firstImage ? `<img src="${firstImage}" alt="${title}" />` : ""}

          <p>${description}</p>
          <p><strong>Ends at:</strong> ${endsAt}</p>
          <p><strong>Highest bid:</strong> ${highestBid}</p>

          <div style="margin-top:0.75rem; display:flex; gap:0.5rem;">
            <button 
              class="btn btn-primary edit-listing-btn" 
              data-listing-id="${listing.id}"
            >
              Edit
            </button>

            <button 
              class="btn btn-danger delete-listing-btn" 
              data-listing-id="${listing.id}"
            >
              Delete
            </button>
          </div>
        </article>
      `;
		})
		.join("");

	/* Attach delete handlers for each delete button */
	const deleteButtons = myListingsSection.querySelectorAll(
		".delete-listing-btn"
	);

	deleteButtons.forEach((button) => {
		button.addEventListener("click", async () => {
			const listingId = button.dataset.listingId;
			if (!listingId) return;

			await deleteListing(listingId);
		});
	});

	/* Attach edit handlers */
	const editButtons = myListingsSection.querySelectorAll(".edit-listing-btn");

	editButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const listingId = button.dataset.listingId;
			if (!listingId) return;

			window.location.href = `create-listing.html?id=${listingId}`;
		});
	});
}

/* Render all listings where the user has placed a bid */
function renderMyBids(bids) {
	if (!myBidsSection) return;

	if (!Array.isArray(bids) || bids.length === 0) {
		myBidsSection.innerHTML = `<p>You haven't placed any bids yet.</p>`;
		return;
	}

	myBidsSection.innerHTML = bids
		.map((bidEntry) => {
			const listing = bidEntry.listing;
			if (!listing) {
				return "";
			}

			const title = listing.title || "Untitled listing";
			const media = Array.isArray(listing.media) ? listing.media : [];
			const firstImage = media.length > 0 ? media[0].url : null;

			const allBids = Array.isArray(listing.bids) ? listing.bids : [];
			const highestBid = allBids.length
				? Math.max(...allBids.map((b) => b.amount))
				: 0;

			const myBidAmount = bidEntry.amount ?? 0;

			const endsAt = listing.endsAt
				? new Date(listing.endsAt).toLocaleString()
				: "No end date";

			return `
        <article class="profile-card">
          <h3>
            <a href="listing.html?id=${listing.id}">
              ${title}
            </a>
          </h3>

          ${firstImage ? `<img src="${firstImage}" alt="${title}" />` : ""}

          <p><strong>Your bid:</strong> ${myBidAmount}</p>
          <p><strong>Current highest bid:</strong> ${highestBid}</p>
          <p><strong>Ends at:</strong> ${endsAt}</p>
        </article>
      `;
		})
		.join("");
}

/* Load everything needed for the profile page */
async function loadProfilePage() {
	if (!currentUser) return;

	if (errorBox) errorBox.textContent = "Loading profile…";
	if (myListingsSection) myListingsSection.innerHTML = "";
	if (myBidsSection) myBidsSection.innerHTML = "";

	try {
		/* Load profile info */
		const profile = await fetchProfile(currentUser.name);
		renderProfileInfo(profile);
		prefillProfileEditForm(profile);

		/* Load listings and bids */
		const myListings = await fetchMyListings(currentUser.name);
		renderMyListings(myListings);

		const myBids = await fetchMyBids(currentUser.name);
		renderMyBids(myBids);

		if (errorBox) errorBox.textContent = "";
	} catch (error) {
		if (errorBox) {
			errorBox.textContent =
				error instanceof Error ? error.message : "Something went wrong.";
		}
	}
}

/* Handle profile edit form submit */
if (profileEditForm) {
	profileEditForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (profileEditError) profileEditError.textContent = "";

		const avatarInput = document.getElementById("profile-avatar-url");
		const bannerInput = document.getElementById("profile-banner-url");
		const bioInput = document.getElementById("profile-bio");

		const avatarUrl = avatarInput ? avatarInput.value.trim() : "";
		const bannerUrl = bannerInput ? bannerInput.value.trim() : "";
		const bio = bioInput ? bioInput.value.trim() : "";

		/* Build payload for update */
		const payload = {
			avatar: avatarUrl ? { url: avatarUrl } : null,
			banner: bannerUrl ? { url: bannerUrl } : null,
			bio: bio || null,
		};

		try {
			const response = await fetch(
				`${API_BASE}/auction/profiles/${encodeURIComponent(currentUser.name)}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
						"X-Noroff-API-Key": API_KEY,
					},
					body: JSON.stringify(payload),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				const message =
					data.errors?.[0]?.message || "Failed to update profile.";
				throw new Error(message);
			}

			showToast("Profile updated successfully!", "success");

			/* Reload profile with fresh data */
			await loadProfilePage();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Something went wrong.";
			if (profileEditError) profileEditError.textContent = message;
			showToast(message, "error");
		}
	});
}

/* Initial load when profile page opens */
loadProfilePage();
