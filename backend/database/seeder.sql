-- =====================================================
-- SEED DATA
-- Description: Initial data for system setup
-- =====================================================

USE ecommerce_db;

-- =====================================================
-- DEFAULT ADMIN USER
-- Username: admin
-- Password: admin123
-- =====================================================

INSERT INTO admin_users (admin_id, username, email, password_hash, full_name, role, status) VALUES
('admin-001', 'admin', 'admin@yourstore.com', 
 '$argon2id$v=19$m=65536,t=3,p=4$ccz4yn7Em7OgVl78$00a5006966d4b4fb7fb7bb44e16738d9f4303236e6c6da1b4795647db2df96676d92f112f4c184402413814d7d1539af16ce329d0814e9b6d4b70acc52417978', 
 'System Administrator', 'super_admin', 'active');

-- =====================================================
-- DEFAULT CATEGORIES
-- =====================================================

INSERT INTO categories (category_name, description, status, sort_order) VALUES
('Electronics', 'Electronic devices and accessories', 'active', 1),
('Clothing', 'Men and women clothing', 'active', 2),
('Home & Kitchen', 'Home appliances and kitchen items', 'active', 3),
('Books', 'Books across all genres', 'active', 4),
('Sports & Fitness', 'Sports equipment and fitness gear', 'active', 5),
('Beauty & Personal Care', 'Beauty and personal care products', 'active', 6),
('Toys & Games', 'Toys and games for all ages', 'active', 7),
('Food & Beverages', 'Food items and beverages', 'active', 8);

-- =====================================================
-- SUB-CATEGORIES (Example for Electronics)
-- =====================================================

INSERT INTO categories (category_name, parent_id, description, status, sort_order) 
SELECT 'Smartphones', category_id, 'Mobile phones and smartphones', 'active', 1 
FROM categories WHERE category_name = 'Electronics';

INSERT INTO categories (category_name, parent_id, description, status, sort_order) 
SELECT 'Laptops', category_id, 'Laptops and notebooks', 'active', 2 
FROM categories WHERE category_name = 'Electronics';

INSERT INTO categories (category_name, parent_id, description, status, sort_order) 
SELECT 'Headphones', category_id, 'Headphones and earphones', 'active', 3 
FROM categories WHERE category_name = 'Electronics';

-- =====================================================
-- SAMPLE PRODUCTS
-- =====================================================

-- Get category IDs
SET @electronics_id = (SELECT category_id FROM categories WHERE category_name = 'Electronics' AND parent_id IS NULL);
SET @smartphones_id = (SELECT category_id FROM categories WHERE category_name = 'Smartphones');
SET @laptops_id = (SELECT category_id FROM categories WHERE category_name = 'Laptops');
SET @headphones_id = (SELECT category_id FROM categories WHERE category_name = 'Headphones');

-- Insert sample products
INSERT INTO products (product_name, description, category_id, brand, sku, price, discount_price, hsn_code, gst_rate, is_featured, status) VALUES
-- Smartphones
('iPhone 14 Pro', 'Latest Apple iPhone with advanced camera system and A16 Bionic chip', @smartphones_id, 'Apple', 'IPH14PRO-128', 129900.00, 119900.00, '8517', 18.00, TRUE, 'active'),
('Samsung Galaxy S23', 'Premium Android smartphone with excellent display and camera', @smartphones_id, 'Samsung', 'SAMS23-256', 89900.00, 84900.00, '8517', 18.00, TRUE, 'active'),
('OnePlus 11', 'Flagship killer with fast charging and smooth performance', @smartphones_id, 'OnePlus', 'OP11-128', 56999.00, 54999.00, '8517', 18.00, FALSE, 'active'),

-- Laptops
('MacBook Air M2', 'Thin and light laptop with Apple M2 chip', @laptops_id, 'Apple', 'MBA-M2-256', 114900.00, 109900.00, '8471', 18.00, TRUE, 'active'),
('Dell XPS 13', 'Premium Windows ultrabook with InfinityEdge display', @laptops_id, 'Dell', 'XPS13-512', 99900.00, 94900.00, '8471', 18.00, FALSE, 'active'),
('HP Pavilion Gaming', 'Gaming laptop with NVIDIA graphics', @laptops_id, 'HP', 'HPG15-1TB', 74999.00, 69999.00, '8471', 18.00, TRUE, 'active'),

