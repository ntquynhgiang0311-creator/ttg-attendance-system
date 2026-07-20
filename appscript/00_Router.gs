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

      case "updateHREmployeeProfile":
      return updateHREmployeeProfile(data);

      case "addLeaveRequest":
      return addLeaveRequest(data);

      case "updateLeaveRequestStatus":
      return updateLeaveRequestStatus(data);
      
      // =========================
      // CONTRACT
      // =========================

      case "addEmployeeContract":
      return addEmployeeContract(data);

      case "updateEmployeeContract":
      return updateEmployeeContract(data);

      case "updateEmployeeContractStatus":
      return updateEmployeeContractStatus(data);

      
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

      

  case "addAttendanceAdjustmentRequest":
  return addAttendanceAdjustmentRequest(data);

case "updateAttendanceAdjustmentStatus":
  return updateAttendanceAdjustmentStatus(data);

      // =========================
      // SALARY
      // =========================

      case "savePayrollConfig":
     return savePayrollConfig(data);

      case "resetPayrollConfig":
      return resetPayrollConfig(data);

      case "addAdvanceRequest":
  return addAdvanceRequest(data);

case "updateAdvanceRequestStatus":
  return updateAdvanceRequestStatus(data);
     

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

case "attendanceAdjustmentRequests":
  return getAttendanceAdjustmentRequests(
    e.parameter.status,
    e.parameter.keyword
  );

case "employeeAttendanceAdjustmentRequests":
  return getEmployeeAttendanceAdjustmentRequests(
    e.parameter.manv
  );

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
        case "advanceRequests":
  return getAdvanceRequests(
    e.parameter.status,
    e.parameter.keyword,
    e.parameter.month,
    e.parameter.year
  );

case "employeeAdvanceRequests":
  return getEmployeeAdvanceRequests(
    e.parameter.manv
  );

case "approvedAdvanceTotal":
  return getApprovedAdvanceTotal(
    e.parameter.manv,
    e.parameter.month,
    e.parameter.year
  );
     // =========================
     // HR MASTER DATA
     // =========================

      case "departments":
        return getDepartments();

      case "departmentList":
        return getDepartmentList();

      case "positions":
       return getPositions();

      case "positionList":
        return getPositionList();

      case "hrEmployeeDetail":
        return getHREmployeeDetail(
           e.parameter.manv
          );

      case "employeeContracts":
        return getEmployeeContracts(
          e.parameter.manv
          );
      
      case "contractList":
      return getContractList(
        e.parameter.status,
        e.parameter.keyword
      );

      case "contractAlerts":
      return getContractAlerts(
        e.parameter.days
      );

      case "leaveRequests":
      return getLeaveRequests(
        e.parameter.status,
        e.parameter.keyword
      );

      case "employeeLeaveRequests":
      return getEmployeeLeaveRequests(
        e.parameter.manv
      );

      case "approvedEmployeeLeaves":
  return getApprovedEmployeeLeaves(
    e.parameter.manv,
    e.parameter.month,
    e.parameter.year
  );
      // =========================
      // SALARY
      // =========================

    case "payrollConfig":
    return getPayrollConfig(
    e.parameter.month,
    e.parameter.year
    );

    case "payrollDraft":
  return getPayrollDraft(
    e.parameter.month,
    e.parameter.year,
    e.parameter.pb
  );

   // =========================
      // HISTORY LOG
      // =========================

        case "systemLogs":
        return getSystemLogs(
        e.parameter.module,
        e.parameter.keyword,
        e.parameter.limit
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