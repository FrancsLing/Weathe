# Weather

A simple weather web app using Open-Meteo (free, no API key needed) with location search, current conditions, a 16-day forecast, and an hourly forecast.

## Features

- City search via Open-Meteo Geocoding API
- "Use my location" button (browser geolocation)
- Current conditions (temp, feels-like, humidity, wind)
- 16-day forecast (Open-Meteo's maximum)
- 48-hour hourly forecast with precipitation probability
- Responsive layout, dark theme

## How it works

All calls are made directly from the browser to Open-Meteo's free APIs:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

No backend or API key is required.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (or use an existing one).
2. Push these files to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
3. In the repository settings, go to **Pages** → **Source**, select **GitHub Actions** (or **main / branch**).
4. Once built, the site will be available at `https://<username>.github.io/<repo>/`.

## Local preview

Open `index.html` directly in a browser, or run a simple server:

```bash
# Python
python3 -m http.server 8000

# Node (if installed)
npx serve .
```

## Attribution

Weather data provided by [Open-Meteo](https://open-meteo.com).