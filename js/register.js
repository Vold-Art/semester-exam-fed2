const form = document.getElementById("register-form");
const nameInput = document.getElementById("reg-name");
const emailInput = document.getElementById("reg-email");
const passwordInput = document.getElementById("reg-password");
const errorBox = document.getElementById("register-error");

/* Noroff Auction API base */

const API_BASE = "https://v2.api.noroff.dev";

async function registerUser(name, email, password) {
	const url = `${API_BASE}/auth/register`;

	const payload = {
		name,
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
		const message = data.errors?.[0]?.message || "Registration failed";
		throw new Error(message);
	}

	return data;
}

if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorBox.textContent = "";

		const name = nameInput.value.trim();
		const email = emailInput.value.trim();
		const password = passwordInput.value;

		/* Basic check - Improve later */

		if (!name || !email || !password) {
			errorBox.textContent = "Please fill in all fields.";
			return;
		}

		try {
			await registerUser(name, email, password);
			/* Success sends to Login-page */
			window.location.href = "login.html";
		} catch (error) {
			errorBox.textContent =
				error instanceof Error ? error.message : "Something went wrong.";
		}
	});
}
