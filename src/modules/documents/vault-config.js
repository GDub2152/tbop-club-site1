
export const VAULT_BUCKET = "club-vault";
export const SIGNED_URL_TTL_SECONDS = 300;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const VAULT_ZONES = Object.freeze({
  MEMBERS: "members",
  OFFICERS: "officers",
  FINANCIAL: "financial",
  REPEATER: "repeater",
  ARCHIVE: "archive",
});

export const ALLOWED_MIME_PREFIXES = [
  "application/pdf",
  "image/",
  "text/",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.",
  "application/msword",
  "application/vnd.ms-",
  "application/octet-stream",
];
