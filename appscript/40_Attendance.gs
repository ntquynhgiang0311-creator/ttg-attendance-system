/**
 * Giữ tương thích action "checkIn" hiện tại
 *
 * Thực tế hàm này xử lý cả:
 * - Check In
 * - Check Out
 */
function checkIn(data) {

  return recordAttendance(data);

}


/**
 * Ghi nhận chấm công
 */
function recordAttendance(data) {

  const lock = LockService
    .getScriptLock();

  // Tránh double click tạo 2 record
  if (!lock.tryLock(5000)) {

    return textResponse(
      "Hệ thống đang xử lý. Vui lòng thử lại."
    );

  }

  try {

    // =========================
    // CHUẨN HÓA DỮ LIỆU
    // =========================

    const manv = normalizeText(
      data.manv
    );

    const maCT = normalizeText(
      data.mact
    );

    const type = normalizeText(
      data.type
    );

    const deviceId = normalizeText(
      data.deviceId
    );

    const latitude = Number(
      data.latitude
    );

    const longitude = Number(
      data.longitude
    );


    // =========================
    // KIỂM TRA DỮ LIỆU CƠ BẢN
    // =========================

    if (isEmpty(manv)) {

      return textResponse(
        "Thiếu mã nhân viên"
      );

    }

    if (isEmpty(maCT)) {

      return textResponse(
        "Thiếu mã công trình"
      );

    }

    if (isEmpty(deviceId)) {

      return textResponse(
        "Không xác định được thiết bị"
      );

    }

    if (
      type !== CONFIG.ATTENDANCE_TYPE.CHECK_IN &&
      type !== CONFIG.ATTENDANCE_TYPE.CHECK_OUT
    ) {

      return textResponse(
        "Loại chấm công không hợp lệ"
      );

    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      return textResponse(
        "Tọa độ GPS không hợp lệ"
      );

    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {

      return textResponse(
        "Tọa độ GPS không hợp lệ"
      );

    }


    // =========================
    // KIỂM TRA NHÂN VIÊN
    // =========================

    const employeeSheet = getSheet(
      CONFIG.SHEETS.EMPLOYEES
    );

    const employeeValues = employeeSheet
      .getDataRange()
      .getValues();

    let employee = null;

    for (
      let i = 1;
      i < employeeValues.length;
      i++
    ) {

      if (
        normalizeText(
          employeeValues[i][0]
        ) === manv
      ) {

        employee = {

          manv:
            employeeValues[i][0],

          hoten:
            employeeValues[i][1],

          status:
            normalizeText(
              employeeValues[i][5]
            ),

          deviceId:
            normalizeText(
              employeeValues[i][6]
            )

        };

        break;

      }

    }


    if (!employee) {

      return textResponse(
        "Không tìm thấy nhân viên"
      );

    }


    if (
      employee.status !==
      CONFIG.STATUS.ACTIVE
    ) {

      return textResponse(
        "Tài khoản nhân viên đã bị khóa"
      );

    }


    if (
      isEmpty(employee.deviceId)
    ) {

      return textResponse(
        "Thiết bị chưa được liên kết. Vui lòng đăng nhập lại."
      );

    }


    if (
      employee.deviceId !== deviceId
    ) {

      return textResponse(
        "Thiết bị không khớp với tài khoản"
      );

    }


    // =========================
    // KIỂM TRA CÔNG TRÌNH
    // =========================

    const siteSheet = getSheet(
      CONFIG.SHEETS.SITES
    );

    const siteValues = siteSheet
      .getDataRange()
      .getValues();

    let site = null;

    for (
      let i = 1;
      i < siteValues.length;
      i++
    ) {

      if (
        normalizeText(
          siteValues[i][0]
        ) === maCT
      ) {

        site = {

          ma:
            siteValues[i][0],

          ten:
            siteValues[i][1],

          lat:
            Number(siteValues[i][4]),

          lng:
            Number(siteValues[i][5]),

          radius:
            Number(siteValues[i][6]),

          status:
            normalizeText(
              siteValues[i][7]
            )

        };

        break;

      }

    }


    if (!site) {

      return textResponse(
        "Không tìm thấy công trình"
      );

    }


    if (
      site.status !==
      CONFIG.STATUS.ACTIVE
    ) {

      return textResponse(
        "Công trình đã ngừng hoạt động"
      );

    }


    if (
      !Number.isFinite(site.lat) ||
      !Number.isFinite(site.lng) ||
      !Number.isFinite(site.radius) ||
      site.radius <= 0
    ) {

      return textResponse(
        "Cấu hình GPS công trình không hợp lệ"
      );

    }


    // =========================
    // SERVER TỰ TÍNH KHOẢNG CÁCH
    // =========================

    const distance =
      calculateDistanceMeters(

        latitude,

        longitude,

        site.lat,

        site.lng

      );


    if (
      distance > site.radius
    ) {

      return textResponse(

        "Bạn đang cách công trình " +

        Math.round(distance) +

        "m. Phạm vi cho phép là " +

        Math.round(site.radius) +

        "m."

      );

    }


    // =========================
    // KIỂM TRA TRẠNG THÁI HÔM NAY
    // =========================

    const attendanceSheet = getSheet(
      CONFIG.SHEETS.ATTENDANCE
    );

    const attendanceValues =
      attendanceSheet
        .getDataRange()
        .getValues();

    const today = formatDateKey(
      new Date()
    );

    let hasCheckIn = false;

    let hasCheckOut = false;


    for (
      let i = 1;
      i < attendanceValues.length;
      i++
    ) {

      const attendanceManv =
        normalizeText(
          attendanceValues[i][1]
        );

      if (
        attendanceManv !== manv
      ) {

        continue;

      }


      const attendanceTime =
        attendanceValues[i][0];

      if (
        isEmpty(attendanceTime)
      ) {

        continue;

      }


      const attendanceDay =
        formatDateKey(
          attendanceTime
        );


      if (
        attendanceDay !== today
      ) {

        continue;

      }


      const attendanceType =
        normalizeText(
          attendanceValues[i][3]
        );


      if (
        attendanceType ===
        CONFIG.ATTENDANCE_TYPE.CHECK_IN
      ) {

        hasCheckIn = true;

      }


      if (
        attendanceType ===
        CONFIG.ATTENDANCE_TYPE.CHECK_OUT
      ) {

        hasCheckOut = true;

      }

    }


    // =========================
    // KIỂM TRA LUỒNG CHECK IN
    // =========================

    if (
      type ===
      CONFIG.ATTENDANCE_TYPE.CHECK_IN
    ) {

      if (hasCheckIn) {

        return textResponse(
          "Bạn đã Check In hôm nay"
        );

      }


      if (hasCheckOut) {

        return textResponse(
          "Dữ liệu chấm công hôm nay không hợp lệ"
        );

      }

    }


    // =========================
    // KIỂM TRA LUỒNG CHECK OUT
    // =========================

    if (
      type ===
      CONFIG.ATTENDANCE_TYPE.CHECK_OUT
    ) {

      if (!hasCheckIn) {

        return textResponse(
          "Bạn chưa Check In hôm nay"
        );

      }


      if (hasCheckOut) {

        return textResponse(
          "Bạn đã Check Out hôm nay"
        );

      }

    }


    // =========================
    // GHI CHẤM CÔNG
    // =========================

    attendanceSheet.appendRow([

      new Date(),

      manv,

      maCT,

      type,

      latitude,

      longitude,

      Math.round(distance),

      deviceId

    ]);


    SpreadsheetApp.flush();


    return textResponse("OK");

  }
  catch (error) {

    logError(
      "recordAttendance",
      error
    );

    return textResponse(

      "ERROR: " +

      error.message

    );

  }
  finally {

    lock.releaseLock();

  }

}


/**
 * Lịch sử chấm công của nhân viên
 */
function getHistory(manv) {

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const employeeCode =
    normalizeText(manv);

  const result = [];


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      normalizeText(
        values[i][1]
      ) !== employeeCode
    ) {

      continue;

    }


    result.push({

      time:
        values[i][0],

      type:
        values[i][3],

      mact:
        values[i][2],

      distance:
        values[i][6]

    });

  }


  result.reverse();


  return jsonResponse(result);

}


