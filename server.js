const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { db, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database
initDb();

// Add missing columns if they don't exist (Migration)
db.serialize(() => {
    db.run("ALTER TABLE appointments ADD COLUMN display_name TEXT", (err) => { });
    db.run("ALTER TABLE appointments ADD COLUMN phone TEXT", (err) => { });
});

// --- API Routes ---

// Owners & Pets
app.get('/api/owners', (req, res) => {
    const search = req.query.search || '';
    db.all(`SELECT * FROM owners WHERE name LIKE ? OR phone LIKE ?`, [`%${search}%`, `%${search}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/pets/all', (req, res) => {
    db.all(`SELECT p.id, p.name || ' (' || o.name || ')' as display_name FROM pets p JOIN owners o ON p.owner_id = o.id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/owners', (req, res) => {
    const { name, phone, email, address } = req.body;
    db.run(`INSERT INTO owners (name, phone, email, address) VALUES (?, ?, ?, ?)`,
        [name, phone, email, address],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.get('/api/owners/:id/pets', (req, res) => {
    db.all(`SELECT * FROM pets WHERE owner_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/pets', (req, res) => {
    const { owner_id, name, species, breed, age, weight, photo } = req.body;
    db.run(`INSERT INTO pets (owner_id, name, species, breed, age, weight, photo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [owner_id, name, species, breed, age, weight, photo],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Appointments
app.get('/api/appointments', (req, res) => {
    const { date } = req.query;
    let query = `
        SELECT 
            a.*, 
            COALESCE(p.name, a.display_name) as pet_name,
            COALESCE(o.name, '') as owner_name, 
            v.name as vet_name 
        FROM appointments a
        LEFT JOIN pets p ON a.pet_id = p.id
        LEFT JOIN owners o ON p.owner_id = o.id
        LEFT JOIN vets v ON a.vet_id = v.id
    `;
    let params = [];
    if (date) {
        query += ` WHERE a.date = ?`;
        params.push(date);
    }
    query += ` ORDER BY a.time ASC`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/appointments', (req, res) => {
    const { pet_id, vet_id, display_name, phone, date, time, reason } = req.body;
    db.run(`INSERT INTO appointments (pet_id, vet_id, display_name, phone, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [pet_id || null, vet_id || null, display_name, phone, date, time, reason],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.patch('/api/appointments/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE appointments SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});

app.get('/api/vets', (req, res) => {
    db.all(`SELECT * FROM vets`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Products & Stock
app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/products/low-stock', (req, res) => {
    db.all(`SELECT * FROM products WHERE stock <= min_stock`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { name, category, stock, unit, cost_price, sell_price, min_stock, supplier_id } = req.body;
    db.run(`INSERT INTO products (name, category, stock, unit, cost_price, sell_price, min_stock, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, category, stock, unit, cost_price, sell_price, min_stock, supplier_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Suppliers
app.get('/api/suppliers', (req, res) => {
    db.all(`SELECT * FROM suppliers`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/suppliers', (req, res) => {
    const { name, contact, phone, email, products } = req.body;
    db.run(`INSERT INTO suppliers (name, contact, phone, email, products) VALUES (?, ?, ?, ?, ?)`,
        [name, contact, phone, email, products],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Sales
app.post('/api/sales', (req, res) => {
    const { owner_id, total, discount, payment_method, items } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(`INSERT INTO sales (owner_id, total, discount, payment_method) VALUES (?, ?, ?, ?)`,
            [owner_id, total, discount, payment_method],
            function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                const saleId = this.lastID;
                const stmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, service_name, quantity, price) VALUES (?, ?, ?, ?, ?)`);

                items.forEach(item => {
                    stmt.run(saleId, item.product_id || null, item.service_name || null, item.quantity, item.price);

                    // Deduct stock if it's a product
                    if (item.product_id) {
                        db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.product_id]);
                    }
                });

                stmt.finalize();
                db.run('COMMIT', (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: saleId });
                });
            }
        );
    });
});

// Fallback route for SPA: serve index.html for any unmatched request
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
