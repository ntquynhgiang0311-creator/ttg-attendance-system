// ========================================
// API CONFIG
// ========================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbzaMuVBfIzoB2lLxFVHJV4ZCmJ6oVhx36CdaOEox2iCjgJ-uJFl4X4ooUoB8Dg8WFuO/exec";


// ========================================
// API GET
// ========================================

async function apiGet(action, params = {}) {

  const query = new URLSearchParams({
    action,
    ...params
  });

  const response = await fetch(
    `${API_URL}?${query.toString()}`
  );

  if (!response.ok) {

    throw new Error(
      `API lỗi HTTP ${response.status}`
    );

  }

  return response.json();

}


// ========================================
// API POST - TEXT RESPONSE
//
// Dùng cho:
// addEmployee
// updateEmployee
// toggleEmployee
// addSite
// updateSite
// toggleSite
// checkIn
// ========================================

async function apiPostText(
  action,
  data = {}
) {

  const response = await fetch(
    API_URL,
    {
      method: "POST",
      body: JSON.stringify({
        action,
        ...data
      })
    }
  );

  if (!response.ok) {

    throw new Error(
      `API lỗi HTTP ${response.status}`
    );

  }

  return (
    await response.text()
  ).trim();

}


// ========================================
// API POST - JSON RESPONSE
//
// Dùng cho login
// ========================================

async function apiPostJson(
  action,
  data = {}
) {

  const response = await fetch(
    API_URL,
    {
      method: "POST",
      body: JSON.stringify({
        action,
        ...data
      })
    }
  );

  if (!response.ok) {

    throw new Error(
      `API lỗi HTTP ${response.status}`
    );

  }

  return response.json();

}


// ========================================
// USER
// ========================================

function getCurrentUser() {

  try {

    const value =
      localStorage.getItem("user");

    if (!value) {

      return null;

    }

    return JSON.parse(value);

  }
  catch (error) {

    console.error(
      "Không đọc được user:",
      error
    );

    return null;

  }

}


function setCurrentUser(user) {

  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );

}


function clearCurrentUser() {

  localStorage.removeItem("user");

}


// ========================================
// DEVICE ID
// ========================================

function getDeviceId() {

  let deviceId =
    localStorage.getItem("deviceId");

  if (deviceId) {

    return deviceId;

  }


  if (
    crypto &&
    typeof crypto.randomUUID === "function"
  ) {

    deviceId =
      crypto.randomUUID();

  }
  else {

    deviceId =
      generateFallbackDeviceId();

  }


  localStorage.setItem(
    "deviceId",
    deviceId
  );


  return deviceId;

}


function generateFallbackDeviceId() {

  return (

    "device-" +

    Date.now() +

    "-" +

    Math.random()
      .toString(36)
      .substring(2, 15)

  );

}


// ========================================
// HTML ESCAPE
// ========================================

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ========================================
// LOGOUT
// ========================================

function logout() {

  clearCurrentUser();

  window.location.href =
    "login.html";

}