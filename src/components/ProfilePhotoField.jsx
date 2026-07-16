// Visible profile-photo picker: label, preview (either a newly-chosen local
// file or the existing saved photo), file input, remove/replace control, and
// upload progress/error states. Used by both Register and Edit Profile via
// the useProfilePhotoUpload hook, which owns all the actual state.
function ProfilePhotoField({
  id = "profilePhotoInput",
  previewUrl,
  existingImageUrl,
  error,
  isUploading,
  uploadProgress,
  disabled,
  onFileSelected,
  onRemove,
}) {
  const displayUrl = previewUrl || existingImageUrl;

  return (
    <div className="profile-photo-field">
      <label htmlFor={id}>Upload Your Profile Photo</label>

      <div className="profile-photo-field__body">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile preview"
            className="profile-photo-field__preview"
          />
        ) : (
          <div className="profile-photo-field__placeholder" aria-hidden="true">
            No photo selected
          </div>
        )}

        <div className="profile-photo-field__controls">
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
          />

          {previewUrl && (
            <button
              type="button"
              className="profile-photo-field__remove"
              onClick={onRemove}
              disabled={disabled}
              aria-label="Remove selected photo"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      {isUploading && (
        <p className="profile-photo-field__status" role="status">
          Uploading photo… {uploadProgress}%
        </p>
      )}

      {error && (
        <p className="profile-photo-field__error" role="alert">
          {error}
        </p>
      )}

      <p className="profile-photo-field__hint">
        JPG, JPEG, PNG, or WEBP. Max size 5 MB.
      </p>
    </div>
  );
}

export default ProfilePhotoField;
