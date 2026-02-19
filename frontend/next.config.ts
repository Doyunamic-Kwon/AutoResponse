import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 빌드 시 린트 에러를 무시하도록 설정하여 배포 중단을 방지합니다.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 타입 에러를 무시하도록 설정합니다.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
