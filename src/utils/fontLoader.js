/**
 * Font Loader Utility
 * 
 * This utility helps optimize font loading to prevent flash of unstyled text (FOUT)
 * and ensure text remains visible during font loading.
 */

// Default font display strategy
const DEFAULT_STRATEGY = 'swap';

// Font loading strategies
const STRATEGIES = {
  /**
   * Swap: Use fallback font until the custom font is loaded, then swap it in
   * This is the recommended approach for most cases
   */
  swap: {
    'font-display': 'swap',
    'font-display-legacy': 'swap',
  },
  
  /**
   * Optional: Only use the custom font if it's already available
   * Good for non-essential fonts where performance is critical
   */
  optional: {
    'font-display': 'optional',
    'font-display-legacy': 'fallback',
  },
  
  /**
   * Block: Hide text until the font is loaded
   * Not recommended as it can cause layout shifts
   */
  block: {
    'font-display': 'block',
    'font-display-legacy': 'block',
  },
  
  /**
   * Fallback: Short block period with a swap period
   * A balance between FOUT and FOIT (Flash of Invisible Text)
   */
  fallback: {
    'font-display': 'fallback',
    'font-display-legacy': 'optional',
  },
};

/**
 * Loads a font with the specified strategy
 * @param {string} fontFamily - The font family to load
 * @param {string} [strategyName='swap'] - The loading strategy to use
 * @returns {Promise<FontFace>} - A promise that resolves when the font is loaded
 */
function loadFont(fontFamily, strategyName = DEFAULT_STRATEGY) {
  // Skip if font is already loaded or if we're in a non-browser environment
  if (typeof document === 'undefined' || document.fonts === undefined) {
    return Promise.resolve();
  }
  
  const strategy = STRATEGIES[strategyName] || STRATEGIES[DEFAULT_STRATEGY];
  
  // Check if font is already loaded
  if (document.fonts.check(`1em "${fontFamily}"`)) {
    return Promise.resolve();
  }
  
  // Create a promise that resolves when the font is loaded
  return new Promise((resolve, reject) => {
    const fontFace = new FontFace(fontFamily, `local("${fontFamily}")`);
    
    // Set font display strategy
    fontFace.display = strategy['font-display'];
    
    // Legacy support for older browsers
    if (strategy['font-display-legacy']) {
      fontFace.display = strategy['font-display-legacy'];
    }
    
    // Load the font
    document.fonts.add(fontFace);
    
    fontFace.loaded
      .then(() => {
        document.documentElement.classList.add(`font-loaded-${fontFamily.toLowerCase().replace(/\s+/g, '-')}`);
        resolve(fontFace);
      })
      .catch((error) => {
        console.error(`Failed to load font: ${fontFamily}`, error);
        reject(error);
      });
  });
}

/**
 * Preloads a web font using a link preload
 * @param {string} url - The URL of the font file
 * @param {string} [type='font/woff2'] - The MIME type of the font
 * @param {string} [crossOrigin='anonymous'] - The CORS setting
 * @returns {HTMLLinkElement} - The created link element
 */
function preloadFont(url, type = 'font/woff2', crossOrigin = 'anonymous') {
  if (typeof document === 'undefined') {
    return null;
  }
  
  // Create preload link
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = 'font';
  link.type = type;
  link.crossOrigin = crossOrigin;
  
  // Add to document head
  document.head.appendChild(link);
  
  return link;
}

/**
 * Injects a font face declaration into the document
 * @param {string} fontFamily - The font family name
 * @param {string} src - The font source URL
 * @param {Object} [options] - Font face options
 * @param {string} [options.style='normal'] - Font style (normal, italic, etc.)
 * @param {string} [options.weight='400'] - Font weight (100-900)
 * @param {string} [options.display='swap'] - Font display strategy
 * @param {string} [options.unicodeRange] - Unicode range for the font
 * @returns {CSSStyleSheet} - The created style sheet
 */
function injectFontFace(fontFamily, src, options = {}) {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const {
    style = 'normal',
    weight = '400',
    display = 'swap',
    unicodeRange,
  } = options;
  
  // Create a style element
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  
  // Build the @font-face rule
  let fontFaceRule = `@font-face {
    font-family: "${fontFamily}";
    src: ${src};
    font-style: ${style};
    font-weight: ${weight};
    font-display: ${display};`;
  
  if (unicodeRange) {
    fontFaceRule += `\n    unicode-range: ${unicodeRange};`;
  }
  
  fontFaceRule += '\n  }';
  
  // Add the rule to the style element
  if (styleElement.styleSheet) {
    // For IE
    styleElement.styleSheet.cssText = fontFaceRule;
  } else {
    // For modern browsers
    styleElement.appendChild(document.createTextNode(fontFaceRule));
  }
  
  // Add the style element to the document head
  document.head.appendChild(styleElement);
  
  return styleElement.sheet;
}

/**
 * Gets the computed font display value for an element
 * @param {HTMLElement} element - The element to check
 * @returns {string} - The computed font display value
 */
function getComputedFontDisplay(element) {
  if (typeof window === 'undefined' || !element) {
    return '';
  }
  
  return window.getComputedStyle(element).getPropertyValue('font-display') || 'auto';
}

/**
 * Checks if a font is loaded
 * @param {string} fontFamily - The font family to check
 * @param {string} [testString='BESbswy'] - Test string with characters that differ between fonts
 * @returns {boolean} - True if the font is loaded
 */
function isFontLoaded(fontFamily, testString = 'BESbswy') {
  if (typeof document === 'undefined') {
    return false;
  }
  
  // Create a canvas to measure text dimensions
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set the font to a known fallback font
  context.font = '72px monospace';
  const fallbackWidth = context.measureText(testString).width;
  
  // Set the font to the target font
  context.font = `72px "${fontFamily}", monospace`;
  const targetWidth = context.measureText(testString).width;
  
  // If the widths are different, the font is loaded
  return Math.abs(fallbackWidth - targetWidth) > 10;
}

export {
  loadFont,
  preloadFont,
  injectFontFace,
  getComputedFontDisplay,
  isFontLoaded,
  STRATEGIES,
  DEFAULT_STRATEGY,
};

export default loadFont;
