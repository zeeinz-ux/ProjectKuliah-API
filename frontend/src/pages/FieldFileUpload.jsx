import React, { useRef, useState } from "react";
import "../css/FieldFileUpload.css";

export default function FieldFileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadedFileType, setUploadedFileType] = useState("");

  const inputRef = useRef(null);
  const tempPreviewRef = useRef("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // URL backend Adonis kamu
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  const maxFileSize = 2 * 1024 * 1024;

  const clearLocalPreview = () => {
    if (tempPreviewRef.current) {
      URL.revokeObjectURL(tempPreviewRef.current);
      tempPreviewRef.current = "";
    }
  };

  const resetUploadResult = () => {
    setError("");
    setSuccess("");
    setUploadedUrl("");
    setUploadedFileType("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    resetUploadResult();
    clearLocalPreview();

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("File harus berformat JPG, PNG, atau PDF.");
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    if (file.size > maxFileSize) {
      setError("Ukuran file melebihi 2MB.");
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const localPreview = URL.createObjectURL(file);
      tempPreviewRef.current = localPreview;
      setPreviewUrl(localPreview);
    } else {
      setPreviewUrl("");
    }
  };

  const saveFileUrlToMongo = async (payload) => {
    const response = await fetch(`${apiBaseUrl}/api/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal simpan URL ke database.");
    }

    return result;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Silakan pilih file terlebih dahulu.");
      return;
    }

    if (!cloudName || !uploadPreset) {
      setError("Cloudinary belum dikonfigurasi di file .env");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "monitoring-interior/lapangan");

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const cloudinaryResponse = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
        throw new Error(
          cloudinaryData.error?.message || "Upload ke Cloudinary gagal.",
        );
      }

      const fileUrl = cloudinaryData.secure_url;

      setUploadedUrl(fileUrl);
      setUploadedFileType(selectedFile.type);

      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(fileUrl);
        clearLocalPreview();
      } else {
        setPreviewUrl("");
      }

      const payloadForMongo = {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        fileUrl: fileUrl,
        uploadedAt: new Date().toISOString(),
        projectId: null, // nanti bisa diisi kalau file dikaitkan ke project tertentu
      };

      await saveFileUrlToMongo(payloadForMongo);

      setSuccess(
        "File berhasil diupload ke Cloudinary dan metadata berhasil disimpan ke database.",
      );
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat upload.");

      // Catatan:
      // Kalau error terjadi setelah upload Cloudinary sukses,
      // bisa jadi file sudah masuk Cloudinary tapi metadata gagal masuk database.
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-card">
      <div className="upload-header">
        <div>
          <h2>Upload File Lapangan</h2>
          <p>Unggah foto progres atau file PDF dari tim lapangan.</p>
        </div>
      </div>

      <div className="upload-body">
        <label className="upload-dropzone">
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
          />
          <span className="upload-icon">↑</span>
          <strong>Pilih file</strong>
          <small>Format: JPG, PNG, PDF • Maksimal 2MB</small>
        </label>

        {selectedFile && (
          <div className="file-info">
            <p>
              <span>Nama file:</span> {selectedFile.name}
            </p>
            <p>
              <span>Ukuran:</span> {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <p>
              <span>Tipe:</span> {selectedFile.type}
            </p>
          </div>
        )}

        <div className="upload-actions">
          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Uploading..." : "Upload ke Cloudinary"}
          </button>
        </div>

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        {(previewUrl || uploadedUrl) && (
          <div className="result-box">
            <h3>Hasil Upload</h3>

            {uploadedFileType.startsWith("image/") ? (
              <div className="preview-wrapper">
                <img
                  src={previewUrl}
                  alt="Preview upload"
                  className="preview-image"
                />
              </div>
            ) : (
              <div className="pdf-preview">
                <div className="pdf-badge">PDF</div>
                <p>File PDF berhasil diupload.</p>
              </div>
            )}

            <div className="url-box">
              <label>URL file dari Cloudinary:</label>
              <textarea value={uploadedUrl} readOnly />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
