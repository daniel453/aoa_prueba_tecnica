import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Genera .next/standalone con un server.js minimal para imagenes Docker pequeñas.
  // Vercel ignora este flag (gestiona el deploy con su propio runtime).
  output: 'standalone',
};

export default nextConfig;
