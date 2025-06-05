-- =====================================================
-- TRIGGERS AND STORED PROCEDURES
-- Description: Automatic cleanup and business logic
-- =====================================================

USE ecommerce_db;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS cleanup_cart_on_product_inactive;
DROP TRIGGER IF EXISTS cleanup_cart_on_product_delete;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER $$

-- Trigger: Clean cart and wishlist when product becomes inactive
CREATE TRIGGER cleanup_cart_on_product_inactive
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.status = 'inactive' AND OLD.status = 'active' THEN
        -- Remove from all carts
        DELETE FROM cart WHERE product_id = NEW.product_id;
        
        -- Remove from all wishlists
        DELETE FROM wishlist WHERE product_id = NEW.product_id;
        
        -- Log the action
        INSERT INTO admin_logs (action, entity_type, entity_id, details, created_at)
        VALUES ('auto_cleanup', 'product', NEW.product_id, 
                CONCAT('Product "', NEW.product_name, '" marked inactive - removed from carts and wishlists'), 
                NOW());
    END IF;
END$$

-- Trigger: Clean references when product is deleted
CREATE TRIGGER cleanup_cart_on_product_delete
BEFORE DELETE ON products
FOR EACH ROW
BEGIN
    -- Remove from all carts
    DELETE FROM cart WHERE product_id = OLD.product_id;
    
    -- Remove from all wishlists
    DELETE FROM wishlist WHERE product_id = OLD.product_id;
    
    -- Log the action
    INSERT INTO admin_logs (action, entity_type, entity_id, details, created_at)
    VALUES ('auto_cleanup', 'product', OLD.product_id, 
            CONCAT('Product "', OLD.product_name, '" deleted - removed from carts and wishlists'), 
            NOW());
END$$

DELIMITER ;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER $$

-- Procedure: Complete product cleanup
DROP PROCEDURE IF EXISTS cleanup_product_references$$
CREATE PROCEDURE cleanup_product_references(IN p_product_id INT)
BEGIN
    DECLARE product_name VARCHAR(255);
    DECLARE affected_carts INT;
    DECLARE affected_wishlists INT;
    
    -- Get product name for logging
    SELECT product_name INTO product_name 
    FROM products 
    WHERE product_id = p_product_id;
    
    -- Count affected records
    SELECT COUNT(*) INTO affected_carts FROM cart WHERE product_id = p_product_id;
    SELECT COUNT(*) INTO affected_wishlists FROM wishlist WHERE product_id = p_product_id;
    
    -- Remove from all user carts
    DELETE FROM cart WHERE product_id = p_product_id;
    
    -- Remove from all wishlists
    DELETE FROM wishlist WHERE product_id = p_product_id;
    
    -- Log the cleanup
    INSERT INTO admin_logs (action, entity_type, entity_id, details, created_at)
    VALUES ('manual_cleanup', 'product', p_product_id, 
            CONCAT('Cleaned references for product "', IFNULL(product_name, 'Unknown'), 
                   '" - Removed from ', affected_carts, ' carts and ', 
                   affected_wishlists, ' wishlists'), 
            NOW());
END$$

-- Procedure: Get product deletion analysis
DROP PROCEDURE IF EXISTS analyze_product_deletion$$
CREATE PROCEDURE analyze_product_deletion(IN p_product_id INT)
BEGIN
    SELECT 
        p.product_id,
        p.product_name,
        p.status,
        COUNT(DISTINCT oi.order_id) as order_count,
        COUNT(DISTINCT r.review_id) as review_count,
        COUNT(DISTINCT c.cart_id) as cart_count,
        COUNT(DISTINCT w.wishlist_id) as wishlist_count,
        CASE 
            WHEN COUNT(DISTINCT oi.order_id) > 0 OR COUNT(DISTINCT r.review_id) > 0 
            THEN 'soft_delete_required'
            ELSE 'can_hard_delete'
        END as deletion_recommendation
    FROM products p
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN reviews r ON p.product_id = r.product_id
    LEFT JOIN cart c ON p.product_id = c.product_id
    LEFT JOIN wishlist w ON p.product_id = w.product_id
    WHERE p.product_id = p_product_id
    GROUP BY p.product_id;
