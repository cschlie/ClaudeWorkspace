import requests
from config import OPENWEATHER_API_KEY, WEATHER_CITY, WEATHER_UNITS


def fetch_weather():
    """Fetch current weather + 3-day forecast."""
    if not OPENWEATHER_API_KEY:
        return None

    unit_symbol = "°C" if WEATHER_UNITS == "metric" else "°F"

    try:
        # Current weather
        current_url = "https://api.openweathermap.org/data/2.5/weather"
        current = requests.get(current_url, params={
            "q": WEATHER_CITY,
            "appid": OPENWEATHER_API_KEY,
            "units": WEATHER_UNITS,
        }, timeout=10).json()

        # 5-day / 3-hour forecast
        forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
        forecast_data = requests.get(forecast_url, params={
            "q": WEATHER_CITY,
            "appid": OPENWEATHER_API_KEY,
            "units": WEATHER_UNITS,
            "cnt": 24,  # next 3 days (8 per day)
        }, timeout=10).json()

        # Collapse forecast into daily summaries
        daily = {}
        for item in forecast_data.get("list", []):
            day = item["dt_txt"][:10]
            if day not in daily:
                daily[day] = {"temps": [], "descriptions": [], "icons": []}
            daily[day]["temps"].append(item["main"]["temp"])
            daily[day]["descriptions"].append(item["weather"][0]["description"])
            daily[day]["icons"].append(item["weather"][0]["icon"])

        forecast_days = []
        for day, data in list(daily.items())[:3]:
            forecast_days.append({
                "date": day,
                "high": round(max(data["temps"])),
                "low": round(min(data["temps"])),
                "description": data["descriptions"][len(data["descriptions"]) // 2],
                "icon": data["icons"][0],
                "unit": unit_symbol,
            })

        return {
            "city": current.get("name", WEATHER_CITY),
            "temp": round(current["main"]["temp"]),
            "feels_like": round(current["main"]["feels_like"]),
            "description": current["weather"][0]["description"].capitalize(),
            "humidity": current["main"]["humidity"],
            "icon": current["weather"][0]["icon"],
            "unit": unit_symbol,
            "forecast": forecast_days,
        }
    except Exception as e:
        print(f"[weather] Error: {e}")
        return None
