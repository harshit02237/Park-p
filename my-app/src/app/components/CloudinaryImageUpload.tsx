"use client";

import { useState } from "react";
import { ImageUp } from "lucide-react";
import { api } from "../lib/api";

interface Props {
  label: string;
  purpose: "restaurant-logo" | "dish-image";
  value?: string;
  onUploaded: (imageUrl: string) => void;
}

export default function CloudinaryImageUpload({
  label,
  purpose,
  value,
  onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setMessage("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image must be 10 MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const signatureRes = await api.post("/uploads/cloudinary/signature", {
        purpose,
      });
      const { uploadUrl, apiKey, timestamp, signature, folder } =
        signatureRes.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || "Cloudinary upload failed");
      }

      onUploaded(uploadData.secure_url);
      setMessage("Image uploaded successfully.");
    } catch (error: any) {
      console.error("Image upload error:", error);
      setMessage(error.response?.data?.message || error.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-[#efd9bd] bg-[#fffdf8] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {value ? (
            <img
              src={value}
              alt={label}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#fff1d5] text-[#d9472b]">
              <ImageUp className="h-6 w-6" />
            </div>
          )}
          <div>
            <p className="font-bold text-[#251611]">{label}</p>
            <p className="text-sm text-[#765f55]">
              {uploading ? "Uploading..." : "PNG, JPG, WebP, GIF, or AVIF"}
            </p>
          </div>
        </div>
        <label className="zaika-button cursor-pointer px-4 py-2 text-center">
          {uploading ? "Uploading..." : "Choose Image"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      </div>
      {message && (
        <p className="text-sm font-semibold text-[#765f55]">{message}</p>
      )}
    </div>
  );
}
