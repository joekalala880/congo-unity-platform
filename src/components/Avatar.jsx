import { useState } from "react";
import { DEFAULT_AVATAR } from "./defaultAvatar";

// Single place for profile-photo display logic: falls back to the shared
// default avatar when no photo is set, and again if the stored URL fails to
// load (e.g. a since-deleted Cloudinary asset).
function Avatar({ src, alt = "Profile", className = "feed-profile-img" }) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setFailed(false);
  }

  return (
    <img
      src={failed || !src ? DEFAULT_AVATAR : src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default Avatar;
