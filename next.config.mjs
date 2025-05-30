/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [new URL('https://hackrland.dev/**')]
    }
};

export default nextConfig;
