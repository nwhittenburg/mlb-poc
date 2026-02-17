# Columns Block

Creates responsive multi-column layouts with various styling options.

## Features

- **Responsive grid**: Automatically stacks on mobile, side-by-side on desktop
- **Flexible columns**: Supports 2+ columns of equal or custom width
- **Multiple variations**: Different styling options for various use cases
- **Gap control**: Adjustable spacing between columns

## Basic Usage

### Two Columns

| Column 1 | Column 2 |
|----------|----------|
| **Heading 1**<br>Content for column 1 | **Heading 2**<br>Content for column 2 |

### Three Columns

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Content 1 | Content 2 | Content 3 |

## Variations

### No Background

Add class: `no-background`

Removes the white background, border, and padding from columns for a cleaner look.

```
| Content 1 | Content 2 |
```

### Horizontal

Add class: `horizontal`

Compact styling with reduced padding and smaller font sizes.

### Editorial

Add class: `editorial`

Specialized styling with narrow font family and compact spacing.

### Image Cover

Add class: `image-cover`

Creates equal-height columns with images that fill their container using `object-fit: cover`.

### Extended Image

Add class: `extended-image` (requires `full-width` section)

Creates an asymmetric layout where the image extends beyond the container width:
- Image on left: extends to left edge of viewport
- Image on right: extends to right edge of viewport
- Content column has max-width of 560px

### Z-Pattern

Add class: `z-pattern`

On desktop, alternates column order on odd rows to create a zigzag reading pattern.

### Align Top

Add class: `align-top`

Aligns column content to the top instead of stretching to full height.

## Gap Sizes

Control spacing between columns with gap classes:

- `gap-xs` - Extra small gap
- `gap-s` - Small gap
- `gap-m` - Medium gap
- `gap-l` - Large gap (default)
- `gap-xl` - Extra large gap
- `gap-xxl` - Extra extra large gap

## Responsive Behavior

- **Desktop** (900px+): Columns display side-by-side in equal widths
- **Mobile** (<900px): Columns stack vertically

## Combining Variations

Multiple classes can be combined:

```
columns, no-background, gap-xl
```

## Extended Image Requirements

The `extended-image` variation requires:
1. Parent section must have `full-width` class
2. Works best with 2 columns (image + content)
3. Image should be in a column by itself (wrapped in picture tag only)
4. Automatically detects image position (left or right) based on column order
