const defaultCity = {
  name: "Detroit",
  admin1: "Michigan",
  country: "US",
  latitude: 42.33,
  longitude: -83.05,
};

const weatherApiBase = "https://api.open-meteo.com/v1/forecast";
const geocodingApi = "https://geocoding-api.open-meteo.com/v1/search";
const favoriteCityKey = "favoriteCity";
const clothesKey = "clothes";

const temperatureElement = document.getElementById("temperature");
const weatherDescriptionElement = document.getElementById("weather-description");
const outfitMessageElement = document.getElementById("outfit-message");
const weatherIconElement = document.getElementById("weather-icon");
const feelsLikeElement = document.getElementById("feels-like");
const windSpeedElement = document.getElementById("wind-speed");
const locationNameElement = document.getElementById("location-name");
const conditionBadgeElement = document.getElementById("condition-badge");
const outfitGalleryElement = document.getElementById("outfit-gallery");
const wardrobeSuggestionElement = document.getElementById("wardrobe-suggestion");
const wardrobeSuggestionTextElement = document.getElementById("wardrobe-suggestion-text");
const citySearchForm = document.getElementById("city-search-form");
const citySearchInput = document.getElementById("city-search");
const saveFavoriteCityButton = document.getElementById("save-favorite-city");
const searchStatusElement = document.getElementById("search-status");
const clothesForm = document.getElementById("clothes-form");
const clothesInput = document.getElementById("clothes-input");
const clothesListElement = document.getElementById("clothes-list");
const unitButtons = document.querySelectorAll(".unit-btn");

let selectedUnit = "C";
let weatherData = {
  celsius: null,
  fahrenheit: null,
  feelsLikeC: null,
  windSpeed: null,
  condition: "",
};

function getSavedFavoriteCity() {
  try {
    return localStorage.getItem(favoriteCityKey) || "";
  } catch (error) {
    return "";
  }
}

function saveFavoriteCity(cityName) {
  const city = (cityName || citySearchInput?.value || "").trim();

  if (!city) {
    setSearchStatus("Please enter a city name before saving it.", true);
    return;
  }

  try {
    localStorage.setItem(favoriteCityKey, city);
    setSearchStatus(`Saved ${city} as your favorite city.`);
  } catch (error) {
    setSearchStatus("Your browser blocked local storage. Please try again.", true);
  }
}

