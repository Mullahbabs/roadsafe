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

  // Show admin-only menu
  if (isAdmin()) {
    const adminMenuItem = document.getElementById("adminMenuItem");
    if (adminMenuItem) adminMenuItem.classList.remove("hidden");
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

  // Initialize form elements
  const accidentReportForm = document.getElementById("accidentReportForm");
  const resultCard = document.getElementById("resultCard");
  const stateSelect = document.getElementById("state");
  const lgaSelect = document.getElementById("lga");
  const townSelect = document.getElementById("town");

  if (
    !accidentReportForm ||
    !resultCard ||
    !stateSelect ||
    !lgaSelect ||
    !townSelect
  ) {
    console.error("Missing required DOM elements");
    return;
  }

  // Nigeria location data (simplified for demo)
  const locationData = {
    lagos: {
      lgas: ["Ikeja", "Lagos Island", "Epe", "Ikorodu"],
      towns: {
        Ikeja: ["Opebi", "Magodo", "Ojodu"],
        "Lagos Island": ["Victoria Island", "Ikoyi", "Lekki"],
        Epe: ["Epe Town", "Ijebu-Ode"],
        Ikorodu: ["Ikorodu Town", "Imota"],
      },
    },
    abuja: {
      lgas: ["Abaji", "Gwagwalada", "Kuje"],
      towns: {
        Abaji: ["Abaji Town", "Yaba"],
        Gwagwalada: ["Gwagwalada Town", "Dobi"],
        Kuje: ["Kuje Town", "Ruboci"],
      },
    },
    kano: {
      lgas: ["Kano Municipal", "Dala", "Fagge"],
      towns: {
        "Kano Municipal": ["Kano City", "Zaria Road"],
        Dala: ["Dala Town", "Kofar Mazugal"],
        Fagge: ["Fagge Town", "Sabon Gari"],
      },
    },
    rivers: {
      lgas: ["Port Harcourt", "Obio/Akpor", "Ikwerre"],
      towns: {
        "Port Harcourt": ["Diobu", "Trans Amadi"],
        "Obio/Akpor": ["Rumuodara", "Rumuokoro"],
        Ikwerre: ["Isiokpo", "Aluu"],
      },
    },
    oyo: {
      lgas: ["Ibadan North", "Ibadan South-West", "Ogbomosho"],
      towns: {
        "Ibadan North": ["Bodija", "Agbowo"],
        "Ibadan South-West": ["Challenge", "Ring Road"],
        Ogbomosho: ["Ogbomosho Town", "Sabo"],
      },
    },
  };

  // Populate LGAs based on state
  stateSelect.addEventListener("change", function () {
    const state = this.value;
    lgaSelect.innerHTML =
      '<option value="" disabled selected>Select LGA</option>';
    townSelect.innerHTML =
      '<option value="" disabled selected>Select town</option>';
    if (state && locationData[state]) {
      locationData[state].lgas.forEach((lga) => {
        const option = document.createElement("option");
        option.value = lga.toLowerCase().replace(/\s/g, "-");
        option.textContent = lga;
        lgaSelect.appendChild(option);
      });
    }
  });

  // Populate towns based on LGA
  lgaSelect.addEventListener("change", function () {
    const state = stateSelect.value;
    const lga = this.value.replace(/-/g, " ");
    townSelect.innerHTML =
      '<option value="" disabled selected>Select town</option>';
    if (state && lga && locationData[state]?.towns[lga]) {
      locationData[state].towns[lga].forEach((town) => {
        const option = document.createElement("option");
        option.value = town.toLowerCase().replace(/\s/g, "-");
        option.textContent = town;
        townSelect.appendChild(option);
      });
    }
  });

  // Handle form submission
  accidentReportForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate inputs
    const state = stateSelect.value;
    const lga = lgaSelect.value;
    const town = townSelect.value;
    const vehicleType = document.getElementById("vehicleType").value;
    const vehicleCount = parseInt(
      document.getElementById("vehicleCount").value
    );
    const injuryCount = parseInt(document.getElementById("injuryCount").value);
    const roadCondition = document.getElementById("roadCondition").value;
    const weather = document.getElementById("weather").value;
    const estimatedTime = document.getElementById("estimatedTime").value;
    const mortalities = document.getElementById("mortalities").value;
    const description =
      document.getElementById("description").value.trim() || "N/A";

    if (
      !state ||
      !lga ||
      !town ||
      !vehicleType ||
      !roadCondition ||
      !weather ||
      !estimatedTime
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (vehicleCount < 1 || vehicleCount > 10) {
      alert("Number of vehicles must be between 1 and 10.");
      return;
    }

    if (injuryCount < 0 || injuryCount > 10) {
      alert("Number of injuries must be between 0 and 10.");
      return;
    }

    // Calculate severity
    const severity = calculateAccidentSeverity(
      vehicleType,
      vehicleCount,
      injuryCount,
      roadCondition,
      weather,
      estimatedTime,
      mortalities
    );
    const severityCategory =
      severity >= 8 ? "Critical" : severity >= 4 ? "Major" : "Minor";

    const reportData = {
      id: Date.now(),
      location: { state, lga, town },
      vehicleType,
      vehicleCount,
      injuryCount,
      roadCondition,
      weather,
      estimatedTime,
      mortalities: mortalities || "0",
      description,
      severity,
      severityCategory,
      timestamp: new Date().toISOString(),
      reportedBy: currentUser.username,
    };

    // Save report
    saveAccidentReport(reportData);

    // Show result
    showReportResult(reportData);

    // Notify user
    alert(
      "Accident reported successfully! First responders have been notified."
    );
  });

  // Handle reset button
  accidentReportForm.addEventListener("reset", function () {
    resultCard.classList.add("hidden");
    lgaSelect.innerHTML =
      '<option value="" disabled selected>Select LGA</option>';
    townSelect.innerHTML =
      '<option value="" disabled selected>Select town</option>';
  });

  // Handle new report button
  const newReportBtn = document.getElementById("newReport");
  if (newReportBtn) {
    newReportBtn.addEventListener("click", function () {
      resultCard.classList.add("hidden");
      accidentReportForm.reset();
      lgaSelect.innerHTML =
        '<option value="" disabled selected>Select LGA</option>';
      townSelect.innerHTML =
        '<option value="" disabled selected>Select town</option>';
    });
  }
});

