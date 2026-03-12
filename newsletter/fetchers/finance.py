import yfinance as yf
from config import FINANCE_TICKERS


def fetch_finance():
    """Fetch current prices + daily change for configured tickers."""
    results = []
    for ticker_symbol in FINANCE_TICKERS:
        try:
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.fast_info

            price = getattr(info, "last_price", None)
            prev_close = getattr(info, "previous_close", None)

            if price is None or prev_close is None:
                hist = ticker.history(period="2d")
                if len(hist) >= 2:
                    price = round(hist["Close"].iloc[-1], 2)
                    prev_close = round(hist["Close"].iloc[-2], 2)
                elif len(hist) == 1:
                    price = round(hist["Close"].iloc[-1], 2)
                    prev_close = price
                else:
                    continue

            price = round(float(price), 2)
            prev_close = round(float(prev_close), 2)
            change = round(price - prev_close, 2)
            change_pct = round((change / prev_close) * 100, 2) if prev_close else 0

            # Friendly display name
            name = ticker_symbol
            try:
                name = ticker.info.get("shortName", ticker_symbol) or ticker_symbol
            except Exception:
                pass

            results.append({
                "ticker": ticker_symbol,
                "name": name,
                "price": price,
                "change": change,
                "change_pct": change_pct,
                "direction": "up" if change >= 0 else "down",
                "currency": "$",
            })
        except Exception as e:
            print(f"[finance] Error fetching {ticker_symbol}: {e}")

    return results