function getSavedClothes() {
  try {
    const storedValue = localStorage.getItem(clothesKey);
    const parsed = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch (error) {
    return [];
  }
}

function saveClothes(clothes) {
  try {
    localStorage.setItem(clothesKey, JSON.stringify(clothes));
  } catch (error) {
    console.error("Unable to save clothes:", error);
  }
}

function updateWardrobeSuggestion(tempC) {
  if (!wardrobeSuggestionElement || !wardrobeSuggestionTextElement) {
    return;
  }

  const clothingItems = getSavedClothes();

  if (!clothingItems.length) {
    wardrobeSuggestionTextElement.textContent = "Add some clothes to compare with the forecast.";
    return;
  }

  const normalizedClothes = clothingItems.map((item) => item.toLowerCase());
  const matchesItem = (keywords) =>
    normalizedClothes.some((item) => keywords.some((keyword) => item.includes(keyword)));

  let suggestion = "No exact match found, but a light layer will work well.";

  if (tempC < 50) {
    if (matchesItem(["hoodie"])) {
      suggestion = "Wear your Hoodie.";
    } else if (matchesItem(["jacket", "coat"])) {
      suggestion = "Wear your jacket or coat.";
    } else if (matchesItem(["sweater"])) {
      suggestion = "Wear your sweater.";
    }
  } else if (tempC < 70) {
    if (matchesItem(["light jacket"])) {
      suggestion = "Wear your light jacket.";
    } else if (matchesItem(["hoodie"])) {
      suggestion = "Wear your hoodie.";
    } else if (matchesItem(["shirt", "long sleeve", "top"])) {
      suggestion = "Wear a shirt or light top.";
    }
  } else {
    if (matchesItem(["t-shirt", "tee", "tank top", "tanktop"])) {
      suggestion = "Wear a T-shirt or tank top.";
    } else if (matchesItem(["shorts"])) {
      suggestion = "Wear your shorts.";
    } else if (matchesItem(["dress"])) {
      suggestion = "Wear your dress for the warmer weather.";
    }
  }

  wardrobeSuggestionTextElement.textContent = suggestion;
}

function toFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function formatLocationName(location) {
  const parts = [location.name];

  if (location.admin1 && location.admin1 !== location.name) {
    parts.push(location.admin1);
  }

  if (location.country && !parts.includes(location.country)) {
    parts.push(location.country);
  }

  return parts.join(", ");
}

function setSearchStatus(message, isError = false) {
  if (!searchStatusElement) {
    return;
  }

  searchStatusElement.textContent = message;
  searchStatusElement.classList.toggle("error", isError);
}

function getMinutesFromTime(timeString, timeZone) {
  const date = new Date(timeString);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return hour * 60 + minute;
}

function isDaytime(currentTime, sunriseTime, sunsetTime, timeZone) {
  const currentMinutes = getMinutesFromTime(currentTime, timeZone);
  const sunriseMinutes = getMinutesFromTime(sunriseTime, timeZone);
  const sunsetMinutes = getMinutesFromTime(sunsetTime, timeZone);

  return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
}

function getWeatherThemeCode(code, isNight) {
  const weatherCode = Number(code);

  if ([0, 1].includes(weatherCode)) {
    return isNight ? "clear-night" : "clear-day";
  }

  if ([2, 3].includes(weatherCode)) {
    return "cloudy";
  }

  if ([45, 48].includes(weatherCode)) {
    return "fog";
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "rain";
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "snow";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "storm";
  }

  return isNight ? "clear-night" : "clear-day";
}

function applyWeatherTheme(code, currentTime, sunriseTime, sunsetTime, timeZone) {
  const isNight = !isDaytime(currentTime, sunriseTime, sunsetTime, timeZone);
  const themeCode = getWeatherThemeCode(code, isNight);

  document.body.classList.remove(
    "theme-day",
    "theme-night",
    "weather-clear-day",
    "weather-clear-night",
    "weather-cloudy",
    "weather-fog",
    "weather-rain",
    "weather-snow",
    "weather-storm",
  );

  document.body.classList.add(isNight ? "theme-night" : "theme-day", `weather-${themeCode}`);
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

function getOutfitSuggestion(tempC, condition, windSpeed) {
  const base = {
    title: "Layer up",
    description: "A smart mix of comfort and practicality will get you through the day.",
    items: [
      {
        name: "Light layer",
        detail: "Easy to add or remove",
        image:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
        alt: "Casual light layered outfit",
      },
      {
        name: "Everyday essentials",
        detail: "Balanced for current conditions",
        image:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
        alt: "Everyday casual outfit",
      },
      {
        name: "Weather-ready finish",
        detail: "Comfortable final layer",
        image:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
        alt: "Weather-ready outfit accessories",
      },
    ],
  };

  if (tempC >= 30) {
    return {
      title: "Hot day essentials",
      description: "Sunny and humid, so choose breathable fabrics and keep cool.",
      items: [
        {
          name: "Breathable tee",
          detail: "Loose-fit cotton top",
          image:
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
          alt: "Light summer T-shirt outfit",
        },
        {
          name: "Shorts and sandals",
          detail: "Airy and easy-moving",
          image:
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
          alt: "Shorts and sandals summer outfit",
        },
        {
          name: "Sunglasses",
          detail: "Sun protection and style",
          image:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
          alt: "Sunglasses and warm weather style",
        },
      ],
    };
  }

  if (tempC >= 24) {
    return {
      title: "Warm and easy",
      description: "Comfortable temperatures call for light layers and casual pairing.",
      items: [
        {
          name: "Light tee",
          detail: "Soft cotton for warmer hours",
          image:
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
          alt: "Light shirt outfit",
        },
        {
          name: "Straight-leg jeans",
          detail: "Easy, classic fit",
          image:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
          alt: "Casual jeans outfit",
        },
        {
          name: "Sneakers",
          detail: "Great for everyday movement",
          image:
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
          alt: "Sneakers outfit",
        },
      ],
    };
  }

  if (tempC >= 18) {
    return {
      title: "Mild-day style",
      description: "A light layer works well with the comfortable conditions outside.",
      items: [
        {
          name: "Long-sleeve shirt",
          detail: "Light but polished",
          image:
            "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
          alt: "Long sleeve shirt outfit",
        },
        {
          name: "Casual trousers",
          detail: "Relaxed and comfortable",
          image:
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
          alt: "Casual trousers outfit",
        },
        {
          name: "Light jacket",
          detail: "Perfect for evening coolness",
          image:
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
          alt: "Light jacket outfit",
        },
      ],
    };
  }

  if (tempC >= 10) {
    return {
      title: "Cool weather layering",
      description: "A sweater and a light outer layer will keep you comfortable in the breeze.",
      items: [
        {
          name: "Hoodie",
          detail: "Warm but easy to layer",
          image:
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
          alt: "Hoodie outfit",
        },
        {
          name: "Jeans",
          detail: "Classic insulated staple",
          image:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
          alt: "Jeans outfit",
        },
        {
          name: "Warm coat",
          detail: "Essential on cooler mornings",
          image:
            "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
          alt: "Warm coat outfit",
        },
      ],
    };
  }

  if (tempC >= 0) {
    return {
      title: "Cold-weather gear",
      description: "Bundle up to stay warm and comfortable in colder air.",
      items: [
        {
          name: "Thermal base",
          detail: "Keeps warmth close to the body",
          image:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
          alt: "Thermal winter clothing",
        },
        {
          name: "Wool jacket",
          detail: "Protects against cold wind",
          image:
            "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
          alt: "Wool coat winter outfit",
        },
        {
          name: "Scarf and gloves",
          detail: "Important for wind chill",
          image:
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
          alt: "Cold-weather accessories",
        },
      ],
    };
  }

  return {
    title: "Arctic style",
    description: "Very cold conditions need serious insulation and extra layers.",
    items: [
      {
        name: "Thermal layers",
        detail: "Base protection against freezing air",
        image:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        alt: "Thermal winter outfit",
      },
      {
        name: "Heavy coat",
        detail: "Maximum warmth and coverage",
        image:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
          alt: "Heavy winter coat outfit",
      },
      {
        name: "Boots and hat",
        detail: "Keeps feet and head protected",
        image:
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
        alt: "Winter boots and hat outfit",
      },
    ],
  };
}

function renderOutfitGallery(suggestion) {
  outfitGalleryElement.innerHTML = suggestion.items
    .map(
      (item) => `
        <article class="outfit-card">
          <img src="${item.image}" alt="${item.alt}" />
          <div class="outfit-card-copy">
            <h4>${item.name}</h4>
            <p>${item.detail}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function updateTemperatureDisplay() {
  if (!temperatureElement || !feelsLikeElement || !windSpeedElement) {
    return;
  }

  if (weatherData.celsius === null) {
    temperatureElement.textContent = "--";
    feelsLikeElement.textContent = "--";
    windSpeedElement.textContent = "--";
    return;
  }

  const displayTemp =
    selectedUnit === "C" ? weatherData.celsius : toFahrenheit(weatherData.celsius);

  const displayFeelsLike =
    selectedUnit === "C"
      ? weatherData.feelsLikeC ?? weatherData.celsius
      : toFahrenheit(weatherData.feelsLikeC ?? weatherData.celsius);

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

async function fetchWeatherForCoordinates(latitude, longitude, locationLabel) {
  const apiUrl = `${weatherApiBase}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,windspeed_10m&daily=sunrise,sunset&temperature_unit=celsius&windspeed_unit=mph&timezone=auto`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Weather data could not be loaded.");
    }

    const data = await response.json();
    const current = data.current || {};
    const daily = data.daily || {};
    const tempC = Number(current.temperature_2m ?? 0);
    const feelsLikeC = Number(current.apparent_temperature ?? tempC);
    const weatherCode = Number(current.weather_code ?? 0);
    const weatherInfo = getWeatherInfo(weatherCode);
    const currentTime = current.time || new Date().toISOString();
    const sunriseTime = daily.sunrise?.[0] || "1970-01-01T06:00";
    const sunsetTime = daily.sunset?.[0] || "1970-01-01T18:00";
    const timeZone = data.timezone || "UTC";

    weatherData = {
      celsius: tempC,
      fahrenheit: toFahrenheit(tempC),
      feelsLikeC,
      windSpeed: Number(current.windspeed_10m ?? 0),
      condition: weatherInfo.label,
    };

    if (locationNameElement) {
      locationNameElement.textContent = locationLabel;
    }

    if (conditionBadgeElement) {
      conditionBadgeElement.textContent = weatherInfo.label;
    }

    if (weatherDescriptionElement) {
      weatherDescriptionElement.textContent = `${weatherInfo.label} today in ${locationLabel}.`;
    }

    if (weatherIconElement) {
      weatherIconElement.textContent = weatherInfo.icon;
    }

    const suggestion = getOutfitSuggestion(tempC, weatherInfo.label, weatherData.windSpeed);

    if (outfitMessageElement) {
      outfitMessageElement.textContent = `${suggestion.title}: ${suggestion.description}`;
    }

    if (outfitGalleryElement) {
      renderOutfitGallery(suggestion);
    }

    updateWardrobeSuggestion(tempC);
    updateTemperatureDisplay();
    setSearchStatus(`Updated weather for ${locationLabel}.`);
    applyWeatherTheme(weatherCode, currentTime, sunriseTime, sunsetTime, timeZone);
  } catch (error) {
    if (weatherDescriptionElement) {
      weatherDescriptionElement.textContent = "Unable to load weather right now.";
    }

    if (weatherIconElement) {
      weatherIconElement.textContent = "⚠️";
    }

    if (outfitMessageElement) {
      outfitMessageElement.textContent = "Please try again later for outfit suggestions.";
    }

    if (temperatureElement) {
      temperatureElement.textContent = "--";
    }

    if (feelsLikeElement) {
      feelsLikeElement.textContent = "--";
    }

    if (windSpeedElement) {
      windSpeedElement.textContent = "--";
    }

    setSearchStatus("Please try a different city or check your connection.", true);
  }
}

async function searchCity(cityName) {
  const trimmedCity = cityName.trim();

  if (!trimmedCity) {
    setSearchStatus("Please enter a city name.", true);
    return;
  }

  setSearchStatus("Searching for your city...");

  try {
    const response = await fetch(
      `${geocodingApi}?name=${encodeURIComponent(trimmedCity)}&count=1&language=en&format=json`,
    );

    if (!response.ok) {
      throw new Error("City lookup failed.");
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      throw new Error("No matching city found.");
    }

    const locationLabel = formatLocationName(result);

    if (citySearchInput) {
      citySearchInput.value = result.name;
    }

    await fetchWeatherForCoordinates(result.latitude, result.longitude, locationLabel);
  } catch (error) {
    setSearchStatus("Sorry, we couldn’t find that city. Try another name.", true);
  }
}

function renderSavedClothes() {
  if (!clothesListElement) {
    return;
  }

  const clothes = getSavedClothes();

  clothesListElement.innerHTML = clothes.length
    ? clothes.map((item) => `<li>${item}</li>`).join("")
    : "<li>No clothes saved yet.</li>";
}

function handleClothesSubmit(event) {
  event.preventDefault();

  if (!clothesInput) {
    return;
  }

  const item = clothesInput.value.trim();

  if (!item) {
    return;
  }

  const clothes = getSavedClothes();
  clothes.push(item);
  saveClothes(clothes);
  renderSavedClothes();
  clothesInput.value = "";
}

if (saveFavoriteCityButton) {
  saveFavoriteCityButton.addEventListener("click", () => saveFavoriteCity(citySearchInput?.value || getSavedFavoriteCity()));
}

unitButtons.forEach((button) => {
  button.addEventListener("click", () => setUnit(button.dataset.unit));
});

if (citySearchForm && citySearchInput) {
  citySearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchCity(citySearchInput.value);
  });
}

if (clothesForm) {
  clothesForm.addEventListener("submit", handleClothesSubmit);
}

if (citySearchInput) {
  const savedFavoriteCity = getSavedFavoriteCity();

  if (savedFavoriteCity) {
    citySearchInput.value = savedFavoriteCity;
  }
}

if (temperatureElement) {
  const savedFavoriteCity = getSavedFavoriteCity();

  if (savedFavoriteCity) {
    searchCity(savedFavoriteCity);
  } else {
    fetchWeatherForCoordinates(defaultCity.latitude, defaultCity.longitude, formatLocationName(defaultCity));
  }
} else {
  renderSavedClothes();
}

if (clothesListElement) {
  renderSavedClothes();
}
