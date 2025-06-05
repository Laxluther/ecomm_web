
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- Categories table
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    parent_id INT,
    description TEXT,
    image_url VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status)
);

-- Users table
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    profile_image VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status)
);

-- Addresses table
CREATE TABLE addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    address_type ENUM('home', 'work', 'other') DEFAULT 'home',
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    landmark VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
);

-- Products table
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    weight DECIMAL(8, 3),
    dimensions VARCHAR(100),
    hsn_code VARCHAR(10) DEFAULT '0000',
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    tax_category VARCHAR(50) DEFAULT 'standard',
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured),
    INDEX idx_sku (sku),
    FULLTEXT idx_search (product_name, description)
);

-- Product images table
CREATE TABLE product_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_is_primary (is_primary)
);

-- Product variants table
CREATE TABLE product_variants (
    variant_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    weight_adjustment DECIMAL(8, 3) DEFAULT 0,
    sku VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_status (status)
);

-- Inventory table
CREATE TABLE inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    max_stock_level INT DEFAULT 1000,
    location VARCHAR(100) DEFAULT 'main_warehouse',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    UNIQUE KEY unique_inventory (product_id, variant_id, location),
    INDEX idx_product_id (product_id),
    INDEX idx_quantity (quantity)
);

-- Shopping cart table
CREATE TABLE cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    UNIQUE KEY unique_cart_item (user_id, product_id, variant_id),
    INDEX idx_user_id (user_id)
);

-- Wallet table
CREATE TABLE wallet (
    wallet_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    transaction_type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    reference_type ENUM('order', 'refund', 'cashback', 'referral', 'admin_adjustment'),
    reference_id VARCHAR(36),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at)
);

-- Orders table
CREATE TABLE orders (
    order_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    cgst_amount DECIMAL(10,2) DEFAULT 0,
    sgst_amount DECIMAL(10,2) DEFAULT 0,
    igst_amount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cod', 'online', 'wallet') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    shipping_address JSON NOT NULL,
    billing_address JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_created_at (created_at)
);

-- Order items table
CREATE TABLE order_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(36) NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Order tracking table
CREATE TABLE order_tracking (
    tracking_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(36) NOT NULL,
    status ENUM('order_placed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL,
    message TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
);

-- Reviews table
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_product_review (user_id, product_id),
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating)
);

-- Wishlist table
CREATE TABLE wishlist (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (user_id, product_id),
    INDEX idx_user_id (user_id)
);

-- Promo codes table
CREATE TABLE promocodes (
    code_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    user_limit INT DEFAULT 1,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_valid_dates (valid_from, valid_until)
);

