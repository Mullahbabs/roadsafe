document.addEventListener("DOMContentLoaded", function () {
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

  // Simulate weather based on time (05:47 AM WAT, June 29, 2025)
  const currentHour = 5; // 05:47 AM WAT
  const isNight = currentHour < 6 || currentHour >= 18;
  // Simulate weather: early morning in Nigeria (June, rainy season) likely Rain or Fog
  const currentWeather = isNight
    ? "Fog"
    : Math.random() < 0.7
    ? "Rain"
    : "Clear";

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

  // Update DOM
  const date = new Date();
  date.setHours(5, 47, 0, 0); // Set to 05:47 AM WAT
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
  weatherInfo.textContent = `${currentWeather} | ${formattedDate} | ${timeString} WAT`;

  speedCar.textContent = `${speeds.car} km/h`;
  speedMotorcycle.textContent = `${speeds.motorcycle} km/h`;
  speedTruck.textContent = `${speeds.truck} km/h`;
  speedBus.textContent = `${speeds.bus} km/h`;
  speedOther.textContent = `${speeds.other} km/h`;
});
