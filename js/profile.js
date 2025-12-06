const profileInfo = document.getElementById("profile-info");
const myListingsSection = document.getElementById("my-listings");
const myBidsSection = document.getElementById("my-bids");
const errorBox = document.getElementById("profile-error");

const API_BASE = "https://v2.api.noroff.dev";
const API_KEY = "cbaa0f81-8295-47e5-9872-09e6c04de25c";

const storedUser = localStorage.getItem("auction_user");
const token = localStorage.getItem("auction_token");
const currentUser = storedUser ? JSON.parse(storedUser) : null;

if (!currentUser || !token) {
	// Not logged in → send to login
	window.location.href = "login.html";
}

/**
 * Render basic profile info: name, email, avatar, banner, credits, bio
 */
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

/**
 * Fetch full profile data from API (to get latest credits, avatar, banner, bio)
 */
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
        <article style="background:white; padding:1rem; border:1px solid #ccc; margin-bottom: 1rem;">
          <h3>
            <a href="listing.html?id=${listing.id}">
              ${title}
            </a>
          </h3>

          ${
						firstImage
							? `<img src="${firstImage}" alt="${title}" style="max-width:100%; height:auto; margin:0.5rem 0;" />`
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
        <article style="background:white; padding:1rem; border:1px solid #ccc; margin-bottom: 1rem;">
          <h3>
            <a href="listing.html?id=${listing.id}">
              ${title}
            </a>
          </h3>

          ${
						firstImage
							? `<img src="${firstImage}" alt="${title}" style="max-width:100%; height:auto; margin:0.5rem 0;" />`
							: ""
					}

          <p><strong>Your bid:</strong> ${myBidAmount}</p>
          <p><strong>Current highest bid:</strong> ${highestBid}</p>
          <p><strong>Ends at:</strong> ${endsAt}</p>
        </article>
      `;
		})
		.join("");
}

async function loadProfilePage() {
	if (!currentUser) return;

	if (errorBox) errorBox.textContent = "Loading profile…";
	if (myListingsSection) myListingsSection.innerHTML = "";
	if (myBidsSection) myBidsSection.innerHTML = "";

	try {
		const profile = await fetchProfile(currentUser.name);
		renderProfileInfo(profile);

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

loadProfilePage();
