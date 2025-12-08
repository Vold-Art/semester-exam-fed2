const headerElement = document.getElementById("main-header");

function renderHeader() {
	if (!headerElement) return;

	const storedUser = localStorage.getItem("auction_user");
	const user = storedUser ? JSON.parse(storedUser) : null;

	headerElement.innerHTML = `
    <nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #111827; color: white;">
      <a href="index.html" style="font-weight: bold; font-size: 1.25rem;">Auction House</a>

      <div>
        ${
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

	const logoutButton = document.getElementById("logout-button");
	if (logoutButton) {
		logoutButton.addEventListener("click", () => {
			localStorage.removeItem("auction_token");
			localStorage.removeItem("auction_user");
			window.location.href = "index.html";
		});
	}
}

renderHeader();
