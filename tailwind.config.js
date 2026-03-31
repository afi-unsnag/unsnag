
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#FAF7F2',
        'cream-dark': '#F0EBE3',
        'warm-dark': '#2D2A26',
        'warm-dark-light': '#4A4640',
        
        // Primary Accent
        mauve: '#E2C6FD',
        'mauve-dark': '#C9A4E8',
        'mauve-light': '#F0DEFF',
        
        // Secondary Pops
        blush: '#FFBCF2',
        'blush-dark': '#E8A0D8',
        orange: '#FFA846',
        'orange-dark': '#E89A30',
        tomato: '#FF6B4C',
        'tomato-dark': '#E85A3A',
        
        // Keep Sage for calm/timer
        sage: '#8BA888',
        'sage-dark': '#6E8E6B',
        'sage-light': '#A8C4A5',
        
        'warm-gray': '#B8B2A8',
        'warm-gray-light': '#E8E3DB',
      },
      boxShadow: {
        'chunky': '3px 3px 0px 0px #2D2A26',
        'chunky-sm': '2px 2px 0px 0px #2D2A26',
        'chunky-lg': '4px 4px 0px 0px #2D2A26',
        'chunky-mauve': '3px 3px 0px 0px #C9A4E8',
        'chunky-pressed': '1px 1px 0px 0px #2D2A26',
      },
    },
  },
}