-- Headphones
('AirPods Pro 2', 'Premium wireless earbuds with active noise cancellation', @headphones_id, 'Apple', 'APP2-2023', 24900.00, 22900.00, '8518', 18.00, TRUE, 'active'),
('Sony WH-1000XM5', 'Industry-leading noise canceling headphones', @headphones_id, 'Sony', 'WH1000XM5', 29990.00, 27990.00, '8518', 18.00, TRUE, 'active'),
('JBL Tune 760NC', 'Affordable wireless headphones with ANC', @headphones_id, 'JBL', 'JBL760NC', 5999.00, 4999.00, '8518', 18.00, FALSE, 'active');

-- =====================================================
-- PRODUCT IMAGES (Sample URLs)
-- =====================================================

-- Insert product images for each product
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT product_id, 
       CONCAT('/static/uploads/products/', LOWER(REPLACE(product_name, ' ', '_')), '_1.jpg'),
       product_name,
       TRUE,
       0
FROM products;

-- Add secondary images for featured products
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT product_id, 
       CONCAT('/static/uploads/products/', LOWER(REPLACE(product_name, ' ', '_')), '_2.jpg'),
       CONCAT(product_name, ' - Side view'),
       FALSE,
       1
FROM products WHERE is_featured = TRUE;

-- =====================================================
-- INVENTORY
-- =====================================================

-- Add inventory for all products
INSERT INTO inventory (product_id, quantity, min_stock_level, max_stock_level)
SELECT product_id, 
       CASE 
           WHEN price > 100000 THEN 25  -- High-value items
           WHEN price > 50000 THEN 50   -- Medium-value items
           ELSE 100                      -- Regular items
       END as quantity,
       CASE 
           WHEN price > 100000 THEN 5   -- High-value items
           WHEN price > 50000 THEN 10   -- Medium-value items
           ELSE 20                       -- Regular items
       END as min_stock_level,
       CASE 
           WHEN price > 100000 THEN 50  -- High-value items
           WHEN price > 50000 THEN 100  -- Medium-value items
           ELSE 500                      -- Regular items
       END as max_stock_level
FROM products;

-- =====================================================
-- PROMOCODES
-- =====================================================

INSERT INTO promocodes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, status) VALUES
('WELCOME10', 'Welcome discount - 10% off on first order', 'percentage', 10.00, 1000.00, 500.00, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'active'),
('SAVE100', 'Flat ₹100 off on orders above ₹2000', 'fixed', 100.00, 2000.00, 100.00, 500, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), 'active'),
('ELECTRONICS15', '15% off on all electronics', 'percentage', 15.00, 5000.00, 2000.00, 200, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active'),
('FREESHIP', 'Free shipping on all orders', 'fixed', 99.00, 499.00, 99.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 12 MONTH), 'active'),
('PREMIUM20', '20% off on orders above ₹10000', 'percentage', 20.00, 10000.00, 5000.00, 100, NOW(), DATE_ADD(NOW(), INTERVAL 2 MONTH), 'active');

-- =====================================================
-- TEST USER (Optional - for testing)
-- Email: test@example.com
-- Password: test123
-- =====================================================

-- INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, email_verified, status) VALUES
-- (UUID(), 'test@example.com', 
--  '$argon2id$v=19$m=65536,t=3,p=4$test$hashedpassword', 
--  'Test', 'User', '9876543210', TRUE, 'active');

-- =====================================================
-- SAMPLE REVIEWS (Optional - for featured products)
-- =====================================================

-- Add this only after you have some test users and orders
-- INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, status)
-- SELECT ... (sample review data)

-- =====================================================
-- FINAL MESSAGE
-- =====================================================

SELECT 'Seed data inserted successfully!' as message;
SELECT 'Default admin credentials:' as info, 'Username: admin' as username, 'Password: admin123' as password;