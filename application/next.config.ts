import type { NextConfig } from "next";

// Allow cross-origin requests from the ngrok dev tunnel so that
// /_next/* HMR and static asset requests work without warnings.
// The hostname is read from .env at startup, so running `npm run dev:urls`
// followed by restarting the dev server is all that's needed when ngrok changes.
const devOrigins: string[] = [];

if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const { hostname } = new URL(process.env.NEXT_PUBLIC_APP_URL);
    if (hostname) devOrigins.push(hostname);
  } catch {
    // malformed URL — skip
  }
}

const nextConfig: NextConfig = {
  ...(devOrigins.length > 0 && { allowedDevOrigins: devOrigins }),
};

export default nextConfig;
