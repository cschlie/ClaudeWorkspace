// Yahoo Finance API via public endpoints / CORS proxies
// We use multiple data strategies for resilience

const CORS_PROXY = 'https://corsproxy.io/?';
const YF_BASE = 'https://query1.finance.yahoo.com';

async function fetchWithProxy(url) {
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Quote data ───────────────────────────────────────────
export async function getQuotes(symbols) {
  try {
    const url = `${YF_BASE}/v7/finance/quote?symbols=${symbols.join(',')}`;
    const data = await fetchWithProxy(url);
    return data?.quoteResponse?.result || [];
  } catch {
    return generateMockQuotes(symbols);
  }
}

export async function getQuote(symbol) {
  const quotes = await getQuotes([symbol]);
  return quotes[0] || null;
}

// ─── Chart / historical data ──────────────────────────────
export async function getChart(symbol, range = '1d', interval = '5m') {
  try {
    const url = `${YF_BASE}/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const data = await fetchWithProxy(url);
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No chart data');
    return parseChartData(result);
  } catch {
    return generateMockChart(symbol, range, interval);
  }
}

function parseChartData(result) {
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  return timestamps.map((t, i) => ({
    time: t,
    open: quote.open?.[i] ?? null,
    high: quote.high?.[i] ?? null,
    low: quote.low?.[i] ?? null,
    close: quote.close?.[i] ?? null,
    volume: quote.volume?.[i] ?? 0,
  })).filter(d => d.close !== null);
}

// ─── News ─────────────────────────────────────────────────
export async function getNews(query = 'stock market') {
  try {
    const url = `https://newsdata.io/api/1/latest?apikey=pub_83498cf73e86aadb10ffe27e9abcb5e8b53e8&q=${encodeURIComponent(query)}&category=business&language=en`;
    const data = await fetch(url).then(r => r.json());
    if (data?.results?.length) {
      return data.results.map(item => ({
        title: item.title,
        description: item.description || '',
        source: item.source_name || item.source_id || 'Unknown',
        url: item.link,
        publishedAt: item.pubDate,
        image: item.image_url,
      }));
    }
    throw new Error('No news');
  } catch {
    return generateMockNews();
  }
}

// ─── Screener ─────────────────────────────────────────────
export async function getScreenerData() {
  const symbols = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B',
    'JPM', 'V', 'UNH', 'HD', 'PG', 'MA', 'DIS', 'NFLX', 'PYPL', 'INTC',
    'VZ', 'ADBE', 'CRM', 'AMD', 'QCOM', 'TXN', 'COST', 'WMT', 'PEP',
    'AVGO', 'CSCO', 'ORCL', 'ACN', 'MRK', 'ABBV', 'TMO', 'LLY', 'NKE',
    'BA', 'CAT', 'GS', 'MMM',
  ];
  return getQuotes(symbols);
}

// ─── Market indices ───────────────────────────────────────
export async function getMarketIndices() {
  const symbols = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX', 'GC=F', 'CL=F', 'BTC-USD', 'EURUSD=X', '^TNX'];
  return getQuotes(symbols);
}

// ─── Sector performance ──────────────────────────────────
export async function getSectorETFs() {
  const symbols = ['XLK', 'XLF', 'XLV', 'XLE', 'XLY', 'XLP', 'XLI', 'XLB', 'XLU', 'XLRE', 'XLC'];
  return getQuotes(symbols);
}

// ─── Mock data generators ─────────────────────────────────

