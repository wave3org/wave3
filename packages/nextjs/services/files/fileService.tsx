import { UploadResponse } from "pinata";
import { pinata } from "~~/utils/config";

export const uploadFile = async (file: File): Promise<string> => {
	let cid: string = "";
	try {
		const urlRequest = await fetch("/api/url");
		const urlResponse = await urlRequest.json();
		const upload: UploadResponse = await pinata.upload.public.file(file).url(urlResponse.url);
		cid = upload.cid;
	} catch (e) {
		console.log(e);
	}

	return cid;
};

export const getFileUrl = (cid: string): string => {
	return "https://" + `${process.env.NEXT_PUBLIC_GATEWAY_URL}` + "/ipfs/" + cid;
};
