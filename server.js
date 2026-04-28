require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();



// MIDDLEWARE

app.use(cors());

app.use(express.json());

app.use(express.static(__dirname));



// SSL CERTIFICATE

const caPath = path.join(__dirname, 'ca.pem');

if (!fs.existsSync(caPath)) {

    console.error("ERROR: ca.pem not found!");

    process.exit(1);
}



// DATABASE CONNECTION

const db = mysql.createPool({

    host: process.env.DB_HOST,

    port: process.env.DB_PORT,

    user: process.env.DB_USER,

    password: process.env.DB_PASS,

    database: process.env.DB_NAME,

    ssl: {

        rejectUnauthorized: true,

        ca: fs.readFileSync(caPath)

    },

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0

});



// TEST DATABASE CONNECTION

db.getConnection((err, connection) => {

    if (err) {

        console.error(
            "Aiven Connection Failed:",
            err.message
        );

        return;
    }

    console.log(
        "Connected to Aiven Cloud MySQL Database!"
    );

    connection.release();

});



// ======================================================
// LOGIN API
// ======================================================

app.post('/api/login', (req, res) => {

    const {
        email,
        password,
        role
    } = req.body;


    const sql = `
        SELECT
            id,
            fullname,
            email,
            role

        FROM users

        WHERE email = ?
        AND password = ?
        AND role = ?
    `;


    db.query(

        sql,

        [
            email,
            password,
            role
        ],

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    message: "Database error"

                });

            }


            if (results.length > 0) {

                res.json({

                    success: true,

                    user: results[0]

                });

            } else {

                res.status(401).json({

                    success: false,

                    message: "Invalid credentials"

                });

            }

        }

    );

});



const response = await fetch('/api/register', {

    method: 'POST',

    headers: {
        'Content-Type': 'application/json'
    },

    body: JSON.stringify({

        fullname: document.getElementById('fullname').value,

        email: document.getElementById('email').value,

        password: document.getElementById('password').value,

        address: document.getElementById('address').value,

        phone: document.getElementById('phone').value

    })

});



// ======================================================
// GET USERS
// ======================================================

app.get('/api/admin/users', (req, res) => {

    db.query(

        `
        SELECT
            id,
            fullname,
            email,
            address,
            phone,
            role

        FROM users
        `,

        (err, results) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(results);

        }

    );

});



// ======================================================
// UPDATE INVENTORY
// ======================================================

app.put('/api/admin/inventory/:id', (req, res) => {

    const productId = req.params.id;

    const {
        item_name,
        stock_quantity,
        price
    } = req.body;


    const sql = `
        UPDATE inventory

        SET
            item_name = ?,
            stock_quantity = ?,
            price = ?

        WHERE id = ?
    `;


    db.query(

        sql,

        [
            item_name,
            stock_quantity,
            price,
            productId
        ],

        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    success: false,

                    message: "Update failed"

                });

            }

            res.json({

                success: true,

                message: "Inventory updated"

            });

        }

    );

});



// ======================================================
// DELETE INVENTORY
// ======================================================

app.delete('/api/admin/inventory/:id', (req, res) => {

    const productId = req.params.id;


    db.query(

        "DELETE FROM inventory WHERE id = ?",

        [productId],

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    message: "Delete failed"

                });

            }

            res.json({

                success: true,

                message: "Product deleted"

            });

        }

    );

});



// ======================================================
// SALES REPORT
// ======================================================

app.get('/api/admin/reports/sales', (req, res) => {

    db.query(

        `
        SELECT
            SUM(total_price)
            AS totalSales

        FROM orders

        WHERE status = 'Delivered'
        `,

        (err, results) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(

                results[0] || {
                    totalSales: 0
                }

            );

        }

    );

});



// ======================================================
// FEEDBACK API
// ======================================================

app.get('/api/admin/feedback', (req, res) => {

    db.query(

        `
        SELECT

            f.id,

            u.fullname,

            f.message,

            f.created_at

        FROM feedback f

        JOIN users u

        ON f.user_id = u.id
        `,

        (err, results) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(results);

        }

    );

});



// ======================================================
// STAFF ORDERS
// ======================================================

app.get('/api/staff/orders', (req, res) => {

    db.query(

        "SELECT * FROM orders",

        (err, results) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(results);

        }

    );

});



// ======================================================
// CUSTOMER ORDER API
// ======================================================

app.post('/api/orders', (req, res) => {

    const {

        customer_name,

        item_id,

        quantity

    } = req.body;


    // GET ALL ORDERS

app.get('/api/orders', (req, res) => {

    const sql = `
        SELECT * FROM orders
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch orders'
            });

        }

        res.json(results);

    });

});

    // UPDATE ORDER STATUS

app.put('/api/orders/:id', (req, res) => {

    const orderId = req.params.id;

    const sql = `
        UPDATE orders
        SET status = 'Delivered'
        WHERE id = ?
    `;

    db.query(sql, [orderId], (err, result) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: 'Failed to update order'
            });

        }

        res.json({
            success: true,
            message: 'Order marked as delivered'
        });

    });

});


    // CHECK PRODUCT

    db.query(

        `
        SELECT *
        FROM inventory
        WHERE id = ?
        `,

        [item_id],

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    message: "Database error"

                });

            }



            if (results.length === 0) {

                return res.status(404).json({

                    success: false,

                    message: "Product not found"

                });

            }



            const product = results[0];



            // CHECK STOCK

            if (
                product.stock_quantity < quantity
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Insufficient stock"

                });

            }



            // COMPUTE TOTAL

            const totalPrice =
                product.price * quantity;



            // INSERT ORDER

            db.query(

                `
                INSERT INTO orders
                (

                    customer_name,

                    item_id,

                    quantity,

                    total_price,

                    status

                )

                VALUES (?, ?, ?, ?, ?)
                `,

                [

                    customer_name,

                    item_id,

                    quantity,

                    totalPrice,

                    'Pending'

                ],

                (err, orderResult) => {

                    if (err) {

                        return res.status(500).json({

                            success: false,

                            message: "Order failed"

                        });

                    }



                    // UPDATE STOCK

                    const newStock =
                        product.stock_quantity
                        - quantity;



                    db.query(

                        `
                        UPDATE inventory

                        SET stock_quantity = ?

                        WHERE id = ?
                        `,

                        [

                            newStock,

                            item_id

                        ],

                        (err) => {

                            if (err) {

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Stock update failed"

                                });

                            }



                            res.json({

                                success: true,

                                message:
                                    "Order placed successfully",

                                remaining_stock:
                                    newStock

                            });

                        }

                    );

                }

            );

        }

    );

});



// ======================================================
// HOME PAGE
// ======================================================

app.get('/', (req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            'index.html'
        )

    );

});



// ======================================================
// SERVER
// ======================================================

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});