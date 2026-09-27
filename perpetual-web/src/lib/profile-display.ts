import type { Profile } from "./types";

export function profileDisplay(
  profile: Pick<Profile, "first_name" | "last_name" | "username" | "email">,
) {
  // Google accounts use an opaque username internally, not a public handle.
  const generatedUsername = /^google_[a-f0-9]{32}$/.test(profile.username);
  const firstName = profile.first_name?.trim() || "";
  const lastName = profile.last_name?.trim() || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const displayName =
    fullName ||
    (generatedUsername
      ? profile.email.trim() || "Your account"
      : profile.username);
  const greeting =
    firstName || lastName || (generatedUsername ? "there" : profile.username);
  const initials = (
    fullName
      ? `${firstName[0] || ""}${lastName[0] || ""}`
      : displayName.slice(0, 2)
  ).toUpperCase();
  return { generatedUsername, displayName, greeting, initials };
}
