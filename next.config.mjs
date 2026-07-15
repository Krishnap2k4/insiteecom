/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
                search: ''
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.pexels.com',
                port: '',
                pathname: '/**',
            }
        ]
    },
    // pdfkit ships its built-in AFM font files alongside its source
    // and resolves them at runtime via `fs`. Bundling it through
    // Turbopack / Webpack rewrites the paths and breaks the lookup
    // ("ENOENT: data/Helvetica.afm"). Tell Next to leave it as a
    // runtime require from node_modules.
    serverExternalPackages: ['pdfkit'],

    // ---- Security & CORS headers ----
    // CORS: API routes only allow requests from the app's own origin.
    // In production NEXT_PUBLIC_BASE_URL is set to the live domain;
    // in dev it's http://localhost:3000. This keeps localhost out of
    // production CORS while keeping local dev working.
    async headers() {
        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        return [
            // CORS for API routes
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: origin },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Max-Age', value: '86400' },
                ],
            },
            // Security headers for all routes
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ]
    },
};

export default nextConfig;
