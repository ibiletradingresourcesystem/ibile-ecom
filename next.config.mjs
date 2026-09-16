/** @type {import('next').NextConfig} */

const strip = (value) => String(value || "").trim().replace(/^["']|["']$/g, "");

const bucket = strip(process.env.S3_BUCKET_NAME);
const region = strip(process.env.S3_REGION);

/**
 * Hosts next/image is allowed to optimise product photos from.
 *
 * The inventory app writes image URLs as
 *   https://<bucket>.s3.<region>.amazonaws.com/<key>
 * so the configured bucket is derived from the same env vars it uses, and a
 * bucket or region change does not silently turn every product image into a
 * placeholder. The older global-style host and the legacy bucket are kept for
 * images uploaded before the move.
 *
 * A previous entry used "**.s3.*.amazonaws.com": Next only supports "**" at the
 * start of a hostname and "*" for a single leading subdomain, so a wildcard in
 * the middle never matched anything.
 */
const remotePatterns = [
  bucket && region && {
    protocol: "https",
    hostname: `${bucket}.s3.${region}.amazonaws.com`,
  },
  bucket && {
    protocol: "https",
    hostname: `${bucket}.s3.amazonaws.com`,
  },
  { protocol: "https", hostname: "image-bucket-admin.s3.amazonaws.com" },
  { protocol: "https", hostname: "st-micheals-hub.s3.eu-north-1.amazonaws.com" },
].filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
    // Smaller payloads on the product grid, which is the heaviest page.
    formats: ["image/avif", "image/webp"],
    // Product photos rarely change; let the optimiser keep them a day.
    minimumCacheTTL: 86400,
    deviceSizes: [360, 420, 640, 750, 1080, 1200],
    imageSizes: [80, 128, 180, 220, 320],
  },
};

export default nextConfig;
