CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce;

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

CREATE TABLE referral_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_code (code),
    INDEX idx_status (status)
);

CREATE TABLE referral_uses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    referral_code_id INT NOT NULL,
    referred_user_id VARCHAR(36) NOT NULL,
    reward_given BOOLEAN DEFAULT FALSE,
    first_purchase_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_referral_code_id (referral_code_id),
    INDEX idx_referred_user_id (referred_user_id),
    INDEX idx_reward_given (reward_given)
);

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
    UNIQUE KEY unique_inventory (product_id, variant_id, location),
    INDEX idx_product_id (product_id),
    INDEX idx_quantity (quantity)
);

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
    UNIQUE KEY unique_cart_item (user_id, product_id, variant_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE wallet (
    wallet_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

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
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

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


INSERT INTO categories (category_name, description, image_url, sort_order, status) VALUES
('Honey & Natural Sweeteners', 'Pure honey and natural sweeteners for healthy living', '/static/uploads/categories/honey.jpg', 1, 'active'),
('Premium Coffee', 'High-quality coffee beans and blends from around the world', '/static/uploads/categories/coffee.jpg', 2, 'active'),
('Nuts & Dry Fruits', 'Premium quality nuts and dry fruits rich in nutrients', '/static/uploads/categories/nuts.jpg', 3, 'active'),
('Super Seeds', 'Nutritious seeds packed with vitamins and minerals', '/static/uploads/categories/seeds.jpg', 4, 'active');

INSERT INTO products (product_name, description, category_id, price, discount_price, sku, hsn_code, gst_rate, is_featured, brand, status, weight, meta_title, meta_description) VALUES

('Raw Forest Honey', 'Pure unprocessed honey directly sourced from forest beekeepers. Rich in antioxidants and natural enzymes. Perfect for daily consumption and medicinal uses.', 1, 599.00, 549.00, 'HON001', '0409', 0.00, TRUE, 'PureHive', 'active', 0.500, 'Buy Raw Forest Honey Online - Pure & Natural', 'Premium raw forest honey with natural enzymes and antioxidants. Free delivery on orders above ₹500.'),

('Manuka Honey Premium', 'Imported premium Manuka honey with high antibacterial properties. Perfect for boosting immunity and wound healing. MGO 400+ certified.', 1, 2999.00, 2699.00, 'HON002', '0409', 0.00, TRUE, 'ManukaGold', 'active', 0.250, 'Premium Manuka Honey MGO 400+ Online India', 'Authentic Manuka honey with powerful antibacterial properties. Imported from New Zealand.'),

('Organic Wildflower Honey', 'Multi-floral honey collected from organic wildflower fields. Unfiltered and unpasteurized to retain all natural goodness. Light amber color with delicate taste.', 1, 449.00, 399.00, 'HON003', '0409', 0.00, FALSE, 'WildBloom', 'active', 0.500, 'Organic Wildflower Honey - Unfiltered & Pure', 'Multi-floral wildflower honey with delicate taste and natural sweetness.'),

('Eucalyptus Honey', 'Single-origin eucalyptus honey with distinctive mentholated flavor. Excellent for respiratory health and sore throat relief. Dark amber colored.', 1, 699.00, 649.00, 'HON004', '0409', 0.00, FALSE, 'EucaHive', 'active', 0.500, 'Eucalyptus Honey for Respiratory Health', 'Pure eucalyptus honey with mentholated flavor, perfect for cold and cough relief.'),

('Himalayan Rock Honey', 'Rare cliff honey harvested from Himalayan rock bees. Collected at high altitude with unique mineral content. Limited edition artisanal honey.', 1, 1299.00, 1199.00, 'HON005', '0409', 0.00, TRUE, 'HimalayaGold', 'active', 0.350, 'Rare Himalayan Rock Honey - Limited Edition', 'Exclusive cliff honey from Himalayan rock bees with unique mineral profile.'),

('Arabica Coffee Beans Premium', 'Single-origin Arabica coffee beans from Coorg plantations. Medium roast with chocolatey notes and low acidity. Perfect for espresso and filter coffee.', 2, 899.00, 799.00, 'COF001', '0901', 5.00, TRUE, 'CoorgCoffee', 'active', 1.000, 'Premium Arabica Coffee Beans from Coorg', 'Single-origin Arabica coffee with rich chocolate notes. Fresh roasted to order.'),

('Blue Mountain Coffee', 'Rare Jamaican Blue Mountain coffee beans. Smooth, mild flavor with no bitterness. One of the world\'s most expensive and sought-after coffees.', 2, 3999.00, 3599.00, 'COF002', '0901', 5.00, TRUE, 'BluePeak', 'active', 0.500, 'Jamaican Blue Mountain Coffee - Premium Grade', 'Authentic Blue Mountain coffee with smooth, mild flavor and zero bitterness.'),

('South Indian Filter Coffee', 'Traditional blend of Arabica and Robusta beans perfect for South Indian filter coffee. Dark roast with strong aroma and rich taste.', 2, 549.00, 499.00, 'COF003', '0901', 5.00, FALSE, 'FilterMaster', 'active', 1.000, 'Authentic South Indian Filter Coffee Blend', 'Traditional coffee blend for perfect filter coffee with strong aroma.'),

('Ethiopian Single Origin', 'Premium Ethiopian coffee beans with fruity and wine-like characteristics. Light to medium roast highlighting the natural flavors of the region.', 2, 1199.00, 1099.00, 'COF004', '0901', 5.00, FALSE, 'EthiopianGold', 'active', 0.500, 'Ethiopian Single Origin Coffee - Fruity Notes', 'Premium Ethiopian coffee with natural fruity and wine-like characteristics.'),

('Espresso Blend Supreme', 'Perfect espresso blend combining Brazilian, Colombian and Italian roasting techniques. Dark roast with crema formation and balanced acidity.', 2, 799.00, 729.00, 'COF005', '0901', 5.00, TRUE, 'EspressoMaster', 'active', 1.000, 'Supreme Espresso Coffee Blend - Perfect Crema', 'Professional espresso blend with perfect crema and balanced acidity.'),

('Premium California Almonds', 'Grade A California almonds. Rich in protein, healthy fats, and vitamin E. Perfect for snacking, baking, and making almond milk. Naturally sweet and crunchy.', 3, 899.00, 799.00, 'NUT001', '0801', 5.00, TRUE, 'NutriChoice', 'active', 1.000, 'Premium California Almonds - Grade A Quality', 'Fresh California almonds rich in protein and vitamin E. Perfect for healthy snacking.'),

('Kashmiri Walnuts', 'Premium Kashmiri walnuts with brain-shaped kernels. Rich in omega-3 fatty acids and antioxidants. Light colored with mild, sweet taste.', 3, 1599.00, 1399.00, 'NUT002', '0801', 5.00, TRUE, 'KashmirNuts', 'active', 1.000, 'Kashmiri Walnuts - Premium Quality Brain Food', 'Fresh Kashmiri walnuts rich in omega-3 fatty acids. Perfect brain food.'),

('Roasted Cashews', 'Premium cashews roasted to perfection with light salt. Creamy texture and rich flavor. Great for snacking and cooking. Grade W320 cashews.', 3, 1299.00, 1199.00, 'NUT003', '0801', 5.00, FALSE, 'CashewKing', 'active', 1.000, 'Roasted Cashews W320 Grade - Premium Quality', 'Perfectly roasted cashews with creamy texture and rich flavor.'),

('Afghani Dried Figs', 'Premium Afghani anjeer (dried figs) naturally sun-dried. Rich in fiber, potassium, and antioxidants. Soft texture with natural sweetness.', 3, 649.00, 599.00, 'NUT004', '0804', 5.00, FALSE, 'FigDelight', 'active', 0.500, 'Afghani Dried Figs - Natural & Soft', 'Premium quality Afghani figs naturally sun-dried with rich flavor.'),

('Mixed Dry Fruits Premium', 'Carefully selected mix of almonds, cashews, raisins, and dates. Perfect for gifting and daily consumption. Maintains individual taste of each dry fruit.', 3, 1199.00, 1099.00, 'NUT005', '0801', 5.00, TRUE, 'MixMaster', 'active', 1.000, 'Premium Mixed Dry Fruits - Gift Pack', 'Premium assortment of almonds, cashews, raisins and dates in gift packaging.'),

('Organic Chia Seeds', 'Superfood chia seeds rich in omega-3, fiber, and protein. Perfect for smoothies, puddings, and healthy recipes. Sourced from organic farms.', 4, 399.00, 349.00, 'SED001', '1207', 5.00, TRUE, 'SuperSeed', 'active', 0.500, 'Organic Chia Seeds - Superfood for Health', 'Premium chia seeds rich in omega-3 and fiber. Perfect for healthy recipes.'),

('Premium Flax Seeds', 'Golden flax seeds rich in lignans and alpha-linolenic acid. Supports heart health and digestion. Can be consumed whole or ground.', 4, 299.00, 269.00, 'SED002', '1207', 5.00, FALSE, 'FlaxGold', 'active', 1.000, 'Premium Golden Flax Seeds - Heart Healthy', 'Golden flax seeds rich in lignans supporting heart health and digestion.'),

('Pumpkin Seeds Roasted', 'Roasted pumpkin seeds (pepitas) with light salt. Rich in zinc, magnesium, and healthy fats. Crunchy texture perfect for snacking.', 4, 549.00, 499.00, 'SED003', '1207', 5.00, TRUE, 'PumpkinPower', 'active', 0.500, 'Roasted Pumpkin Seeds - Rich in Zinc', 'Perfectly roasted pumpkin seeds rich in zinc and magnesium. Healthy snacking.'),

('Sunflower Seeds', 'Raw sunflower seeds rich in vitamin E and selenium. Perfect for snacking, salads, and baking. Mild nutty flavor with crunchy texture.', 4, 199.00, 179.00, 'SED004', '1207', 5.00, FALSE, 'SunnySeeds', 'active', 1.000, 'Raw Sunflower Seeds - Vitamin E Rich', 'Fresh sunflower seeds rich in vitamin E and selenium. Perfect for healthy snacking.'),

('Hemp Hearts (Hemp Seeds)', 'Hulled hemp seeds with complete protein profile. Rich in omega fatty acids and minerals. Nutty flavor perfect for smoothies and salads.', 4, 799.00, 749.00, 'SED005', '1207', 5.00, TRUE, 'HempNature', 'active', 0.500, 'Hemp Hearts - Complete Protein Seeds', 'Hulled hemp seeds with complete protein and omega fatty acids. Superfood nutrition.');

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(1, '/static/uploads/products/honey/raw-forest-honey-1.jpg', 'Raw Forest Honey Jar', 0, TRUE),
(1, '/static/uploads/products/honey/raw-forest-honey-2.jpg', 'Raw Forest Honey Texture', 1, FALSE),
(1, '/static/uploads/products/honey/raw-forest-honey-3.jpg', 'Raw Forest Honey Pour', 2, FALSE),

(2, '/static/uploads/products/honey/manuka-honey-1.jpg', 'Manuka Honey Premium Jar', 0, TRUE),
(2, '/static/uploads/products/honey/manuka-honey-2.jpg', 'Manuka Honey Certificate', 1, FALSE),
(2, '/static/uploads/products/honey/manuka-honey-3.jpg', 'Manuka Honey Spoon', 2, FALSE),

(3, '/static/uploads/products/honey/wildflower-honey-1.jpg', 'Organic Wildflower Honey', 0, TRUE),
(3, '/static/uploads/products/honey/wildflower-honey-2.jpg', 'Wildflower Honey Color', 1, FALSE),

(4, '/static/uploads/products/honey/eucalyptus-honey-1.jpg', 'Eucalyptus Honey Dark', 0, TRUE),
(4, '/static/uploads/products/honey/eucalyptus-honey-2.jpg', 'Eucalyptus Honey Packaging', 1, FALSE),

(5, '/static/uploads/products/honey/himalayan-honey-1.jpg', 'Himalayan Rock Honey', 0, TRUE),
(5, '/static/uploads/products/honey/himalayan-honey-2.jpg', 'Himalayan Honey Cliff', 1, FALSE),
(5, '/static/uploads/products/honey/himalayan-honey-3.jpg', 'Himalayan Honey Crystal', 2, FALSE),

(6, '/static/uploads/products/coffee/arabica-beans-1.jpg', 'Arabica Coffee Beans', 0, TRUE),
(6, '/static/uploads/products/coffee/arabica-beans-2.jpg', 'Arabica Beans Close-up', 1, FALSE),
(6, '/static/uploads/products/coffee/arabica-beans-3.jpg', 'Arabica Coffee Cup', 2, FALSE),

(7, '/static/uploads/products/coffee/blue-mountain-1.jpg', 'Blue Mountain Coffee Beans', 0, TRUE),
(7, '/static/uploads/products/coffee/blue-mountain-2.jpg', 'Blue Mountain Package', 1, FALSE),

(8, '/static/uploads/products/coffee/filter-coffee-1.jpg', 'South Indian Filter Coffee', 0, TRUE),
(8, '/static/uploads/products/coffee/filter-coffee-2.jpg', 'Filter Coffee Brewing', 1, FALSE),

(9, '/static/uploads/products/coffee/ethiopian-coffee-1.jpg', 'Ethiopian Coffee Beans', 0, TRUE),
(9, '/static/uploads/products/coffee/ethiopian-coffee-2.jpg', 'Ethiopian Coffee Origin', 1, FALSE),

(10, '/static/uploads/products/coffee/espresso-blend-1.jpg', 'Espresso Blend Beans', 0, TRUE),
(10, '/static/uploads/products/coffee/espresso-blend-2.jpg', 'Espresso Crema', 1, FALSE),

(11, '/static/uploads/products/nuts/california-almonds-1.jpg', 'California Almonds Premium', 0, TRUE),
(11, '/static/uploads/products/nuts/california-almonds-2.jpg', 'Almonds Close-up', 1, FALSE),
(11, '/static/uploads/products/nuts/california-almonds-3.jpg', 'Almonds Nutrition', 2, FALSE),

(12, '/static/uploads/products/nuts/kashmiri-walnuts-1.jpg', 'Kashmiri Walnuts', 0, TRUE),
(12, '/static/uploads/products/nuts/kashmiri-walnuts-2.jpg', 'Walnuts Brain Shape', 1, FALSE),

(13, '/static/uploads/products/nuts/roasted-cashews-1.jpg', 'Roasted Cashews Premium', 0, TRUE),
(13, '/static/uploads/products/nuts/roasted-cashews-2.jpg', 'Cashews W320 Grade', 1, FALSE),

(14, '/static/uploads/products/nuts/afghani-figs-1.jpg', 'Afghani Dried Figs', 0, TRUE),
(14, '/static/uploads/products/nuts/afghani-figs-2.jpg', 'Figs Soft Texture', 1, FALSE),

(15, '/static/uploads/products/nuts/mixed-dry-fruits-1.jpg', 'Mixed Dry Fruits Premium', 0, TRUE),
(15, '/static/uploads/products/nuts/mixed-dry-fruits-2.jpg', 'Mixed Nuts Variety', 1, FALSE),
(15, '/static/uploads/products/nuts/mixed-dry-fruits-3.jpg', 'Gift Pack Presentation', 2, FALSE),

(16, '/static/uploads/products/seeds/chia-seeds-1.jpg', 'Organic Chia Seeds', 0, TRUE),
(16, '/static/uploads/products/seeds/chia-seeds-2.jpg', 'Chia Seeds Texture', 1, FALSE),
(16, '/static/uploads/products/seeds/chia-seeds-3.jpg', 'Chia Pudding Recipe', 2, FALSE),

(17, '/static/uploads/products/seeds/flax-seeds-1.jpg', 'Golden Flax Seeds', 0, TRUE),
(17, '/static/uploads/products/seeds/flax-seeds-2.jpg', 'Flax Seeds Benefits', 1, FALSE),

(18, '/static/uploads/products/seeds/pumpkin-seeds-1.jpg', 'Roasted Pumpkin Seeds', 0, TRUE),
(18, '/static/uploads/products/seeds/pumpkin-seeds-2.jpg', 'Pumpkin Seeds Snack', 1, FALSE),

(19, '/static/uploads/products/seeds/sunflower-seeds-1.jpg', 'Raw Sunflower Seeds', 0, TRUE),
(19, '/static/uploads/products/seeds/sunflower-seeds-2.jpg', 'Sunflower Seeds Bowl', 1, FALSE),

(20, '/static/uploads/products/seeds/hemp-hearts-1.jpg', 'Hemp Hearts Seeds', 0, TRUE),
(20, '/static/uploads/products/seeds/hemp-hearts-2.jpg', 'Hemp Seeds Protein', 1, FALSE);

INSERT INTO inventory (product_id, quantity, min_stock_level, max_stock_level) VALUES
(1, 150, 20, 500), (2, 75, 10, 200), (3, 120, 25, 400), (4, 90, 15, 300), (5, 50, 8, 150),
(6, 200, 30, 600), (7, 40, 5, 100), (8, 180, 35, 500), (9, 85, 12, 250), (10, 160, 25, 450),
(11, 250, 40, 800), (12, 120, 20, 400), (13, 200, 35, 600), (14, 100, 15, 300), (15, 80, 12, 250),
(16, 300, 50, 1000), (17, 220, 40, 700), (18, 150, 25, 450), (19, 280, 45, 800), (20, 90, 15, 300);

INSERT INTO admin_users (admin_id, username, email, password_hash, full_name, role, status) VALUES
('admin-001', 'admin', 'admin@yourstore.com', '32768:8:1$ccz4yn7Em7OgVl78$00a5006966d4b4fb7fb7bb44e16738d9f4303236e6c6da1b4795647db2df96676d92f112f4c184402413814d7d1539af16ce329d0814e9b6d4b70acc52417978', 'System Administrator', 'super_admin', 'active');

INSERT INTO promocodes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, status) VALUES
('WELCOME10', 'Welcome discount - 10% off on first order', 'percentage', 10.00, 500.00, 200.00, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'active'),
('HONEY50', 'Flat ₹50 off on honey products', 'fixed', 50.00, 300.00, 50.00, 500, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), 'active'),
('NUTS20', '20% off on all nuts and dry fruits', 'percentage', 20.00, 400.00, 300.00, 200, NOW(), DATE_ADD(NOW(), INTERVAL 2 MONTH), 'active'),
('COFFEE15', '15% off on premium coffee', 'percentage', 15.00, 600.00, 400.00, 150, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active'),
('SEEDS25', '25% off on superfood seeds', 'percentage', 25.00, 250.00, 200.00, 300, NOW(), DATE_ADD(NOW(), INTERVAL 4 MONTH), 'active'),
('FREESHIP', 'Free shipping on all orders', 'fixed', 50.00, 0.00, 50.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 12 MONTH), 'active');

INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, created_at) VALUES
('user-001', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewtnZ8h5Sf2NGhM2', 'Test', 'User', '9876543210', NOW()),
('user-002', 'demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewtnZ8h5Sf2NGhM2', 'Demo', 'Customer', '9876543211', NOW());

INSERT INTO referral_codes (user_id, code, status, created_at) VALUES
('user-001', 'REFTES123', 'active', NOW()),
('user-002', 'REFDEM456', 'active', NOW());

INSERT INTO wallet (user_id, balance, created_at) VALUES
('user-001', 150.00, NOW()),
('user-002', 75.00, NOW());

-- 1. Add the missing columns
ALTER TABLE users 
ADD COLUMN referral_code VARCHAR(20) UNIQUE NULL AFTER phone,
ADD COLUMN referred_by VARCHAR(36) NULL AFTER referral_code,
ADD INDEX idx_referral_code (referral_code);

-- 2. Populate existing users with referral codes
UPDATE users u 
JOIN referral_codes rc ON u.user_id = rc.user_id 
SET u.referral_code = rc.code 
WHERE rc.status = 'active';

UPDATE users 
SET referral_code = CONCAT('REF', UPPER(SUBSTRING(MD5(RAND()), 1, 8)))
WHERE referral_code IS NULL;

-- Speed up product queries
CREATE INDEX idx_products_status_featured ON products(status, is_featured);
CREATE INDEX idx_products_category_status ON products(category_id, status);

-- Speed up inventory/stock queries  
CREATE INDEX idx_inventory_product_quantity ON inventory(product_id, quantity);

-- Speed up review queries
CREATE INDEX idx_reviews_product_status_created ON reviews(product_id, status, created_at DESC);

-- Speed up product images
CREATE INDEX idx_product_images_product_primary ON product_images(product_id, is_primary, sort_order);


SHOW INDEX FROM products;
SHOW INDEX FROM reviews;
SHOW INDEX FROM inventory;