/* Show a temporary toast message on screen */
export function showToast(message, type = "info") {
	/* Get the container where toasts will be placed */
	const container = document.getElementById("toast-container");
	if (!container) return;

	/* Color classes depending on toast type */
	const colors = {
		success: "bg-green-600",
		error: "bg-red-600",
		info: "bg-blue-600",
	};

	/* Create the toast element */
	const toast = document.createElement("div");
	toast.className = `
		pointer-events-auto
		text-white ${colors[type] || colors.info}
		px-6 py-4 rounded-lg shadow-xl text-lg
		transform scale-95 opacity-0 transition-all duration-300
		max-w-md text-center
	`;
	toast.textContent = message;

	/* Add toast to the container */
	container.appendChild(toast);

	/* Small delay to trigger CSS animation (fade/scale in) */
	setTimeout(() => {
		toast.classList.remove("scale-95", "opacity-0");
		toast.classList.add("scale-100", "opacity-100");
	}, 10);

	/* Remove toast after animation (fade/scale out) */
	setTimeout(() => {
		toast.classList.remove("scale-100", "opacity-100");
		toast.classList.add("scale-95", "opacity-0");

		/* Fully remove the element after fade out */
		setTimeout(() => toast.remove(), 300);
	}, 2500);
}
