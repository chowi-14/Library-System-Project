import { useState } from "react";

export default function Cover({ title, src, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${title} cover`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  const hue = [...title].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360;
  return (
    <div
      className={`flex items-center justify-center p-1 text-center font-serif text-[10px] leading-tight text-white ${className}`}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 45% 32%), hsl(${(hue + 40) % 360} 50% 14%))` }}
    >
      {title}
    </div>
  );
}