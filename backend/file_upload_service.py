"""
Complete File Upload and Image Management Service
Handles image uploads, resizing, thumbnails, and file management
"""

import os
import uuid
from PIL import Image, ImageOps
from werkzeug.utils import secure_filename
from flask import current_app
import mimetypes

class FileUploadService:
    def __init__(self):
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
        self.max_file_size = 16 * 1024 * 1024  # 16MB
        
        # Image sizes for different use cases
        self.image_sizes = {
            'thumbnail': (150, 150),
            'small': (300, 300),
            'medium': (600, 600),
            'large': (1200, 1200),
            'original': None
        }
    
    def allowed_file(self, filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def get_file_size(self, file):
        """Get file size"""
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)  # Seek back to beginning
        return size
    
    def validate_file(self, file):
        """Validate uploaded file"""
        if not file or file.filename == '':
            return False, "No file selected"
        
        if not self.allowed_file(file.filename):
            return False, f"File type not allowed. Allowed types: {', '.join(self.allowed_extensions)}"
        
        file_size = self.get_file_size(file)
        if file_size > self.max_file_size:
            return False, f"File too large. Maximum size: {self.max_file_size // (1024*1024)}MB"
        
        return True, "File is valid"
    
    def generate_filename(self, original_filename, folder_type='products'):
        """Generate unique filename"""
        filename = secure_filename(original_filename)
        name, ext = os.path.splitext(filename)
        
        # Clean the name
        name = name[:50]  # Limit length
        unique_id = uuid.uuid4().hex[:8]
        
        return f"{folder_type}_{name}_{unique_id}{ext}"
    
    def create_folder_structure(self, folder_type='products'):
        """Create folder structure for uploads"""
        upload_folder = current_app.config['UPLOAD_FOLDER']
        
        folders = [
            os.path.join(upload_folder, folder_type),
            os.path.join(upload_folder, folder_type, 'thumbnails'),
            os.path.join(upload_folder, folder_type, 'small'),
            os.path.join(upload_folder, folder_type, 'medium'),
            os.path.join(upload_folder, folder_type, 'large'),
            os.path.join(upload_folder, folder_type, 'original')
        ]
        
        for folder in folders:
            os.makedirs(folder, exist_ok=True)
    
    def optimize_image(self, image_path, quality=85):
        """Optimize image for web"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = rgb_img
                
                # Auto-orient based on EXIF data
                img = ImageOps.exif_transpose(img)
                
                # Save optimized
                img.save(image_path, 'JPEG', optimize=True, quality=quality)
        except Exception as e:
            print(f"Error optimizing image: {e}")
    
    def create_image_variants(self, original_path, folder_type='products'):
        """Create different sized variants of an image"""
        base_name = os.path.splitext(os.path.basename(original_path))[0]
        upload_folder = current_app.config['UPLOAD_FOLDER']
        
        variants = {}
        
        try:
            with Image.open(original_path) as img:
                # Auto-orient based on EXIF data
                img = ImageOps.exif_transpose(img)
                
                for size_name, dimensions in self.image_sizes.items():
                    if size_name == 'original':
                        continue
                    
                    # Create sized version
                    variant_img = img.copy()
                    
                    if dimensions:
                        # Resize maintaining aspect ratio
                        variant_img.thumbnail(dimensions, Image.Resampling.LANCZOS)
                    
                    # Convert to RGB if necessary
                    if variant_img.mode in ('RGBA', 'LA', 'P'):
                        rgb_img = Image.new('RGB', variant_img.size, (255, 255, 255))
                        if variant_img.mode == 'P':
                            variant_img = variant_img.convert('RGBA')
                        rgb_img.paste(variant_img, mask=variant_img.split()[-1] if variant_img.mode == 'RGBA' else None)
                        variant_img = rgb_img
                    
                    # Save variant
                    variant_path = os.path.join(upload_folder, folder_type, size_name, f"{base_name}.jpg")
                    variant_img.save(variant_path, 'JPEG', optimize=True, quality=85)
                    
                    # Store relative URL
                    variants[size_name] = f"/static/uploads/{folder_type}/{size_name}/{base_name}.jpg"
        
        except Exception as e:
            print(f"Error creating image variants: {e}")
        
        return variants
    
    def save_image(self, file, folder_type='products', create_variants=True):
        """Save image with variants"""
        # Validate file
        is_valid, message = self.validate_file(file)
        if not is_valid:
            return None, message
        
        # Create folder structure
        self.create_folder_structure(folder_type)
        
        # Generate filename
        filename = self.generate_filename(file.filename, folder_type)
        
        # Paths
        upload_folder = current_app.config['UPLOAD_FOLDER']
        original_folder = os.path.join(upload_folder, folder_type, 'original')
        original_path = os.path.join(original_folder, filename)
        
        try:
            # Save original file
            file.save(original_path)
            
            # Optimize original
            self.optimize_image(original_path)
            
            # Create variants
            variants = {}
            if create_variants:
                variants = self.create_image_variants(original_path, folder_type)
            
            # Main URL (medium size or original)
            main_url = variants.get('medium', f"/static/uploads/{folder_type}/original/{filename}")
            
            return {
                'main_url': main_url,
                'original_url': f"/static/uploads/{folder_type}/original/{filename}",
                'variants': variants,
                'filename': filename
            }, "Image uploaded successfully"
        
        except Exception as e:
            return None, f"Failed to save image: {str(e)}"
    
    def delete_image(self, image_url, folder_type='products'):
        """Delete image and all its variants"""
        if not image_url:
            return
        
        try:
            upload_folder = current_app.config['UPLOAD_FOLDER']
            
            # Extract filename from URL
            if image_url.startswith('/static/uploads/'):
                relative_path = image_url.replace('/static/uploads/', '')
                
                # Try to extract filename from different possible paths
                path_parts = relative_path.split('/')
                if len(path_parts) >= 2:
                    filename = path_parts[-1]
                    base_name = os.path.splitext(filename)[0]
                    
                    # Delete all variants
                    for size_name in self.image_sizes.keys():
                        if size_name == 'original':
                            variant_path = os.path.join(upload_folder, folder_type, 'original', filename)
                        else:
                            variant_path = os.path.join(upload_folder, folder_type, size_name, f"{base_name}.jpg")
                        
                        if os.path.exists(variant_path):
                            os.remove(variant_path)
                            print(f"Deleted: {variant_path}")
        
        except Exception as e:
            print(f"Error deleting image: {e}")
    
    def get_image_info(self, image_path):
        """Get image information"""
        try:
            with Image.open(image_path) as img:
                return {
                    'size': img.size,
                    'format': img.format,
                    'mode': img.mode,
                    'file_size': os.path.getsize(image_path)
                }
        except Exception as e:
            return None

# Global file upload service instance
file_upload_service = FileUploadService()