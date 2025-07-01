document.addEventListener("DOMContentLoaded", async function () {
  const weatherInfo = document.getElementById("weatherInfo");
  const speedCar = document.getElementById("speedCar");
  const speedMotorcycle = document.getElementById("speedMotorcycle");
  const speedTruck = document.getElementById("speedTruck");
  const speedBus = document.getElementById("speedBus");
  const speedOther = document.getElementById("speedOther");
  const cityInput = document.getElementById("cityInput");

  if (
    !weatherInfo ||
    !speedCar ||
    !speedMotorcycle ||
    !speedTruck ||
    !speedBus ||
    !speedOther
  ) {
    console.error("Weather widget elements not found");
    return;
  }

  // Default location: Calabar, Nigeria
  let lat = 4.9757;
  let lon = 8.3417;
  let locationName = "Calabar";

  // Cache key for localStorage
  const cacheKey = `weather_${lat}_${lon}`;
  const cacheTTL = 15 * 60 * 1000; // 15 minutes

  // Function to get user location via geolocation
  const getLocation = () =>
    new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            }),
          () => resolve({ lat, lon, name: locationName }) // Fallback to Calabar
        );
      } else {
        resolve({ lat, lon, name: locationName });
      }
    });

  // Function to get coordinates from city name
  const getCoordinates = async (city) => {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}`;
      const response = await fetch(geoUrl);
      if (!response.ok) throw new Error("Geocoding API error");
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].latitude,
          lon: data.results[0].longitude,
          name: data.results[0].name,
        };
      }
      return { lat, lon, name: locationName }; // Fallback to Calabar
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return { lat, lon, name: locationName };
    }
  };

  // Function to fetch weather data
  const fetchWeather = async (lat, lon, locationName) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}¤t=weather_code,time&timezone=auto`;

    // Check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheTTL) {
        return { data, locationName };
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      // Cache result
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data, timestamp: Date.now() })
      );
      return { data, locationName };
    } catch (error) {
      throw error;
    }
  };

  // Function to update DOM
  const updateDOM = (currentWeather, speeds, apiTime, locationName) => {
    const date = apiTime ? new Date(apiTime) : new Date();
    if (!apiTime) date.setHours(4, 40, 0, 0); // Fallback to 04:40 AM WAT
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = date.toLocaleDateString("en-US", {
      ...options,
      timeZone: "Africa/Lagos",
    });
    const timeString = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Lagos",
    });
    weatherInfo.textContent = `${currentWeather} in ${locationName} | ${formattedDate} | ${timeString} WAT`;

    speedCar.textContent = `${speeds.car} km/h`;
    speedMotorcycle.textContent = `${speeds.motorcycle} km/h`;
    speedTruck.textContent = `${speeds.truck} km/h`;
    speedBus.textContent = `${speeds.bus} km/h`;
    speedOther.textContent = `${speeds.other} km/h`;
  };

  // Main logic
  try {
    // Check if city input exists and has value
    let coords = { lat, lon, name: locationName };
    if (cityInput && cityInput.value.trim()) {
      coords = await getCoordinates(cityInput.value.trim());
      lat = coords.lat;
      lon = coords.lon;
      locationName = coords.name;
    } else {
      coords = await getLocation();
      lat = coords.lat;
      lon = coords.lon;
      locationName = coords.name || "Calabar";
    }

    const { data, locationName: finalLocationName } = await fetchWeather(
      lat,
      lon,
      locationName
    );

    // Extract weather condition
    const weatherCode = data.current.weather_code;
    let currentWeather;
    if (weatherCode === 0) {
      currentWeather = "Clear";
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      currentWeather = "Rain";
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      currentWeather = "Fog";
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      currentWeather = "Snow";
    } else {
      currentWeather = "Clear";
    }

    // Calculate safe speeds
    const baseSpeeds = {
      car: 80,
      motorcycle: 60,
      truck: 60,
      bus: 70,
      other: 65,
    };
    const weatherFactors = {
      Clear: 1.0,
      Rain: 0.7,
      Fog: 0.5,
      Snow: 0.4,
    };
    const weatherFactor = weatherFactors[currentWeather] || 1.0;
    const speeds = {
      car: Math.round(baseSpeeds.car * weatherFactor),
      motorcycle: Math.round(baseSpeeds.motorcycle * weatherFactor),
      truck: Math.round(baseSpeeds.truck * weatherFactor),
      bus: Math.round(baseSpeeds.bus * weatherFactor),
      other: Math.round(baseSpeeds.other * weatherFactor),
    };

    // Update DOM
    updateDOM(currentWeather, speeds, data.current.time, finalLocationName);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    weatherInfo.textContent = `Unable to load weather data for ${locationName}`;
    speedCar.textContent = "0 km/h";
    speedMotorcycle.textContent = "0 km/h";
    speedTruck.textContent = "0 km/h";
    speedBus.textContent = "0 km/h";
    speedOther.textContent = "0 km/h";

    // Fallback time display
    updateDOM(
      "Unknown",
      { car: 0, motorcycle: 0, truck: 0, bus: 0, other: 0 },
      null,
      locationName
    );
  }

  // Event listener for city input
  if (cityInput) {
    window.fetchWeatherByCity = async () => {
      const city = cityInput.value.trim();
      if (!city) return;
      try {
        const coords = await getCoordinates(city);
        const { data, locationName } = await fetchWeather(
          coords.lat,
          coords.lon,
          coords.name
        );
        const weatherCode = data.current.weather_code;
        let currentWeather;
        if (weatherCode === 0) {
          currentWeather = "Clear";
        } else if (weatherCode >= 51 && weatherCode <= 67) {
          currentWeather = "Rain";
        } else if (weatherCode >= 45 && weatherCode <= 48) {
          currentWeather = "Fog";
        } else if (weatherCode >= 71 && weatherCode <= 77) {
          currentWeather = "Snow";
        } else {
          currentWeather = "Clear";
        }
        const weatherFactor = weatherFactors[currentWeather] || 1.0;
        const speeds = {
          car: Math.round(baseSpeeds.car * weatherFactor),
          motorcycle: Math.round(baseSpeeds.motorcycle * weatherFactor),
          truck: Math.round(baseSpeeds.truck * weatherFactor),
          bus: Math.round(baseSpeeds.bus * weatherFactor),
          other: Math.round(baseSpeeds.other * weatherFactor),
        };
        updateDOM(currentWeather, speeds, data.current.time, locationName);
      } catch (error) {
        console.error("Error fetching weather for city:", error);
        weatherInfo.textContent = `Unable to load weather data for ${city}`;
        updateDOM(
          "Unknown",
          { car: 0, motorcycle: 0, truck: 0, bus: 0, other: 0 },
          null,
          city
        );
      }
    };
  }
});
