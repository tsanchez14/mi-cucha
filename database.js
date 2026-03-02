const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'veterinary.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    db.serialize(() => {
        // Owners Table
        db.run(`CREATE TABLE IF NOT EXISTS owners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Pets Table
        db.run(`CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER,
            name TEXT NOT NULL,
            species TEXT,
            breed TEXT,
            age INTEGER,
            weight REAL,
            photo TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
        )`);

        // Vets Table
        db.run(`CREATE TABLE IF NOT EXISTS vets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT,
            phone TEXT
        )`);

        // Appointments Table
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER,
            vet_id INTEGER,
            display_name TEXT, -- For manual entry if pet_id is null
            phone TEXT,        -- Store phone for WA confirmation
            date DATE NOT NULL,
            time TIME NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'pending', -- pending, completed, cancelled
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id),
            FOREIGN KEY (vet_id) REFERENCES vets(id)
        )`);

        // Suppliers Table
        db.run(`CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT,
            phone TEXT,
            email TEXT,
            products TEXT -- Summary of products supplied
        )`);

        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER,
            name TEXT NOT NULL,
            category TEXT,
            stock INTEGER DEFAULT 0,
            unit TEXT,
            cost_price REAL,
            sell_price REAL,
            min_stock INTEGER DEFAULT 5,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        )`);

        // Sales Table
        db.run(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER,
            total REAL NOT NULL,
            discount REAL DEFAULT 0,
            payment_method TEXT, -- cash, card, transfer
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES owners(id)
        )`);

        // Sale Items Table
        db.run(`CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER,
            product_id INTEGER,
            service_name TEXT, -- Optional, if it's a service instead of product
            quantity INTEGER,
            price REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        console.log("Database initialized successfully.");
    });
};

module.exports = {
    db,
    initDb
};
