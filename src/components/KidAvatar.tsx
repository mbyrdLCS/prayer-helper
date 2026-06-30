/* eslint-disable @next/next/no-img-element */
import type { Kid } from "@/db/schema";

const SIZES = {
  sm: "h-10 w-10 text-base",
  md: "h-14 w-14 text-xl",
  lg: "h-20 w-20 text-3xl",
} as const;

export default function KidAvatar({
  kid,
  size = "md",
}: {
  kid: Pick<Kid, "firstName" | "photoUrl" | "redeemed">;
  size?: keyof typeof SIZES;
}) {
  const ring =
    kid.redeemed === "approved" ? "ring-2 ring-accent" : "ring-1 ring-border";
  if (kid.photoUrl) {
    return (
      <img
        src={kid.photoUrl}
        alt={kid.firstName}
        className={`${SIZES[size]} rounded-full object-cover ${ring}`}
      />
    );
  }
  return (
    <div
      className={`${SIZES[size]} rounded-full bg-primary-soft/25 text-primary flex items-center justify-center font-semibold ${ring}`}
    >
      {kid.firstName.slice(0, 1).toUpperCase()}
    </div>
  );
}
