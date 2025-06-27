function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function isAuthenticated() {
  return !!localStorage.getItem("currentUser");
}

function isAdmin() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  return currentUser && currentUser.role === "admin";
}

function getPredictions() {
  return JSON.parse(localStorage.getItem("predictions")) || [];
}

function savePrediction(prediction) {
  const predictions = getPredictions();
  predictions.push(prediction);
  localStorage.setItem("predictions", JSON.stringify(predictions));
}

function getScenarios() {
  return JSON.parse(localStorage.getItem("scenarios")) || [];
}

function saveScenario(name, data) {
  const scenarios = getScenarios();
  if (scenarios.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    return false; // Scenario name already exists
  }
  scenarios.push({ id: data.id, name, data });
  localStorage.setItem("scenarios", JSON.stringify(scenarios));
  return true;
}

function deletePrediction(predictionId) {
  let predictions = getPredictions();
  predictions = predictions.filter((p) => p.id !== predictionId);
  localStorage.setItem("predictions", JSON.stringify(predictions));
}
