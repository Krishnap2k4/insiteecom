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
};

export default nextConfig;
