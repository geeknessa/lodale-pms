import React, { useState } from 'react';

/**
 * Avatar component that renders a profile image if available,
 * and falls back to a colored circle with the user's initials if not.
 * 
 * @param {Object} props
 * @param {string} props.src - The URL of the avatar image.
 * @param {string} props.name - The name of the user (used to generate initials).
 * @param {string} props.className - Additional CSS classes for styling (e.g., width, height).
 * @param {Object} props.style - Inline styles.
 */
export default function Avatar({ src, name, className = "", style = {} }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Check if src is provided and is not empty or a default placeholder that we want to override
  const isValidSrc = src && src.trim() !== "" && src !== "/default-avatar.png";
  const showImage = isValidSrc && !imgFailed;

  const getInitial = () => {
    if (!name || name.trim() === "") return "U";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div 
      className={`overflow-hidden flex items-center justify-center shrink-0 ${className}`} 
      style={{
        backgroundColor: !showImage ? '#3A5A40' : 'transparent',
        color: !showImage ? 'white' : 'inherit',
        fontWeight: 'bold',
        ...style
      }}
    >
      {showImage ? (
        <img 
          src={src} 
          alt={name || "User Avatar"} 
          className="h-full w-full object-cover" 
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span style={{ fontSize: 'inherit' }}>{getInitial()}</span>
      )}
    </div>
  );
}

