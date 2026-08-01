/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image-bucket-admin.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;


