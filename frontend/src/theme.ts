import type { Theme } from 'theme-ui'

export const focusRing = {
  outline: '2px solid',
  outlineColor: 'focus',
  outlineOffset: '2px',
}

export const theme: Theme = {
  config: { useLocalStorage: false },

  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: 'inherit',
    monospace: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  fontSizes: [12, 14, 16, 18, 20, 24, 30, 38],
  fontWeights: { body: 400, medium: 500, semibold: 600, heading: 700 },
  lineHeights: { body: 1.55, heading: 1.2 },
  space: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  sizes: { container: 1040 },
  radii: { sm: '4px', md: '8px', lg: '12px', pill: '999px' },
  borders: { hairline: '1px solid', thick: '4px solid' },
  shadows: {
    card: '0 1px 3px rgba(26, 27, 37, 0.08), 0 1px 2px rgba(26, 27, 37, 0.04)',
    raised: '0 4px 12px rgba(26, 27, 37, 0.10)',
  },

  colors: {
    text: '#1A1B25',
    muted: '#55596B',
    background: '#F7F8FC',
    surface: '#FFFFFF',
    primary: '#4338CA',
    primaryHover: '#372FA8',
    focus: '#4338CA',
    border: '#E2E5EF',
    borderInput: '#7C8399',
    track: '#E4E6F1',
    error: '#B4232B',
    errorText: '#991B1F',
    errorBackground: '#FDEDEE',
    status: {
      active: { background: '#DCFCE7', text: '#14532D' },
      pending: { background: '#FEF3C7', text: '#78350F' },
      sold: { background: '#F1F1F4', text: '#3F3F52' },
    },
  },

  styles: {
    root: {
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
      fontSize: 2,
      color: 'text',
      backgroundColor: 'background',
    },
    h1: { fontFamily: 'heading', lineHeight: 'heading', fontSize: 6, m: 0 },
    h2: { fontFamily: 'heading', lineHeight: 'heading', fontSize: 4, m: 0 },
    h3: { fontFamily: 'heading', lineHeight: 'heading', fontSize: 3, m: 0 },
  },

  text: {
    heading: { fontFamily: 'heading', lineHeight: 'heading' },
    muted: { color: 'muted', fontSize: 1 },
    fieldError: { color: 'errorText', fontSize: 1, fontWeight: 'medium' },
  },

  buttons: {
    primary: {
      fontFamily: 'body',
      fontSize: 2,
      fontWeight: 'semibold',
      color: 'surface',
      backgroundColor: 'primary',
      borderRadius: 'md',
      px: 5,
      py: 3,
      cursor: 'pointer',
      '&:hover:not(:disabled)': { backgroundColor: 'primaryHover' },
      '&:focus-visible': focusRing,
      '&:disabled': { opacity: 0.55, cursor: 'not-allowed' },
    },
    secondary: {
      fontFamily: 'body',
      fontSize: 2,
      fontWeight: 'semibold',
      color: 'primary',
      backgroundColor: 'surface',
      border: 'hairline',
      borderColor: 'borderInput',
      borderRadius: 'md',
      px: 5,
      py: 3,
      cursor: 'pointer',
      '&:hover:not(:disabled)': { backgroundColor: 'background' },
      '&:focus-visible': focusRing,
      '&:disabled': { opacity: 0.55, cursor: 'not-allowed' },
    },
  },

  forms: {
    label: { fontSize: 1, fontWeight: 'semibold', color: 'text', mb: 1 },
    input: {
      fontFamily: 'body',
      fontSize: 2,
      color: 'text',
      backgroundColor: 'surface',
      borderColor: 'borderInput',
      borderRadius: 'md',
      px: 3,
      py: 2,
      '&:focus-visible': focusRing,
    },
    select: {
      fontFamily: 'body',
      fontSize: 2,
      color: 'text',
      backgroundColor: 'surface',
      borderColor: 'borderInput',
      borderRadius: 'md',
      px: 3,
      py: 2,
      '&:focus-visible': focusRing,
    },
  },

  layout: {
    container: { maxWidth: 'container', mx: 'auto', px: 4 },
  },

  cards: {
    primary: {
      backgroundColor: 'surface',
      border: 'hairline',
      borderColor: 'border',
      borderRadius: 'lg',
      boxShadow: 'card',
      p: 5,
    },
  },
}
