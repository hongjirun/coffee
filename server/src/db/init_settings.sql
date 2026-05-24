CREATE TABLE IF NOT EXISTS settings (
  id int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  value text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_key (`key`)
);

INSERT IGNORE INTO settings (`key`, value) VALUES
  ('normal_mode', '1'),
  ('review_mode', '0'),
  ('wechat_group_qrcode', ''),
  ('wechat_pay_qrcode', ''),
  ('shop_notice', '');
