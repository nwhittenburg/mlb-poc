# Fonts Directory

## Adobe Clean Font Files Needed

The following Adobe Clean font files need to be added to this directory:

- `adobe-clean-light.woff2` (font-weight: 300)
- `adobe-clean-regular.woff2` (font-weight: 400)
- `adobe-clean-bold.woff2` (font-weight: 700)

### Where to Get Adobe Clean Fonts

Adobe Clean is a proprietary Adobe font. You can obtain the font files from:

1. **Adobe Fonts** (formerly Typekit) - Available to Creative Cloud subscribers
2. **Adobe's internal font library** - For Adobe employees
3. **Adobe's design system resources**

### Font File Requirements

- Format: WOFF2 (Web Open Font Format 2.0) for best compression and browser support
- Weights needed: Light (300), Regular (400), Bold (700)
- Style: Normal (non-italic)

### Installing the Fonts

1. Download the Adobe Clean .woff2 font files
2. Place them in this directory (`/styles/fonts/`)
3. Ensure filenames match:
   - `adobe-clean-light.woff2`
   - `adobe-clean-regular.woff2`
   - `adobe-clean-bold.woff2`
4. The `@font-face` declarations are already configured in `styles.css`

### Current Fallback

Until Adobe Clean fonts are added, the browser will fall back to system fonts:
- -apple-system (macOS/iOS)
- BlinkMacSystemFont (macOS Chrome)
- Segoe UI (Windows)
- Roboto (Android)
- Generic sans-serif

## Existing Fonts

The following fonts are currently present as fallbacks:

- `montserrat.woff2` - Montserrat variable font (weights 100-900)
- `montserrat-italic.woff2` - Montserrat italic variable font (weights 100-900)

These can be removed once Adobe Clean is properly installed.
