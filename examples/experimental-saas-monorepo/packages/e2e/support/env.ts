import path from "node:path";

export const API_DIR = path.resolve(import.meta.dirname, "../../api");
export const WEB_DIR = path.resolve(import.meta.dirname, "../../web");

export const API_PORT = 3001;
export const WEB_PORT = 5174;
export const BASE_URL = `http://localhost:${WEB_PORT}`;

export const DB_FILE = path.join(API_DIR, "data", "e2e-test.sqlite3");

// Same 64-char hex format required by buildTotpCrypto - fixed rather than
// randomly generated so a failed run's leftover DB_FILE (if ever inspected
// manually) can still be decrypted with this same key. Generated via
// `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
export const TOTP_SECRET_ENCRYPTION_KEY =
	"74ba0ab7a2e74801c2754b0d7fb9a2ea01425fb578e40b782680142013fae0ea";
