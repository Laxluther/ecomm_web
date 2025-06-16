

import os
import shutil
import subprocess

def create_placeholder_images():
    """Create placeholder images for development/testing"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        print("📸 Creating placeholder images...")
        upload_dir = "./static/uploads"
        
        # All images referenced in your database
        images_to_create = [
            # Honey products
            ("products/honey/himalayan-honey-1.jpg", "Himalayan Honey"),
            ("products/honey/himalayan-honey-2.jpg", "Himalayan Honey 2"),
            ("products/honey/himalayan-honey-3.jpg", "Himalayan Honey 3"),
            ("products/honey/manuka-honey-1.jpg", "Manuka Honey"),
            ("products/honey/manuka-honey-2.jpg", "Manuka Honey 2"),
            ("products/honey/manuka-honey-3.jpg", "Manuka Honey 3"),
            ("products/honey/raw-forest-honey-1.jpg", "Raw Forest Honey"),
            ("products/honey/raw-forest-honey-2.jpg", "Raw Forest Honey 2"),
            ("products/honey/raw-forest-honey-3.jpg", "Raw Forest Honey 3"),
            ("products/honey/wildflower-honey-1.jpg", "Wildflower Honey"),
            ("products/honey/wildflower-honey-2.jpg", "Wildflower Honey 2"),
            ("products/honey/eucalyptus-honey-1.jpg", "Eucalyptus Honey"),
            ("products/honey/eucalyptus-honey-2.jpg", "Eucalyptus Honey 2"),
            
            # Coffee products
            ("products/coffee/blue-mountain-1.jpg", "Blue Mountain Coffee"),
            ("products/coffee/blue-mountain-2.jpg", "Blue Mountain Coffee 2"),
            ("products/coffee/espresso-blend-1.jpg", "Espresso Blend"),
            ("products/coffee/espresso-blend-2.jpg", "Espresso Blend 2"),
            ("products/coffee/arabica-beans-1.jpg", "Arabica Beans"),
            ("products/coffee/arabica-beans-2.jpg", "Arabica Beans 2"),
            ("products/coffee/arabica-beans-3.jpg", "Arabica Beans 3"),
            ("products/coffee/filter-coffee-1.jpg", "Filter Coffee"),
            ("products/coffee/filter-coffee-2.jpg", "Filter Coffee 2"),
            ("products/coffee/ethiopian-coffee-1.jpg", "Ethiopian Coffee"),
            ("products/coffee/ethiopian-coffee-2.jpg", "Ethiopian Coffee 2"),
            
            # Nuts products
            ("products/nuts/kashmiri-walnuts-1.jpg", "Kashmiri Walnuts"),
            ("products/nuts/kashmiri-walnuts-2.jpg", "Kashmiri Walnuts 2"),
            ("products/nuts/mixed-dry-fruits-1.jpg", "Mixed Dry Fruits"),
            ("products/nuts/mixed-dry-fruits-2.jpg", "Mixed Dry Fruits 2"),
            ("products/nuts/mixed-dry-fruits-3.jpg", "Mixed Dry Fruits 3"),
            ("products/nuts/california-almonds-1.jpg", "California Almonds"),
            ("products/nuts/california-almonds-2.jpg", "California Almonds 2"),
            ("products/nuts/california-almonds-3.jpg", "California Almonds 3"),
            ("products/nuts/roasted-cashews-1.jpg", "Roasted Cashews"),
            ("products/nuts/roasted-cashews-2.jpg", "Roasted Cashews 2"),
            ("products/nuts/afghani-figs-1.jpg", "Afghani Figs"),
            ("products/nuts/afghani-figs-2.jpg", "Afghani Figs 2"),
            
            # Seeds products
            ("products/seeds/chia-seeds-1.jpg", "Chia Seeds"),
            ("products/seeds/chia-seeds-2.jpg", "Chia Seeds 2"),
            ("products/seeds/chia-seeds-3.jpg", "Chia Seeds 3"),
            ("products/seeds/flax-seeds-1.jpg", "Flax Seeds"),
            ("products/seeds/flax-seeds-2.jpg", "Flax Seeds 2"),
            ("products/seeds/pumpkin-seeds-1.jpg", "Pumpkin Seeds"),
            ("products/seeds/pumpkin-seeds-2.jpg", "Pumpkin Seeds 2"),
            ("products/seeds/sunflower-seeds-1.jpg", "Sunflower Seeds"),
            ("products/seeds/sunflower-seeds-2.jpg", "Sunflower Seeds 2"),
            ("products/seeds/hemp-hearts-1.jpg", "Hemp Hearts"),
            ("products/seeds/hemp-hearts-2.jpg", "Hemp Hearts 2"),
        ]
        
        for relative_path, text in images_to_create:
            full_path = os.path.join(upload_dir, relative_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Create colorful placeholder image
            colors = [(255, 182, 193), (173, 216, 230), (144, 238, 144), (255, 218, 185), (221, 160, 221)]
            bg_color = colors[hash(text) % len(colors)]
            
            img = Image.new('RGB', (600, 600), bg_color)
            draw = ImageDraw.Draw(img)
            
            # Add text
            try:
                font = ImageFont.truetype("arial.ttf", 32)
            except:
                try:
                    font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 32)
                except:
                    font = ImageFont.load_default()
            
            # Multi-line text
            lines = []
            words = text.split()
            current_line = []
            for word in words:
                current_line.append(word)
                line_text = ' '.join(current_line)
                bbox = draw.textbbox((0, 0), line_text, font=font)
                if bbox[2] - bbox[0] > 500:  # Max width
                    if len(current_line) > 1:
                        current_line.pop()
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(line_text)
                        current_line = []
            if current_line:
                lines.append(' '.join(current_line))
            
            # Draw lines
            total_height = len(lines) * 40
            start_y = (600 - total_height) // 2
            
            for i, line in enumerate(lines):
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
                x = (600 - text_width) // 2
                y = start_y + i * 40
                draw.text((x, y), line, font=font, fill=(80, 80, 80))
            
            img.save(full_path, 'JPEG', quality=85)
            
        print(f"✅ Created {len(images_to_create)} placeholder images")
        
    except ImportError:
        print("⚠️ PIL not available. Install with: pip install Pillow")
        print("   You can still continue without placeholder images")

def check_requirements():
    """Check if required files exist"""
    print("🔍 Checking requirements...")
    
    required_files = ['main.py', 'config.py', 'schema.sql']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        print("   Please run this script from the backend directory")
        return False
    
    print("✅ All required files found")
    return True

def create_directory_structure():
    """Create necessary directory structure"""
    print("📁 Creating directory structure...")
    
    directories = [
        "static",
        "static/uploads",
        "static/uploads/products",
        "static/uploads/products/honey",
        "static/uploads/products/coffee", 
        "static/uploads/products/nuts",
        "static/uploads/products/seeds",
        "shared",
        "admin",
        "user"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        
    print("✅ Directory structure created")

def update_env_file():
    """Update .env file with backend URL"""
    print("📝 Updating .env file...")
    
    env_file = ".env"
    backend_url_line = "BACKEND_BASE_URL=http://localhost:5000"
    
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            content = f.read()
        
        if 'BACKEND_BASE_URL' not in content:
            with open(env_file, 'a') as f:
                f.write(f"\n# Backend URL for image serving\n{backend_url_line}\n")
            print("✅ Added BACKEND_BASE_URL to .env file")
        else:
            print("ℹ️ BACKEND_BASE_URL already exists in .env file")
    else:
        print("⚠️ .env file not found. Please ensure it exists with your database configuration")

def main():
    print("🚀 COMPLETE ECOMMERCE IMAGE SERVING SETUP")
    print("=" * 60)
    print("This script sets up the INDUSTRY STANDARD backend-only solution")
    print("that will work for ALL operations (admin, user, add, remove, etc.)")
    print("=" * 60)
    
    # Step 1: Check requirements
    if not check_requirements():
        return
    
    # Step 2: Create directories
    create_directory_structure()
    
    # Step 3: Update .env
    update_env_file()
    
    # Step 4: Create placeholder images
    create_placeholder_images()
    
    print("\n" + "=" * 60)
    print("🎉 SETUP COMPLETE!")
    print("=" * 60)
    
    print("\n📋 FILES TO UPDATE MANUALLY:")
    print("1. Replace backend/shared/file_service.py with the updated version")
    print("2. Create backend/shared/image_utils.py with the utility functions")
    print("3. Update backend/main.py with static file serving")
    print("4. Update backend/shared/routes.py with image conversion")
    print("5. Update backend/admin/routes.py with image conversion")
    print("6. Update backend/user/routes.py with image conversion")
    
    print("\n🔄 RESTART INSTRUCTIONS:")
    print("1. Stop your Flask backend (Ctrl+C)")
    print("2. Start it again: python main.py")
    print("3. Test image loading: http://localhost:5000/static/uploads/products/honey/himalayan-honey-1.jpg")
    
    print("\n✅ HOW THIS SOLUTION WORKS:")
    print("• Database keeps relative URLs: /static/uploads/products/...")
    print("• Backend converts to absolute URLs: http://localhost:5000/static/uploads/...")
    print("• Frontend receives absolute URLs and displays correctly")
    print("• No frontend changes needed!")
    print("• Works for ALL operations: admin add/edit/delete, user browsing, etc.")
    
    print("\n🌟 FOR PRODUCTION:")
    print("• Change BACKEND_BASE_URL in .env to your production domain")
    print("• Example: BACKEND_BASE_URL=https://api.yourdomain.com")
    print("• That's it! Your images will work in production automatically")
    
    print("\n🏆 BENEFITS OF THIS APPROACH:")
    print("✅ Industry standard practice")
    print("✅ Database stays portable (relative URLs)")
    print("✅ Easy to change domains/CDNs")
    print("✅ Works with multiple frontends (web, mobile)")
    print("✅ No frontend changes required")
    print("✅ Automatic URL conversion in all API responses")
    print("✅ Production ready")
    
    print("\n💡 WHAT TO TEST:")
    print("1. Backend API endpoints return absolute image URLs")
    print("2. Admin can upload/delete images successfully")
    print("3. Frontend displays images correctly")
    print("4. Image uploads via admin panel work")
    print("5. Product images show in user catalog")
    
    print("\n🎯 THIS IS THE RIGHT APPROACH for your ecommerce site!")
    print("   It's scalable, maintainable, and follows best practices.")

if __name__ == "__main__":
    main()