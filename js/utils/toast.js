export function showToast(message, type = "info") {
	const container = document.getElementById("toast-container");
	if (!container) return;

	const colors = {
		success: "bg-green-600",
		error: "bg-red-600",
		info: "bg-blue-600",
	};

	const toast = document.createElement("div");
	toast.className = `
		pointer-events-auto
		text-white ${colors[type] || colors.info}
		px-6 py-4 rounded-lg shadow-xl text-lg
		transform scale-95 opacity-0 transition-all duration-300
		max-w-md text-center
	`;
	toast.textContent = message;

	container.appendChild(toast);

	setTimeout(() => {
		toast.classList.remove("scale-95", "opacity-0");
		toast.classList.add("scale-100", "opacity-100");
	}, 10);

	setTimeout(() => {
		toast.classList.remove("scale-100", "opacity-100");
		toast.classList.add("scale-95", "opacity-0");

		setTimeout(() => toast.remove(), 300);
	}, 2500);
}
