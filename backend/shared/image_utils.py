import os
from flask import request

def get_base_url():
    """Get the base URL for the backend server"""
    # Production: Use environment variable
    base_url = os.environ.get('BACKEND_BASE_URL')
    if base_url:
        return base_url.rstrip('/')
    
    # Development: Auto-detect from request
    if request:
        return f"{request.scheme}://{request.host}"
    
    # Fallback
    return "http://localhost:5000"

def convert_image_url(image_url):
    """Convert relative image URL to absolute URL"""
    if not image_url:
        return image_url
    
    # If already absolute URL, return as is
    if image_url.startswith('http'):
        return image_url
    
    # Convert relative URL to absolute
    if image_url.startswith('/static/uploads/'):
        base_url = get_base_url()
        return f"{base_url}{image_url}"
    
    return image_url

def convert_product_images(product):
    """Convert all image URLs in a product dict to absolute URLs"""
    if not product:
        return product
    
    # Convert primary image
    if 'primary_image' in product:
        product['primary_image'] = convert_image_url(product['primary_image'])
    
    # Convert image_url (for single image)
    if 'image_url' in product:
        product['image_url'] = convert_image_url(product['image_url'])
    
    # Convert images array (for multiple images)
    if 'images' in product and isinstance(product['images'], list):
        for img in product['images']:
            if isinstance(img, dict) and 'image_url' in img:
                img['image_url'] = convert_image_url(img['image_url'])
    
    return product

def convert_products_images(products):
    """Convert image URLs for a list of products"""
    if not products:
        return products
    
    for product in products:
        convert_product_images(product)
    
    return products

def convert_category_images(categories):
    """Convert image URLs for categories"""
    if not categories:
        return categories
    
    for category in categories:
        if 'image_url' in category:
            category['image_url'] = convert_image_url(category['image_url'])
    
    return categories