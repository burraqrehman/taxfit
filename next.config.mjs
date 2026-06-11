/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fonts are loaded via a <link> in app/layout.tsx. Next's build-time font
  // inlining tries to fetch the Google Fonts stylesheet during the build, which
  // fails in restricted/offline environments. Disabling it keeps the build
  // clean; the fonts still load normally in the browser.
  optimizeFonts: false,
};

export default nextConfig;
