
const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());

app.use(express.json());

//This connects to Ford's MySQL database
const con = mysql.createConnection({
  host: "fordsdb.duckdns.org",
  user: "root",
  password: "PASSWORD",
  database: "db1"
});

app.get('/users', function(req, res) {
  con.query('SELECT * FROM users', function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});
// User registration
app.post('/users/register', (req, res) => {
  const { username, password } = req.body;
  const sql = "INSERT INTO users (username, password) VALUES (?)";
  con.query(sql, [[username, password]], (err, result) => {
    if (err) throw err;
    res.send({ message: 'User registered' });
  });
});

// User login
app.post('/users/login', (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  con.query(sql, [username, password], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const cashBalance = result[0].cash_balance;
      res.status(200).json({ message: 'Login successful', userId: result[0].id, cashBalance });
    } else {
      res.status(401).send({ message: 'Invalid username or password' });
    }
    
  });
});

// Updates user cash balance
app.post('/users/update-cash-balance', (req, res) => {
  const { username, cashBalance } = req.body;

  const sql = "UPDATE users SET cash_balance = ? WHERE username = ?";
  con.query(sql, [cashBalance, username], (err, result) => {
    if (err) {
      console.error('Error updating cash balance:', err);
      res.status(500).json({ message: 'Error updating cash balance' });
    } else {
      res.status(200).json({ message: 'Cash balance updated' });
    }
  });
});

// Fetch user cash balance
app.get('/users/:userId/cash-balance', (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT cash_balance FROM users WHERE id = ?";
  con.query(sql, [userId], (err, result) => {
    if (err) throw err;
    res.send(result[0]);
  });
});


// Fetch user data
app.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM users WHERE id = ?";
  con.query(sql, [userId], (err, result) => {
    if (err) throw err;
    res.send(result[0]);
  });
});

// Fetch stock data
app.get('/stocks', (req, res) => {
  const sql = "SELECT * FROM stocks";
  con.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// Fetch user's portfolio
app.get('/users/:userId/portfolio', (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM portfolio WHERE user_id = ?";
  con.query(sql, [userId], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// Buy stock and add to user's portfolio
app.post('/users/:userId/buy-stock', (req, res) => {
  const userId = req.params.userId;
  const { ticker, shares, buyPrice, stopLossPrice } = req.body;
  const sql = "INSERT INTO portfolio (user_id, ticker, shares, buy_price, stop_loss_price) VALUES (?, ?, ?, ?, ?)";
  con.query(sql, [userId, ticker, shares, buyPrice, stopLossPrice], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Stock bought' });
  });
});

// Sell stock and remove from user's portfolio
app.post('/users/:userId/sell-stock', (req, res) => {
  const userId = req.params.userId;
  const { ticker, shares } = req.body;
  const sql = "DELETE FROM portfolio WHERE user_id = ? AND ticker = ? AND shares = ?";
  con.query(sql, [userId, ticker, shares], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Stock sold' });
  });
});




app.listen(port, function() {
  console.log('Server listening on port ' + port);
});