function generateMockQuotes(symbols) {
  const names = {
    'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corp.', 'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.', 'NVDA': 'NVIDIA Corp.', 'META': 'Meta Platforms',
    'TSLA': 'Tesla Inc.', 'BRK-B': 'Berkshire Hathaway', 'JPM': 'JPMorgan Chase',
    'V': 'Visa Inc.', 'UNH': 'UnitedHealth Group', 'HD': 'Home Depot',
    'PG': 'Procter & Gamble', 'MA': 'Mastercard', 'DIS': 'Walt Disney',
    'NFLX': 'Netflix Inc.', 'PYPL': 'PayPal Holdings', 'INTC': 'Intel Corp.',
    'VZ': 'Verizon Comm.', 'ADBE': 'Adobe Inc.', 'CRM': 'Salesforce',
    'AMD': 'AMD Inc.', 'QCOM': 'Qualcomm', 'TXN': 'Texas Instruments',
    'COST': 'Costco', 'WMT': 'Walmart', 'PEP': 'PepsiCo',
    'AVGO': 'Broadcom', 'CSCO': 'Cisco Systems', 'ORCL': 'Oracle',
    'ACN': 'Accenture', 'MRK': 'Merck & Co.', 'ABBV': 'AbbVie',
    'TMO': 'Thermo Fisher', 'LLY': 'Eli Lilly', 'NKE': 'Nike',
    'BA': 'Boeing', 'CAT': 'Caterpillar', 'GS': 'Goldman Sachs', 'MMM': '3M Co.',
    '^GSPC': 'S&P 500', '^DJI': 'Dow Jones', '^IXIC': 'NASDAQ Composite',
    '^RUT': 'Russell 2000', '^VIX': 'CBOE VIX', 'GC=F': 'Gold Futures',
    'CL=F': 'Crude Oil', 'BTC-USD': 'Bitcoin USD', 'EURUSD=X': 'EUR/USD',
    '^TNX': '10-Y Treasury', 'XLK': 'Tech Select SPDR', 'XLF': 'Financial SPDR',
    'XLV': 'Health Care SPDR', 'XLE': 'Energy SPDR', 'XLY': 'Consumer Disc SPDR',
    'XLP': 'Consumer Staples', 'XLI': 'Industrial SPDR', 'XLB': 'Materials SPDR',
    'XLU': 'Utilities SPDR', 'XLRE': 'Real Estate SPDR', 'XLC': 'Comm Services',
  };

  const basePrices = {
    'AAPL': 192, 'MSFT': 420, 'GOOGL': 175, 'AMZN': 185, 'NVDA': 880,
    'META': 510, 'TSLA': 175, 'BRK-B': 410, 'JPM': 198, 'V': 280,
    'UNH': 520, 'HD': 370, 'PG': 165, 'MA': 460, 'DIS': 112,
    'NFLX': 620, 'PYPL': 65, 'INTC': 44, 'VZ': 41, 'ADBE': 510,
    'CRM': 270, 'AMD': 178, 'QCOM': 170, 'TXN': 175, 'COST': 730,
    'WMT': 168, 'PEP': 175, 'AVGO': 1350, 'CSCO': 50, 'ORCL': 125,
    'ACN': 345, 'MRK': 128, 'ABBV': 175, 'TMO': 570, 'LLY': 790,
    'NKE': 98, 'BA': 215, 'CAT': 340, 'GS': 420, 'MMM': 105,
    '^GSPC': 5320, '^DJI': 39800, '^IXIC': 16800, '^RUT': 2100,
    '^VIX': 14.5, 'GC=F': 2360, 'CL=F': 78, 'BTC-USD': 68500,
    'EURUSD=X': 1.085, '^TNX': 4.25, 'XLK': 210, 'XLF': 41,
    'XLV': 142, 'XLE': 90, 'XLY': 184, 'XLP': 76, 'XLI': 118,
    'XLB': 86, 'XLU': 68, 'XLRE': 40, 'XLC': 82,
  };

  const sectors = {
    'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology',
    'AMZN': 'Consumer Cyclical', 'NVDA': 'Technology', 'META': 'Technology',
    'TSLA': 'Consumer Cyclical', 'BRK-B': 'Financial Services', 'JPM': 'Financial Services',
    'V': 'Financial Services', 'UNH': 'Healthcare', 'HD': 'Consumer Cyclical',
    'PG': 'Consumer Defensive', 'MA': 'Financial Services', 'DIS': 'Communication Services',
    'NFLX': 'Communication Services', 'PYPL': 'Financial Services', 'INTC': 'Technology',
    'VZ': 'Communication Services', 'ADBE': 'Technology', 'CRM': 'Technology',
    'AMD': 'Technology', 'QCOM': 'Technology', 'TXN': 'Technology',
    'COST': 'Consumer Defensive', 'WMT': 'Consumer Defensive', 'PEP': 'Consumer Defensive',
    'AVGO': 'Technology', 'CSCO': 'Technology', 'ORCL': 'Technology',
    'ACN': 'Technology', 'MRK': 'Healthcare', 'ABBV': 'Healthcare',
    'TMO': 'Healthcare', 'LLY': 'Healthcare', 'NKE': 'Consumer Cyclical',
    'BA': 'Industrials', 'CAT': 'Industrials', 'GS': 'Financial Services', 'MMM': 'Industrials',
  };

  return symbols.map(sym => {
    const base = basePrices[sym] || 100 + Math.random() * 200;
    const change = (Math.random() - 0.48) * base * 0.03;
    const price = base + change;
    const prevClose = base;
    return {
      symbol: sym,
      shortName: names[sym] || sym,
      regularMarketPrice: +price.toFixed(2),
      regularMarketChange: +change.toFixed(2),
      regularMarketChangePercent: +((change / prevClose) * 100).toFixed(2),
      regularMarketVolume: Math.floor(Math.random() * 50000000) + 1000000,
      regularMarketPreviousClose: +prevClose.toFixed(2),
      regularMarketOpen: +(base + (Math.random() - 0.5) * base * 0.01).toFixed(2),
      regularMarketDayHigh: +(price + Math.random() * base * 0.01).toFixed(2),
      regularMarketDayLow: +(price - Math.random() * base * 0.01).toFixed(2),
      marketCap: Math.floor(base * (Math.random() * 10 + 1) * 1e9),
      trailingPE: +(15 + Math.random() * 35).toFixed(1),
      fiftyTwoWeekHigh: +(price * (1 + Math.random() * 0.3)).toFixed(2),
      fiftyTwoWeekLow: +(price * (1 - Math.random() * 0.3)).toFixed(2),
      averageDailyVolume3Month: Math.floor(Math.random() * 30000000) + 500000,
      sector: sectors[sym] || 'Other',
    };
  });
}

