import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f5f5f6',
        surface: '#ffffff',
        'text-primary': '#0f172a',
        'text-muted': '#6b7280',
        accent: '#2563eb',
        warning: '#f97316',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
export default config
