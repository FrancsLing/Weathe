"use strict";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MAX_DAYS = 16;

const searchInput = document.getElementById("search-input");
const locateBtn = document.getElementById("locate-btn");
const searchResults = document.getElementById("search-results");
const main = document.getElementById("main");

let lastLocation = null;

const svgSun = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></g></svg>';
const svgCloud = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 17.5a5 5 0 0 0-9.9-1.5A4 4 0 0 0 7 21h10.5a4 4 0 0 0 .5-8.5z"/></svg>';
const svgFog = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M4 17h16M4 21h16M5 13a5 5 0 0 1 8.6-3.3A3.5 3.5 0 0 1 19 13H5z"/></svg>';
const svgRain = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 17.5a5 5 0 0 0-9.9-1.5A4 4 0 0 0 7 21h10.5a4 4 0 0 0 .5-8.5z"/><g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M9 20v3M12 20v3M15 20v3"/></g></svg>';
const svgSnow = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 17.5a5 5 0 0 0-9.9-1.5A4 4 0 0 0 7 21h10.5a4 4 0 0 0 .5-8.5z"/><g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M9 20l-2 2M12 20v3M12 20l2 2M15 20l-2 2M15 20v3M15 20l2 2"/></g></svg>';
const svgStorm = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 17.5a5 5 0 0 0-9.9-1.5A4 4 0 0 0 7 21h10.5a4 4 0 0 0 .5-8.5z"/><path d="M13 17l-2 4h3l-2 4 5-8h-4l2-4z"/></svg>';

const weatherSvg = {
  0: svgSun, 1: svgSun,
  2: svgCloud, 3: svgCloud,
  45: svgFog, 48: svgFog,
  51: svgRain, 53: svgRain, 55: svgRain, 56: svgRain, 57: svgRain,
  61: svgRain, 63: svgRain, 65: svgRain, 66: svgRain, 67: svgRain,
  71: svgSnow, 73: svgSnow, 75: svgSnow, 77: svgSnow,
  80: svgRain, 81: svgRain, 82: svgRain,
  85: svgSnow, 86: svgSnow,
  95: svgStorm, 96: svgStorm, 99: svgStorm,
};

function icon(code) {
  return weatherSvg[code] !== undefined ? weatherSvg[code] : svgCloud;
}

function fmtDate(iso, short) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  if (short) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function fmtHour(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}

function fmtWind(dirDeg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const i = Math.round(dirDeg / 45) % 8;
  return dirs[i];
}

function showLoading(msg) {
  main.innerHTML = '<div class="loading">' + msg + "</div>";
}

function showError(msg) {
  main.innerHTML = '<div class="empty">' + msg + "</div>";
}

async function geocode(name) {
  const url = GEO_URL + "?name=" + encodeURIComponent(name) + "&count=8&language=en";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  return res.json();
}

async function fetchForecast(lat, lon, tz) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: tz || "auto",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,sunrise,sunset",
    forecast_days: MAX_DAYS,
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });
  const res = await fetch(FORECAST_URL + "?" + params.toString());
  if (!res.ok) throw new Error("Forecast failed");
  return res.json();
}
function renderCurrent(loc, data) {
  const c = data.current;
  const details = [
    ["Feels like", Math.round(c.apparent_temperature) + "\u00b0C"],
    ["Humidity", c.relative_humidity_2m + "%"],
    ["Wind", c.wind_speed_10m + " km/h " + fmtWind(c.wind_direction_10m)],
    ["Pressure", "n/a"],
  ];

  let html = '<div class="current">';
  html += '<div class="loc">' + escapeHtml(loc.name) + (loc.admin1 ? ", " + escapeHtml(loc.admin1) : "") + (loc.country ? ", " + escapeHtml(loc.country) : "") + "</div>";
  html += '<div class="temp">' + Math.round(c.temperature_2m) + "\u00b0</div>";
  html += '<div class="cond">' + icon(c.weather_code) + " " + weatherLabel(c.weather_code) + "</div>";
  html += '<div class="details">';
  for (const d of details) {
    html += "<div><div class=\"lbl\">" + d[0] + "</div><div class=\"val\">" + d[1] + "</div></div>";
  }
  html += "</div></div>";
  return html;
}

function weatherLabel(code) {
  const labels = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight showers",
    81: "Moderate showers",
    82: "Violent showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
  };
  return labels[code] !== undefined ? labels[code] : "Cloudy";
}

