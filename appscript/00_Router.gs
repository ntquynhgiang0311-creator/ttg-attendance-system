/**
 * POST API ROUTER
 */
function doPost(e) {

  try {

    const data = parsePostData(e);

    switch (data.action) {

      // =========================
      // AUTH
      // =========================

      case "login":
        return login(data);


      // =========================
      // EMPLOYEE
      // =========================

      case "addEmployee":
        return addEmployeeV2(data);

      case "updateEmployee":
        return updateEmployeeV2(data);

      case "toggleEmployee":
        return toggleEmployeeV2(data);


      // =========================
      // SITE
      // =========================

      case "addSite":
        return addSite(data);

      case "updateSite":
        return updateSite(data);

      case "toggleSite":
        return toggleSite(data);


      // Giữ tương thích code cũ
      case "disableSite":
        return disableSite(data);


      // =========================
      // ATTENDANCE
      // =========================

      // Giữ action checkIn hiện tại
      case "checkIn":
        return checkIn(data);


      // =========================
      // UNKNOWN ACTION
      // =========================

      default:

        return textResponse(
          "Không tìm thấy action"
        );

    }

  }
  catch (error) {

    logError(
      "doPost",
      error
    );

    return errorResponse(
      "Có lỗi xảy ra",
      error.message
    );

  }

}


/**
 * GET API ROUTER
 */
function doGet(e) {

  try {

    const action =
      e &&
      e.parameter
        ? e.parameter.action
        : "";

    switch (action) {
    

      // =========================
      // EMPLOYEE
      // =========================

      case "employees":
        return getEmployees();


      // Giữ tương thích frontend cũ
      case "employeeList":
        return getEmployees();


     // =========================
     // SITE
     // =========================

      case "sites":
        return getSites();

case "siteList":
  return getSiteList();
      // =========================
      // DASHBOARD
      // =========================

      case "dashboard":
        return getDashboard();


      // =========================
      // ATTENDANCE
      // =========================

      case "history":

        return getHistory(
          e.parameter.manv
        );


      case "attendance":
        return getAttendance();


      // =========================
      // REPORT
      // =========================

      case "report":

        return getReport(
          e.parameter.month,
          e.parameter.year,
          e.parameter.pb
        );


      case "reportDetail":

        return getReportDetail(
          e.parameter.manv,
          e.parameter.month,
          e.parameter.year
        );


      // =========================
      // UNKNOWN ACTION
      // =========================

      default:

        return textResponse(
          "Không tìm thấy action"
        );

    }

  }
  catch (error) {

    logError(
      "doGet",
      error
    );

    return errorResponse(
      "Có lỗi xảy ra",
      error.message
    );

  }

}