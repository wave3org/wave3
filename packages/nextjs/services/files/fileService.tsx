const STORAGE_API_URL = process.env.NEXT_PUBLIC_STORAGE_API_URL || "http://localhost:3001";

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
		console.log(e);
		return "";
	}
};

export const getFileUrl = (cid: string): string => {
	const baseUrl = process.env.NODE_ENV === "production" ? "https://ipfs.io/ipfs" : "http://127.0.0.1:8080/ipfs";

	return `${baseUrl}/${cid}`;
};