function renderWeekly(data) {
  const daily = data.daily;
  let html = '<div class="forecast"><h2>16-Day Forecast</h2><div class="weekly">';
  for (let i = 0; i < daily.time.length; i++) {
    const rain = daily.precipitation_probability_max[i];
    const rainHtml = rain !== null && rain !== undefined ? rain + "%" : "";
    html += '<div class="day">';
    html += '<div class="d">' + fmtDate(daily.time[i], true) + "</div>";
    html += '<div class="ic">' + icon(daily.weather_code[i]) + "</div>";
    html += '<div class="hi">' + Math.round(daily.temperature_2m_max[i]) + "\u00b0</div>";
    html += '<div class="lo">' + Math.round(daily.temperature_2m_min[i]) + "\u00b0</div>";
    if (rainHtml) html += '<div class="rain">' + rainHtml + "</div>";
    html += "</div>";
  }
  html += "</div></div>";
  return html;
}

function renderHourly(data) {
  const hourly = data.hourly;
  const now = new Date();
  let startIdx = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    if (new Date(hourly.time[i]) >= now) { startIdx = i; break; }
  }
  const count = Math.min(48, hourly.time.length - startIdx);
  if (count <= 0) return "";

  let html = '<div class="hourly-wrap"><div class="hourly">';
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const prob = hourly.precipitation_probability[idx];
    html += '<div class="hour">';
    html += '<div class="t">' + fmtHour(hourly.time[idx]) + "</div>";
    html += '<div class="ic">' + icon(hourly.weather_code[idx]) + "</div>";
    html += '<div class="temp">' + Math.round(hourly.temperature_2m[idx]) + "\u00b0</div>";
    if (prob !== null && prob !== undefined && prob > 0) {
      html += '<div class="t" style="color:var(--accent)">' + prob + "%</div>";
    }
    html += "</div>";
  }
  html += "</div></div>";
  return html;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadWeather(loc) {
  lastLocation = loc;
  showLoading("Loading weather\u2026");
  try {
    const data = await fetchForecast(loc.latitude, loc.longitude, loc.timezone);
    let html = renderCurrent(loc, data);
    html += renderWeekly(data);
    html += renderHourly(data);
    main.innerHTML = html;
  } catch (e) {
    showError("Could not load weather. Please try again.");
  }
}
let searchTimeout = null;

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();
  clearTimeout(searchTimeout);
  if (q.length < 2) {
    searchResults.classList.remove("show");
    searchResults.innerHTML = "";
    return;
  }
  searchTimeout = setTimeout(async () => {
    try {
      const res = await geocode(q);
      const items = res.results || [];
      searchResults.innerHTML = "";
      if (items.length === 0) {
        searchResults.innerHTML = '<li>No locations found</li>';
      } else {
        for (const item of items) {
          const li = document.createElement("li");
          li.setAttribute("role", "option");
          const label = item.name + (item.admin1 ? ", " + item.admin1 : "") + (item.country ? ", " + item.country : "");
          li.innerHTML = label + '<small>' + item.latitude.toFixed(3) + ", " + item.longitude.toFixed(3) + "</small>";
          li.addEventListener("click", () => {
            searchInput.value = "";
            searchResults.classList.remove("show");
            searchResults.innerHTML = "";
            loadWeather(item);
          });
          searchResults.appendChild(li);
        }
      }
      searchResults.classList.add("show");
    } catch (e) {
      searchResults.innerHTML = '<li>Search failed</li>';
      searchResults.classList.add("show");
    }
  }, 300);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchResults.classList.remove("show");
    searchResults.innerHTML = "";
  }
});

locateBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    alert("Geolocation not supported in your browser.");
    return;
  }
  showLoading("Detecting your location\u2026");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const fallback = { name: "Your location", latitude: lat, longitude: lon, timezone: "auto" };
      try {
        const res = await fetch(GEO_URL + "?name=&count=0&language=en");
      } catch (e) {}
      loadWeather(fallback);
    },
    (err) => {
      showError("Could not detect your location. Please search for a city.");
    },
    { timeout: 10000 }
  );
});

window.addEventListener("DOMContentLoaded", () => {
  if (lastLocation) {
    loadWeather(lastLocation);
  } else {
    showLoading("Search for a city to see the weather");
  }
});
