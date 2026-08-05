/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image-bucket-admin.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "st-micheals-hub.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;


