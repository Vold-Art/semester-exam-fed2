import { showToast } from "./utils/toast.js";

/* Get form elements */
const form = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const errorBox = document.getElementById("login-error");

/* Base API URL */
const API_BASE = "https://v2.api.noroff.dev";

/* Send login request to API */
async function loginUser(email, password) {
	const url = `${API_BASE}/auth/login`;

	const payload = { email, password };

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();

	/* If login failed, throw error message */
	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Login failed";
		throw new Error(message);
	}

	return data;
}

/* Handle login form submission */
if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorBox.textContent = "";

		/* Get values from inputs */
		const email = emailInput.value.trim();
		const password = passwordInput.value;

		/* Basic validation */
		if (!email || !password) {
			errorBox.textContent = "Please enter email and password.";
			showToast("Please enter email and password.", "error");
			return;
		}

		try {
			/* Try to log user in */
			const result = await loginUser(email, password);

			/* Extract token anb full user profile */
			const token = result.data?.accessToken ?? result.accessToken;
			const profile = result.data ?? result;

			/* Save login info in localStorage */
			if (token) {
				localStorage.setItem("auction_token", token);
			}
			localStorage.setItem("auction_user", JSON.stringify(profile));

			showToast("Login successful!", "success");

			/* Small delay before redirecting */
			setTimeout(() => {
				window.location.href = "index.html";
			}, 800);
		} catch (error) {
			/* Show error from API */
			const msg =
				error instanceof Error ? error.message : "Something went wrong.";
			errorBox.textContent = msg;
			showToast(msg || "Invalid email or password", "error");
		}
	});
}