/**
 * Danh sách toàn bộ dữ liệu chấm công
 */
function getAttendance() {

  const attendanceValues = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  )
    .getDataRange()
    .getValues();


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


  const employeeMap = {};

  const siteMap = {};


  // =========================
  // MAP NHÂN VIÊN
  // =========================

  for (
    let i = 1;
    i < employeeValues.length;
    i++
  ) {

    employeeMap[
      employeeValues[i][0]
    ] = employeeValues[i][1];

  }


  // =========================
  // MAP CÔNG TRÌNH
  // =========================

  for (
    let i = 1;
    i < siteValues.length;
    i++
  ) {

    siteMap[
      siteValues[i][0]
    ] =

      siteValues[i][2] +

      " · " +

      siteValues[i][1];

  }


  // =========================
  // TẠO KẾT QUẢ
  // =========================

  const result = [];


  for (
    let i = 1;
    i < attendanceValues.length;
    i++
  ) {

    const manv =
      attendanceValues[i][1];

    const maCT =
      attendanceValues[i][2];


    result.push({

      time:
        attendanceValues[i][0],

      manv:
        manv,

      hoten:
        employeeMap[manv] ||
        manv,

      mact:
        maCT,

      congtrinh:
        siteMap[maCT] ||
        maCT,

      type:
        attendanceValues[i][3],

      distance:
        attendanceValues[i][6]

    });

  }


  return jsonResponse(result);

}


/**
 * Tính khoảng cách GPS bằng Haversine
 *
 * Kết quả: mét
 */
function calculateDistanceMeters(
  lat1,
  lng1,
  lat2,
  lng2
) {

  const earthRadius = 6371000;


  const latitude1 =
    degreesToRadians(lat1);

  const latitude2 =
    degreesToRadians(lat2);


  const latitudeDelta =
    degreesToRadians(
      lat2 - lat1
    );

  const longitudeDelta =
    degreesToRadians(
      lng2 - lng1
    );


  const a =

    Math.sin(
      latitudeDelta / 2
    ) *

    Math.sin(
      latitudeDelta / 2
    ) +

    Math.cos(latitude1) *

    Math.cos(latitude2) *

    Math.sin(
      longitudeDelta / 2
    ) *

    Math.sin(
      longitudeDelta / 2
    );


  const c =

    2 *

    Math.atan2(

      Math.sqrt(a),

      Math.sqrt(1 - a)

    );


  return earthRadius * c;

}


/**
 * Đổi độ sang radian
 */
function degreesToRadians(
  degrees
) {

  return degrees *
    Math.PI /
    180;

}