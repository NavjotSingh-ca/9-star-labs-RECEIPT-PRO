/**
 * Z-Index System — Systemic Layering
 * Strict scale, no arbitrary values
 */

export const zIndex = {
  // Base layers
  hide: -1,
  base: 0,

  // Layout layers
  content: 10,
  sidebar: 50,
  header: 100,
  footer: 100,

  // Overlay layers
  dropdown: 200,
  sticky: 300,
  fixed: 400,

  // Modal/Dialog layers
  modalBackdrop: 500,
  modal: 600,
  modalContent: 610,

  // Popover/Tooltip layers
  popover: 700,
  tooltip: 800,
  toast: 900,

  // Special
  commandPalette: 1000,
  debug: 9999,

  // Semantic aliases
  semantic: {
    belowContent: 0,
    aboveContent: 10,
    navigation: 50,
    appChrome: 100,
    overlay: 200,
    stickyHeader: 300,
    dropdown: 400,
    modalBackdrop: 500,
    modal: 600,
    popover: 700,
    tooltip: 800,
    notification: 900,
    global: 1000,
  },
} as const;

export type ZIndexTokens = typeof zIndex;