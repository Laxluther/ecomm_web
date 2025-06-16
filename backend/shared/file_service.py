import os
import uuid
from PIL import Image, ImageOps
from werkzeug.utils import secure_filename
from flask import current_app
from .image_utils import get_base_url

class FileService:
    def __init__(self):
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        self.max_file_size = 16 * 1024 * 1024
        self.image_sizes = {
            'thumbnail': (150, 150),
            'small': (300, 300),
            'medium': (600, 600),
            'large': (1200, 1200),
            'original': None
        }
    
    def allowed_file(self, filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def validate_file(self, file):
        if not file or file.filename == '':
            return False, "No file selected"
        
        if not self.allowed_file(file.filename):
            return False, f"File type not allowed. Allowed: {', '.join(self.allowed_extensions)}"
        
        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        
        if size > self.max_file_size:
            return False, f"File too large. Max: {self.max_file_size // (1024*1024)}MB"
        
        return True, "Valid file"
    
    def generate_filename(self, original_filename, folder_type='products'):
        filename = secure_filename(original_filename)
        name, ext = os.path.splitext(filename)
        unique_id = uuid.uuid4().hex[:8]
        return f"{folder_type}_{name}_{unique_id}{ext}"
    
    def create_folders(self, folder_type='products'):
        upload_folder = current_app.config['UPLOAD_FOLDER']
        folders = [
            os.path.join(upload_folder, folder_type),
            os.path.join(upload_folder, folder_type, 'thumbnail'),
            os.path.join(upload_folder, folder_type, 'small'),
            os.path.join(upload_folder, folder_type, 'medium'),
            os.path.join(upload_folder, folder_type, 'large'),
            os.path.join(upload_folder, folder_type, 'original')
        ]
        
        for folder in folders:
            os.makedirs(folder, exist_ok=True)
    
    def optimize_image(self, image_path, quality=85):
        with Image.open(image_path) as img:
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            img = ImageOps.exif_transpose(img)
            img.save(image_path, 'JPEG', optimize=True, quality=quality)
    
    def create_variants(self, original_path, folder_type='products'):
        base_name = os.path.splitext(os.path.basename(original_path))[0]
        upload_folder = current_app.config['UPLOAD_FOLDER']
        base_url = get_base_url()
        variants = {}
        
        with Image.open(original_path) as img:
            img = ImageOps.exif_transpose(img)
            
            for size_name, dimensions in self.image_sizes.items():
                if size_name == 'original':
                    continue
                
                variant_img = img.copy()
                if dimensions:
                    variant_img.thumbnail(dimensions, Image.Resampling.LANCZOS)
                
                if variant_img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', variant_img.size, (255, 255, 255))
                    if variant_img.mode == 'P':
                        variant_img = variant_img.convert('RGBA')
                    rgb_img.paste(variant_img, mask=variant_img.split()[-1] if variant_img.mode == 'RGBA' else None)
                    variant_img = rgb_img
                
                variant_path = os.path.join(upload_folder, folder_type, size_name, f"{base_name}.jpg")
                variant_img.save(variant_path, 'JPEG', optimize=True, quality=85)
                # Generate absolute URL
                variants[size_name] = f"{base_url}/static/uploads/{folder_type}/{size_name}/{base_name}.jpg"
        
        return variants
    
    def save_image(self, file, folder_type='products', create_variants=True):
        is_valid, message = self.validate_file(file)
        if not is_valid:
            return None, message
        
        self.create_folders(folder_type)
        filename = self.generate_filename(file.filename, folder_type)
        
        upload_folder = current_app.config['UPLOAD_FOLDER']
        original_folder = os.path.join(upload_folder, folder_type, 'original')
        original_path = os.path.join(original_folder, filename)
        
        file.save(original_path)
        self.optimize_image(original_path)
        
        base_url = get_base_url()
        variants = {}
        if create_variants:
            variants = self.create_variants(original_path, folder_type)
        
        # Generate absolute URLs
        main_url = variants.get('medium', f"{base_url}/static/uploads/{folder_type}/original/{filename}")
        original_url = f"{base_url}/static/uploads/{folder_type}/original/{filename}"
        
        return {
            'main_url': main_url,
            'original_url': original_url,
            'variants': variants,
            'filename': filename
        }, "Image uploaded successfully"
    
    def delete_image(self, image_url, folder_type='products'):
        if not image_url:
            return
        
        upload_folder = current_app.config['UPLOAD_FOLDER']
        
        # Handle both relative and absolute URLs
        if image_url.startswith('http'):
            # Extract relative path from absolute URL
            path_start = image_url.find('/static/uploads/')
            if path_start != -1:
                relative_path = image_url[path_start + len('/static/uploads/'):]
            else:
                return
        elif image_url.startswith('/static/uploads/'):
            relative_path = image_url.replace('/static/uploads/', '')
        else:
            return
        
        path_parts = relative_path.split('/')
        
        if len(path_parts) >= 2:
            filename = path_parts[-1]
            base_name = os.path.splitext(filename)[0]
            
            for size_name in self.image_sizes.keys():
                if size_name == 'original':
                    variant_path = os.path.join(upload_folder, folder_type, 'original', filename)
                else:
                    variant_path = os.path.join(upload_folder, folder_type, size_name, f"{base_name}.jpg")
                
                if os.path.exists(variant_path):
                    os.remove(variant_path)

file_service = FileService()