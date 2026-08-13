// ========================================
// API CONFIG
// ========================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbxrIO8iFkWk8qc8OHVOT-hrihnwEJ8piVl_B73aMqL2eGGWwHBAt6ddLh2EpB_5D29f/exec";


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
function getExportValueByIds(ids) {

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const element =
            document.getElementById(
                ids[i]
            );

        if (
            element &&
            element.value
        ) {

            return element.value;

        }

    }

    return "";

}


function getExportSelectedTextByIds(ids) {

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const element =
            document.getElementById(
                ids[i]
            );

        if (!element) {

            continue;

        }

        if (
            element.tagName === "SELECT" &&
            element.selectedIndex >= 0
        ) {

            return element.options[
                element.selectedIndex
            ].text || element.value || "";

        }

        if (element.value) {

            return element.value;

        }

    }

    return "";

}


function styleExportTable(table) {

    table.style.borderCollapse =
        "collapse";

    table.style.fontFamily =
        "Arial, sans-serif";

    table.style.fontSize =
        "12px";

    table.style.width =
        "100%";

    table
        .querySelectorAll("th")
        .forEach(function(th) {

            th.style.backgroundColor =
                "#15803d";

            th.style.color =
                "#ffffff";

            th.style.fontWeight =
                "700";

            th.style.textAlign =
                "center";

            th.style.border =
                "1px solid #d9ead3";

            th.style.padding =
                "8px";

        });

    table
        .querySelectorAll("td")
        .forEach(function(td) {

            td.style.border =
                "1px solid #d9ead3";

            td.style.padding =
                "7px";

            td.style.verticalAlign =
                "middle";

        });

}


function downloadHtmlExcelFile(
    html,
    fileName
) {

    const blob =
        new Blob(
            [html],
            {
                type: "application/vnd.ms-excel;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}