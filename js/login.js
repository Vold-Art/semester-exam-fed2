const form = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const errorBox = document.getElementById("login-error");

/* Noroff Auction API base */

const API_BASE = "https://v2.api.noroff.dev";

async function loginUser(email, password) {
	const url = `${API_BASE}/auth/login`;

	const payload = {
		email,
		password,
	};

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();

	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Login failed";
		throw new Error(message);
	}

	return data;
}

if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorBox.textContent = "";

		const email = emailInput.value.trim();
		const password = passwordInput.value;

		if (!email || !password) {
			errorBox.textContent = "Please enter email and password.";
			return;
		}

		try {
			const result = await loginUser(email, password);

			/* Store token + user in localStorage */

			const token = result.data?.accessToken ?? result.accessToken;
			const profile = result.data ?? result;

			if (token) {
				localStorage.setItem("auction_token", token);
			}
			localStorage.setItem("auction_user", JSON.stringify(profile));

			/* Success sends to Login-page */
			window.location.href = "index.html";
		} catch (error) {
			errorBox.textContent =
				error instanceof Error ? error.message : "Something went wrong.";
		}
	});
}
