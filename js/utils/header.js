/* Get the header container from the DOM */
const headerElement = document.getElementById("main-header");

/* Renders the navigation header based on whether the user is logged in */
function renderHeader() {
	if (!headerElement) return;

	/* Get user data from localStorage */
	const storedUser = localStorage.getItem("auction_user");
	const user = storedUser ? JSON.parse(storedUser) : null;

	/* Build the header HTML */
	headerElement.innerHTML = `
    <nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #111827; color: white;">
      <a href="index.html" style="font-weight: bold; font-size: 1.25rem;">Auction House</a>

      <div>
        ${
					/* Display different options depending on login state */
					user
						? `
      <span style="margin-right: 1rem;">
        <strong>${user.name}</strong> 
        <span style="background:#4B5563; padding:0.2rem 0.5rem; border-radius:4px; margin-left:0.5rem;">
          ${user.credits ?? 0} credits
        </span>
      </span>

      <a href="profile.html" style="margin-right: 1rem;">Profile</a>
      <a href="create-listing.html" style="margin-right: 1rem;">Create listing</a>

      <button id="logout-button" style="padding: 0.3rem 0.75rem;">
        Log out
      </button>
    `
						: `
      <a href="login.html" style="margin-right: 1rem;">Log in</a>
      <a href="register.html">Register</a>
    `
				}
      </div>
    </nav>
  `;

	/* Add logout functionality when button exists */
	const logoutButton = document.getElementById("logout-button");
	if (logoutButton) {
		logoutButton.addEventListener("click", () => {
			/* Clear stored login info */
			localStorage.removeItem("auction_token");
			localStorage.removeItem("auction_user");

			/* Redirect to home */
			window.location.href = "index.html";
		});
	}
}

/* Render the header immediately */
renderHeader();
