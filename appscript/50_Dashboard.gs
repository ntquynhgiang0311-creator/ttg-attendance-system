/**
 * Dashboard chấm công
 */
function getDashboard() {

  const employeeValues = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  )
    .getDataRange()
    .getValues();


  const siteValues = getSheet(
    CONFIG.SHEETS.SITES
  )
    .getDataRange()
    .getValues();


  const attendanceValues = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  )
    .getDataRange()
    .getValues();


  // =========================
  // NHÂN VIÊN ACTIVE
  // =========================

  const activeEmployees = {};

  let activeEmployeeCount = 0;


  for (
    let i = 1;
    i < employeeValues.length;
    i++
  ) {

    const manv = normalizeText(
      employeeValues[i][0]
    );

    const status = normalizeText(
      employeeValues[i][5]
    );


    if (
      status !== CONFIG.STATUS.ACTIVE
    ) {

      continue;

    }


    activeEmployees[manv] = true;

    activeEmployeeCount++;

  }


  // =========================
  // CÔNG TRÌNH ACTIVE
  // =========================

  let activeSiteCount = 0;


  for (
    let i = 1;
    i < siteValues.length;
    i++
  ) {

    const status = normalizeText(
      siteValues[i][7]
    );


    if (
      status === CONFIG.STATUS.ACTIVE
    ) {

      activeSiteCount++;

    }

  }


  // =========================
  // CHECK IN HÔM NAY
  // =========================

  const today = formatDateKey(
    new Date()
  );


  const checkedEmployees = {};


  for (
    let i = 1;
    i < attendanceValues.length;
    i++
  ) {

    const time =
      attendanceValues[i][0];


    if (isEmpty(time)) {

      continue;

    }


    const manv = normalizeText(
      attendanceValues[i][1]
    );


    // Chỉ tính nhân viên đang Active
    if (
      !activeEmployees[manv]
    ) {

      continue;

    }


    const type = normalizeText(
      attendanceValues[i][3]
    );


    if (
      type !==
      CONFIG.ATTENDANCE_TYPE.CHECK_IN
    ) {

      continue;

    }


    const attendanceDate =
      new Date(time);


    if (
      isNaN(attendanceDate.getTime())
    ) {

      continue;

    }


    const attendanceDay =
      formatDateKey(
        attendanceDate
      );


    if (
      attendanceDay !== today
    ) {

      continue;

    }


    checkedEmployees[manv] = true;

  }


  const checkedInCount =
    Object.keys(
      checkedEmployees
    ).length;


  const notCheckedInCount =
    Math.max(

      0,

      activeEmployeeCount -
      checkedInCount

    );


  // =========================
  // RESPONSE
  // =========================

  return jsonResponse({

    tongNV:
      activeEmployeeCount,

    tongCT:
      activeSiteCount,

    checkin:
      checkedInCount,

    chuacheckin:
      notCheckedInCount

  });

}