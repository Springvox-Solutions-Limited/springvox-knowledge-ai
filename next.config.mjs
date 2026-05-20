/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {},
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.100.70:3000',
    '192.168.100.70',
    '*.pinggy.link',
    '*.serveo.net',
    '*.loca.lt',
    '*.localtunnel.me'
  ]
};

export default nextConfig;