function calculateAccidentSeverity(
  vehicleType,
  vehicleCount,
  injuryCount,
  roadCondition,
  weather,
  estimatedTime,
  mortalities
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

  const vehicleCountFactor =
    vehicleCount >= 7 ? 2.0 : vehicleCount >= 4 ? 1.5 : 1.0;
  const injuryFactor =
    injuryCount >= 7
      ? 2.5
      : injuryCount >= 3
      ? 1.8
      : injuryCount >= 1
      ? 1.3
      : 1.0;
  const timeFactor =
    {
      now: 1.5,
      "30min": 1.3,
      "1hour": 1.1,
      uncertain: 1.0,
    }[estimatedTime] || 1.0;
  const mortalityFactor =
    {
      0: 1.0,
      1: 2.0,
      2: 2.5,
      3: 3.0,
      4: 3.5,
      5: 4.0,
      more: 5.0,
      "": 1.0,
    }[mortalities] || 1.0;

  // Calculate base severity (1-10 scale)
  let severity = 3; // Baseline
  severity *= vehicleFactor;
  severity *= roadFactor;
  severity *= weatherFactor;
  severity *= vehicleCountFactor;
  severity *= injuryFactor;
  severity *= timeFactor;
  severity *= mortalityFactor;

  // Normalize to 1-10 scale
  severity = Math.min(Math.max(Math.round(severity), 1), 10);
  return severity;
}

function showReportResult(reportData) {
  const resultCard = document.getElementById("resultCard");
  const severityValue = document.getElementById("severityValue");
  const severityCategory = document.getElementById("severityCategory");
  const meterFill = document.getElementById("meterFill");
  const detailsList = document.getElementById("detailsList");

  if (
    !resultCard ||
    !severityValue ||
    !severityCategory ||
    !meterFill ||
    !detailsList
  ) {
    console.error("Missing required DOM elements for report result");
    return;
  }

  // Update result display
  severityValue.textContent = reportData.severity;
  severityCategory.textContent = reportData.severityCategory;
  meterFill.style.width = `${reportData.severity * 10}%`;

  // Capitalize location fields
  const stateText =
    reportData.location.state.charAt(0).toUpperCase() +
    reportData.location.state.slice(1);
  const lgaText = reportData.location.lga
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const townText = reportData.location.town
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Populate details list
  detailsList.innerHTML = `
    <li><span class="factor-name">Location:</span><span class="factor-value">${stateText}, ${lgaText}, ${townText}</span></li>
    <li><span class="factor-name">Vehicle Type:</span><span class="factor-value">${
      reportData.vehicleType.charAt(0).toUpperCase() +
      reportData.vehicleType.slice(1)
    }</span></li>
    <li><span class="factor-name">Vehicles Involved:</span><span class="factor-value">${
      reportData.vehicleCount
    }</span></li>
    <li><span class="factor-name">Injuries:</span><span class="factor-value">${
      reportData.injuryCount
    }</span></li>
    <li><span class="factor-name">Road Condition:</span><span class="factor-value">${
      reportData.roadCondition.charAt(0).toUpperCase() +
      reportData.roadCondition.slice(1)
    }</span></li>
    <li><span class="factor-name">Weather:</span><span class="factor-value">${
      reportData.weather.charAt(0).toUpperCase() + reportData.weather.slice(1)
    }</span></li>
    <li><span class="factor-name">Estimated Time:</span><span class="factor-value">${
      {
        now: "At the moment",
        "30min": "Less than 30 minutes ago",
        "1hour": "Less than an hour ago",
        uncertain: "Uncertain",
      }[reportData.estimatedTime]
    }</span></li>
    <li><span class="factor-name">Suspected Mortalities:</span><span class="factor-value">${
      reportData.mortalities === "more"
        ? "More than 5"
        : reportData.mortalities || "None"
    }</span></li>
    <li><span class="factor-name">Description:</span><span class="factor-value">${
      reportData.description
    }</span></li>
    <li><span class="factor-name">Reported By:</span><span class="factor-value">${
      reportData.reportedBy
    }</span></li>
  `;

  // Show result card with animation
  resultCard.classList.remove("hidden");
  resultCard.classList.add("show");
  resultCard.scrollIntoView({ behavior: "smooth" });
}
