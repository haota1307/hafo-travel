import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { legacyPublicRoutes } from "./features/public-site/data/legacy-routes";

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(legacyPublicRoutes).map(([source, destination]) => ({
      source: `/:locale(vi|en)/${source}`,
      destination: `/:locale/${destination}`,
      permanent: true,
    }));
  },
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
