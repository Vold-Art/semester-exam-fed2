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
    <nav class="main-nav">
      <div class="main-nav-bar">
        <a href="index.html" class="main-nav-logo">
          Auction House
        </a>

        <button 
          id="nav-toggle" 
          class="nav-toggle btn btn-secondary"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          ☰
        </button>
      </div>

      <div id="main-nav-actions" class="main-nav-actions">
        ${
					user
						? `
          <span class="main-nav-user">
            <strong>${user.name}</strong> 
            <span class="main-nav-credits">
              ${user.credits ?? 0} credits
            </span>
          </span>

          <a href="profile.html" class="btn btn-primary">Profile</a>
          <a href="create-listing.html" class="btn btn-primary">Create listing</a>

          <button id="logout-button" class="btn btn-secondary">
            Log out
          </button>
        `
						: `
          <a href="login.html" class="btn btn-primary">Log in</a>
          <a href="register.html" class="btn btn-primary">Register</a>
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

	/* Add mobile nav toggle functionality */
	const navToggle = document.getElementById("nav-toggle");
	const navActions = document.getElementById("main-nav-actions");

	if (navToggle && navActions) {
		navToggle.addEventListener("click", () => {
			const isOpen = navActions.classList.toggle("is-open");
			navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
		});
	}
}

/* Render the header immediately */
renderHeader();
