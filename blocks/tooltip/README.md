# Tooltip Block

A compact card component that displays optional image with text content, perfect for tool tips, feature highlights, or informational cards.

## Design Reference
- Figma: [Tooltip Component](https://www.figma.com/design/G2UB1i84COcBzNUHNgDjj1/MLB-Microsite-Working-File?node-id=21910-219941&m=dev)
- Design System: C1/Horizontal Card

## Authoring

### Basic Structure (Image + Text)

| Tooltip |
|---------|
| ![image.jpg](image.jpg) |
| Tool Tip |
| Lorem ipsum |

### Text Only (No Image)

| Tooltip |
|---------|
| Tool Tip |
| Lorem ipsum |

### Single Line Text

| Tooltip |
|---------|
| ![image.jpg](image.jpg) |
| Lorem ipsum |

## Styling Rules

### Two Paragraphs
- **First paragraph**: Body text (14px, regular weight, 1.5 line height)
- **Second paragraph**: Heading text (18px, bold weight, 1.25 line height)

### One Paragraph
- Uses heading style (18px, bold weight, 1.25 line height)

### Image
- **Optional**: If no image is provided, the block displays text-only
- **Desktop size**: 115px width × 130px height
- **Mobile**: Full width, 200px height
- Image automatically crops/scales to fit using `object-fit: cover`

## Layout

### Desktop (≥600px)
- Horizontal layout: image on left, text on right
- Fixed image width: 115px
- Text padding: 24px
- Min height: 130px

### Mobile (<600px)
- Vertical layout: image on top, text below
- Image: full width, 200px height
- Text padding: 16px

## Styling Details

- **Border**: 1px solid #e8e8e8
- **Border radius**: 4px
- **Background**: White (light mode)
- **Text color**: #2c2c2c
- **Font**: Adobe Clean

## Examples

### Feature Highlight
```
| Tooltip |
| ![analytics-icon.png](analytics-icon.png) |
| ANALYTICS |
| Real-time Insights |
```

### Info Card
```
| Tooltip |
| QUICK TIP |
| Use keyboard shortcuts to navigate faster |
```

### Tool Description
```
| Tooltip |
| ![tool-screenshot.jpg](tool-screenshot.jpg) |
| Segmentation Tool |
```

## Accessibility

- Ensure image alt text is descriptive
- Heading text is limited to 4 lines (will ellipsize)
- High contrast ratio for text readability
- Responsive layout adapts to screen size
