-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price NUMERIC NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  threshold NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create pivot table for linking menus and ingredients
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  menu_item_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  amount_required NUMERIC NOT NULL,
  PRIMARY KEY (menu_item_id, ingredient_id)
);

-- Create orders table with order status
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_number VARCHAR(50) NOT NULL,
  number_of_customers INTEGER NOT NULL,
  items JSON NOT NULL,
  total_price NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'in-progress',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

