import GlobalProvider from "@/components/Application/GlobalProvider";
import "./globals.css";
import { Assistant } from 'next/font/google'
import { ToastContainer } from 'react-toastify';
import { getSiteSettings } from "@/lib/settings";
import { headers } from "next/headers";

const assistantFont = Assistant({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap'
})

/**
 * Generate root metadata dynamically so site name, tagline and the
 * admin-uploaded favicon flow into every page (storefront + admin).
 *
 * The static favicon fallback lives at /public/favicon.ico — NOT
 * /app/favicon.ico, because the latter is a Next.js convention path
 * that would override anything set here. Moving the file out of /app
 * makes `metadata.icons` the single source of truth.
 *
 * Pages with their own metadata export still take precedence (e.g. the
 * home page's marketing title) — this object is the fallback used
 * everywhere else, including pages that don't define their own metadata.
 */
export async function generateMetadata() {
  const { branding } = await getSiteSettings()
  const siteName = branding?.siteName?.trim() || 'Store'
  const tagline  = branding?.tagline?.trim()  || ''
  const iconUrl  = branding?.faviconUrl || '/favicon.ico'

  return {
    title: {
      default:  tagline ? `${siteName} — ${tagline}` : siteName,
      template: `%s — ${siteName}`,    // pages set just their page name; brand suffix is automatic
    },
    description: tagline || `Discover ${siteName}'s curated fragrance collection.`,
    applicationName: siteName,
    icons: {
      icon:     iconUrl,
      shortcut: iconUrl,
      apple:    iconUrl,
    },
  }
}

export default async function RootLayout({ children }) {
  // Paint the dark storefront canvas *before* any CSS loads — kills the
  // white flash on hard reload. We only set the inline style when the
  // request is for a storefront path; admin and auth routes get nothing
  // here so shadcn's ThemeProvider continues to control them as before.
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') || ''
  const isStorefront = !pathname.startsWith('/admin') && !pathname.startsWith('/auth')
  const storefrontPaint = isStorefront ? { backgroundColor: '#070707' } : undefined

  return (
    <html lang="en" style={storefrontPaint}>
      <body
        className={`${assistantFont.className} antialiased`}
        style={storefrontPaint}
      >
        <GlobalProvider>
          <ToastContainer />
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}
