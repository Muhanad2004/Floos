"""
Generate PNG icons from SVG for Floos app
Requires: pip install cairosvg pillow
"""
import os
try:
    from cairosvg import svg2png
    from PIL import Image
    import io
    
    # Icon sizes needed
    sizes = [72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512]
    
    # Read SVG
    svg_path = 'icons/logo.svg'
    with open(svg_path, 'r') as f:
        svg_data = f.read()
    
    # Generate each size
    for size in sizes:
        # Convert SVG to PNG at target size
        png_data = svg2png(bytestring=svg_data.encode('utf-8'), 
                          output_width=size, 
                          output_height=size)
        
        # Save PNG
        output_path = f'icons/icon-{size}x{size}.png'
        with open(output_path, 'wb') as f:
            f.write(png_data)
        
        print(f'✓ Generated {output_path}')
    
    print(f'\n✅ Successfully generated {len(sizes)} icon sizes!')
    
except ImportError as e:
    print('❌ Missing required packages.')
    print('Please install: pip install cairosvg pillow')
    print('\nOr use an online converter:')
    print('1. Visit https://www.pwabuilder.com/imageGenerator')
    print('2. Upload icons/logo.svg')
    print('3. Download generated icons')
    print('4. Place in icons/ directory')
