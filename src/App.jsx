import React, { useState, useEffect } from "react";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const weatherCodeToLabel = (code) => {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Snow fall",
    80: "Rain showers",
    95: "Thunderstorm",
  };
  return map[code] || "Unknown";
};

export default function App() {
  const [q, setQ] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [dark]);

  async function geocodeCity(cityName) {
    const geoRes = await fetch(
      `${GEOCODE_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
    );
    const geoJson = await geoRes.json();
    if (geoJson.results && geoJson.results.length > 0) {
      return {
        latitude: geoJson.results[0].latitude,
        longitude: geoJson.results[0].longitude,
        name: geoJson.results[0].name,
        country: geoJson.results[0].country,
      };
    }
    return null;
  }

  async function handleSearch() {
    setError(null);
    setWeather(null);
    if (!q.trim()) return setError("Please enter a city name.");
    setLoading(true);
    try {
      const loc = await geocodeCity(q);
      if (!loc) {
        setError("City not found. Try again.");
        setLoading(false);
        return;
      }
      const weatherRes = await fetch(
        `${WEATHER_URL}?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&timezone=auto`
      );
      const wj = await weatherRes.json();
      if (!wj.current_weather) {
        setError("Weather data not available.");
        setLoading(false);
        return;
      }
      const cw = wj.current_weather;
      setWeather({
        city: loc.name,
        country: loc.country,
        temp: cw.temperature,
        wind: cw.windspeed,
        description: weatherCodeToLabel(cw.weathercode),
        time: cw.time,
        unit: "°C",
      });
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="weather-card">
        <h1>🌦 Weather Now</h1>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Enter city... (Eg: Chennai, Hyderabad, New York)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#0071e3",
              color: "white",
              cursor: "pointer",
            }}
          >
            {loading ? "Loading..." : "Get"}
          </button>
        </div>

        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

        {weather && (
          <div>
            <h2>
              {weather.city}, {weather.country}
            </h2>
            <div className="temp">
              {weather.temp} {weather.unit}
            </div>
            <div className="desc">{weather.description}</div>
            <div className="muted">
              As of {new Date(weather.time).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <button className="theme-toggle" onClick={() => setDark(!dark)}>
        {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
    </div>
  );
}
