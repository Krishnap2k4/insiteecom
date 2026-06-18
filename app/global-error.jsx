'use client'
import { useEffect } from 'react'

/**
 * Top-level error boundary. Replaces the root layout when a fatal
 * error occurs anywhere in the tree, so we own both `<html>` and
 * `<body>`. Must be a Client Component.
 *
 * Auto-handles the #1 cause of "This page couldn't load" after a deploy:
 * `ChunkLoadError` — the browser has cached `index.html` referencing
 * old JS bundle hashes that the new server doesn't serve any more.
 * The only safe recovery is a fresh page load, which we do once
 * automatically (with a sessionStorage guard so we don't reload-loop).
 */
const isChunkLoadError = (error) => {
    if (!error) return false
    const name = error.name || ''
    const msg  = error.message || ''
    return (
        name === 'ChunkLoadError' ||
        /Loading chunk \d+ failed/i.test(msg) ||
        /Loading CSS chunk/i.test(msg) ||
        /ChunkLoadError/i.test(msg) ||
        /failed to fetch dynamically imported module/i.test(msg)
    )
}

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        if (error) console.error('[Global error boundary]', error)
        if (isChunkLoadError(error)) {
            // Avoid infinite reload loops — only auto-reload once.
            try {
                if (sessionStorage.getItem('chunk-reloaded') !== '1') {
                    sessionStorage.setItem('chunk-reloaded', '1')
                    window.location.reload()
                    return
                }
            } catch { /* sessionStorage blocked — skip */ }
        }
    }, [error])

    return (
        <html lang='en'>
            <body style={{
                margin: 0,
                minHeight: '100vh',
                backgroundColor: '#070707',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}>
                <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
                    <div style={{
                        fontSize: '11px',
                        letterSpacing: '0.4em',
                        textTransform: 'uppercase',
                        color: '#C9A24B',
                        marginBottom: '16px',
                    }}>
                        Something went wrong
                    </div>
                    <h1 style={{
                        fontSize: '36px',
                        margin: '0 0 12px 0',
                        fontWeight: 600,
                        color: '#F0D77C',
                    }}>
                        We hit a snag
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.65)',
                        lineHeight: 1.6,
                        margin: '0 0 24px 0',
                        fontSize: '14px',
                    }}>
                        Please refresh the page to try again. If the problem persists,
                        check your connection or come back in a moment.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            type='button'
                            onClick={() => reset()}
                            style={{
                                background: 'linear-gradient(to right, #C9A24B, #F0D77C)',
                                color: '#1a1208',
                                border: 'none',
                                padding: '12px 28px',
                                fontWeight: 700,
                                letterSpacing: '0.25em',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                            }}
                        >
                            Try again
                        </button>
                        <button
                            type='button'
                            onClick={() => { window.location.href = '/' }}
                            style={{
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.85)',
                                border: '1px solid rgba(201, 162, 75, 0.5)',
                                padding: '12px 28px',
                                fontWeight: 600,
                                letterSpacing: '0.25em',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                            }}
                        >
                            Go home
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
