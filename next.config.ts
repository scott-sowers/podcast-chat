import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Apple Podcasts artwork
        protocol: "https",
        hostname: "is*.mzstatic.com",
      },
      {
        // Spotify/Anchor podcasts
        protocol: "https",
        hostname: "*.scdn.co",
      },
      {
        // Megaphone podcasts
        protocol: "https",
        hostname: "megaphone.imgix.net",
      },
      {
        // Simplecast podcasts
        protocol: "https",
        hostname: "*.simplecastcdn.com",
      },
      {
        // Libsyn podcasts
        protocol: "https",
        hostname: "*.libsynpro.com",
      },
      {
        // Buzzsprout podcasts
        protocol: "https",
        hostname: "*.buzzsprout.com",
      },
      {
        // Podbean podcasts
        protocol: "https",
        hostname: "*.podbean.com",
      },
      {
        // Spreaker podcasts
        protocol: "https",
        hostname: "*.spreaker.com",
      },
      {
        // Transistor podcasts
        protocol: "https",
        hostname: "images.transistor.fm",
      },
      {
        // Generic image CDNs
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        // S3 hosted images
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        // Allow any https image as fallback
        protocol: "https",
        hostname: "**",
      },
      {
        // Allow any http image as fallback (some podcast feeds use http)
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
