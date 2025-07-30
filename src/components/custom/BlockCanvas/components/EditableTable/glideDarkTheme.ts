// glideDarkTheme.ts
// dark mode theme for Glide DataGrid

import { Theme } from '@glideapps/glide-data-grid';

export const glideDarkTheme: Partial<Theme> = {
    accentColor: '#7C3AED', // border color for selected cells
    accentLight: '#1f1f1fff', // when selecting a cell
    bgCell: '#09090bff', // color of the cell background
    bgHeader: '#09090bff', // header background color
    bgHeaderHovered: '#1f1f1fff', // header background color when hovered
    bgHeaderHasFocus: '#1f1f1fff', // header background color when selected
    textDark: '#ffffffff', // default text color (non header)
    textMedium: '#b5b5b5ff', // add row text color at bottom
    textLight: '#ffffffff', // row number text color
    headerFontStyle: 'bold 14px sans-serif',

    fontFamily: 'sans-serif',

    editorFontSize: '12px', // font size for cell being typed

    textHeader: '#ffffffff', // header text color

    baseFontStyle: '50px sans-serif', // base font style for the grid
};
