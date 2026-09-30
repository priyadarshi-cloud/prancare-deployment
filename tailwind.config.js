/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pran: {
          dark: '#0A363B',
          deep: '#0E525A',
          teal: '#0D9488',
          turquoise: '#14B8A6',
          cyan: '#0EA5A0',
          mint: '#DEF7F4',
          lightMint: '#E6F6F5',
          bg: '#F2F9F9',
          cardDark: '#114C53',
          cardTeal: '#16999F',
        },
        status: {
          verified: '#22C55E',
          verifiedBg: '#DCFCE7',
          verifiedCard: '#2E7D47',
          verifiedBorder: '#86EFAC',
          needs: '#F59E0B',
          needsBg: '#FEF3C7',
          needsCard: '#D97706',
          needsBorder: '#FCD34D',
          suspicious: '#EF4444',
          suspiciousBg: '#FEE2E2',
          suspiciousCard: '#DC2626',
          suspiciousBorder: '#FCA5A5',
          demo: '#FEF08A',
        }
      },
      borderRadius: {
        'card': '24px',
        'phone': '44px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(10, 54, 59, 0.08), 0 2px 6px -1px rgba(10, 54, 59, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(10, 54, 59, 0.12), 0 4px 10px -2px rgba(10, 54, 59, 0.06)',
        'btn': '0 2px 8px 0 rgba(14, 82, 90, 0.25)',
      },
      minHeight: {
        'touch': '48px',
        'btn': '56px',
      },
      minWidth: {
        'touch': '48px',
      }
    },
  },
  plugins: [],
};
