# Icon Generation Instructions

Since the automated icon generation is temporarily unavailable, you can generate app icons using one of these methods:

## Option 1: Use an Online Icon Generator

1. Visit [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) or [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload a logo or design with these specifications:
   - **Design**: Omani Riyal symbol (ر.ع.) or coin icon
   - **Colors**: Blue (#3B82F6) background with white symbol
   - **Style**: Flat, modern, minimalist
   - **Size**: At least 512x512px
3. Generate all required sizes
4. Download and place in `/icons/` directory

## Option 2: Use Figma/Canva

1. Create a 512x512px square design
2. Add the Omani Riyal symbol or a coin icon
3. Use gradient background (blue to light blue)
4. Export as PNG in these sizes:
   - 72x72, 96x96, 120x120, 128x128, 144x144, 152x152
   - 167x167, 180x180, 192x192, 384x384, 512x512

## Option 3: Simple SVG Placeholder

Create a simple SVG icon and convert to PNG:

```svg
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#60A5FA;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <text x="256" y="320" font-family="Arial" font-size="200" font-weight="bold" 
        fill="white" text-anchor="middle">ر.ع.</text>
</svg>
```

## Required Icon Sizes

Place generated icons in `/icons/` directory:
- icon-72x72.png
- icon-96x96.png
- icon-120x120.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-167x167.png
- icon-180x180.png (Apple Touch Icon)
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## iOS Splash Screens (Optional)

For a complete iOS PWA experience, generate splash screens:
- 640x1136 (iPhone SE, 5s)
- 750x1334 (iPhone 8, 7, 6s)
- 1125x2436 (iPhone X, XS, 11 Pro)
- 1242x2208 (iPhone 8+, 7+, 6s+)
- 1242x2688 (iPhone XS Max, 11 Pro Max)
- 828x1792 (iPhone 11, XR)
- 1170x2532 (iPhone 12/13/14 Pro)
- 1284x2778 (iPhone 14 Pro Max)

Place in `/icons/splash/` directory.

## Note

The app will work perfectly without custom icons - browsers will use default icons. However, custom icons improve the user experience when installing the PWA.
