import React, { useEffect, useRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/ProfileSettings.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const emptyPasswordState = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const emptyShowPasswordState = {
  currentPassword: false,
  newPassword: false,
  confirmNewPassword: false,
};

const ProfileSettings = ({ currentUser, setCurrentUser }) => {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    avatar: "",
    role: "",
  });

  const [passwordData, setPasswordData] = useState(emptyPasswordState);
  const [showPassword, setShowPassword] = useState(emptyShowPasswordState);

  const [loadingUser, setLoadingUser] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const getToken = () => localStorage.getItem("token");

  const getSafeLocalUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  const splitFullName = (fullName = "") => {
    const trimmed = fullName.trim();

    if (!trimmed) {
      return { firstName: "", lastName: "" };
    }

    const parts = trimmed.split(" ");
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");

    return { firstName, lastName };
  };

  const buildFullName = (firstName, lastName) => {
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  const getInitials = (firstName, lastName) => {
    const initials =
      `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    return initials || "US";
  };

  const formatRoleLabel = (role = "") => {
    if (!role) return "User";

    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const resetPasswordFields = () => {
    setPasswordData(emptyPasswordState);
    setShowPassword(emptyShowPasswordState);
  };

  const applyUserToForm = (user) => {
    const { firstName, lastName } = splitFullName(
      user.full_name || user.name || "",
    );

    setFormData({
      firstName,
      lastName,
      email: user.email || "",
      bio: user.bio || "",
      avatar: user.avatar || "",
      role: user.role || "",
    });
  };

  const syncUserToStorageAndState = (user) => {
    const updatedLocalUser = {
      ...(currentUser || {}),
      ...user,
    };

    localStorage.setItem("user", JSON.stringify(updatedLocalUser));

    if (setCurrentUser) {
      setCurrentUser(updatedLocalUser);
    }
  };

  const loadProfile = async () => {
    try {
      setLoadingUser(true);
      setErrorMessage("");

      const token = getToken();

      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data profil");
      }

      const user = data?.user || data;

      applyUserToForm(user);
      syncUserToStorageAndState(user);
    } catch (error) {
      const localUser = getSafeLocalUser();

      if (localUser) {
        applyUserToForm(localUser);
      } else {
        setErrorMessage(error.message || "Gagal mengambil data user.");
      }
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearMessages();
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearMessages();
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearMessages();

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File avatar harus berupa gambar.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Ukuran avatar maksimal 2 MB.");
      e.target.value = "";
      return;
    }

    if (!cloudName || !uploadPreset) {
      setErrorMessage(
        "Cloudinary belum dikonfigurasi. Isi VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET.",
      );
      e.target.value = "";
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
    clearMessages();
    resetPasswordFields();
    await loadProfile();
  };

  const validatePassword = () => {
    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    const isPasswordFilled =
      currentPassword || newPassword || confirmNewPassword;

    if (!isPasswordFilled) return true;

    if (!currentPassword) {
      setErrorMessage(
        "Current Password wajib diisi jika ingin mengganti password.",
      );
      return false;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New Password minimal harus 6 karakter.");
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New Password dan Confirm New Password harus sama.");
      return false;
    }

    return true;
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!validatePassword()) return;

    try {
      setIsSaving(true);

      const token = getToken();
      const fullName = buildFullName(formData.firstName, formData.lastName);

      if (!fullName) {
        setErrorMessage("Nama lengkap wajib diisi.");
        return;
      }

      const profilePayload = {
        full_name: fullName,
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar,
      };

      const profileResponse = await fetch(`${API_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profilePayload),
      });

      const profileData = await profileResponse.json().catch(() => ({}));

      if (!profileResponse.ok) {
        throw new Error(profileData.message || "Gagal memperbarui profil");
      }

      const isUpdatingPassword =
        passwordData.currentPassword ||
        passwordData.newPassword ||
        passwordData.confirmNewPassword;

      if (isUpdatingPassword) {
        const passwordResponse = await fetch(`${API_URL}/me/password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        const passwordResult = await passwordResponse.json().catch(() => ({}));

        if (!passwordResponse.ok) {
          throw new Error(
            passwordResult.message || "Gagal memperbarui password",
          );
        }
      }

      const updatedUser = profileData.user || profileData;

      syncUserToStorageAndState(updatedUser);
      resetPasswordFields();

      setSuccessMessage(
        isUpdatingPassword
          ? "Profil dan password berhasil diperbarui!"
          : "Profil berhasil diperbarui!",
      );

      await loadProfile();
    } catch (error) {
      setErrorMessage(error.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-settings-page">
      <div className="profile-settings-header">
        <div>
          <span className="profile-settings-eyebrow">Account Settings</span>
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
                {getInitials(formData.firstName, formData.lastName)}
              </div>
            )}
          </div>

          <h3>
            {formData.firstName || "First"} {formData.lastName || "Last"}
          </h3>
          <p>{formData.email || "email@example.com"}</p>
          <small className="avatar-role-text">
            {formatRoleLabel(formData.role)}
          </small>

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
            <div className="profile-form-group">
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

            <div className="profile-form-group">
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

            <div className="profile-form-group profile-form-group--full">
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

            <div className="profile-form-group profile-form-group--full">
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

          <div className="profile-section-divider">
            <div>
              <h2>Change Password</h2>
              <p>
                Isi bagian ini hanya jika kamu ingin mengganti password akun.
              </p>
            </div>
          </div>

          <div className="profile-form-grid password-form-grid">
            <div className="profile-form-group password-field">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPassword.currentPassword ? "text" : "password"}
                  placeholder="Masukkan password lama"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={loadingUser}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  disabled={loadingUser}
                  aria-label="Toggle current password visibility"
                >
                  {showPassword.currentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="profile-form-group password-field">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword.newPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  disabled={loadingUser}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  disabled={loadingUser}
                  aria-label="Toggle new password visibility"
                >
                  {showPassword.newPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="profile-form-group password-field">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type={showPassword.confirmNewPassword ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  disabled={loadingUser}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility("confirmNewPassword")}
                  disabled={loadingUser}
                  aria-label="Toggle confirm password visibility"
                >
                  {showPassword.confirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
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
