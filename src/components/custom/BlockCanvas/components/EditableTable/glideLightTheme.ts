// glideLightTheme.ts
// light mode theme for Glide DataGrid

import { Theme } from '@glideapps/glide-data-grid';

export const glideLightTheme: Partial<Theme> = {
    accentColor: '#7C3AED',
    accentLight: '#e5e7eb', // Tailwind gray-200
    bgCell: '#ffffff', // White cell background
    bgHeader: '#f9fafb', // Slightly off-white header
    textDark: '#1f2937', // Dark text
    textMedium: '#4b5563', // Gray-600
    textLight: '#9ca3af', // Gray-400
    headerFontStyle: 'bold 16px',
    fontFamily: 'sans-serif',

    editorFontSize: '14px', // font size for cell being typed
    baseFontStyle: '14px', // base font style for the grid
};
