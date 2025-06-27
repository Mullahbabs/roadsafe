document.addEventListener("DOMContentLoaded", function () {
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Set user info in sidebar
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const usernameEl = document.querySelector(".username");
  const roleEl = document.querySelector(".role");
  if (usernameEl) usernameEl.textContent = currentUser.username;
  if (roleEl)
    roleEl.textContent =
      currentUser.role === "admin" ? "Administrator" : "Standard User";

  // Show admin-only menu and fields
  if (isAdmin()) {
    const adminMenuItem = document.getElementById("adminMenuItem");
    if (adminMenuItem) adminMenuItem.classList.remove("hidden");
    document
      .querySelectorAll(".admin-only")
      .forEach((el) => el.classList.remove("hidden"));
  }

  // Set current date
  const currentDateEl = document.getElementById("currentDate");
  if (currentDateEl) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    currentDateEl.textContent = new Date().toLocaleDateString("en-US", options);
  }

  // Handle logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  }

  // Initialize form and result elements
  const predictionForm = document.getElementById("predictionForm");
  const resultCard = document.getElementById("resultCard");
  if (!predictionForm || !resultCard) {
    console.error("Prediction form or result card not found");
    return;
  }

  // Load scenarios for admins
  if (isAdmin()) {
    loadScenarios();
    const scenarioSelect = document.getElementById("scenarioSelect");
    if (scenarioSelect) {
      scenarioSelect.addEventListener("change", function () {
        const scenarioId = parseInt(this.value);
        if (scenarioId) {
          const scenarios = getScenarios();
          const scenario = scenarios.find((s) => s.id === scenarioId);
          if (scenario) {
            document.getElementById("vehicleType").value =
              scenario.data.vehicleType || "";
            document.getElementById("speed").value = scenario.data.speed || "";
            document.getElementById("roadCondition").value =
              scenario.data.roadCondition || "";
            document.getElementById("weather").value =
              scenario.data.weather || "";
            document.getElementById("driverExperience").value =
              scenario.data.driverExperience || "";
            document.getElementById("location").value =
              scenario.data.location || "";
            document.getElementById("additionalNotes").value =
              scenario.data.additionalNotes || "";
          }
        } else {
          predictionForm.reset();
        }
      });
    }
  }

  // Handle form submission
  predictionForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate inputs
    const vehicleType = document.getElementById("vehicleType").value;
    const speed = parseInt(document.getElementById("speed").value);
    const roadCondition = document.getElementById("roadCondition").value;
    const weather = document.getElementById("weather").value;
    const driverExperience = parseInt(
      document.getElementById("driverExperience").value
    );
    const location = document.getElementById("location").value.trim() || "N/A";
    const additionalNotes =
      document.getElementById("additionalNotes").value.trim() || "N/A";
    const scenarioName =
      document.getElementById("scenarioName")?.value.trim() || "";

    if (!vehicleType || !roadCondition || !weather) {
      alert("Please fill in all required fields.");
      return;
    }

    if (speed < 0 || speed > 250) {
      alert("Speed must be between 0 and 250 km/h.");
      return;
    }

    if (driverExperience < 0 || driverExperience > 60) {
      alert("Driver experience must be between 0 and 60 years.");
      return;
    }

    // Calculate severity
    const severity = predictSeverity(
      vehicleType,
      speed,
      roadCondition,
      weather,
      driverExperience
    );

    const predictionData = {
      id: Date.now(),
      vehicleType,
      speed,
      roadCondition,
      weather,
      driverExperience,
      location,
      additionalNotes,
      severity,
      timestamp: new Date().toISOString(),
    };

    // Save scenario if admin and scenario name provided
    if (isAdmin() && scenarioName) {
      const scenarioSaved = saveScenario(scenarioName, predictionData);
      if (scenarioSaved) {
        loadScenarios();
        document.getElementById("scenarioName").value = "";
        alert("Scenario saved successfully!");
      } else {
        alert("Scenario name already exists. Please choose a different name.");
      }
    }

    // Show result
    showPredictionResult(predictionData);
  });

  // Handle reset button
  predictionForm.addEventListener("reset", function () {
    resultCard.classList.add("hidden");
    if (document.getElementById("scenarioSelect")) {
      document.getElementById("scenarioSelect").value = "";
    }
  });

  // Handle save prediction
  const savePredictionBtn = document.getElementById("savePrediction");
  if (savePredictionBtn) {
    savePredictionBtn.addEventListener("click", function () {
      const predictionData = JSON.parse(this.dataset.result || "{}");
      if (predictionData.id) {
        savePrediction(predictionData);
        alert("Prediction saved successfully!");
        resultCard.classList.add("hidden");
        predictionForm.reset();
      } else {
        alert("Error saving prediction. Please try again.");
      }
    });
  }

  // Handle new prediction
  const newPredictionBtn = document.getElementById("newPrediction");
  if (newPredictionBtn) {
    newPredictionBtn.addEventListener("click", function () {
      resultCard.classList.add("hidden");
      predictionForm.reset();
      if (document.getElementById("scenarioSelect")) {
        document.getElementById("scenarioSelect").value = "";
      }
    });
  }
});

