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

// Initialize Database
initDb();

// Add missing columns if they don't exist (Migration)
db.serialize(() => {
    db.run("ALTER TABLE appointments ADD COLUMN display_name TEXT", (err) => { });
    db.run("ALTER TABLE appointments ADD COLUMN phone TEXT", (err) => { });
    db.run("ALTER TABLE sales ADD COLUMN description TEXT", (err) => { });
    db.run("ALTER TABLE sales ADD COLUMN category_id INTEGER", (err) => { });
    db.run("ALTER TABLE sales ADD COLUMN notes TEXT", (err) => { });
});

// --- API Routes ---

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

app.put('/api/products/:id', (req, res) => {
    const { name, category, stock, unit, cost_price, sell_price, min_stock, supplier_id } = req.body;
    db.run(`UPDATE products SET name=?, category=?, stock=?, unit=?, cost_price=?, sell_price=?, min_stock=?, supplier_id=? WHERE id=?`,
        [name, category, stock, unit, cost_price, sell_price, min_stock, supplier_id, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.patch('/api/products/:id', (req, res) => {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    const setClause = fields.map(f => `${f}=?`).join(', ');
    db.run(`UPDATE products SET ${setClause} WHERE id=?`, [...values, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.run(`DELETE FROM products WHERE id=?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
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

app.put('/api/suppliers/:id', (req, res) => {
    const { name, contact, phone, email, products } = req.body;
    db.run(`UPDATE suppliers SET name=?, contact=?, phone=?, email=?, products=? WHERE id=?`,
        [name, contact, phone, email, products, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.delete('/api/suppliers/:id', (req, res) => {
    db.run(`DELETE FROM suppliers WHERE id=?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Sales Categories (Synced with Stock) - v2
app.get('/api/v2/sales-categories', (req, res) => {
    console.log("Hitting /api/v2/sales-categories");
    const query = `SELECT DISTINCT category as name FROM products WHERE category IS NOT NULL AND category != ''`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("DB Error fetching categories:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("Found categories in products:", rows.length);
        const categories = rows.map((r, index) => ({ id: index + 1, name: r.name }));
        if (categories.length === 0) {
            return res.json([{ id: 1, name: 'Venta General' }]);
        }
        res.json(categories);
    });
});

app.post('/api/sales/categories', (req, res) => {
    const { name } = req.body;
    db.run(`INSERT INTO sales_categories (name) VALUES (?)`, [name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Costs
app.get('/api/costs', (req, res) => {
    const { month, year } = req.query;
    let query = `SELECT * FROM costs`;
    let params = [];
    if (month && year) {
        query += ` WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?`;
        params.push(month.padStart(2, '0'));
        params.push(year);
    }
    query += ` ORDER BY date DESC`;
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/costs', (req, res) => {
    const { date, description, type, category, amount, frequency, supplier, is_recurring, notes } = req.body;
    db.run(`INSERT INTO costs (date, description, type, category, amount, frequency, supplier, is_recurring, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [date, description, type, category, amount, frequency, supplier, is_recurring ? 1 : 0, notes],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/costs/:id', (req, res) => {
    const { date, description, type, category, amount, frequency, supplier, is_recurring, notes } = req.body;
    db.run(`UPDATE costs SET date=?, description=?, type=?, category=?, amount=?, frequency=?, supplier=?, is_recurring=?, notes=? WHERE id=?`,
        [date, description, type, category, amount, frequency, supplier, is_recurring ? 1 : 0, notes, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.delete('/api/costs/:id', (req, res) => {
    db.run(`DELETE FROM costs WHERE id=?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Sales
app.get('/api/sales', (req, res) => {
    const { month, year } = req.query;
    let query = `
        SELECT s.*, c.name as category_name, o.name as client_name
        FROM sales s
        LEFT JOIN sales_categories c ON s.category_id = c.id
        LEFT JOIN owners o ON s.owner_id = o.id
    `;
    let params = [];
    if (month && year) {
        query += ` WHERE strftime('%m', s.date) = ? AND strftime('%Y', s.date) = ?`;
        params.push(month.padStart(2, '0'));
        params.push(year);
    }
    query += ` ORDER BY s.date DESC`;
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sales', (req, res) => {
    const { owner_id, total, discount, payment_method, items, description, category_id, notes, date } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(`INSERT INTO sales (owner_id, total, discount, payment_method, description, category_id, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [owner_id || null, total, discount, payment_method, description, category_id, notes, date || new Date().toISOString()],
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

// Reports
app.get('/api/reports/monthly_recruitment', (req, res) => {
    const { month, year } = req.query;
    const query = `
        SELECT c.name as category, SUM(s.total) as total
        FROM sales s
        LEFT JOIN sales_categories c ON s.category_id = c.id
        WHERE strftime('%m', s.date) = ? AND strftime('%Y', s.date) = ?
        GROUP BY c.id
    `;
    db.all(query, [month.padStart(2, '0'), year], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Logic for recurring costs
const processRecurringCosts = () => {
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();
    const currentDate = now.toISOString().split('T')[0];

    db.all(`SELECT * FROM costs WHERE is_recurring = 1`, [], (err, rows) => {
        if (err || !rows) return;

        rows.forEach(cost => {
            // Check if this recurring cost already exists for this month
            db.get(`SELECT id FROM costs WHERE description = ? AND type = 'Fijo' AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`,
                [cost.description, currentMonth, currentYear],
                (err, row) => {
                    if (!row) {
                        // Create it for this month
                        db.run(`INSERT INTO costs (date, description, type, category, amount, frequency, supplier, is_recurring, notes) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [currentDate, cost.description, cost.type, cost.category, cost.amount, cost.frequency, cost.supplier, 1, cost.notes + ' (Auto-recurrido)']);
                    }
                }
            );
        });
    });
};

// Run recurring costs check on server start
setTimeout(processRecurringCosts, 2000);

// Static files and fallback - v1.2
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route for SPA: serve index.html for any unmatched request
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`VETERASKY SERVER v1.2 RUNNING ON PORT ${PORT}`);
    console.log(`-------------------------------------------`);
});
