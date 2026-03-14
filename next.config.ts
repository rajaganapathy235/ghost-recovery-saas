import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
});

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
    '/**/*': ['./node_modules/.prisma/client/**/*'],
  },
};

export default withPWA(nextConfig);
