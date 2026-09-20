const apiUrl =
  "https://api.open-meteo.com/v1/forecast?latitude=42.33&longitude=-83.05&current=temperature_2m,weather_code,windspeed_10m&temperature_unit=celsius&windspeed_unit=mph";

const temperatureElement = document.getElementById("temperature");
const weatherDescriptionElement = document.getElementById("weather-description");
const outfitMessageElement = document.getElementById("outfit-message");
const weatherIconElement = document.getElementById("weather-icon");
const feelsLikeElement = document.getElementById("feels-like");
const windSpeedElement = document.getElementById("wind-speed");
const unitButtons = document.querySelectorAll(".unit-btn");

let selectedUnit = "C";
let weatherData = {
  celsius: null,
  fahrenheit: null,
  windSpeed: null,
  condition: "",
};

function toFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function getWeatherInfo(code) {
  const weatherMap = {
    0: { label: "Clear sky", icon: "☀️" },
    1: { label: "Mostly clear", icon: "🌤️" },
    2: { label: "Partly cloudy", icon: "⛅" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Foggy", icon: "🌫️" },
    48: { label: "Depositing rime fog", icon: "🌫️" },
    51: { label: "Light drizzle", icon: "🌦️" },
    53: { label: "Moderate drizzle", icon: "🌦️" },
    55: { label: "Dense drizzle", icon: "🌧️" },
    56: { label: "Freezing drizzle", icon: "🌧️" },
    57: { label: "Heavy freezing drizzle", icon: "🌧️" },
    61: { label: "Slight rain", icon: "🌦️" },
    63: { label: "Moderate rain", icon: "🌧️" },
    65: { label: "Heavy rain", icon: "🌧️" },
    66: { label: "Freezing rain", icon: "🌧️" },
    67: { label: "Heavy freezing rain", icon: "🌧️" },
    71: { label: "Light snow", icon: "🌨️" },
    73: { label: "Moderate snow", icon: "❄️" },
    75: { label: "Heavy snow", icon: "❄️" },
    77: { label: "Snow grains", icon: "❄️" },
    80: { label: "Rain showers", icon: "🌦️" },
    81: { label: "Heavy rain showers", icon: "🌧️" },
    82: { label: "Violent rain showers", icon: "⛈️" },
    85: { label: "Snow showers", icon: "🌨️" },
    86: { label: "Heavy snow showers", icon: "🌨️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunderstorm with hail", icon: "⛈️" },
    99: { label: "Severe thunderstorm", icon: "⛈️" },
  };

  return weatherMap[code] || { label: "Weather conditions", icon: "🌤️" };
}

function getOutfitSuggestion(tempC, condition) {
  if (tempC >= 30) {
    return "It’s hot outside! Wear a breathable T-shirt, shorts, sunglasses, and keep water with you.";
  }

  if (tempC >= 24) {
    return "Warm and comfortable. Go with a light T-shirt, jeans, and breathable sneakers.";
  }

  if (tempC >= 18) {
    return "Mild day ahead. A light long-sleeve shirt, casual pants, and a light jacket will be perfect.";
  }

  if (tempC >= 10) {
    return "Cooler weather. Layer a sweater or hoodie with jeans and a light coat if needed.";
  }

  if (tempC >= 0) {
    return "Cold outside. Wear a warm jacket, scarf, gloves, and insulated boots.";
  }

  return "Very cold! Bundle up with a heavy coat, thermal layers, gloves, and a hat.";
}

function updateTemperatureDisplay() {
  if (weatherData.celsius === null) {
    temperatureElement.textContent = "--";
    feelsLikeElement.textContent = "--";
    windSpeedElement.textContent = "--";
    return;
  }

  const displayTemp =
    selectedUnit === "C"
      ? weatherData.celsius
      : toFahrenheit(weatherData.celsius);

  const displayFeelsLike =
    selectedUnit === "C"
      ? weatherData.celsius
      : toFahrenheit(weatherData.celsius);

  temperatureElement.textContent = `${displayTemp.toFixed(1)}°${selectedUnit}`;
  feelsLikeElement.textContent = `${displayFeelsLike.toFixed(1)}°${selectedUnit}`;
  windSpeedElement.textContent = `${weatherData.windSpeed.toFixed(0)} mph`;
}

function setUnit(unit) {
  selectedUnit = unit;

  unitButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.unit === unit);
  });

  updateTemperatureDisplay();
}

async function fetchWeather() {
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Weather data could not be loaded.");
    }

    const data = await response.json();
    const current = data.current;
    const tempC = current.temperature_2m;
    const weatherCode = current.weather_code;
    const weatherInfo = getWeatherInfo(weatherCode);

    weatherData = {
      celsius: tempC,
      fahrenheit: toFahrenheit(tempC),
      windSpeed: current.windspeed_10m,
      condition: weatherInfo.label,
    };

    weatherDescriptionElement.textContent = `${weatherInfo.label} today.`;
    weatherIconElement.textContent = weatherInfo.icon;
    outfitMessageElement.textContent = getOutfitSuggestion(tempC, weatherInfo.label);
    updateTemperatureDisplay();
  } catch (error) {
    weatherDescriptionElement.textContent = "Unable to load weather right now.";
    weatherIconElement.textContent = "⚠️";
    outfitMessageElement.textContent = "Please try again later for outfit suggestions.";
    temperatureElement.textContent = "--";
    feelsLikeElement.textContent = "--";
    windSpeedElement.textContent = "--";
  }
}

unitButtons.forEach((button) => {
  button.addEventListener("click", () => setUnit(button.dataset.unit));
});

fetchWeather();
