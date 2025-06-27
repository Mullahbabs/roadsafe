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

  // Initialize report page
  let currentPage = 1;
  const itemsPerPage = 10;
  let currentFilter = "all";
  let currentVehicleFilter = "all";
  let currentSearch = "";

  // Load initial data
  loadSummaryCards();
  initCharts();
  loadPredictionsTable();

  // Handle report range filter
  const reportRange = document.getElementById("reportRange");
  if (reportRange) {
    reportRange.addEventListener("change", function () {
      currentPage = 1;
      loadSummaryCards();
      initCharts();
      loadPredictionsTable();
    });
  }

  // Handle severity filter
  const severityFilter = document.getElementById("severityFilter");
  if (severityFilter) {
    severityFilter.addEventListener("change", function () {
      currentFilter = this.value;
      currentPage = 1;
      loadPredictionsTable();
    });
  }

  // Handle vehicle filter
  const severityDistributionFilter = document.getElementById(
    "severityDistributionFilter"
  );
  if (severityDistributionFilter) {
    severityDistributionFilter.addEventListener("change", function () {
      currentVehicleFilter = this.value;
      initCharts();
    });
  }

  // Handle search
  const searchInput = document.getElementById("searchPredictions");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentSearch = this.value.toLowerCase();
      currentPage = 1;
      loadPredictionsTable();
    });
  }

  // Handle pagination
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  if (prevPageBtn && nextPageBtn) {
    prevPageBtn.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage--;
        loadPredictionsTable();
      }
    });
    nextPageBtn.addEventListener("click", function () {
      const filteredPredictions = filterPredictions();
      const maxPage = Math.ceil(filteredPredictions.length / itemsPerPage);
      if (currentPage < maxPage) {
        currentPage++;
        loadPredictionsTable();
      }
    });
  }

  // Handle export modal
  const exportBtn = document.getElementById("exportBtn");
  const exportModal = document.getElementById("exportModal");
  const confirmExport = document.getElementById("confirmExport");
  const closeModalButtons = document.querySelectorAll(".close-modal");

  if (exportBtn && exportModal && confirmExport) {
    exportBtn.addEventListener("click", function () {
      exportModal.classList.add("show");
    });

    closeModalButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        exportModal.classList.remove("show");
      });
    });

    confirmExport.addEventListener("click", function () {
      const format = document.querySelector(
        'input[name="exportFormat"]:checked'
      ).value;
      exportReport(format);
      exportModal.classList.remove("show");
    });
  }
});

function filterPredictions() {
  const predictions = getPredictions();
  const reportRange = document.getElementById("reportRange")?.value || "all";
  const now = new Date();
  let filteredPredictions = predictions;

  // Apply date range filter
  if (reportRange !== "all") {
    const days = parseInt(reportRange);
    const startDate = new Date(now.setDate(now.getDate() - days));
    filteredPredictions = predictions.filter(
      (p) => new Date(p.timestamp) >= startDate
    );
  }

  // Apply severity filter
  if (currentFilter !== "all") {
    filteredPredictions = filteredPredictions.filter((p) => {
      if (currentFilter === "high") return p.severity >= 8;
      if (currentFilter === "medium") return p.severity >= 4 && p.severity < 8;
      if (currentFilter === "low") return p.severity < 4;
      return true;
    });
  }

  // Apply vehicle filter for charts
  if (currentVehicleFilter !== "all") {
    filteredPredictions = filteredPredictions.filter(
      (p) => p.vehicleType === currentVehicleFilter
    );
  }

  // Apply search filter
  if (currentSearch) {
    filteredPredictions = filteredPredictions.filter(
      (p) =>
        p.vehicleType.toLowerCase().includes(currentSearch) ||
        p.location.toLowerCase().includes(currentSearch) ||
        p.roadCondition.toLowerCase().includes(currentSearch) ||
        p.weather.toLowerCase().includes(currentSearch)
    );
  }

  return filteredPredictions;
}

