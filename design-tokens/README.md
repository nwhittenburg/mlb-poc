# Design Tokens

This directory contains the Consonant Design System tokens exported from Figma.

## 📁 Files

- `Desktop.tokens.json` - Design tokens for desktop breakpoint (900px+)
- `Tablet.tokens.json` - Design tokens for tablet breakpoint (600-899px)
- `Mobile.tokens.json` - Design tokens for mobile breakpoint (0-599px)
- `generate-css.js` - Script to convert JSON tokens to CSS custom properties
- `check-updates.js` - Script to detect when tokens need updating

## 🔄 Usage

### Generate CSS from Tokens

```bash
npm run tokens:generate
```

This generates `styles/consonant.css` with all design tokens as CSS custom properties with responsive media queries.

### Check for Token Updates

```bash
npm run tokens:check
```

Compares local tokens with source files in Downloads and alerts if updates are needed.

### Update Tokens

```bash
npm run tokens:update
```

Copies latest token files from Downloads and regenerates CSS.

## 📊 Token Structure

The token files contain 658 design tokens organized into categories:

- **Size** - Grid calculations, column widths, inline dimensions
- **Component** - Component-specific tokens (Marquee, Cards, Buttons, etc.)
- **Spacing** - All spacing values (xs, s, m, l, xl, reflow gaps)
- **Typography** - Font families, sizes, line heights
- **Page** - Layout dimensions (page width, container width)
- **Visibility** - Show/hide flags
- **String** - Text content

## 🎯 Key Tokens

### Layout
- `--container-width: 1200px`
- `--page-width: 1920px`
- `--block-m-min-height: 560px`
- `--block-l-min-height: 700px`

### Spacing
- `--spacing-xs: 16px`
- `--spacing-s: 24px`
- `--spacing-xl: 56px`
- `--spacing-reflow-reflow-1-col-to-m-gap: 100px`

### Typography
- `--typography-heading-2xl: 44px`
- `--body-xl: 22px` (line-height 1.5)
- `--font-adobe-clean: 'Adobe Clean'`

### Colors
- `--c1-text-text: #2c2c2c`
- `--c1-content-button-primary: #2c2c2c`
- `--c1-content-button-accent: #3b63fb`
- `--c1-background-standard: #ffffff`

## 🔧 Maintenance

When the design system is updated in Figma:

1. Export new token JSON files from Figma
2. Place them in `/Users/whittenb/Downloads/C1 _ Breakpoint 2/`
3. Run `npm run tokens:check` to see what changed
4. Run `npm run tokens:update` to sync and regenerate CSS
5. Commit the updated token files and generated CSS

## 📝 Notes

- Token files are **658 tokens each** (one for each breakpoint)
- Most tokens (81.5%) are marked as `hiddenFromPublishing: true` in Figma
- The JSON export gives complete access to all tokens
- CSS generation only includes tokens that differ per breakpoint to reduce file size
