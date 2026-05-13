const form = document.querySelector("#search-form");
const input = document.querySelector("#location-input");
const statusPill = document.querySelector("#status-pill");
const locationName = document.querySelector("#location-name");
const condition = document.querySelector("#condition");
const temperature = document.querySelector("#temperature");
const feelsLike = document.querySelector("#feels-like");
const wind = document.querySelector("#wind");
const humidity = document.querySelector("#humidity");
const updatedAt = document.querySelector("#updated-at");
const forecastGrid = document.querySelector("#forecast-grid");

const weatherCodes = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm hail",
  99: "Thunderstorm hail",
};

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function setStatus(text, isError = false) {
  statusPill.textContent = text;
  statusPill.classList.toggle("error", isError);
}

function formatPlace(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

function describe(code) {
  return weatherCodes[code] ?? "Changing skies";
}

function iconFor(code) {
  if ([0, 1].includes(code)) return "sun";
  if ([2, 3, 45, 48].includes(code)) return "cloud";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code >= 85) return "snow";
  if (code >= 95) return "storm";
  return "cloud";
}

function iconMarkup(kind) {
  const icons = {
    sun: `
      <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Sunny">
        <circle cx="32" cy="32" r="13" fill="#ffd25f"/>
        <g stroke="#ffad42" stroke-width="5" stroke-linecap="round">
          <path d="M32 5v8M32 51v8M5 32h8M51 32h8M13 13l6 6M45 45l6 6M51 13l-6 6M19 45l-6 6"/>
        </g>
      </svg>`,
    cloud: `
      <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Cloudy">
        <path d="M20 48h27a12 12 0 0 0 0-24 17 17 0 0 0-32-3A14 14 0 0 0 20 48Z" fill="#fff" stroke="#7dbfe3" stroke-width="3"/>
      </svg>`,
    rain: `
      <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Rain">
        <path d="M20 39h27a12 12 0 0 0 0-24 17 17 0 0 0-32-3A14 14 0 0 0 20 39Z" fill="#fff" stroke="#7dbfe3" stroke-width="3"/>
        <g stroke="#177fb6" stroke-width="4" stroke-linecap="round"><path d="M24 47l-4 8M36 47l-4 8M48 47l-4 8"/></g>
      </svg>`,
    snow: `
      <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Snow">
        <path d="M20 38h27a12 12 0 0 0 0-24 17 17 0 0 0-32-3A14 14 0 0 0 20 38Z" fill="#fff" stroke="#7dbfe3" stroke-width="3"/>
        <g fill="#177fb6"><circle cx="22" cy="50" r="3"/><circle cx="34" cy="55" r="3"/><circle cx="47" cy="50" r="3"/></g>
      </svg>`,
    storm: `
      <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Storm">
        <path d="M20 38h27a12 12 0 0 0 0-24 17 17 0 0 0-32-3A14 14 0 0 0 20 38Z" fill="#fff" stroke="#7dbfe3" stroke-width="3"/>
        <path d="M34 40l-8 13h8l-4 9 12-16h-8l4-6Z" fill="#ffad42"/>
      </svg>`,
  };

  return icons[kind] ?? icons.cloud;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

async function findPlace(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await fetchJson(url);
  if (!data.results?.length) {
    throw new Error("No matching place found.");
  }
  return data.results[0];
}

async function getForecast(place) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", place.latitude);
  url.searchParams.set("longitude", place.longitude);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("timezone", "auto");
  return fetchJson(url);
}

function renderForecast(place, forecast) {
  const current = forecast.current;
  locationName.textContent = formatPlace(place);
  condition.textContent = describe(current.weather_code);
  temperature.textContent = Math.round(current.temperature_2m);
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} mph`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  updatedAt.textContent = `Updated ${timeFormatter.format(new Date(current.time))}`;

  forecastGrid.innerHTML = forecast.daily.time
    .map((date, index) => {
      const code = forecast.daily.weather_code[index];
      const high = Math.round(forecast.daily.temperature_2m_max[index]);
      const low = Math.round(forecast.daily.temperature_2m_min[index]);
      const day = index === 0 ? "Today" : dayFormatter.format(new Date(`${date}T12:00:00`));

      return `
        <article class="forecast-card">
          ${iconMarkup(iconFor(code))}
          <span>${day}</span>
          <strong>${high}°</strong>
          <span>${describe(code)}</span>
          <span>Low ${low}°</span>
        </article>
      `;
    })
    .join("");
}

async function loadWeather(query) {
  setStatus("Loading");
  try {
    const place = await findPlace(query);
    const forecast = await getForecast(place);
    renderForecast(place, forecast);
    setStatus("Live");
  } catch (error) {
    setStatus("Try again", true);
    condition.textContent = error.message;
    forecastGrid.innerHTML = "";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) {
    loadWeather(query);
  }
});

loadWeather(input.value);