function loadSummaryCards() {
  const predictions = getPredictions();
  const reportRange = document.getElementById("reportRange")?.value || "all";
  const now = new Date();
  let filteredPredictions = predictions;

  if (reportRange !== "all") {
    const days = parseInt(reportRange);
    const startDate = new Date(now.setDate(now.getDate() - days));
    filteredPredictions = predictions.filter(
      (p) => new Date(p.timestamp) >= startDate
    );
  }

  const highSeverityCountEl = document.getElementById("highSeverityCount");
  const totalPredictionsCountEl = document.getElementById(
    "totalPredictionsCount"
  );
  const commonFactorEl = document.getElementById("commonFactor");
  const highSeverityChangeEl = document.getElementById("highSeverityChange");
  const totalPredictionsChangeEl = document.getElementById(
    "totalPredictionsChange"
  );
  const commonFactorImpactEl = document.getElementById("commonFactorImpact");

  if (highSeverityCountEl) {
    const highSeverity = filteredPredictions.filter(
      (p) => p.severity >= 8
    ).length;
    highSeverityCountEl.textContent = highSeverity;
    highSeverityChangeEl.textContent = calculateChange(
      predictions,
      reportRange,
      (p) => p.severity >= 8
    );
  }

  if (totalPredictionsCountEl) {
    totalPredictionsCountEl.textContent = filteredPredictions.length;
    totalPredictionsChangeEl.textContent = calculateChange(
      predictions,
      reportRange,
      () => true
    );
  }

  if (commonFactorEl && filteredPredictions.length > 0) {
    const factors = filteredPredictions.reduce((acc, p) => {
      acc[p.roadCondition] = (acc[p.roadCondition] || 0) + p.severity;
      return acc;
    }, {});
    const commonFactor = Object.entries(factors).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    commonFactorEl.textContent =
      commonFactor.charAt(0).toUpperCase() + commonFactor.slice(1);
    commonFactorImpactEl.textContent = `Contributes ${(
      factors[commonFactor] / filteredPredictions.length
    ).toFixed(1)}/10 to severity`;
  }
}

function calculateChange(predictions, range, condition) {
  const now = new Date();
  let currentPeriod, previousPeriod;

  if (range === "all") {
    currentPeriod = predictions.filter(condition);
    previousPeriod = [];
  } else {
    const days = parseInt(range);
    const currentStart = new Date(now.setDate(now.getDate() - days));
    currentPeriod = predictions.filter(
      (p) => new Date(p.timestamp) >= currentStart && condition(p)
    );
    const prevStart = new Date(
      currentStart.setDate(currentStart.getDate() - days)
    );
    previousPeriod = predictions.filter(
      (p) =>
        new Date(p.timestamp) >= prevStart &&
        new Date(p.timestamp) < currentStart &&
        condition(p)
    );
  }

  const currentCount = currentPeriod.length;
  const prevCount = previousPeriod.length;
  if (prevCount === 0) return "N/A";
  const change = (((currentCount - prevCount) / prevCount) * 100).toFixed(1);
  return `${change}% vs previous period`;
}

