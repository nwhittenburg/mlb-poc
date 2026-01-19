# Adobe Clean Font Integration

## Summary

Adobe Clean font has been configured as the primary font family for the entire MLB project. All typography throughout the site will use Adobe Clean once the font files are added.

## Changes Made

### 1. `/styles/styles.css`

**Added @font-face declarations:**
- `Adobe Clean Light` (weight: 300)
- `Adobe Clean Regular` (weight: 400)  
- `Adobe Clean Bold` (weight: 700)

**Updated font-family variable:**
```css
--font-family: "Adobe Clean", "adobe-clean", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### 2. `/styles/fonts/README.md`

Created documentation for:
- Required font files
- Where to obtain Adobe Clean fonts
- Installation instructions
- Current fallback behavior

## Typography Inheritance

All typography in the project inherits from the global `--font-family` variable:

- **Body text** - Uses `font-family: var(--font-family)` (line 237 in styles.css)
- **Headings** (h1-h6) - Inherit from body
- **Buttons** - Use `font: inherit` (line 373)
- **Form elements** - Use `font: inherit` (line 373)
- **All blocks** - No block-specific font-family overrides found

## Font Files Needed

To complete the integration, add these files to `/styles/fonts/`:

1. `adobe-clean-light.woff2` (300 weight)
2. `adobe-clean-regular.woff2` (400 weight)
3. `adobe-clean-bold.woff2` (700 weight)

## Fallback Stack

Until Adobe Clean fonts are added, the browser will use:
1. System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
2. Montserrat (existing font, still available as fallback)
3. Generic sans-serif

## Weights Used in Project

Based on the current CSS:

- **300 (Light)** - Available if needed
- **400 (Regular)** - Body text (default)
- **600 (Semi-bold)** - Headings (`font-weight: 600` on lines 354-357)
- **700 (Bold)** - Hero breadcrumb, strong text

**Note:** Weight 600 is used for headings but only 700 is defined. You may want to either:
- Change heading weight to 700: `h1, h2, h3, h4, h5, h6 { font-weight: 700; }`
- Or add Adobe Clean Semibold (600) font file

## Next Steps

1. Obtain Adobe Clean font files (.woff2 format)
2. Add files to `/styles/fonts/` directory
3. Test typography rendering across all pages
4. Consider adding italic variants if needed:
   - `adobe-clean-regular-italic.woff2`
   - `adobe-clean-bold-italic.woff2`
5. Optionally remove Montserrat font files once Adobe Clean is confirmed working

## Verification

To verify the font is loading correctly:
1. Open browser DevTools → Network tab
2. Filter by "Font" 
3. Reload the page
4. Check that `adobe-clean-*.woff2` files are loading
5. Inspect any element → Computed styles → Check "font-family" shows "Adobe Clean"
