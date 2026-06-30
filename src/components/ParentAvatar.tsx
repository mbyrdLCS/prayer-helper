/* eslint-disable @next/next/no-img-element */
const SIZES = {
  sm: "h-10 w-10 text-base",
  md: "h-14 w-14 text-xl",
  lg: "h-20 w-20 text-3xl",
} as const;

export default function ParentAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover ring-1 ring-border`}
      />
    );
  }
  return (
    <div
      className={`${SIZES[size]} rounded-full bg-accent/15 text-accent flex items-center justify-center font-semibold ring-1 ring-border`}
    >
      {(name.trim()[0] || "♡").toUpperCase()}
    </div>
  );
}
