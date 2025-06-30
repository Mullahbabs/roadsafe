document.addEventListener("DOMContentLoaded", async function () {
  const weatherInfo = document.getElementById("weatherInfo");
  const speedCar = document.getElementById("speedCar");
  const speedMotorcycle = document.getElementById("speedMotorcycle");
  const speedTruck = document.getElementById("speedTruck");
  const speedBus = document.getElementById("speedBus");
  const speedOther = document.getElementById("speedOther");

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

  // Open-Meteo API configuration
  const lat = 4.9757; // Calabar, Nigeria latitude
  const lon = 8.3417; // Calabar, Nigeria longitude
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,rain,showers,snowfall,weather_code,cloud_cover,visibility,wind_speed_80m&current=temperature_2m,relative_humidity_2m,is_day,rain,showers,snowfall,weather_code&timezone=auto`;

  try {
    // Fetch weather data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    // Extract weather condition using WMO weather code
    const weatherCode = data.current.weather_code;
    let currentWeather;
    if (weatherCode === 0) {
      currentWeather = "Clear";
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      currentWeather = "Rain"; // Includes drizzle, rain, showers
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      currentWeather = "Fog"; // Fog and depositing rime fog
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      currentWeather = "Snow"; // Snow and snow showers
    } else {
      currentWeather = "Clear"; // Fallback for clouds, thunderstorms, etc.
    }

    // Base speed limits (km/h) for good conditions (Clear)
    const baseSpeeds = {
      car: 80,
      motorcycle: 60,
      truck: 60,
      bus: 70,
      other: 65,
    };

    // Weather adjustment factors
    const weatherFactors = {
      Clear: 1.0,
      Rain: 0.7,
      Fog: 0.5,
      Snow: 0.4,
    };

    // Calculate safe speeds
    const weatherFactor = weatherFactors[currentWeather] || 1.0;
    const speeds = {
      car: Math.round(baseSpeeds.car * weatherFactor),
      motorcycle: Math.round(baseSpeeds.motorcycle * weatherFactor),
      truck: Math.round(baseSpeeds.truck * weatherFactor),
      bus: Math.round(baseSpeeds.bus * weatherFactor),
      other: Math.round(baseSpeeds.other * weatherFactor),
    };

    // Update DOM with weather, date, and time
    const date = new Date();
    date.setHours(4, 0, 0, 0); // Set to 04:00 AM WAT
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
    weatherInfo.innerHTML = `
  <i class="fas fa-cloud" aria-hidden="true" style="color: white"></i> ${currentWeather} | 
  <i class="fas fa-calendar-alt" aria-hidden="true" style="color: #4cc9f0"></i> ${formattedDate} | 
  <i class="fas fa-clock" aria-hidden="true" style="color: #ef233c"></i> ${timeString} WAT
`;

    // Update speed recommendations
    speedCar.textContent = `${speeds.car} km/h`;
    speedMotorcycle.textContent = `${speeds.motorcycle} km/h`;
    speedTruck.textContent = `${speeds.truck} km/h`;
    speedBus.textContent = `${speeds.bus} km/h`;
    speedOther.textContent = `${speeds.other} km/h`;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    weatherInfo.textContent = "Unable to load weather data";
    // Set default speeds to 0
    speedCar.textContent = "0 km/h";
    speedMotorcycle.textContent = "0 km/h";
    speedTruck.textContent = "0 km/h";
    speedBus.textContent = "0 km/h";
    speedOther.textContent = "0 km/h";
  }
});
