export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Apple system palette
        primary:  { 50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc', 400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca' },
        surface:  { 50:'#f2f2f7', 100:'#f4f4f5', 200:'#e5e5ea', 300:'#d1d1d6', 400:'#aeaeb2', 500:'#8e8e93' },
        ink:      { 900:'#1c1c1e', 800:'#2c2c2e', 700:'#3a3a3c', 600:'#48484a', 500:'#636366', 400:'#8e8e93', 300:'#aeaeb2', 200:'#c7c7cc' },
        success:  { 50:'#d1fae5', 100:'#a7f3d0', 500:'#10b981', 600:'#059669', 700:'#047857' },
        warning:  { 50:'#fef3c7', 100:'#fde68a', 500:'#f59e0b', 600:'#d97706' },
        danger:   { 50:'#ffe4e6', 100:'#fecdd3', 500:'#f43f5e', 600:'#e11d48', 700:'#be123c' },
        violet:   { 50:'#ede9fe', 500:'#8b5cf6', 600:'#7c3aed' },
        sky:      { 50:'#e0f2fe', 500:'#0ea5e9', 600:'#0284c7' },
        emerald:  { 50:'#d1fae5', 500:'#10b981', 600:'#059669' },
        rose:     { 50:'#ffe4e6', 500:'#f43f5e' },
        amber:    { 50:'#fef3c7', 500:'#f59e0b' },
        teal:     { 50:'#ccfbf1', 500:'#14b8a6', 600:'#0d9488' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-md': '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'card-lg': '0 12px 40px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.05)',
        'glass':   '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        'icon':    '0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
        'btn':     '0 2px 8px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        'inner':   'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-up':   'fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':  'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':  'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'spin-slow': 'spin 2s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity:'0', transform:'translateY(10px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        scaleIn: { from: { opacity:'0', transform:'scale(0.96)' },      to: { opacity:'1', transform:'scale(1)' } },
        slideUp: { from: { opacity:'0', transform:'translateY(16px)' }, to: { opacity:'1', transform:'translateY(0)' } },
      },
    }
  },
  plugins: []
}
