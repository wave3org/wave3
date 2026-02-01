"use client";

import { useState } from "react";
import { uploadFile } from "~~/services/files/fileService";

export default function Home() {
	const [file, setFile] = useState<File>();
	const [uploading, setUploading] = useState(false);

	const upload = async () => {
		const input: HTMLInputElement | null = document.getElementById("file-input") as HTMLInputElement;
		let cid: string = "";
		if (!file) {
			alert("No file selected");
			return;
		}

		try {
			setUploading(true);
			cid = await uploadFile(file);
			console.log("-------------------- CID-------------------: ", cid);
			setUploading(false);
			setFile(undefined);
			if (input) {
				input.value = "";
			}
		} catch (e) {
			console.log(e);
			setUploading(false);
			alert("Trouble uploading file");
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFile(e.target?.files?.[0]);
	};

	return (
		<div className="main-container">
			<label className="subtitle" htmlFor="file">
				File
			</label>
			<input id="file-input" className="input" type="file" onChange={handleChange} />
			<button className="primary-button" type="button" disabled={uploading} onClick={upload}>
				<span className="subtitle">{uploading ? "Uploading..." : "Upload"}</span>
			</button>
		</div>
	);
}
