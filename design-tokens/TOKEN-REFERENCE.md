# Consonant Design System Token Reference

## 🎯 Best Practice: Always Use Tokens

**Never hard-code values** - Always use Consonant Design System tokens from `consonant.css`.

### Why?
- ✅ Ensures design system consistency
- ✅ Automatic responsive behavior across breakpoints
- ✅ Single source of truth from Figma
- ✅ Easy to maintain and update

### Example:

**❌ BAD - Hard-coded:**
```css
.hero {
  min-height: 560px;
  padding: 56px 0;
  width: 1200px;
}
```

**✅ GOOD - Using tokens:**
```css
.hero {
  min-height: var(--block-m-min-height);
  padding: var(--component-marquee-reflow-56-0-padding) 0;
  max-width: var(--container-width);
}
```

---

## 🏗️ Hero Block (Marquee) Token Reference

The Hero block maps to **Marquee** in the Consonant Design System.

### Typography Tokens

#### Heading Sizes (Responsive)
```css
/* Hero Heading - Use typography-heading-2xl or 3xl */
--typography-heading-3xl: 80px  /* Desktop: Large hero headings */
--typography-heading-2xl: 44px  /* Desktop: Default hero headings */
--typography-heading-xl: 36px   /* Desktop: Smaller headings */
--typography-heading-l: 28px
--typography-heading-m: 24px
--typography-heading-s: 20px
--typography-heading-xs: 18px   /* Desktop: Breadcrumbs, small text */

/* Tablet & Mobile (600-899px & <600px) */
--typography-heading-3xl: 44px  /* Large hero headings scale down */
--typography-heading-2xl: 36px  /* Default hero headings scale down */
--typography-heading-xl: 28px
--typography-heading-l: 24px
--typography-heading-m: 20px
--typography-heading-s: 18px
--typography-heading-xs: 16px   /* Breadcrumbs, small text */
```

#### Hero Typography Usage
```css
.hero-heading {
  font-size: var(--typography-heading-2xl);  /* 44px → 36px responsive */
  font-weight: 700;
  line-height: 1.2;
}

.hero-heading-large {
  font-size: var(--typography-heading-3xl);  /* 80px → 44px responsive */
}

.hero-breadcrumb {
  font-size: var(--typography-heading-xs);   /* 18px → 16px responsive */
  font-weight: 600;
}
```

### Component-Specific Tokens (13 available)

#### Padding & Spacing
```css
--component-marquee-reflow-56-0-padding: 56px      /* Vertical padding (XL) */
--component-marquee-reflow-56-32-padding: 56px     /* Responsive padding */
--component-marquee-reflow-48-32-padding: 48px     /* Responsive padding */
--component-marquee-reflow-40-0-padding: 40px      /* Responsive padding */
--component-marquee-anchor-anchor-card-padding: 24px
--component-marquee-anchor-anchor-marquee-container-padding: 16px
```

#### Layout & Dimensions
```css
--component-marquee-banner-image-reflow: 0px
--component-marquee-splt-banner-image: 0px
--component-marquee-justified-btn-min-width: 0px
--component-marquee-anchor-reflow-anchor-link-padding: 800px
--component-marquee-anchor-anchor-marquee-link-bkg-2: 768px
--component-marquee-anchor-test-marquee-anchor: 368px
```

### Block Height Tokens (Hero Marquee Heights)
```css
--block-l-min-height: 700px                /* Large Hero (L) */
--block-m-min-height: 560px                /* Medium Hero (M) */
--block-s-min-height: 360px                /* Small Hero (S) */
--block-s-min-height-alt: 420px            /* Alternative Small */
```

**Responsive Values:**
- **Desktop (900px+):** 700px / 560px / 360px
- **Tablet (600-899px):** 360px / 360px / 360px
- **Mobile (0-599px):** 0px / 0px / 0px (auto-height)

### Layout Tokens
```css
--container-width: 1200px                  /* Main container width */
--page-width: 1920px                       /* Full page width */
--1440-container-width: 1440px             /* Alternative container */
```

**Responsive Values:**
- **Desktop:** 1200px
- **Tablet:** 640px
- **Mobile:** 300px

