import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move the dev-only indicator out of the bottom-left so it doesn't overlap
  // the Settings gear in the left rail.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
