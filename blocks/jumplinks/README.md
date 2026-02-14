# Jumplinks Block

A navigation block that loads a fragment containing navigation items and displays the current page's headings within the navigation structure.

## Features

- **Fragment-Based Navigation**: Loads navigation structure from a fragment
- **Smart Page Detection**: Automatically identifies and expands the current page in the navigation
- **Section Detection**: Shows all h1, h2, and h3 headings under the current page item
- **Active State Tracking**: Highlights the current section as the user scrolls with a blue accent line
- **Smooth Scrolling**: Provides smooth scroll behavior when clicking on section links
- **Sticky Positioning**: Stays visible while scrolling (on desktop)
- **Two-Column Layout**: Automatically creates a 1/3 + 2/3 column layout with jumplinks on the left and content on the right
- **Responsive Design**: Adapts to mobile devices with single-column layout
- **Accessibility**: Includes proper ARIA labels and keyboard navigation support
- **External Link Indicators**: Shows arrows (→) for links to other pages

## Usage

### In Your Document

Add the jumplinks block with a path to a navigation fragment. You can use either plain text or a link:

**Option 1: Plain text path (recommended)**
```
|Jumplinks|
|---------|
|/fragments/page-nav/resources|
```

**Option 2: Link**
```
|Jumplinks|
|---------|
|[Navigation](/fragments/page-nav/resources)|
```

Both relative paths (`/fragments/...`) and full URLs are supported.

### Fragment Structure

Create a navigation fragment with this structure (no heading needed):

```html
<ul>
  <li><a href="/page1">Page 1 Title</a></li>
  <li>
    <a href="/page2">Page 2 Title</a>
    <ul>
      <li><a href="/page2/sub1">Sub Page 1</a></li>
      <li><a href="/page2/sub2">Sub Page 2</a></li>
    </ul>
  </li>
  <li><a href="/page3">Page 3 Title</a></li>
</ul>
```

### How It Works

1. The block loads the specified fragment
2. Fetches the title from placeholders (key: `jumpToSection`)
3. Extracts the navigation structure (ul/li with links)
4. Matches navigation links against the current page URL
5. For the matching page:
   - Marks it with bold styling
   - Expands to show all h1-h3 headings from the current page
   - Enables scroll-spy for heading links
6. Other pages display with arrow indicators (→)

### Authoring Notes

- **Place the jumplinks block in the first section** to create a 2-column layout
- The section containing jumplinks will take 1/3 of the page width (left column)
- All other sections will flow in the right column taking 2/3 of the page width
- The fragment should contain a heading (for the title) and a ul (for navigation)
- Navigation can be nested for hierarchical structures
- On mobile devices (< 900px), the layout becomes single-column with jumplinks at the top

### Layout Behavior

When a jumplinks block is present on the page:

**Desktop (≥ 900px)**
- Main content area uses a 2-column grid layout (1fr : 2fr ratio = 33% : 67%)
- Section containing jumplinks stays in the left column with sticky positioning
- All other sections flow in the right column
- Jumplinks scrolls independently if content exceeds viewport height

**Mobile (< 900px)**
- Single-column layout
- Jumplinks appears at the top as a standard block
- All sections stack vertically below

## Customization

### Title

The "Jump to Section" title comes from placeholders. Add this to your `placeholders.json`:

```json
{
  "data": [
    {
      "Key": "jump to section",
      "Text": "JUMP TO SECTION"
    }
  ]
}
```

The text will be automatically converted to uppercase when displayed.

### Multi-language Support

For multi-language sites:

1. Create language-specific placeholder files:
   - `/en/placeholders.json` - English
   - `/de/placeholders.json` - German (e.g., "Text": "ZUM ABSCHNITT SPRINGEN")
   - `/es/placeholders.json` - Spanish (e.g., "Text": "IR A LA SECCIÓN")

2. Create separate navigation fragments for each language:
   - `/en/fragments/page-nav/resources`
   - `/de/fragments/page-nav/resources`
   - `/es/fragments/page-nav/resources`

The block will automatically use the correct placeholder based on your site's locale configuration.

## Styling

The block uses the following CSS custom properties and can be customized:

- `--spacing-l`: Large spacing (default: 24px)
- `--spacing-m`: Medium spacing (default: 16px)
- `--heading-font-size-xs`: Extra small heading font size
- `--mlb-text-color`: Default text color

Active links are styled with:
- Blue text color: `#0066cc`
- Blue left accent bar with scale animation

## Technical Details

### JavaScript Functionality

- **Scroll Spy**: Uses `requestAnimationFrame` for performant scroll tracking
- **Smooth Scrolling**: Uses native `scrollIntoView` with smooth behavior
- **ID Generation**: Creates URL-friendly IDs from heading text
- **Offset**: Uses a 100px offset to account for fixed headers

### CSS Features

- Sticky positioning with `position: sticky; top: 100px`
- Smooth transitions for active state changes
- Respects `prefers-reduced-motion` for accessibility
- Print styles hide the block for cleaner printouts

## Browser Support

- Modern browsers with ES6+ support
- Smooth scroll behavior may fall back to instant scroll in older browsers
- Sticky positioning requires CSS Sticky support (IE11 not supported)

## Example

See `/drafts/jumplinks-demo.html` for a working example of the jumplinks block in action.

## Performance

- Lightweight with minimal JavaScript
- Uses passive event listeners for scroll tracking
- Debounced scroll updates with requestAnimationFrame
- No external dependencies