function generateMockChart(symbol, range, interval) {
  const basePrices = { 'AAPL': 192, 'MSFT': 420, 'GOOGL': 175, 'NVDA': 880, 'TSLA': 175 };
  const basePrice = basePrices[symbol] || 150;
  const points = range === '1d' ? 78 : range === '5d' ? 390 : range === '1mo' ? 22 : range === '3mo' ? 65 : range === '6mo' ? 130 : range === '1y' ? 252 : range === '5y' ? 1260 : 78;

  const now = Math.floor(Date.now() / 1000);
  const intervalSec = interval === '1m' ? 60 : interval === '5m' ? 300 : interval === '15m' ? 900 : interval === '1h' ? 3600 : 86400;

  const data = [];
  let price = basePrice;
  for (let i = points; i >= 0; i--) {
    const volatility = basePrice * 0.005;
    price += (Math.random() - 0.48) * volatility;
    price = Math.max(price, basePrice * 0.8);
    price = Math.min(price, basePrice * 1.2);
    const high = price + Math.random() * volatility;
    const low = price - Math.random() * volatility;
    data.push({
      time: now - i * intervalSec,
      open: +(price - (Math.random() - 0.5) * volatility).toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume: Math.floor(Math.random() * 5000000) + 100000,
    });
  }
  return data;
}

function generateMockNews() {
  const articles = [
    { title: 'Fed Signals Potential Rate Cut Amid Cooling Inflation Data', source: 'Reuters', description: 'Federal Reserve officials indicated openness to cutting interest rates as inflation shows consistent signs of moderation toward the 2% target.' },
    { title: 'NVIDIA Surpasses $2 Trillion Market Cap on AI Demand', source: 'Bloomberg', description: 'NVIDIA\'s market capitalization crossed the $2 trillion threshold as demand for AI chips continues to surge across the tech industry.' },
    { title: 'Apple Unveils New AI Features Across Product Lineup', source: 'CNBC', description: 'Apple announced a sweeping set of artificial intelligence features coming to iPhone, iPad, and Mac later this year.' },
    { title: 'Treasury Yields Fall as Economic Data Softens', source: 'Wall Street Journal', description: 'U.S. Treasury yields declined after weaker-than-expected jobs data raised expectations for Federal Reserve rate cuts.' },
    { title: 'Oil Prices Surge on OPEC+ Production Cut Extension', source: 'Reuters', description: 'Crude oil prices jumped over 3% after OPEC+ members agreed to extend production cuts through the end of the quarter.' },
    { title: 'Tech Stocks Lead Market Rally as Earnings Beat Expectations', source: 'MarketWatch', description: 'Major technology companies reported stronger-than-expected quarterly earnings, driving a broad market rally.' },
    { title: 'Bitcoin Reaches New All-Time High Above $70,000', source: 'CoinDesk', description: 'Bitcoin surged past $70,000 for the first time, driven by institutional demand and ETF inflows.' },
    { title: 'Amazon Expands Same-Day Delivery to 50 New Cities', source: 'CNBC', description: 'Amazon announced plans to expand its same-day delivery network, investing billions in logistics infrastructure.' },
    { title: 'European Markets Close Higher on ECB Rate Decision', source: 'Financial Times', description: 'European stock markets rallied after the European Central Bank held rates steady, signaling potential cuts ahead.' },
    { title: 'Microsoft Azure Revenue Growth Accelerates on AI Workloads', source: 'Bloomberg', description: 'Microsoft reported a significant acceleration in Azure cloud revenue growth, driven primarily by AI-related workloads.' },
    { title: 'Goldman Sachs Upgrades Semiconductor Sector to Overweight', source: 'Barrons', description: 'Goldman Sachs analysts upgraded the semiconductor sector citing strong demand drivers from AI, automotive, and data center markets.' },
    { title: 'China\'s Economic Recovery Shows Mixed Signals', source: 'Reuters', description: 'Latest economic data from China painted a mixed picture, with manufacturing activity contracting while services showed improvement.' },
  ];
  return articles.map((a, i) => ({
    ...a,
    url: '#',
    publishedAt: new Date(Date.now() - i * 3600000 * 2).toISOString(),
    image: null,
  }));
}
