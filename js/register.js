import { showToast } from "./utils/toast.js";

/* Form and input fields */
const form = document.getElementById("register-form");
const nameInput = document.getElementById("reg-name");
const emailInput = document.getElementById("reg-email");
const passwordInput = document.getElementById("reg-password");
const errorBox = document.getElementById("register-error");

/* Base API URL */
const API_BASE = "https://v2.api.noroff.dev";

/* Send registration request to Noroff API */
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

	/* API returned an error and throw it */
	if (!response.ok) {
		const message = data.errors?.[0]?.message || "Registration failed";
		throw new Error(message);
	}

	return data;
}

/* Handle form submission */
if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorBox.textContent = "";

		const name = nameInput.value.trim();
		const email = emailInput.value.trim();
		const password = passwordInput.value;

		/* Simple validation */
		if (!name || !email || !password) {
			errorBox.textContent = "Please fill in all fields.";
			showToast("Please fill in all fields.", "error");
			return;
		}

		try {
			/* Try to register the user */
			await registerUser(name, email, password);

			showToast("Account created successfully!", "success");

			/* Redirect to login after a small delay */
			setTimeout(() => {
				window.location.href = "login.html";
			}, 800);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Something went wrong.";

			errorBox.textContent = message;

			/* Specific error message for email rule */
			if (message.toLowerCase().includes("stud.noroff.no")) {
				showToast("Only @stud.noroff.no emails allowed", "error");
			} else {
				showToast(message, "error");
			}
		}
	});
}