function initCharts() {
  const predictions = filterPredictions();
  const ctxDistribution = document
    .getElementById("severityDistributionChart")
    ?.getContext("2d");
  const ctxFactors = document.getElementById("factorsChart")?.getContext("2d");
  if (!ctxDistribution || !ctxFactors) return;

  let severityChart, factorsChart;

  // Severity Distribution Chart
  const severityCounts = [0, 0, 0]; // Low, Medium, High
  predictions.forEach((p) => {
    if (p.severity >= 8) severityCounts[2]++;
    else if (p.severity >= 4) severityCounts[1]++;
    else severityCounts[0]++;
  });

  if (severityChart) severityChart.destroy();
  severityChart = new Chart(ctxDistribution, {
    type: "bar",
    data: {
      labels: ["Low (1-3)", "Medium (4-7)", "High (8-10)"],
      datasets: [
        {
          label: "Severity Distribution",
          data: severityCounts,
          backgroundColor: ["#4cc9f0", "#f8961e", "#ef233c"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  // Factors Correlation Chart
  const factorsData = {
    roadCondition: { excellent: 0, good: 0, fair: 0, poor: 0 },
    weather: { clear: 0, rain: 0, fog: 0, snow: 0 },
  };

  predictions.forEach((p) => {
    factorsData.roadCondition[p.roadCondition] += p.severity;
    factorsData.weather[p.weather] += p.severity;
  });

  if (factorsChart) factorsChart.destroy();
  factorsChart = new Chart(ctxFactors, {
    type: "bar",
    data: {
      labels: [
        "Excellent",
        "Good",
        "Fair",
        "Poor",
        "Clear",
        "Rain",
        "Fog",
        "Snow",
      ],
      datasets: [
        {
          label: "Impact on Severity",
          data: [
            factorsData.roadCondition.excellent,
            factorsData.roadCondition.good,
            factorsData.roadCondition.fair,
            factorsData.roadCondition.poor,
            factorsData.weather.clear,
            factorsData.weather.rain,
            factorsData.weather.fog,
            factorsData.weather.snow,
          ],
          backgroundColor: [
            "#4cc9f0",
            "#4cc9f0",
            "#4cc9f0",
            "#4cc9f0",
            "#f8961e",
            "#f8961e",
            "#f8961e",
            "#f8961e",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function loadPredictionsTable() {
  const predictions = filterPredictions();
  const tableBody = document.getElementById("predictionsTableBody");
  const pageInfo = document.getElementById("pageInfo");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  if (!tableBody || !pageInfo || !prevPageBtn || !nextPageBtn) return;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedPredictions = predictions.slice(start, end);

  tableBody.innerHTML = paginatedPredictions.length
    ? ""
    : "<tr><td colspan='8'>No predictions available</td></tr>";

  paginatedPredictions.forEach((prediction) => {
    const severityClass =
      prediction.severity >= 8
        ? "high"
        : prediction.severity >= 4
        ? "medium"
        : "low";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${prediction.id.toString().slice(-6)}</td>
      <td>${new Date(prediction.timestamp).toLocaleDateString()}</td>
      <td>${
        prediction.vehicleType.charAt(0).toUpperCase() +
        prediction.vehicleType.slice(1)
      }</td>
      <td>${prediction.speed} km/h</td>
      <td>${
        prediction.roadCondition.charAt(0).toUpperCase() +
        prediction.roadCondition.slice(1)
      }</td>
      <td>${
        prediction.weather.charAt(0).toUpperCase() + prediction.weather.slice(1)
      }</td>
      <td><span class="severity-badge ${severityClass}">${
      prediction.severity
    }/10</span></td>
      <td>
        <button class="action-btn view-btn" data-id="${
          prediction.id
        }" title="View Details"><i class="fas fa-eye"></i></button>
        <button class="action-btn delete-btn" data-id="${
          prediction.id
        }" title="Delete Prediction"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update pagination
  const maxPage = Math.ceil(predictions.length / itemsPerPage) || 1;
  pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === maxPage;

  // Add event listeners for action buttons
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const predictionId = parseInt(this.getAttribute("data-id"));
      const prediction = getPredictions().find((p) => p.id === predictionId);
      if (prediction) {
        alert(
          `Prediction Details:\n\nID: ${prediction.id}\nDate: ${new Date(
            prediction.timestamp
          ).toLocaleDateString()}\nVehicle: ${prediction.vehicleType}\nSpeed: ${
            prediction.speed
          } km/h\nRoad: ${prediction.roadCondition}\nWeather: ${
            prediction.weather
          }\nDriver Experience: ${
            prediction.driverExperience
          } years\nSeverity: ${prediction.severity}/10\nLocation: ${
            prediction.location
          }\nNotes: ${prediction.additionalNotes}`
        );
      }
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (confirm("Are you sure you want to delete this prediction?")) {
        const predictionId = parseInt(this.getAttribute("data-id"));
        deletePrediction(predictionId);
        currentPage = 1;
        loadPredictionsTable();
        loadSummaryCards();
        initCharts();
      }
    });
  });
}

function exportReport(format) {
  const predictions = filterPredictions();
  if (!predictions.length) {
    alert("No predictions available to export.");
    return;
  }

  if (format === "csv") {
    const headers = [
      "ID",
      "Date",
      "Vehicle",
      "Speed",
      "Road Condition",
      "Weather",
      "Driver Experience",
      "Severity",
      "Location",
      "Notes",
    ];
    const csvContent = [
      headers.join(","),
      ...predictions.map((p) =>
        [
          p.id,
          `"${new Date(p.timestamp).toLocaleDateString()}"`,
          `"${p.vehicleType}"`,
          p.speed,
          `"${p.roadCondition}"`,
          `"${p.weather}"`,
          p.driverExperience,
          p.severity,
          `"${p.location}"`,
          `"${p.additionalNotes}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `predictions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (format === "json") {
    const blob = new Blob([JSON.stringify(predictions, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `predictions_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert("PDF export is not available yet.");
  }
}
