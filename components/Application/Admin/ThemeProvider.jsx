'use client'
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Thin client-side wrapper around next-themes' provider.
 *
 * The `'use client'` directive is required: next-themes injects a small
 * inline <script> tag during render to apply the saved theme class on
 * <html> before first paint (preventing the dark/light flash). React 19
 * and Next.js 16 refuse to execute <script> tags from server-rendered
 * React trees and emit a console warning if they encounter one. Marking
 * this wrapper as a client component keeps the script-injection where
 * it works — in the client tree.
 */
const ThemeProvider = ({ children, ...props }) => {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export default ThemeProvider
