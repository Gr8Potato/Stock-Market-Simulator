//THIS SHOULD BE RAN ON editor.p5js.org

//Enter a username
//Buy stocks with 'b' key and sell stocks with 's' key
//When you buy a stock you can create a stop-loss order so that if a stock dips below a certain price it automatically sells the stock
// Scroll through different stocks with 'g' and 'h' key


let stocks = []; // array of stock objects
let portfolio = []; // array of user's stock holdings
let userCash = 1000; // user's starting cash
let stockIndex = 0; // index of the currently selected stock
let selectedStockIndex = -1; // index of the currently selected stock in the user's portfolio
let userName;
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
  }
}

// Initialize stocks
function initStocks() {
  let stock1 = new Stock("AAPL", 100, 0.1);
  let stock2 = new Stock("GOOG", 200, 0.2);
  let stock3 = new Stock("AMZN", 1500, 0.3);
  let stock4 = new Stock("TSLA", 500, 0.4);
  let stock5 = new Stock("FB", 300, 0.5);
  stocks.push(stock1, stock2, stock3, stock4, stock5);
}


// Updates prices of all stocks
function updatePrices() {
  for (let i = 0; i < stocks.length; i++) {
    stocks[i].fluctuate();
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
  // display price history for past 90 days
  let history = stock.history.slice(-90);
  let minY = min(history);
  let maxY = max(history);
  let startX = 10;
  let endX = width - 10;
  let startY = height - 30;
  let endY = 100;
  stroke(color);
  for (let i = 0; i < history.length - 1; i++) {
    let x1 = map(i, 0, history.length - 2, startX, endX);
    let y1 = map(history[i], minY, maxY, startY, endY);
    let x2 = map(i + 1, 0, history.length - 2, startX, endX);
    let y2 = map(history[i + 1], minY, maxY, startY, endY);
    line(x1, y1, x2, y2);
  }
}


// Displays user portfolio
function displayPortfolio() {
  fill(255);
  textAlign(LEFT);
  text("User: " + userName + ", Cash: $" + userCash.toFixed(2), 10, height - 10);
  let startY = height - 50;
  for (let i = 0; i < portfolio.length; i++) {
    let stock = portfolio[i];
    let price = stock.price.toFixed(2);
    let value = (stock.shares * stock.price).toFixed(2);
    let change = (price - stock.buyPrice).toFixed(2);
    let percentChange = ((change / price) * 100).toFixed(2);
    let color = (change >= 0) ? "green" : "red";
    fill(color);
    rect(0, startY - 20, width, 20);
    fill(255); // add this line
    text(stock.ticker + ": " + stock.shares + " shares @ " + price + " (" + change + ", " + percentChange + "%) - Value: $" + value, 10, startY - 5);
    startY -= 20;
  }
}


// Buys stock
function buyStock() {
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
  } else {
    alert("Invalid input or not enough cash!");
  }
}


// Sells stock
function sellStock() {
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
  } else {
    alert("Invalid input or not enough shares!");
  }
}


function setup() {
  createCanvas(400, 400);
  initStocks();
  // Ask for user name
userName = prompt("Enter your name:");

// Display user name
text("User: " + userName + ", Cash: $" + userCash.toFixed(2), 10, height - 10);


}

function draw() {
  background(220);
  updatePrices();
  displayStock();
  displayPortfolio();
}
function keyPressed() {
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

function mousePressed() {
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
