USE coffee_shop;

CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  sugar_options JSON,
  ice_options JSON,
  size_options JSON,
  addon_options JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(50),
  customer_phone VARCHAR(20),
  remark TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','preparing','completed','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  product_image VARCHAR(255),
  size VARCHAR(20),
  sugar VARCHAR(20),
  ice VARCHAR(20),
  addons JSON,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO admins (username, password) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO categories (name, sort_order) VALUES
('招牌系列', 1),
('拿铁系列', 2),
('手冲系列', 3),
('茶饮系列', 4),
('特调系列', 5)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO products (category_id, name, description, base_price, sugar_options, ice_options, size_options, addon_options) VALUES
(1, '凌小巧特调拿铁', '精选埃塞俄比亚单品咖啡豆，搭配新鲜牛奶，口感醇厚细腻', 28.00,
  '["无糖","少糖","半糖","七分糖","全糖"]',
  '["去冰","少冰","正常冰","多冰"]',
  '[{"name":"中杯","price":0},{"name":"大杯","price":5}]',
  '[{"name":"珍珠","price":3},{"name":"椰果","price":2},{"name":"布丁","price":3}]'
),
(2, '燕麦拿铁', '精选燕麦奶替代传统牛奶，健康轻盈，带有自然麦香', 32.00,
  '["无糖","少糖","半糖","全糖"]',
  '["去冰","少冰","正常冰","多冰"]',
  '[{"name":"中杯","price":0},{"name":"大杯","price":5}]',
  '[{"name":"珍珠","price":3},{"name":"椰果","price":2}]'
),
(3, '手冲耶加雪菲', '来自埃塞俄比亚耶加雪菲产区，花香果酸，清新明亮', 38.00,
  '["不加糖"]',
  '["热","冰"]',
  '[{"name":"单杯","price":0}]',
  '[]'
);
