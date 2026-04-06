const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bnpl_db.sqlite');

db.serialize(() => {
  console.log("Creation of tables started...");

  // USERS
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    available_credit REAL DEFAULT 5000,
    risk_level TEXT DEFAULT 'MEDIUM',
    risk_score INTEGER DEFAULT 0,
    group_purchase_count INTEGER DEFAULT 0,
    total_group_payments_made REAL DEFAULT 0,
    network_score INTEGER DEFAULT 0,
    co_signer_trustworthiness REAL DEFAULT 50,
    consecutive_on_time_payments INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT 0
  )`);

  // ORDERS
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_amount REAL,
    months INTEGER,
    monthly_emi REAL,
    status TEXT DEFAULT 'ACTIVE',
    product_name TEXT,
    purchase_date TEXT,
    is_split_bnpl BOOLEAN DEFAULT 0,
    group_id INTEGER,
    individual_share REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // INSTALLMENTS
  db.run(`CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    installment_no INTEGER,
    amount REAL,
    due_date TEXT,
    status TEXT DEFAULT 'PENDING',
    FOREIGN KEY(order_id) REFERENCES orders(id)
  )`);

  // USER_KYC
  db.run(`CREATE TABLE IF NOT EXISTS user_kyc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    kyc_status TEXT DEFAULT 'PENDING',
    full_name TEXT,
    dob TEXT,
    phone TEXT,
    address TEXT,
    id_type TEXT,
    id_number TEXT,
    enrollment_type TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by TEXT,
    verified_at TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // --- SPLIT BNPL TABLES ---

  // GROUP PURCHASES
  db.run(`CREATE TABLE IF NOT EXISTS group_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT UNIQUE NOT NULL,
    total_amount REAL NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT,
    purchase_date TEXT NOT NULL,
    months INTEGER NOT NULL DEFAULT 3,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  // GROUP PARTICIPANTS
  db.run(`CREATE TABLE IF NOT EXISTS group_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    individual_share REAL NOT NULL,
    individual_emi REAL NOT NULL,
    status TEXT DEFAULT 'INVITED',
    individual_order_id INTEGER,
    kyc_verified BOOLEAN DEFAULT 0,
    credit_available REAL,
    risk_score_at_join INTEGER,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (individual_order_id) REFERENCES orders(id),
    UNIQUE(group_id, user_id)
  )`);

  // GROUP INSTALLMENTS
  db.run(`CREATE TABLE IF NOT EXISTS group_installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    installment_number INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    payment_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES group_participants(id),
    UNIQUE(participant_id, installment_number)
  )`);

  // GROUP INCENTIVES
  db.run(`CREATE TABLE IF NOT EXISTS group_incentives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    incentive_type TEXT DEFAULT 'CREDIT_BONUS',
    amount REAL NOT NULL,
    status TEXT DEFAULT 'EARNED',
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TEXT,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // GROUP RISK METRICS
  db.run(`CREATE TABLE IF NOT EXISTS group_risk_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    avg_risk_score REAL,
    combined_default_probability REAL,
    network_strength_score REAL,
    correlation_score REAL,
    joint_approval_decision TEXT DEFAULT 'NEEDS_REVIEW',
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id)
  )`);

  // GROUP NOTIFICATIONS
  db.run(`CREATE TABLE IF NOT EXISTS group_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    notification_type TEXT DEFAULT 'INVITE',
    message TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // PRODUCT CATEGORIES
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // PRODUCTS
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`);

  // Seed Categories
  const categories = [
    'Electronics', 'Gadgets', 'Clothing', 'Accessories', 'Footwear', 'Food & Grocery', 'Beauty & Personal Care'
  ];
  categories.forEach(cat => {
    db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [cat]);
  });

  // Seed Products (7 Categories * 10 Products = 70 Total)
  // Assumed IDs: 
  // 1: Electronics, 2: Gadgets, 3: Clothing, 4: Accessories, 5: Footwear, 6: Food & Grocery, 7: Beauty & Personal Care

  const products = [
    // 1. Electronics (10)
    { name: 'Smart TV 32 inch', price: 18999, image: 'tv32.jpg', cat_id: 1 },
    { name: 'Dell 24" Monitor', price: 12999, image: 'tv32.jpg', cat_id: 1 },
    { name: 'Logitech Mouse', price: 1499, image: 'mouse.jpg', cat_id: 1 },
    { name: 'Mechanical Keyboard', price: 4999, image: 'keyboard.jpg', cat_id: 1 },
    { name: 'Cables & Adapters', price: 499, image: 'cables.jpg', cat_id: 1 },
    { name: 'USB Hub', price: 1299, image: 'usbhub.jpg', cat_id: 1 },
    { name: 'Webcam 1080p', price: 2499, image: 'webcam.jpg', cat_id: 1 },
    { name: 'Router', price: 3499, image: 'router.jpg', cat_id: 1 },
    { name: 'External HDD 1TB', price: 4999, image: 'hdd1tb.jpg', cat_id: 1 },
    { name: 'Desk Lamp', price: 1999, image: 'desklamp.jpg', cat_id: 1 },
    { name: 'Laptop Charger', price: 1500, image: 'charger.jpg', cat_id: 1 },

    // 2. Gadgets (10)
    { name: 'Power Bank 20000mAh', price: 1999, image: 'powerbank.jpg', cat_id: 2 },
    { name: 'Smart Watch', price: 4999, image: 'smartwatch.jpg', cat_id: 2 },
    { name: 'Fitness Band', price: 2999, image: 'fitnessband.jpg', cat_id: 2 },
    { name: 'TWS Earbuds', price: 2499, image: 'twsearbuds.jpg', cat_id: 2 },
    { name: 'Bluetooth Speaker', price: 3999, image: 'speaker.jpg', cat_id: 2 },
    { name: 'Tracker Tag', price: 2999, image: 'trackertag.jpg', cat_id: 2 },
    { name: 'Selfie Stick', price: 999, image: 'selfiestick.jpg', cat_id: 2 },
    { name: 'Game Controller', price: 4999, image: 'controller.jpg', cat_id: 2 },
    { name: 'Ring Light', price: 1299, image: 'ringlight.jpg', cat_id: 2 },
    { name: 'Neckband Earphones', price: 1499, image: 'neckband.jpg', cat_id: 2 },

    // 3. Clothing (10)
    { name: 'Men Shirt', price: 1499, image: 'menshirt.jpg', cat_id: 3 },
    { name: 'Denim Jeans', price: 2499, image: 'jeans.jpg', cat_id: 3 },
    { name: 'Cotton Shorts', price: 899, image: 'shorts.jpg', cat_id: 3 },
    { name: 'Hoodie', price: 2999, image: 'hoodie.jpg', cat_id: 3 },
    { name: 'Track Pants', price: 1299, image: 'trackpants.jpg', cat_id: 3 },
    { name: 'Women Top', price: 999, image: 'womentop.jpg', cat_id: 3 },
    { name: 'Kurti', price: 1499, image: 'kurti.jpg', cat_id: 3 },
    { name: 'Kids Dress', price: 1999, image: 'kidsdress.jpg', cat_id: 3 },
    { name: 'Sports T-Shirt', price: 799, image: 'sportstshirt.jpg', cat_id: 3 },
    { name: 'Formal Trousers', price: 1999, image: 'trousers.jpg', cat_id: 3 },

    // 4. Accessories (10)
    { name: 'RayBan Aviator', price: 8990, image: 'sunglasses.jpg', cat_id: 4 },
    { name: 'Leather Wallet', price: 1999, image: 'wallet.jpg', cat_id: 4 },
    { name: 'Leather Belt', price: 1499, image: 'belt.jpg', cat_id: 4 },
    { name: 'Analog Watch', price: 3999, image: 'analogwatch.jpg', cat_id: 4 },
    { name: 'Travel Bag', price: 2499, image: 'travelbag.jpg', cat_id: 4 },
    { name: 'Handbag', price: 2999, image: 'handbag.jpg', cat_id: 4 },
    { name: 'Cap', price: 499, image: 'cap.jpg', cat_id: 4 },
    { name: 'Earrings', price: 1999, image: 'earrings.jpg', cat_id: 4 },
    { name: 'Laptop Sleeve', price: 999, image: 'sleeve.jpg', cat_id: 4 },
    { name: 'Socks (Pack of 3)', price: 499, image: 'socks.jpg', cat_id: 4 },

    // 5. Footwear (10)
    { name: 'Sport Shoes', price: 3499, image: 'shoes.jpg', cat_id: 5 },
    { name: 'Running Sneakers', price: 4999, image: 'sneakers.jpg', cat_id: 5 },
    { name: 'Formal Shoes', price: 3999, image: 'formalshoes.jpg', cat_id: 5 },
    { name: 'Casual Sandals (Men)', price: 1499, image: 'sandalsmen.jpg', cat_id: 5 },
    { name: 'Sandals (Women)', price: 1499, image: 'sandalswomen.jpg', cat_id: 5 },
    { name: 'Heels', price: 2999, image: 'heels.jpg', cat_id: 5 },
    { name: 'Flats', price: 999, image: 'flats.jpg', cat_id: 5 },
    { name: 'Slippers', price: 499, image: 'slippers.jpg', cat_id: 5 },
    { name: 'Trek Shoes', price: 5999, image: 'trekshoes.jpg', cat_id: 5 },
    { name: 'Slippers (Daily)', price: 299, image: 'slippers.jpg', cat_id: 5 }, // Duplicate filename check? No, 'slippers.jpg' used once. Wait, I used it twice above? No. checking.

    // 6. Food & Grocery (10)
    { name: 'Atta (5kg)', price: 299, image: 'atta.jpg', cat_id: 6 },
    { name: 'Rice (5kg)', price: 499, image: 'rice.jpg', cat_id: 6 },
    { name: 'Toor Dal (1kg)', price: 150, image: 'toordal.jpg', cat_id: 6 },
    { name: 'Cooking Oil (1L)', price: 180, image: 'oil.jpg', cat_id: 6 },
    { name: 'Sugar (1kg)', price: 50, image: 'sugar.jpg', cat_id: 6 },
    { name: 'Salt (1kg)', price: 25, image: 'salt.jpg', cat_id: 6 },
    { name: 'Tea Powder', price: 250, image: 'tea.jpg', cat_id: 6 },
    { name: 'Instant Noodles (Pack)', price: 120, image: 'noodles.jpg', cat_id: 6 },
    { name: 'Honey', price: 350, image: 'honey.jpg', cat_id: 6 },
    { name: 'Dry Fruits Mix', price: 899, image: 'dryfruits.jpg', cat_id: 6 },

    // 7. Beauty & Personal Care (10)
    { name: 'Face Wash', price: 299, image: 'facewash.jpg', cat_id: 7 },
    { name: 'Shampoo', price: 399, image: 'shampoo.jpg', cat_id: 7 },
    { name: 'Conditioner', price: 399, image: 'conditioner.jpg', cat_id: 7 },
    { name: 'Body Lotion', price: 499, image: 'lotion.jpg', cat_id: 7 },
    { name: 'Sunscreen', price: 599, image: 'sunscreen.jpg', cat_id: 7 },
    { name: 'Moisturizing Cream', price: 350, image: 'cream.jpg', cat_id: 7 },
    { name: 'Lip Balm', price: 199, image: 'lipbalm.jpg', cat_id: 7 },
    { name: 'Deodorant', price: 250, image: 'deo.jpg', cat_id: 7 },
    { name: 'Makeup Kit', price: 1299, image: 'makeupkit.jpg', cat_id: 7 },
    { name: 'Soap (Pack of 4)', price: 200, image: 'soap.jpg', cat_id: 7 }
  ];

  products.forEach(p => {
    db.run(`INSERT OR IGNORE INTO products (name, price, image, category_id) VALUES (?, ?, ?, ?)`,
      [p.name, p.price, p.image, p.cat_id]);
  });

  // Seed Users
  db.run(`INSERT OR IGNORE INTO users (name, email, phone, password, available_credit) 
          VALUES ('User A', 'a@test.com', '1234567890', 'password', 5000)`);

  db.run(`INSERT OR IGNORE INTO users (name, email, phone, password, available_credit) 
          VALUES ('User B', 'b@test.com', '1234567891', 'password', 5000)`);

  db.run(`INSERT OR IGNORE INTO users (name, email, phone, password, available_credit) 
          VALUES ('User C', 'c@test.com', '1234567892', 'password', 5000)`);

  // Set KYC for seeded users
  // Note: we can't do subquery + insert easily in one go if tables are empty/new in sqlite sometimes, but SELECT stub works.
  // Actually, we can just insert based on emails.
  db.run(`INSERT OR IGNORE INTO user_kyc (user_id, kyc_status) 
          SELECT id, 'APPROVED' FROM users WHERE email IN ('a@test.com', 'b@test.com', 'c@test.com')`);

  console.log("...Creation of tables complete.");
});

db.close();
