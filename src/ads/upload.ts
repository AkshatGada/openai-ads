import { adsClient } from "./client.js";

export interface UploadResult {
  file_id: string;
}

export const upload = {
  /** Upload a creative image by remote URL. Returns a reusable file_id. */
  fromUrl: (image_url: string) => adsClient.post<UploadResult>("/upload", { image_url }),

  /** Upload a creative image from a Blob/File via multipart. */
  fromBlob: (file: Blob, filename = "creative.png") => {
    const form = new FormData();
    form.append("file", file, filename);
    return adsClient.postForm<UploadResult>("/upload", form);
  },
};