function predictSeverity(
  vehicleType,
  speed,
  roadCondition,
  weather,
  experience
) {
  // Define factors for severity calculation
  const vehicleFactor =
    {
      motorcycle: 1.8,
      car: 1.0,
      truck: 1.5,
      bus: 1.6,
      other: 1.3,
    }[vehicleType] || 1.0;

  const roadFactor =
    {
      excellent: 0.8,
      good: 1.0,
      fair: 1.3,
      poor: 1.8,
    }[roadCondition] || 1.0;

  const weatherFactor =
    {
      clear: 1.0,
      rain: 1.4,
      fog: 1.7,
      snow: 2.0,
    }[weather] || 1.0;

  const experienceFactor = experience >= 10 ? 0.8 : experience >= 5 ? 0.9 : 1.0;
  const speedFactor =
    speed >= 120 ? 2.0 : speed >= 80 ? 1.5 : speed >= 40 ? 1.2 : 1.0;

  // Calculate base severity (1-10 scale)
  let severity = 3; // Baseline
  severity *= vehicleFactor;
  severity *= roadFactor;
  severity *= weatherFactor;
  severity *= experienceFactor;
  severity *= speedFactor;

  // Normalize to 1-10 scale
  severity = Math.min(Math.max(Math.round(severity), 1), 10);
  return severity;
}

function showPredictionResult(predictionData) {
  const resultCard = document.getElementById("resultCard");
  const severityValue = document.getElementById("severityValue");
  const meterFill = document.getElementById("meterFill");
  const factorsList = document.getElementById("factorsList");

  if (!resultCard || !severityValue || !meterFill || !factorsList) {
    console.error("Missing required DOM elements for prediction result");
    return;
  }

  // Update result display
  severityValue.textContent = predictionData.severity;
  meterFill.style.width = `${predictionData.severity * 10}%`;

  // Populate factors list
  factorsList.innerHTML = `
    <li><span class="factor-name">Vehicle Type:</span><span class="factor-value">${
      predictionData.vehicleType.charAt(0).toUpperCase() +
      predictionData.vehicleType.slice(1)
    }</span></li>
    <li><span class="factor-name">Speed:</span><span class="factor-value">${
      predictionData.speed
    } km/h</span></li>
    <li><span class="factor-name">Road Condition:</span><span class="factor-value">${
      predictionData.roadCondition.charAt(0).toUpperCase() +
      predictionData.roadCondition.slice(1)
    }</span></li>
    <li><span class="factor-name">Weather:</span><span class="factor-value">${
      predictionData.weather.charAt(0).toUpperCase() +
      predictionData.weather.slice(1)
    }</span></li>
    <li><span class="factor-name">Driver Experience:</span><span class="factor-value">${
      predictionData.driverExperience
    } years</span></li>
    <li><span class="factor-name">Location:</span><span class="factor-value">${
      predictionData.location
    }</span></li>
    <li><span class="factor-name">Notes:</span><span class="factor-value">${
      predictionData.additionalNotes
    }</span></li>
  `;

  // Store prediction data for saving
  document.getElementById("savePrediction").dataset.result =
    JSON.stringify(predictionData);

  // Show result card with animation
  resultCard.classList.remove("hidden");
  resultCard.classList.add("show");
  resultCard.scrollIntoView({ behavior: "smooth" });
}

function loadScenarios() {
  const scenarioSelect = document.getElementById("scenarioSelect");
  if (!scenarioSelect) return;

  const scenarios = getScenarios();
  scenarioSelect.innerHTML =
    '<option value="">Select a saved scenario</option>';

  scenarios.forEach((scenario) => {
    const option = document.createElement("option");
    option.value = scenario.id;
    option.textContent = scenario.name;
    scenarioSelect.appendChild(option);
  });
}