### Spacing Tokens
```css
--spacing-tokens-spacing-xs: 16px          /* Extra small */
--spacing-tokens-spacing-s: 24px           /* Small */
--spacing-tokens-spacing-m: 32px           /* Medium */
--spacing-tokens-spacing-l: 40px           /* Large */
--spacing-tokens-spacing-xl: 56px          /* Extra large */
--spacing-tokens-spacing-2xl: 64px         /* 2X large */
--spacing-reflow-reflow-1-col-to-m-gap: 100px  /* Column gap */
```

### Typography Tokens

#### Headings
```css
--typography-heading-3xl: 80px             /* Hero headlines */
--typography-heading-2xl: 44px             /* Main headings */
--typography-heading-xl: 36px
--typography-heading-l: 28px
--typography-heading-m: 24px
--typography-heading-s: 20px
--typography-heading-xs: 18px
```

**Responsive (Heading 2XL Example):**
- **Desktop:** 44px
- **Tablet:** 36px
- **Mobile:** 32px (or similar scaling)

#### Body Text
```css
--body-xl: 22px (line-height 1.5)          /* Large body text */
--font-adobe-clean: 'Adobe Clean'          /* Primary font */
```

### Color Tokens
```css
--c1-text-text: #2c2c2c                    /* Primary text */
--c1-content-button-primary: #2c2c2c       /* Primary button */
--c1-content-button-accent: #3b63fb        /* Accent button */
--c1-background-standard: #ffffff          /* Standard background */
--c1-web-gray-scale-white: #ffffff         /* White */
```

---

## 📝 Usage Examples for Hero Block

### Basic Hero Structure
```css
.hero {
  /* Use block height tokens for fixed heights */
  min-height: var(--block-m-min-height);
  
  /* Use Marquee padding tokens */
  padding: var(--component-marquee-reflow-56-0-padding) 0;
  
  /* Use container width */
  max-width: var(--container-width);
  margin: 0 auto;
}
```

### Hero Content
```css
.hero-foreground {
  /* Use spacing tokens for gaps */
  gap: var(--spacing-reflow-reflow-1-col-to-m-gap);
  padding: var(--spacing-tokens-spacing-xl) 0;
}

.hero-heading {
  /* Use typography tokens */
  font-size: var(--typography-heading-2xl);
  font-family: var(--font-adobe-clean);
  color: var(--c1-text-text);
  line-height: 1.25;
}

.hero-body {
  font-size: var(--body-xl);
  line-height: 1.5;
}
```

### Hero Variants
```css
.hero.large {
  min-height: var(--block-l-min-height);  /* 700px */
}

.hero.medium {
  min-height: var(--block-m-min-height);  /* 560px */
}

.hero.small {
  min-height: var(--block-s-min-height);  /* 360px */
}
```

---

## 🔍 Finding Tokens

### Search by Component
```bash
# Find all Marquee tokens
grep "^  --component-marquee" styles/consonant.css

# Find all spacing tokens
grep "^  --spacing" styles/consonant.css

# Find all typography tokens
grep "^  --typography" styles/consonant.css
```

### Search by Pattern
```bash
# Find height-related tokens
grep "height" styles/consonant.css

# Find padding tokens
grep "padding" styles/consonant.css

# Find width tokens
grep "width" styles/consonant.css
```

---

## 📚 Additional Resources

- **Full token reference:** `styles/consonant.css` (658 tokens)
- **Token source files:** `design-tokens/*.tokens.json`
- **Design system in Figma:** [MLB Microsite Working File](https://www.figma.com/design/G2UB1i84COcBzNUHNgDjj1/MLB-Microsite-Working-File?node-id=326-1668)

---

## ⚡ Quick Reference Card

| What You Need | Token to Use |
|---------------|--------------|
| Hero height (Medium) | `--block-m-min-height` |
| Hero height (Large) | `--block-l-min-height` |
| Vertical padding | `--component-marquee-reflow-56-0-padding` |
| Container width | `--container-width` |
| Column gap | `--spacing-reflow-reflow-1-col-to-m-gap` |
| Large heading | `--typography-heading-2xl` |
| Body text | `--body-xl` |
| Primary text color | `--c1-text-text` |
| Accent button | `--c1-content-button-accent` |
| Small spacing | `--spacing-tokens-spacing-s` |
| Large spacing | `--spacing-tokens-spacing-xl` |

Remember: **Tokens automatically adjust for tablet and mobile breakpoints!** 📱
