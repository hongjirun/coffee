ALTER TABLE orders ADD COLUMN customer_note text DEFAULT NULL AFTER remark;
ALTER TABLE order_items ADD COLUMN item_note varchar(255) DEFAULT NULL AFTER subtotal;
