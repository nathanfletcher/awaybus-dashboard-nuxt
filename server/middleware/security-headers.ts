// Security headers middleware for AwayBus Dashboard
// Applied to every server response

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Enable HSTS (1 year, include subdomains)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ktcwtskfltmihgddyzbj.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "connect-src 'self' https://ktcwtskfltmihgddyzbj.supabase.co wss://ktcwtskfltmihgddyzbj.supabase.co https://*.supabase.co wss://*.supabase.co http://127.0.0.1:* http://localhost:* ws://127.0.0.1:*",
      "frame-src 'self'",
      "object-src 'none'",
    ].join('; '),
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })
})