END$$

-- Procedure: Clean up expired tokens
DROP PROCEDURE IF EXISTS cleanup_expired_tokens$$
CREATE PROCEDURE cleanup_expired_tokens()
BEGIN
    -- Delete expired email verification tokens
    DELETE FROM email_verifications 
    WHERE expires_at < NOW() AND used_at IS NULL;
    
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() AND used_at IS NULL;
    
    -- Log the cleanup
    INSERT INTO admin_logs (action, entity_type, details, created_at)
    VALUES ('cleanup', 'tokens', 'Cleaned up expired verification and password reset tokens', NOW());
END$$

-- Procedure: Update inventory after order
DROP PROCEDURE IF EXISTS update_inventory_after_order$$
CREATE PROCEDURE update_inventory_after_order(
    IN p_product_id INT,
    IN p_quantity INT,
    IN p_operation VARCHAR(10) -- 'reserve' or 'release'
)
BEGIN
    IF p_operation = 'reserve' THEN
        UPDATE inventory 
        SET quantity = quantity - p_quantity,
            reserved_quantity = reserved_quantity + p_quantity
        WHERE product_id = p_product_id;
    ELSEIF p_operation = 'release' THEN
        UPDATE inventory 
        SET quantity = quantity + p_quantity,
            reserved_quantity = reserved_quantity - p_quantity
        WHERE product_id = p_product_id;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Product deletion analysis
CREATE OR REPLACE VIEW product_deletion_analysis AS
SELECT 
    p.product_id,
    p.product_name,
    p.status,
    COUNT(DISTINCT oi.order_id) as order_count,
    COUNT(DISTINCT r.review_id) as review_count,
    COUNT(DISTINCT c.cart_id) as cart_count,
    COUNT(DISTINCT w.wishlist_id) as wishlist_count,
    CASE 
        WHEN COUNT(DISTINCT oi.order_id) > 0 OR COUNT(DISTINCT r.review_id) > 0 
        THEN 'soft_delete_required'
        ELSE 'can_hard_delete'
    END as deletion_recommendation
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN reviews r ON p.product_id = r.product_id
LEFT JOIN cart c ON p.product_id = c.product_id
LEFT JOIN wishlist w ON p.product_id = w.product_id
GROUP BY p.product_id;

-- View: Low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.product_id,
    p.product_name,
    p.sku,
    c.category_name,
    i.quantity as current_stock,
    i.reserved_quantity,
    i.min_stock_level,
    (i.quantity - i.reserved_quantity) as available_stock,
    CASE 
        WHEN (i.quantity - i.reserved_quantity) <= 0 THEN 'out_of_stock'
        WHEN (i.quantity - i.reserved_quantity) <= i.min_stock_level THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM inventory i
JOIN products p ON i.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
WHERE p.status = 'active'
  AND (i.quantity - i.reserved_quantity) <= i.min_stock_level
ORDER BY available_stock ASC;

-- View: Order summary
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.order_id,
    o.order_number,
    o.user_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    o.status as order_status,
    o.payment_method,
    o.payment_status,
    o.total_amount,
    o.created_at as order_date,
    COUNT(oi.item_id) as total_items,
    SUM(oi.quantity) as total_quantity
FROM orders o
JOIN users u ON o.user_id = u.user_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;

-- =====================================================
-- EVENTS (Scheduled Tasks)
-- =====================================================

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Event: Clean up expired tokens daily
DROP EVENT IF EXISTS cleanup_expired_tokens_daily;
CREATE EVENT cleanup_expired_tokens_daily
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO CALL cleanup_expired_tokens();

-- Event: Update expired promocodes
DROP EVENT IF EXISTS update_expired_promocodes;
CREATE EVENT update_expired_promocodes
ON SCHEDULE EVERY 1 HOUR
DO
    UPDATE promocodes 
    SET status = 'expired' 
    WHERE valid_until < NOW() 
    AND status = 'active';