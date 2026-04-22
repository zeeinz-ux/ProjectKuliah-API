import React, { useEffect, useRef, useState } from "react";
import "../css/FieldFileUpload.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function FieldFileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [uploadedFileType, setUploadedFileType] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const inputRef = useRef(null);
  const tempPreviewRef = useRef("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

  const clearLocalPreview = () => {
    if (tempPreviewRef.current) {
      URL.revokeObjectURL(tempPreviewRef.current);
      tempPreviewRef.current = "";
    }
    setLocalPreviewUrl("");
  };

  useEffect(() => {
    return () => {
      clearLocalPreview();
    };
  }, []);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetUploadResult = () => {
    setUploadedUrl("");
    setUploadedFileType("");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "File harus berformat JPG, PNG, atau PDF.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Ukuran file melebihi 2MB.";
    }

    return "";
  };

  const applySelectedFile = (file) => {
    resetMessages();
    resetUploadResult();
    clearLocalPreview();

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      tempPreviewRef.current = preview;
      setLocalPreviewUrl(preview);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    applySelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0];
    applySelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    resetMessages();
    resetUploadResult();
    clearLocalPreview();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const saveFileUrlToDatabase = async (payload) => {
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
      setError("Cloudinary belum dikonfigurasi di file .env.");
      return;
    }

    try {
      setIsUploading(true);
      resetMessages();

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

      const payloadForDatabase = {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        fileUrl,
        uploadedAt: new Date().toISOString(),
        projectId: null,
      };

      await saveFileUrlToDatabase(payloadForDatabase);

      setSuccess(
        "File berhasil diupload ke Cloudinary dan metadata berhasil disimpan ke database.",
      );
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="field-upload-card">
      <div className="field-upload-header">
        <div>
          <span className="field-upload-eyebrow">Field File Upload</span>
          <h2>Upload File Lapangan</h2>
          <p>Unggah foto progres atau file PDF dari tim lapangan.</p>
        </div>
      </div>

      <div className="field-upload-body">
        <label
          className={`field-upload-dropzone ${isDragActive ? "is-drag-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
          />

          <span className="field-upload-icon">↑</span>
          <strong>Pilih atau drop file di sini</strong>
          <small>Format: JPG, PNG, PDF • Maksimal 2MB</small>
        </label>

        {selectedFile && (
          <div className="field-upload-file-info">
            <div className="field-upload-file-meta">
              <p>
                <span>Nama file:</span> {selectedFile.name}
              </p>
              <p>
                <span>Ukuran:</span> {formatFileSize(selectedFile.size)}
              </p>
              <p>
                <span>Tipe:</span> {selectedFile.type}
              </p>
            </div>

            <button
              type="button"
              className="field-upload-btn field-upload-btn--ghost"
              onClick={handleRemoveFile}
            >
              Hapus Pilihan
            </button>
          </div>
        )}

        {selectedFile && localPreviewUrl && (
          <div className="field-upload-local-preview">
            <h3>Preview File Terpilih</h3>
            <div className="field-upload-preview-wrapper">
              <img
                src={localPreviewUrl}
                alt="Preview file terpilih"
                className="field-upload-preview-image"
              />
            </div>
          </div>
        )}

        <div className="field-upload-actions">
          <button
            type="button"
            className="field-upload-btn field-upload-btn--primary"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Uploading..." : "Upload ke Cloudinary"}
          </button>
        </div>

        {error && (
          <div className="field-upload-message field-upload-message--error">
            {error}
          </div>
        )}

        {success && (
          <div className="field-upload-message field-upload-message--success">
            {success}
          </div>
        )}

        {uploadedUrl && (
          <div className="field-upload-result-box">
            <h3>Hasil Upload</h3>

            {uploadedFileType.startsWith("image/") ? (
              <div className="field-upload-preview-wrapper">
                <img
                  src={uploadedUrl}
                  alt="Preview hasil upload"
                  className="field-upload-preview-image"
                />
              </div>
            ) : (
              <div className="field-upload-pdf-preview">
                <div className="field-upload-pdf-badge">PDF</div>
                <p>File PDF berhasil diupload.</p>
              </div>
            )}

            <div className="field-upload-url-box">
              <label>URL file dari Cloudinary:</label>
              <textarea value={uploadedUrl} readOnly />
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="field-upload-link"
              >
                Buka file
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
