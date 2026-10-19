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

## Attribution

Weather data provided by [Open-Meteo](https://open-meteo.com).
