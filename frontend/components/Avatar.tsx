interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

const COLORS = ["#e60023", "#0074e8", "#008753", "#cb1f7b", "#e68a00", "#5b2a86"];

export default function Avatar({ src, name, size = 32, className = "" }: AvatarProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.44, backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
