// Central authorization model for TBOP CMS 1.0 LTS
export const ROLES = Object.freeze({
  MEMBER: "member",
  PRESIDENT: "president",
  VICE_PRESIDENT: "vice_president",
  SECRETARY: "secretary",
  TREASURER: "treasurer",
  SERGEANT_AT_ARMS: "sergeant_at_arms",
  TRUSTEE: "trustee",
  REPEATER_TRUSTEE: "repeater_trustee",
  ADMIN: "admin",
});

export const EXECUTIVE_ROLES = new Set([
  ROLES.PRESIDENT, ROLES.VICE_PRESIDENT, ROLES.SECRETARY,
  ROLES.TREASURER, ROLES.SERGEANT_AT_ARMS, ROLES.ADMIN,
]);

export function isExecutive(role) { return EXECUTIVE_ROLES.has(role); }
export function canManageMembers(role) { return isExecutive(role); }
export function canManageCalendar(role) { return isExecutive(role); }
export function canManageMeetings(role) { return isExecutive(role); }
export function canManageFinance(role) { return isExecutive(role); }
export function canManageVoting(role) { return isExecutive(role); }
export function canManageDocuments(role) { return isExecutive(role); }
export function canManageNews(role) { return isExecutive(role); }
export function canManageEquipment(role) { return isExecutive(role) || role === ROLES.REPEATER_TRUSTEE; }
export function canManageRepeater(role) { return isExecutive(role) || role === ROLES.REPEATER_TRUSTEE; }
export function canManageSystem(role) { return role === ROLES.ADMIN; }


// Document Vault zones. The Vault is private by design; public website files
// remain outside the protected bucket unless deliberately published elsewhere.
export const VAULT_ZONES = Object.freeze({
  MEMBERS: "members",
  OFFICERS: "officers",
  FINANCIAL: "financial",
  REPEATER: "repeater",
  ARCHIVE: "archive",
});

export function canReadVaultZone(role, zone) {
  if (isExecutive(role)) return true;
  if (role === ROLES.REPEATER_TRUSTEE) {
    return [VAULT_ZONES.MEMBERS, VAULT_ZONES.REPEATER].includes(zone);
  }
  if (role === ROLES.TRUSTEE) {
    return [VAULT_ZONES.MEMBERS, VAULT_ZONES.ARCHIVE].includes(zone);
  }
  return zone === VAULT_ZONES.MEMBERS;
}

export function canWriteVaultZone(role, zone) {
  if (isExecutive(role)) return true;
  if (role === ROLES.REPEATER_TRUSTEE) return zone === VAULT_ZONES.REPEATER;
  return false;
}

export function canPermanentlyDeleteVault(role) {
  // Permanent destruction remains a technical/system-admin action.
  // Executives can move items to trash and restore them.
  return role === ROLES.ADMIN;
}
