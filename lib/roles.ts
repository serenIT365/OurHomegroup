import type { Role } from "./types";

/** Accounts that may be assigned Chairperson for a meeting/occurrence */
export const CHAIR_ELIGIBLE_ROLES: Role[] = [
  "moderator",
  "admin",
  "poweruser",
  "superadmin",
];

/** Accounts that may assign or reassign a Chairperson */
export const CHAIR_ASSIGNER_ROLES: Role[] = [
  "moderator",
  "admin",
  "poweruser",
  "superadmin",
];

export function canBeChair(role?: Role | null) {
  return !!role && CHAIR_ELIGIBLE_ROLES.includes(role);
}

export function canAssignChair(role?: Role | null) {
  return !!role && CHAIR_ASSIGNER_ROLES.includes(role);
}
