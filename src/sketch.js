//Enter a username 
//Buy stocks with 'b' key and sell stocks with 's' key
//When you buy a stock you can create a stop-loss order so that if a stock dips below a certain price it automatically sells the stock
// Scroll through different stocks with 'g' and 'h' key

// for localhost, change to "localhost"
let host = "localhost";
//let host = "fordsdb.duckdns.org";

let stocks = []; // array of stock objects
let portfolio = []; // array of user's stock holdings
let userCash = 1000// user's starting cash
let stockIndex = 0; // index of the currently selected stock
let selectedStockIndex = -1; // index of the currently selected stock in the user's portfolio
let userName;
let isLoggedIn = false;
let infoShown = false;
// Defines stock object
class Stock {
  constructor(ticker, startingPrice, volatility) {
    this.ticker = ticker;
    this.price = startingPrice;
    this.volatility = volatility;
    this.history = [startingPrice];
  }

  // Simulates price fluctuation using Monte Carlo algorithm
  fluctuate() {
    let rand = Math.random();
    let change = rand * this.volatility - (this.volatility / 2);
    let newPrice = this.price + change;
    this.price = Math.max(newPrice, 0.01); // Ensures price doesn't go below 0.01
    this.history.push(this.price);
    return newPrice;
  }
}

// Initialize stocks 
async function initStocks() {
  try {
    const response = await fetch('http://'+host+':3000/stocks');
    if (!response.ok) {
      console.error('Error fetching stocks:', response.statusText);
      return;
    }
    const data = await response.json();
    stocks = data.map(stock => new Stock(stock.ticker, stock.price, stock.volatility));
  } catch (error) {
    console.error('Error initializing stocks:', error);
  }
}

async function updateUserCashBalance() {
  try {
    const response = await fetch('http://'+host+':3000/users/update-cash-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: userName, cashBalance: userCash }),
    });

    if (!response.ok) {
      console.error('Error updating cash balance:', response.statusText);
      return;
    }

    const data = await response.json();
    console.log(data.message);
  } catch (error) {
    console.error('Error updating cash balance:', error);
  }
}
async function fetchUserCashBalance(userId) {
  try {
    const response = await fetch('http://'+host+':3000/users/${userId}/cash-balance');
    if (!response.ok) {
      console.error('Error fetching cash balance:', response.statusText);
      return;
    }

    const data = await response.json();
    userCash = data.cash_balance;
  } catch (error) {
    console.error('Error fetching cash balance:', error);
  }
}
async function fetchStocks(){
  try{
    const response = await fetch ('http://'+host+':3000/stocks');
    
    if (!response.ok) {
      console.error('Error fetching stocks:', response.statusText);
      return;
    }

    const data = await response.json();
    stocks = data.map((stock) => new Stock(stock.ticker, stock.current_price, stock.volatility));
  }catch (error){
    console.error("Error fetching stocks:", error);
  }
}

//Current prices of all of the stocks
let currentPrices = [0,0,0,0,0];

// Updates prices of all stocks
function updatePrices() {
  for (let i = 0; i < stocks.length; i++) {
    currentPrices[i] = stocks[i].fluctuate();
    // check for stop-loss orders
    for (let j = 0; j < portfolio.length; j++) {
      if (portfolio[j].stopLossPrice !== null && stocks[i].ticker === portfolio[j].ticker && stocks[i].price <= portfolio[j].stopLossPrice) {
        alert("Stop-loss order triggered for " + stocks[i].ticker + " at " + portfolio[j].stopLossPrice);
        portfolio.splice(j, 1);
      }
    }
  }
}

function displayStock() {
  let stock = stocks[stockIndex];
  let price = stock.price.toFixed(2);
  let change = (price - stock.history[stock.history.length - 2]).toFixed(2);
  let percentChange = ((change / price) * 100).toFixed(2);
  let color = (change >= 0) ? "green" : "red";
  fill(color);
  text(stock.ticker + ": " + price + " (" + change + ", " + percentChange + "%)", 10, 30);
  // display price history
  let history = stock.history;
  let minY = min(history);
  let maxY = max(history);
  let startX = 10;
  let endX = width - 10;
  let startY = height - 30;
  let endY = 100;
  let historyLength = 500; // added this line
  let startIndex = Math.max(0, history.length - historyLength); // added this line
  stroke(color);
  for (let i = startIndex; i < history.length - 1; i++) { // modified this line
    let x1 = map(i - startIndex, 0, historyLength - 1, startX, endX); // modified this line
    let y1 = map(history[i], minY, maxY, startY, endY);
    let x2 = map(i + 1 - startIndex, 0, historyLength - 1, startX, endX); // modified this line
    let y2 = map(history[i + 1], minY, maxY, startY, endY);
    line(x1, y1, x2, y2);
  }
}

