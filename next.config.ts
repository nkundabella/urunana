import type { NextConfig } from "next";

// Next.js 16 uses Turbopack by default and can process Tailwind CSS via PostCSS.
// No custom Turbopack loader is needed because we have @tailwindcss/postcss installed.
// The configuration is left empty to rely on the defaults.
const nextConfig: NextConfig = {};

export default nextConfig;

