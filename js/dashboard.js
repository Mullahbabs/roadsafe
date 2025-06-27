document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const usernameEl = document.querySelector(".username");
  const roleEl = document.querySelector(".role");
  if (usernameEl) usernameEl.textContent = currentUser.username;
  if (roleEl)
    roleEl.textContent =
      currentUser.role === "admin" ? "Administrator" : "Standard User";

  if (isAdmin()) {
    const adminMenuItem = document.getElementById("adminMenuItem");
    if (adminMenuItem) adminMenuItem.classList.remove("hidden");
  }

  const currentDateEl = document.getElementById("currentDate");
  if (currentDateEl) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    currentDateEl.textContent = new Date().toLocaleDateString("en-US", options);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  }

  loadDashboardData();
  initCharts();
  loadRecentPredictions();
});

function loadDashboardData() {
  const predictions = getPredictions();

  const highRiskCountEl = document.getElementById("highRiskCount");
  const totalPredictionsEl = document.getElementById("totalPredictions");
  const riskyRoadEl = document.getElementById("riskyRoad");
  const severityReductionEl = document.getElementById("severityReduction");

  if (highRiskCountEl) {
    highRiskCountEl.textContent = predictions.filter(
      (p) => p.severity >= 8
    ).length;
  }
  if (totalPredictionsEl) {
    totalPredictionsEl.textContent = predictions.length;
  }

  if (predictions.length > 0 && riskyRoadEl) {
    const roadCounts = predictions.reduce((acc, p) => {
      acc[p.roadCondition] = (acc[p.roadCondition] || 0) + 1;
      return acc;
    }, {});
    const mostRiskyRoad = Object.entries(roadCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ["N/A", 0]
    )[0];
    riskyRoadEl.textContent =
      mostRiskyRoad.charAt(0).toUpperCase() + mostRiskyRoad.slice(1);
  }

  if (predictions.length >= 2 && severityReductionEl) {
    const recent = predictions.slice(-Math.min(predictions.length, 10));
    const older = predictions.slice(0, Math.min(predictions.length, 10));
    const recentAvg =
      recent.reduce((sum, p) => sum + p.severity, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, p) => sum + p.severity, 0) / older.length;
    const reduction = olderAvg
      ? (((olderAvg - recentAvg) / olderAvg) * 100).toFixed(0)
      : 0;
    severityReductionEl.textContent = `${reduction}%`;
  }
}

function initCharts() {
  const predictions = getPredictions();
  const timePeriodEl = document.getElementById("timePeriod");
  if (!timePeriodEl) return;

  const ctx = document.getElementById("severityChart")?.getContext("2d");
  const ctxPie = document.getElementById("severityPieChart")?.getContext("2d");
  if (!ctx || !ctxPie) return;

  let severityChart, severityPieChart;

  function updateCharts(period = "month") {
    let filteredPredictions = predictions;
    const now = new Date();
    if (period !== "quarter") {
      const days = period === "week" ? 7 : 30;
      const startDate = new Date(now.setDate(now.getDate() - days));
      filteredPredictions = predictions.filter(
        (p) => new Date(p.timestamp) >= startDate
      );
    }

    const labels = filteredPredictions.map((p) =>
      new Date(p.timestamp).toLocaleDateString()
    );
    const data = filteredPredictions.map((p) => p.severity);

    if (severityChart) severityChart.destroy();
    severityChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels.length ? labels : ["No Data"],
        datasets: [
          {
            label: "Average Severity",
            data: data.length ? data : [0],
            borderColor: "#4361ee",
            backgroundColor: "rgba(67, 97, 238, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 10 },
        },
      },
    });

    const severityCounts = [0, 0, 0]; // Low, Medium, High
    filteredPredictions.forEach((p) => {
      if (p.severity >= 8) severityCounts[2]++;
      else if (p.severity >= 4) severityCounts[1]++;
      else severityCounts[0]++;
    });

    if (severityPieChart) severityPieChart.destroy();
    severityPieChart = new Chart(ctxPie, {
      type: "doughnut",
      data: {
        labels: ["Low (1-3)", "Medium (4-6)", "High (7-10)"],
        datasets: [
          {
            data: severityCounts,
            backgroundColor: ["#4cc9f0", "#f8961e", "#ef233c"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  updateCharts(timePeriodEl.value);
  timePeriodEl.addEventListener("change", () =>
    updateCharts(timePeriodEl.value)
  );
}

function loadRecentPredictions() {
  const predictions = getPredictions().slice(-5).reverse();
  const tableBody = document.getElementById("predictionsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = predictions.length
    ? ""
    : "<tr><td colspan='6'>No predictions available</td></tr>";

  predictions.forEach((prediction) => {
    const severityClass =
      prediction.severity >= 8
        ? "high"
        : prediction.severity >= 4
        ? "medium"
        : "low";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${prediction.id.toString().slice(-6)}</td>
      <td>${
        prediction.vehicleType.charAt(0).toUpperCase() +
        prediction.vehicleType.slice(1)
      }</td>
      <td>${prediction.location || "N/A"}</td>
      <td><span class="severity-badge ${severityClass}">${
      prediction.severity
    }/10</span></td>
      <td>${new Date(prediction.timestamp).toLocaleDateString()}</td>
      <td><button class="btn-icon view-btn" data-id="${
        prediction.id
      }" title="View Details"><i class="fas fa-eye"></i></button></td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const predictionId = parseInt(this.getAttribute("data-id"));
      const prediction = getPredictions().find((p) => p.id === predictionId);
      if (prediction) {
        alert(
          `Prediction Details:\n\nID: ${prediction.id}\nVehicle: ${prediction.vehicleType}\nSpeed: ${prediction.speed} km/h\nRoad: ${prediction.roadCondition}\nWeather: ${prediction.weather}\nDriver Experience: ${prediction.driverExperience} years\nSeverity: ${prediction.severity}/10`
        );
      }
    });
  });
}
