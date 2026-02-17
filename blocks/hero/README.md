# Hero Block

Creates prominent hero sections with images, headings, and call-to-action buttons.

## Features

- **Flexible layouts**: Supports overlay, stack, and split-view variations
- **Background support**: Images or videos
- **Responsive design**: Automatically adapts to mobile devices
- **Multiple size options**: Small, default, large, and full viewport height
- **Breadcrumb support**: Optional navigation breadcrumbs
- **CTA buttons**: Integrated call-to-action support

## Basic Usage

### Hero with Background Image

```
| Background | Content |
|------------|---------|
| ![Hero Image](image.jpg) | **Breadcrumb Text**<br><br>## Hero Heading<br><br>Hero body text goes here.<br><br>[Call to Action](#) |
```

The first row is the background (image or video), and the second row is the foreground content.

### Content Only Hero

```
| Content |
|---------|
| ## Hero Heading<br><br>Hero body text goes here.<br><br>[Call to Action](#) |
```

## Size Variations

### Small Hero
Add class: `small` (min-height: 180px)

### Large Hero
Add class: `large` (min-height: 560px)

### Full Height Hero
Add class: `full` (fills viewport height minus header)

## Layout Variations

### Split View

Add class: `split-view`

Creates a 50-50 layout with content on the left and an image on the right. The hero includes a background image pattern.

**Usage:**
```
Hero (split-view)
| Content | Image |
|---------|-------|
| **< Back Link**<br><br>## Hero Heading<br><br>**Label:** Value<br>**Label:** Value<br><br>Description text<br><br>[Call to Action](#) | ![Product Image](image.jpg) |
```

**Features:**
- Automatic background pattern (use-case-background-image.png)
- Content column on left
- Image column on right with rounded corners and shadow
- Heading with red border outline
- Responsive: stacks on mobile with image first

### Stack Layout

Add class: `stack`

Stacks background and foreground vertically instead of overlaying them.

### Center Aligned

Add class: `center`

Centers all content horizontally.

### Constrained Width

Add class: `constrained`

Limits content width to 500px maximum.

## Color Variations

### Light Theme
Add class: `light` - Uses light gradient overlay, dark text

### Dark Theme
Add class: `dark` - Uses dark gradient overlay, light text (default)

## Content Structure

The hero block automatically detects and styles content:

1. **Breadcrumb**: Paragraph before the first heading becomes `.hero-breadcrumb`
   - Links in breadcrumbs automatically get a left chevron icon
   
2. **Heading**: First h1-h6 becomes `.hero-heading`
   - Uses HEX Franklin MLB Condensed font
   - Large, bold styling

3. **Body Text**: Paragraphs after heading become `.hero-body`
   - Larger font size for readability

4. **Buttons**: Paragraph containing only a link becomes a button
   - Styled with `.button` and `.hero-button` classes
   - Automatically includes right chevron icon

## Background Options

### Image Background

```
| ![Background Image](image.jpg) |
```

### Video Background

```
| [Video Link](video.mp4) |
```

Links to .mp4 files automatically convert to inline video elements with autoplay and loop.

### Image Focal Point

Control where the image focuses using data-focal in the image title:

```
| ![Image | data-focal: 75,25](image.jpg) |
```

Values are percentages (x, y) from top-left.

## Text Positioning

The hero automatically adds classes based on content column position:

- First column with text: `.hero-text-start` - Image focuses left
- Second column with text: `.hero-text-end` - Image focuses right

## Responsive Behavior

- **Desktop** (600px+): 
  - Split-view shows 50-50 layout
  - Stack variation separates background/foreground
  - Grid layout for multi-column content

- **Mobile** (<600px):
  - Always stacks content vertically
  - Split-view shows image first, then content
  - Full-width layout

## Examples

### Use Case Hero (Split View)

```
Hero (split-view)
| Content | Image |
|---------|-------|
| **< RETURN TO USE CASE LIBRARY**<br><br>## BALLPARK CHECK IN<br><br>**Activation Timing:** Three (3) Business Days<br>**Fan Journey Stage:** In-Venue<br><br>Fan receives push notification via MLB Ballpark app...<br><br>[Request this use case >](#) | ![Check In](ballpark-checkin.jpg) |
```

### Full-Screen Hero with Video

```
Hero (full, center)
| Background | Content |
|------------|---------|
| [Hero Video](hero-video.mp4) | ## Welcome to MLB<br><br>Experience the game like never before.<br><br>[Get Started](#) |
```

### Simple Hero with Breadcrumb

```
Hero (large)
| Background | Content |
|------------|---------|
| ![Stadium](stadium.jpg) | **Home / News / Articles**<br><br>## Breaking News<br><br>Latest updates from around the league. |
```
