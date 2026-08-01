/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0F1E',
        panel: '#131A2E',
        panel2: '#1A2338',
        violet: '#8B5CF6',
        cyan: '#22D3EE',
        amber: '#FBBF24',
        mist: '#94A3B8',
        fog: '#E7E9F5'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        sculpt: '0 1px 0 rgba(255,255,255,0.06) inset, 0 -6px 12px rgba(0,0,0,0.35) inset, 0 12px 24px rgba(0,0,0,0.45)',
        glowViolet: '0 0 24px rgba(139,92,246,0.55), 0 0 60px rgba(139,92,246,0.25)',
        glowCyan: '0 0 24px rgba(34,211,238,0.55), 0 0 60px rgba(34,211,238,0.25)',
        glowAmber: '0 0 24px rgba(251,191,36,0.55), 0 0 60px rgba(251,191,36,0.25)'
      }
    }
  },
  plugins: []
}