-- Admin users table
CREATE TABLE admin_users (
    admin_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('super_admin', 'product_manager', 'order_manager', 'customer_support') NOT NULL,
    permissions JSON,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

CREATE TABLE email_verifications (
    verification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Add email verification status to existing users (if not already exists)
ALTER TABLE users 
ADD COLUMN verification_sent_at TIMESTAMP NULL;

-- Update existing users to be verified (for testing)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
-- Insert default categories
INSERT INTO categories (category_name, description, status) VALUES
('Nuts & Dry Fruits', 'Premium quality nuts and dry fruits', 'active'),
('Seeds', 'Nutritious seeds for healthy lifestyle', 'active'),
('Coffee & Tea', 'Premium coffee beans and tea varieties', 'active'),
('Honey & Natural Sweeteners', 'Pure honey and natural sweeteners', 'active'),
('Spices & Herbs', 'Fresh spices and aromatic herbs', 'active');

-- Insert sample products with proper GST rates
INSERT INTO products (product_name, description, category_id, price, discount_price, sku, hsn_code, gst_rate, is_featured, brand, status) VALUES
('Premium Almonds', ' premium almonds, rich in protein and healthy fats. ', 1, 899.00, 799.00, 'ALM001', '0801', 5.00, TRUE, 'NutriPro', 'active'),
('Roasted Cashews', 'Premium roasted cashews .', 1, 1299.00, 1199.00, 'CSH001', '0801', 5.00, TRUE, 'NutriPro', 'active'),
('Organic Walnuts', 'Fresh organic walnuts ', 1, 1599.00, 1399.00, 'WAL001', '0801', 5.00, FALSE, 'OrganicHarvest', 'active'),
('Chia Seeds', 'Superfood chia seeds .', 2, 299.00, 249.00, 'CHI001', '1207', 5.00, TRUE, 'HealthySeeds', 'active'),
('Flax Seeds', 'Organic flax seeds rich.', 2, 199.00, 179.00, 'FLX001', '1207', 5.00, FALSE, 'HealthySeeds', 'active'),
('Arabica Coffee Beans', 'Premium Arabica coffee .', 3, 599.00, 549.00, 'COF001', '0901', 5.00, TRUE, 'CoffeeMaster', 'active'),
('Green Tea', 'Premium green tea leaves with ', 3, 399.00, 349.00, 'TEA001', '0902', 5.00, FALSE, 'TeaGarden', 'active'),
('Manuka Honey', 'Pure Manuka honey with.', 4, 1299.00, 1199.00, 'HON001', '0409', 0.00, TRUE, 'PureHoney', 'active'),
('Organic Jaggery', 'Organic jaggery .', 4, 199.00, 179.00, 'JAG001', '1701', 5.00, FALSE, 'OrganicSweet', 'active'),
('Turmeric Powder', 'Pure turmeric powder with high.', 5, 149.00, 129.00, 'TUR001', '0910', 5.00, TRUE, 'SpiceMaster', 'active');

-- Insert product images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES
(1, '/static/uploads/products/almonds1.jpg', 'Premium Almonds', TRUE),
(2, '/static/uploads/products/cashews1.jpg', 'Roasted Cashews', TRUE),
(3, '/static/uploads/products/walnuts1.jpg', 'Organic Walnuts', TRUE),
(4, '/static/uploads/products/chia1.jpg', 'Chia Seeds', TRUE),
(5, '/static/uploads/products/flax1.jpg', 'Flax Seeds', TRUE),
(6, '/static/uploads/products/coffee1.jpg', 'Arabica Coffee Beans', TRUE),
(7, '/static/uploads/products/tea1.jpg', 'Green Tea', TRUE),
(8, '/static/uploads/products/honey1.jpg', 'Manuka Honey', TRUE),
(9, '/static/uploads/products/jaggery1.jpg', 'Organic Jaggery', TRUE),
(10, '/static/uploads/products/turmeric1.jpg', 'Turmeric Powder', TRUE);

-- Insert inventory for all products
INSERT INTO inventory (product_id, quantity, min_stock_level) VALUES
(1, 100, 20),
(2, 75, 15),
(3, 50, 10),
(4, 200, 30),
(5, 150, 25),
(6, 80, 15),
(7, 120, 20),
(8, 60, 10),
(9, 180, 35),
(10, 220, 40);

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO admin_users (admin_id, username, email, password_hash, full_name, role, status) VALUES
('admin-001', 'admin', 'admin@yourstore.com', '32768:8:1$ccz4yn7Em7OgVl78$00a5006966d4b4fb7fb7bb44e16738d9f4303236e6c6da1b4795647db2df96676d92f112f4c184402413814d7d1539af16ce329d0814e9b6d4b70acc52417978', 'System Administrator', 'super_admin', 'active');

-- Insert sample promocodes
INSERT INTO promocodes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, status) VALUES
('WELCOME10', 'Welcome discount - 10% off on first order', 'percentage', 10.00, 500.00, 200.00, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'active'),
('SAVE50', 'Flat ₹50 off on orders above ₹300', 'fixed', 50.00, 300.00, 50.00, 500, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), 'active'),
('NUTS20', '20% off on all nuts products', 'percentage', 20.00, 200.00, 500.00, 200, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active'),
('FREESHIP', 'Free shipping on all orders', 'fixed', 50.00, 0.00, 50.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 12 MONTH), 'active'),
('BULK15', '15% off on orders above ₹1000', 'percentage', 15.00, 1000.00, 1000.00, 100, NOW(), DATE_ADD(NOW(), INTERVAL 2 MONTH), 'active');

-- Create indexes for better performance
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_discount_price ON products(discount_price);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);

CREATE TABLE password_reset_tokens (
    reset_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Optional: Add password reset fields to users table for tracking
ALTER TABLE users 
ADD COLUMN password_reset_requested_at TIMESTAMP NULL,
ADD COLUMN password_reset_count INT DEFAULT 0;