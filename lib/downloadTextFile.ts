export function downloadTextFile(filename: string, content: string, mime = "text/plain") {
	if (typeof window === "undefined") return;
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
