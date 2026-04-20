/**
 * app.js — Task Manager frontend logic
 *
 * API base URL is injected at runtime by config.js (loaded before this script).
 * config.js sets window.API_BASE_URL — never hardcoded here.
 *
 * To set up locally:
 *   cp config.example.js config.js
 *   # Edit config.js and set your backend URL
 */

// ── State ─────────────────────────────────────────────────────────────────────
let token = localStorage.getItem("token") || null;
let currentPage = 1;
let currentFilter = null; // null=all, true=completed, false=pending

// ── Bootstrap ─────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if (!window.API_BASE_URL) {
    console.error(
      "[Task Manager] window.API_BASE_URL is not set.\n" +
      "Copy config.example.js → config.js and set the correct backend URL."
    );
  }
  if (token) {
    showSection("dashboard");
    loadTasks();
  } else {
    showSection("auth");
  }
});

// ── Section helpers ───────────────────────────────────────────────────────────
function showSection(name) {
  document.getElementById("auth-section").classList.toggle("hidden", name !== "auth");
  document.getElementById("dashboard-section").classList.toggle("hidden", name !== "dashboard");
}

function showAuthForm(form) {
  const isLogin = form === "login";
  document.getElementById("login-form").classList.toggle("hidden", !isLogin);
  document.getElementById("register-form").classList.toggle("hidden", isLogin);
  document.getElementById("tab-login").classList.toggle("active", isLogin);
  document.getElementById("tab-register").classList.toggle("active", !isLogin);
  clearError("login-error");
  clearError("register-error");
  clearSuccess("register-success");
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; }
}
function clearError(id)   { showError(id, ""); }
function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; }
}
function clearSuccess(id) { showSuccess(id, ""); }

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.querySelector(".btn-text").hidden = loading;
  btn.querySelector(".btn-loading").hidden = !loading;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  clearError("register-error");
  clearSuccess("register-success");
  setLoading("register-submit-btn", true);

  const username = document.getElementById("reg-username").value.trim();
  const email    = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  try {
    const resp = await api("POST", "/auth/register", { username, email, password });
    if (resp.ok) {
      showSuccess("register-success", "Account created! You can now log in.");
      document.getElementById("register-form").reset();
      setTimeout(() => showAuthForm("login"), 1200);
    } else {
      const data = await resp.json();
      showError("register-error", data.detail || "Registration failed.");
    }
  } catch {
    showError("register-error", "Network error. Is the backend running?");
  } finally {
    setLoading("register-submit-btn", false);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  clearError("login-error");
  setLoading("login-submit-btn", true);

  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const resp = await api("POST", "/auth/login", { email, password });
    const data = await resp.json();
    if (resp.ok) {
      token = data.access_token;
      localStorage.setItem("token", token);
      // Decode username from JWT (middle segment, base64)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        document.getElementById("username-display").textContent = payload.sub || email;
      } catch {
        document.getElementById("username-display").textContent = email;
      }
      showSection("dashboard");
      loadTasks(1, null);
    } else {
      showError("login-error", data.detail || "Invalid credentials.");
    }
  } catch {
    showError("login-error", "Network error. Is the backend running?");
  } finally {
    setLoading("login-submit-btn", false);
  }
}

function logout() {
  token = null;
  localStorage.removeItem("token");
  currentPage = 1;
  currentFilter = null;
  document.getElementById("task-list").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";
  showSection("auth");
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
async function loadTasks(page = currentPage, filter = currentFilter) {
  currentPage   = page;
  currentFilter = filter;

  document.getElementById("task-list").innerHTML = '<div class="loading-state">Loading…</div>';
  document.getElementById("pagination").innerHTML = "";

  let url = `/tasks/?page=${page}&size=10`;
  if (filter === true)  url += "&completed=true";
  if (filter === false) url += "&completed=false";

  try {
    const resp = await api("GET", url);
    if (resp.status === 401) { logout(); return; }
    const data = await resp.json();
    renderTasks(data);
    renderPagination(data);
  } catch {
    document.getElementById("task-list").innerHTML =
      '<div class="empty-state">Failed to load tasks. Check your connection.</div>';
  }
}

function renderTasks(data) {
  const container = document.getElementById("task-list");
  if (!data.items || data.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        No tasks yet — add one above!
      </div>`;
    return;
  }

  const html = data.items.map(task => `
    <div class="task-card ${task.completed ? "done" : ""}" id="task-card-${task.id}">
      <div class="task-body">
        <div class="task-title">${escHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ""}
        <span class="task-badge ${task.completed ? "badge-done" : "badge-pending"}">
          ${task.completed ? "Completed" : "Pending"}
        </span>
      </div>
      <div class="task-actions">
        ${!task.completed
          ? `<button class="btn btn-sm btn-done" onclick="markComplete(${task.id})">Done</button>`
          : ""}
        <button class="btn btn-sm btn-del" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `).join("");

  container.innerHTML = `<div class="task-list-inner">${html}</div>`;
}

function renderPagination(data) {
  const container = document.getElementById("pagination");
  if (data.pages <= 1) { container.innerHTML = ""; return; }

  container.innerHTML = `
    <button class="btn btn-sm btn-outline"
      onclick="loadTasks(${data.page - 1})"
      ${data.page <= 1 ? "disabled" : ""}>&larr; Prev</button>
    <span>Page ${data.page} of ${data.pages}</span>
    <button class="btn btn-sm btn-outline"
      onclick="loadTasks(${data.page + 1})"
      ${data.page >= data.pages ? "disabled" : ""}>Next &rarr;</button>
  `;
}

async function createTask(e) {
  e.preventDefault();
  clearError("create-error");
  setLoading("add-task-btn", true);

  const title       = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-description").value.trim() || null;

  if (!title) {
    showError("create-error", "Title is required.");
    setLoading("add-task-btn", false);
    return;
  }

  try {
    const resp = await api("POST", "/tasks/", { title, description });
    if (resp.ok) {
      document.getElementById("create-task-form").reset();
      loadTasks(1, currentFilter);
    } else {
      const data = await resp.json();
      showError("create-error", data.detail || "Failed to create task.");
    }
  } catch {
    showError("create-error", "Network error.");
  } finally {
    setLoading("add-task-btn", false);
  }
}

async function markComplete(taskId) {
  try {
    const resp = await api("PUT", `/tasks/${taskId}`, { completed: true });
    if (resp.ok) loadTasks(currentPage, currentFilter);
  } catch { /* silent */ }
}

async function deleteTask(taskId) {
  try {
    const resp = await api("DELETE", `/tasks/${taskId}`);
    if (resp.status === 204) loadTasks(currentPage, currentFilter);
  } catch { /* silent */ }
}

// ── Filter ────────────────────────────────────────────────────────────────────
function setFilter(value) {
  currentFilter = value;
  currentPage   = 1;

  document.getElementById("filter-all").classList.toggle("active", value === null);
  document.getElementById("filter-pending").classList.toggle("active", value === false);
  document.getElementById("filter-completed").classList.toggle("active", value === true);

  loadTasks(1, value);
}

// ── Utility ───────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const base = (window.API_BASE_URL || "").replace(/\/$/, "");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