function displayPortfolio(currentPortfolioValue) {  
  fill(0);
  noStroke();
  textAlign(LEFT);
  text("User: " + userName + ", Cash: $" + userCash.toFixed(2) + ", Portfolio: $" + currentPortfolioValue.toFixed(2), 10, height - 10);
  let startY = height - 50;
  for (let i = 0; i < portfolio.length; i++) {
    let stock = portfolio[i];
    let price = stock.price.toFixed(2);
    let value = (stock.shares * stock.price).toFixed(2);
    let change = (price - stock.buyPrice).toFixed(2);
    let percentChange = ((change / price) * 100).toFixed(2);
    let color = (change >= 0) ? "green" : "red";
    fill(color);
    textSize(10);
    rect(0, startY - 20, width, 20);
    fill(255); // add this line
    text(stock.ticker + ": " + stock.shares + " shares @ " + price + " (" + change + ", " + percentChange + "%) - Value: $" + value, 10, startY - 5);
    startY -= 20;
  }
}

// Calculates value of User Portfolio
function calculatePortfolio() {
  let totalPortfolioValue = 0;
  for(let i = 0; i < portfolio.length; i++) {
    totalPortfolioValue += portfolio[i].shares*currentPrices[i];
  }

  return totalPortfolioValue;
}

// Advances quarter
async function updateQuarter(quarterInfo) {
  //fetches my local json database
  if(typeof(jsonData) == "undefined") {
    response = await fetch("./FinancialInfo.json");
    jsonData = await response.json();
  }

  jsonData.quarters.push(quarterInfo);
  console.log(jsonData);
}

// Buys stock
async function buyStock() {
  let stock = stocks[stockIndex];
  let shares = parseInt(prompt("How many shares would you like to buy?", 0));
  if (shares > 0 && stock.price * shares <= userCash) {
    let buyPrice = stock.price;
    let stopLossPrice = null;
    let setStopLoss = prompt("Would you like to set a stop-loss order? (Y/N)").toLowerCase();
    if (setStopLoss === "y") {
      stopLossPrice = parseFloat(prompt("Enter the stop-loss price:"));
    }
    portfolio.push({ticker: stock.ticker, shares: shares, buyPrice: buyPrice, price: stock.price, stopLossPrice: stopLossPrice});
    userCash -= stock.price * shares;

    // Update user's cash balance after the transaction
    await updateUserCashBalance();
  } else {
    alert("Invalid input or not enough cash!");
  }
}

// Sells stock
async function sellStock() {
  if (selectedStockIndex == -1) {
    alert("No stock selected!");
    return;
  }
  let stock = portfolio[selectedStockIndex];
  let shares = parseInt(prompt("How many shares would you like to sell?", 0));
  if (shares > 0 && portfolio[selectedStockIndex] && shares <= portfolio[selectedStockIndex].shares) {
    let sellPrice = stocks.find(s => s.ticker == stock.ticker).price;
    let profit = (sellPrice - stock.buyPrice) * shares;
    userCash += sellPrice * shares;
    portfolio[selectedStockIndex].shares -= shares;
    if (portfolio[selectedStockIndex].shares == 0) {
      portfolio.splice(selectedStockIndex, 1);
      selectedStockIndex = -1;
    }
    alert("You sold " + shares + " shares of " + stock.ticker + " for a profit of $" + profit.toFixed(2) + "!");

    // Update user's cash balance after the transaction
    await updateUserCashBalance();
  } else {
    alert("Invalid input or not enough shares!");
  }
}

