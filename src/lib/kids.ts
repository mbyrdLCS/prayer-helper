import type { Kid } from "@/db/schema";

/** Display name with optional last initial to distinguish same-named kids. */
export function kidName(k: Pick<Kid, "firstName" | "lastInitial">): string {
  const li = k.lastInitial?.trim();
  return li ? `${k.firstName} ${li}` : k.firstName;
}
