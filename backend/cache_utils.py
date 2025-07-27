from flask import current_app

def invalidate_product_cache(product_id, stock_quantity=None):
    """Clear cache AND broadcast WebSocket update"""
    try:
        cache = current_app.cache
        
        # Clear specific product caches
        keys_to_clear = [
            f'user_product_detail_{product_id}',
            'user_featured_products',
            'user_products',
            'user_categories'
        ]
        
        cleared_count = 0
        for key in keys_to_clear:
            if cache.delete(key):
                cleared_count += 1
        
        print(f"✅ Cache cleared for product {product_id}: {cleared_count} keys removed")
        
        # BROADCAST WEBSOCKET UPDATE for stock changes
        if hasattr(current_app, 'websocket_manager') and stock_quantity is not None:
            current_app.websocket_manager.broadcast_stock_update(
                product_id, 
                {'quantity': stock_quantity, 'product_id': product_id}
            )
            print(f"📡 WebSocket stock broadcast sent for product {product_id}: {stock_quantity} units")
        
        return cleared_count
        
    except Exception as e:
        print(f"❌ Cache invalidation error: {str(e)}")
        return 0

def invalidate_review_cache(product_id):
    """Clear cache for review updates"""
    try:
        cache = current_app.cache
        
        keys_to_clear = [
            f'user_product_detail_{product_id}',
            f'product_reviews_{product_id}'
        ]
        
        cleared_count = 0
        for key in keys_to_clear:
            if cache.delete(key):
                cleared_count += 1
        
        print(f"✅ Review cache cleared for product {product_id}: {cleared_count} keys")
        return cleared_count
        
    except Exception as e:
        print(f"❌ Review cache invalidation error: {str(e)}")
        return 0