async function registerUser(username, password) {
  try {
    const response = await fetch('http://'+host+':3000/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

async function loginUser(username, password) {
  try {
    const response = await fetch('http://'+host+':3000/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 401) {
      throw new Error('Invalid username or password');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

function setup() {
  createCanvas(500, 500);
  initStocks();
  frameRate(15);
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const result = await loginUser(username, password);
    if (result && result.message === 'Login successful') {
      userName = username;
      isLoggedIn = true; 
      alert('Login successful');
      await fetchUserCashBalance(result.userId);
      document.getElementById('form-container').style.display = 'none';
    } else {
      alert('Login failed');
    }
  });

  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const result = await registerUser(username, password);
  if (result && result.message === 'User registered') {
    userName = username;
    isLoggedIn = true; // Set isLoggedIn to true
    alert('Registration successful');
    document.getElementById('form-container').style.display = 'none';
  } else {
    alert('Registration failed');
  }
});
}

//global variables for draw function
quarterLength = 910;
//every 10 frames is a day
daysPassed = 0;
startingCash = userCash;
startingPortfolioValue = 0;

quarterHighest = 0;
quarterSecondHighest = 0;
quarterSecondLowest = 99999999999999999999999;
quarterLowest = 9999999999999999999999999;

function draw() {
  background(255);
  if (!isLoggedIn) {
    fill(0);
    textSize(20);
    textAlign(CENTER);
   // text("Please log in or register", width/2, height/2);
    return;
  }
  if(isLoggedIn){
    
    currentPortfolioValue = calculatePortfolio();

    if(currentPortfolioValue + userCash > quarterSecondHighest) {
      if(currentPortfolioValue + userCash > quarterHighest) {
        quarterHighest = currentPortfolioValue + userCash;
      }
      else {
        quarterSecondHighest = currentPortfolioValue + userCash;
      }
    }
    else {
      if(currentPortfolioValue + userCash < quarterSecondLowest) {
        if(currentPortfolioValue + userCash < quarterLowest) {
          quarterLowest = currentPortfolioValue + userCash;
        }
        else {
          quarterSecondLowest = currentPortfolioValue + userCash;
        }
      }
    }

    if(daysPassed % quarterLength == 0 && daysPassed != 0) {
      //updates user cash
      //fetchUserCashBalance(result.userId);

      let quarterInfo = {};
      quarterInfo.quarterNumber = daysPassed/quarterLength;
      quarterInfo.quarterlyGains = (userCash - startingCash + currentPortfolioValue - startingPortfolioValue).toFixed(2);
      //console.log("Cash and Portfolio : " + startingCash + "->" + userCash + " " + startingPortfolioValue + "->" + currentPortfolioValue);
      quarterInfo.portfolioHighsAndLows = [quarterHighest.toFixed(2),quarterSecondHighest.toFixed(2),quarterSecondLowest.toFixed(2),quarterLowest.toFixed(2)]

      updateQuarter(quarterInfo);

      quarterHighest = 0;
      quarterSecondHighest = 0;
      quarterSecondLowest = 999999999999999999999;
      quarterLowest = 99999999999999999;
      startingCash = userCash;
      startingPortfolioValue = currentPortfolioValue;
    }
    
    fill(0);
    updatePrices();
    displayStock();
    displayPortfolio(currentPortfolioValue);
    drawInfoBtn();

    fill(0);
    noStroke();
    textAlign(LEFT);
    text("Day : "+(daysPassed/10).toFixed(0), 410, height - 10);

    daysPassed++;
    //console.log(daysPassed);
  }
}

function drawInfoBtn(){
  fill(29, 185, 84);
  noStroke();
  square(474,1,25);
  fill(255);
  rect(485, 12, 3, 10);
  ellipseMode(CENTER);
  ellipse(486.5, 6.5, 4, 4);
}

function showInfo(){
  alert('Press G and H to cycle through stocks.\nPress B to buy the currently viewed stock.\nSelect a stock in your portfolio by clicking its green bar.\nPress S to sell the selected stock.');
}

function keyPressed() {
  if (isLoggedIn) {
    if (key == "b") {
      buyStock();
    } else if (key == "s") {
      sellStock();
    } else if (key == "g") {
      stockIndex = (stockIndex - 1 + stocks.length) % stocks.length;
      selectedStockIndex = -1;
    } else if (key == "h") {
      stockIndex = (stockIndex + 1) % stocks.length;
      selectedStockIndex = -1;
    }
  }
}

function mousePressed() {
  if (mouseX > 475 && mouseX < 500 && mouseY > 0 && mouseY < 25){
    console.log("button clicked");
    infoShown = !infoShown;
    showInfo();
  }
  
  if (mouseY < height - 50) {
    selectedStockIndex = -1;
  }
  let y = height - 50;
  for (let i = 0; i < portfolio.length; i++) {
    if (mouseY >= y - 20 && mouseY < y) {
      selectedStockIndex = i;
      break;
    }
    y -= 20;
  }
}