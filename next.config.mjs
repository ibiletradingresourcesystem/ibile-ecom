/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["image-bucket-admin.s3.amazonaws.com"],
  },
  
};

export default nextConfig;


