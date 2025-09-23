const ENV_APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim();
const ENV_VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();

const normalizedAppUrl = ENV_APP_URL?.replace(/\/$/, "");
const normalizedVercelUrl = ENV_VERCEL_URL
  ? `https://${ENV_VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
  : null;

const FALLBACK_URL = "http://localhost:3000";

export const SITE_URL = normalizedAppUrl || normalizedVercelUrl || FALLBACK_URL;

export const SITE_NAME = "I-GATE 2025";
export const SITE_SHORT_NAME = "I-GATE";
export const SITE_TAGLINE = "Shine, Unite, Celebrate";
export const SITE_DESCRIPTION =
  "Informatics Gathering (I-GATE) adalah momen berkumpulnya seluruh keluarga besar Informatika dan ajang pentas seni lintas angkatan.";

export const SITE_KEYWORDS = [
  "I-GATE",
  "Informatics Gathering",
  "Informatika",
  "event kampus",
  "pentas seni",
  "ticketing",
  "Mahasiswa Informatika",
];

export const SITE_CATEGORY = "Event";
export const OG_IMAGE = "/band.png";

export const METADATA_BASE = new URL(SITE_URL);
