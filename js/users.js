document.addEventListener("DOMContentLoaded", function () {
  // Redirect to login if not authenticated or not admin
  if (!isAuthenticated() || !isAdmin()) {
    window.location.href = "index.html";
    return;
  }

  // Set user info in sidebar
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const usernameEl = document.querySelector(".username");
  const roleEl = document.querySelector(".role");
  if (usernameEl) usernameEl.textContent = currentUser.username;
  if (roleEl) roleEl.textContent = "Administrator";

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

  // Initialize user management
  let currentPage = 1;
  const itemsPerPage = 5;
  let currentSearch = "";

  // Load users table
  loadUsersTable();

  // Handle user form submission
  const userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const role = document.getElementById("role").value;

      // Validate inputs
      if (!username || !password || !role) {
        alert("Please fill in all required fields.");
        return;
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }

      const users = getUsers();
      if (
        users.some((u) => u.username.toLowerCase() === username.toLowerCase())
      ) {
        alert("Username already exists. Please choose a different username.");
        return;
      }

      // Add new user
      users.push({ username, password, role });
      localStorage.setItem("users", JSON.stringify(users));
      alert("User added successfully!");
      userForm.reset();
      loadUsersTable();
    });
  }

  // Handle search
  const searchInput = document.getElementById("searchUsers");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentSearch = this.value.toLowerCase();
      currentPage = 1;
      loadUsersTable();
    });
  }

  // Handle pagination
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  if (prevPageBtn && nextPageBtn) {
    prevPageBtn.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage--;
        loadUsersTable();
      }
    });
    nextPageBtn.addEventListener("click", function () {
      const filteredUsers = filterUsers();
      const maxPage = Math.ceil(filteredUsers.length / itemsPerPage);
      if (currentPage < maxPage) {
        currentPage++;
        loadUsersTable();
      }
    });
  }

  // Handle edit user modal
  const editUserModal = document.getElementById("editUserModal");
  const editUserForm = document.getElementById("editUserForm");
  const confirmEdit = document.getElementById("confirmEdit");
  const closeModalButtons = document.querySelectorAll(".close-modal");

  if (editUserModal && editUserForm && confirmEdit) {
    closeModalButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        editUserModal.classList.remove("show");
      });
    });

    confirmEdit.addEventListener("click", function () {
      const username = document.getElementById("editUsername").value;
      const password = document.getElementById("editPassword").value;
      const role = document.getElementById("editRole").value;

      if (!role) {
        alert("Please select a role.");
        return;
      }

      if (password && password.length < 6) {
        alert("New password must be at least 6 characters long.");
        return;
      }

      const users = getUsers();
      const userIndex = users.findIndex((u) => u.username === username);
      if (userIndex !== -1) {
        users[userIndex].role = role;
        if (password) {
          users[userIndex].password = password;
        }
        localStorage.setItem("users", JSON.stringify(users));
        alert("User updated successfully!");
        editUserModal.classList.remove("show");
        loadUsersTable();
      }
    });
  }
});

function filterUsers() {
  const users = getUsers();
  if (!currentSearch) return users;
  return users.filter(
    (u) =>
      u.username.toLowerCase().includes(currentSearch) ||
      u.role.toLowerCase().includes(currentSearch)
  );
}

function loadUsersTable() {
  const users = filterUsers();
  const tableBody = document.getElementById("usersTableBody");
  const pageInfo = document.getElementById("pageInfo");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  if (!tableBody || !pageInfo || !prevPageBtn || !nextPageBtn) return;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedUsers = users.slice(start, end);

  tableBody.innerHTML = paginatedUsers.length
    ? ""
    : "<tr><td colspan='3'>No users available</td></tr>";

  paginatedUsers.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.role === "admin" ? "Administrator" : "Standard User"}</td>
      <td>
        <button class="action-btn edit-btn" data-username="${
          user.username
        }" title="Edit User"><i class="fas fa-edit"></i></button>
        <button class="action-btn delete-btn" data-username="${
          user.username
        }" title="Delete User"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update pagination
  const maxPage = Math.ceil(users.length / itemsPerPage) || 1;
  pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === maxPage;

  // Add event listeners for action buttons
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const username = this.getAttribute("data-username");
      const user = getUsers().find((u) => u.username === username);
      if (user) {
        const editUsername = document.getElementById("editUsername");
        const editRole = document.getElementById("editRole");
        if (editUsername && editRole) {
          editUsername.value = user.username;
          editRole.value = user.role;
          document.getElementById("editUserModal").classList.add("show");
        }
      }
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const username = this.getAttribute("data-username");
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (username === currentUser.username) {
        alert("You cannot delete your own account.");
        return;
      }
      if (confirm(`Are you sure you want to delete user "${username}"?`)) {
        const users = getUsers().filter((u) => u.username !== username);
        localStorage.setItem("users", JSON.stringify(users));
        loadUsersTable();
      }
    });
  });
}
