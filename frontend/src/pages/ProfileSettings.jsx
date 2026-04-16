import React, { useEffect, useRef, useState } from "react";
import "../css/ProfileSettings.css";

const fallbackUser = {
  id: 1,
  firstName: "Alya",
  lastName: "Rahma",
  email: "alya@company.com",
  bio: "Project coordinator for interior development and reporting.",
  avatar: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  role: "Admin",
};

const ProfileSettings = ({ currentUser, setCurrentUser }) => {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    avatar: "",
  });

  const [loadingUser, setLoadingUser] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const mockFetchLoggedInUser = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (currentUser) {
          resolve(currentUser);
          return;
        }

        const savedUser = localStorage.getItem("loggedInUser");
        if (savedUser) {
          resolve(JSON.parse(savedUser));
          return;
        }

        resolve(fallbackUser);
      }, 500);
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        setLoadingUser(true);

        const user = await mockFetchLoggedInUser();

        if (!isMounted) return;

        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          bio: user.bio || "",
          avatar: user.avatar || "",
        });
      } catch (error) {
        setErrorMessage("Gagal mengambil data user.");
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMessage("");
    setErrorMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File avatar harus berupa gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Ukuran avatar maksimal 2 MB.");
      return;
    }

    if (!cloudName || !uploadPreset) {
      setErrorMessage(
        "Cloudinary belum dikonfigurasi. Isi VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET.",
      );
      return;
    }

    try {
      setIsUploading(true);

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", uploadPreset);
      uploadData.append("folder", "profile-settings");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Upload avatar gagal.");
      }

      setFormData((prev) => ({
        ...prev,
        avatar: data.secure_url,
      }));

      setSuccessMessage("Avatar berhasil diubah.");
    } catch (error) {
      setErrorMessage(error.message || "Terjadi kesalahan saat upload avatar.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleReset = async () => {
    setSuccessMessage("");
    setErrorMessage("");
    setLoadingUser(true);

    try {
      const user = await mockFetchLoggedInUser();

      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
    } catch (error) {
      setErrorMessage("Gagal mereset data.");
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      bio: formData.bio.trim(),
      avatar: formData.avatar,
    };

    try {
      // SIMULASI SAVE KE DATABASE / API
      await new Promise((resolve) => setTimeout(resolve, 800));

      const updatedUser = {
        ...(currentUser || fallbackUser),
        ...payload,
      };

      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

      if (setCurrentUser) {
        setCurrentUser(updatedUser);
      }

      setSuccessMessage("Changes Saved!");
    } catch (error) {
      setErrorMessage("Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-settings-page">
      <div className="profile-settings-header">
        <div>
          <h1>Profile Settings</h1>
          <p className="profile-subtitle">
            Kelola data akun, avatar, dan informasi profil user yang sedang
            login.
          </p>
        </div>
      </div>

      <form className="profile-settings-grid" onSubmit={handleSaveChanges}>
        <div className="profile-settings-card profile-settings-avatar-card">
          <div className="avatar-preview-wrapper">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="Profile Avatar"
                className="avatar-preview-image"
              />
            ) : (
              <div className="avatar-preview-fallback">
                {getInitials(formData.firstName, formData.lastName) || "US"}
              </div>
            )}
          </div>

          <h3>
            {formData.firstName || "First"} {formData.lastName || "Last"}
          </h3>
          <p>{formData.email || "email@example.com"}</p>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden-file-input"
            onChange={handleAvatarUpload}
          />

          <button
            type="button"
            className="secondary-profile-btn"
            onClick={handleOpenFilePicker}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Change Avatar"}
          </button>

          <small className="avatar-hint">
            Format gambar JPG/PNG, maksimal 2 MB.
          </small>
        </div>

        <div className="profile-settings-card profile-settings-form-card">
          {(successMessage || errorMessage) && (
            <div
              className={`profile-alert ${
                successMessage ? "success" : "error"
              }`}
            >
              {successMessage || errorMessage}
            </div>
          )}

          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Masukkan nama depan"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loadingUser}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Masukkan nama belakang"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loadingUser}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Masukkan email"
                value={formData.email}
                onChange={handleChange}
                disabled={loadingUser}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows="5"
                placeholder="Ceritakan profil singkat user..."
                value={formData.bio}
                onChange={handleChange}
                disabled={loadingUser}
              />
            </div>
          </div>

          <div className="profile-form-actions">
            <button
              type="button"
              className="reset-profile-btn"
              onClick={handleReset}
              disabled={loadingUser || isSaving}
            >
              Reset
            </button>

            <button
              type="submit"
              className="primary-profile-btn"
              disabled={loadingUser || isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
