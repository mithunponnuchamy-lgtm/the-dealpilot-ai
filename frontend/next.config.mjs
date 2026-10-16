/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    let backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:8000';

    if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `http://${backendUrl}`;
    }
    if (backendUrl.startsWith('http://dealpilot-backend') && !backendUrl.includes(':8000')) {
      backendUrl = `${backendUrl}:8000`;
    }

    return [
      {
        source: '/api/proxy/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
