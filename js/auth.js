document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // Initialize users only if not already set
  function initializeUsers() {
    if (!localStorage.getItem("users")) {
      const defaultUsers = [
        { username: "admin", password: "admin123", role: "admin" },
        { username: "user", password: "user123", role: "normal" },
      ];
      localStorage.setItem("users", JSON.stringify(defaultUsers));
    }
  }

  initializeUsers();

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    if (login(username, password)) {
      if (remember) {
        localStorage.setItem("rememberedUser", username);
      } else {
        localStorage.removeItem("rememberedUser");
      }
      redirectToDashboard();
    } else {
      alert("Invalid username or password. Please try again.");
    }
  });

  const rememberedUser = localStorage.getItem("rememberedUser");
  if (rememberedUser && document.getElementById("username")) {
    document.getElementById("username").value = rememberedUser;
    document.getElementById("remember").checked = true;
  }
});

function login(username, password) {
  const users = getUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    return true;
  }
  return false;
}

function redirectToDashboard() {
  window.location.href = "dashboard.html";
}
