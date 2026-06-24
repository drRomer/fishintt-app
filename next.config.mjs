/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nota: NO usar output: 'export'. La app necesita servidor para las API routes
  // (/api/analyze con expansión, base comunitaria y IA). Vercel lo soporta nativamente.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
