# Longform Block

A block for displaying long-form text content with optional numbered styling.

## Variants

### Default (Plain)
Simple longform text with appropriate typography and spacing.

```
| Longform |
| Paragraph 1 text here |
| Paragraph 2 text here |
| Paragraph 3 text here |
```

### Numbered
Each paragraph becomes an auto-numbered item with borders.

```
| Longform (numbered) |
| Paragraph 1 text here |
| Paragraph 2 text here |
| Paragraph 3 text here |
```

## Authoring

### Basic Structure
- Each row in the table becomes a numbered item (numbered variant only)
- Paragraphs within items are preserved
- Lists (ul/ol) within items are supported

### Example with Lists

```
| Longform (numbered) |
| First item text |
| Second item text |
| Item with a list: - Point 1 - Point 2 - Point 3 |
```

### Typography
- **Numbers**: 28px, Adobe Clean (numbered variant)
- **Body text**: 20px, Adobe Clean, 1.5 line height
- **Bold text**: Use **bold** or __bold__ in markdown

### Styling
- Top border on the entire block
- Bottom border on each numbered item
- Padding: 24px vertical spacing between items
- Border color: `var(--c1-content-divider-400, #b6b6b6)`

## Design Reference

Based on Consonant Design System:
- Numbers: C1/Body/XXL/Regular (28px)
- Body text: C1/Body/L/Regular (20px)
