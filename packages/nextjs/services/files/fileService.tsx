const STORAGE_API_URL = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:3001";

export const uploadFile = async (file: File): Promise<string> => {
	try {
		const formData = new FormData();
		formData.append("file", file);

		const response = await fetch(`${STORAGE_API_URL}/upload`, {
			method: "POST",
			body: formData
		});

		if (!response.ok) {
			throw new Error("Upload failed");
		}

		const data = await response.json();
		return data.cid;
	} catch (e) {
		console.error("File upload error:", e);
		throw new Error("Failed to upload file to IPFS");
	}
};

export const getFileUrl = (cid: string): string => {
	const baseUrl =
		process.env.NODE_ENV === "production"
			? process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROD || "https://ipfs.io/ipfs"
			: "http://127.0.0.1:8080/ipfs";

	return `${baseUrl}/${cid}`;
};

export const getAudioUrl = (cid: string): string => {
	if (process.env.NODE_ENV === "production") return `/api/audio/${cid}`;
	return `http://127.0.0.1:8080/ipfs/${cid}`;
};
