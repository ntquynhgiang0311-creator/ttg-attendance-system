/**
 * Setup Sheet Chấm công bù.
 *
 * Chạy 1 lần.
 */
function setupAttendanceAdjustmentSheet() {

  const sheet =
    getOrCreateAttendanceAdjustmentSheet_();

  const headers = [

    "MaDon",

    "MaNV",

    "NgayChamCong",

    "MaCT",

    "GioVao",

    "GioRa",

    "LyDo",

    "TrangThai",

    "NguoiDuyet",

    "NgayDuyet",

    "GhiChuDuyet",

    "CreatedAt"

  ];

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

  sheet.setFrozenRows(1);

  setupAttendanceSourceColumns_();

  return textResponse(
    "SETUP_ATTENDANCE_ADJUSTMENT_OK"
  );

}


/**
 * Thêm cột nguồn vào ChamCong.
 *
 * Không ảnh hưởng dữ liệu cũ.
 */
function setupAttendanceSourceColumns_() {

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  );

  const headers = [

    "Nguon",

    "MaDonBu",

    "NguoiDuyet"

  ];

  sheet
    .getRange(
      1,
      9,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

}


/**
 * Nhân viên gửi đơn chấm công bù.
 *
 * Bản an toàn:
 * - Validate trước
 * - Append xong trả OK ngay
 * - Không để lỗi phụ làm frontend báo sai
 */
function addAttendanceAdjustmentRequest(data) {

  const validation =
    validateAttendanceAdjustmentInput_(data);

  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }

  const request =
    validation.request;

  const lock =
    LockService.getScriptLock();

  let locked = false;

  try {

    lock.waitLock(10000);

    locked = true;

    const sheet = getSheet(
      CONFIG.SHEETS.ATTENDANCE_ADJUSTMENTS
    );

    const maDon =
      generateNextCode(
        sheet,
        1,
        CONFIG.CODE_PREFIX.ATTENDANCE_ADJUSTMENT,
        CONFIG.CODE_LENGTH.ATTENDANCE_ADJUSTMENT
      );

    sheet.appendRow([

      maDon,

      request.manv,

      request.ngayChamCong,

      request.mact,

      request.gioVao,

      request.gioRa,

      request.lyDo,

      "Chờ duyệt",

      "",

      "",

      "",

      new Date()

    ]);

    return textResponse("OK");

  }
  catch (error) {

    logError(
      "addAttendanceAdjustmentRequest",
      error
    );

    return textResponse(
      "Không tạo được đơn chấm công bù"
    );

  }
  finally {

    if (locked) {

      try {

        lock.releaseLock();

      }
      catch (error) {

        Logger.log(
          "releaseLock addAttendanceAdjustmentRequest error: " +
          error.message
        );

      }

    }

  }

}


/**
 * Admin duyệt / từ chối đơn chấm công bù.
 *
 * Nếu duyệt:
 * - Backend kiểm tra admin thật.
 * - Chỉ duyệt trong ngày.
 * - Ghi bổ sung Check In / Check Out vào Sheet ChamCong.
 */
function updateAttendanceAdjustmentStatus(data) {

  data = data || {};

  const maDon =
    normalizeText(data.maDon);

  const trangThai =
    normalizeText(data.trangThai);

  const approverManv =
    normalizeText(data.approverManv);

  const ghiChuDuyet =
    normalizeText(data.ghiChuDuyet);

  if (isEmpty(maDon)) {

    return textResponse(
      "Thiếu mã đơn"
    );

  }

  if (
    trangThai !== "Đã duyệt" &&
    trangThai !== "Từ chối"
  ) {

    return textResponse(
      "Trạng thái duyệt không hợp lệ"
    );

  }

  const approver =
    getAdminApproverForAttendanceAdjustment_(
      approverManv
    );

  if (!approver) {

    return textResponse(
      "Người duyệt không hợp lệ hoặc không có quyền Admin"
    );

  }

  const nguoiDuyet =
    approver.manv +
    " - " +
    approver.hoten;

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE_ADJUSTMENTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(10000);

    for (
      let i = 1;
      i < values.length;
      i++
    ) {

      if (
        normalizeText(values[i][0]) !== maDon
      ) {

        continue;

      }

      const currentStatus =
        normalizeText(values[i][7]);

      if (
        currentStatus !== "Chờ duyệt"
      ) {

        return textResponse(
          "Đơn này đã được xử lý"
        );

      }

     const request = {

  maDon:
    normalizeText(values[i][0]),

  manv:
    normalizeText(values[i][1]),

  ngayChamCong:
    formatAttendanceAdjustmentDateForClient_(values[i][2]),

  mact:
    normalizeText(values[i][3]),

  gioVao:
    formatAttendanceAdjustmentTimeForClient_(values[i][4]),

  gioRa:
    formatAttendanceAdjustmentTimeForClient_(values[i][5]),

  lyDo:
    normalizeText(values[i][6])

};

      if (
        trangThai === "Đã duyệt"
      ) {

        const approveValidation =
          validateAttendanceAdjustmentApproval_(
            request
          );

        if (!approveValidation.success) {

          return textResponse(
            approveValidation.message
          );

        }

        writeAttendanceAdjustmentToAttendance_(
          request,
          nguoiDuyet
        );

      }

      sheet
  .getRange(
    i + 1,
    8,
    1,
    4
  )
  .setValues([

    [

      trangThai,

      nguoiDuyet,

      new Date(),

      ghiChuDuyet

    ]

  ]);

writeSystemLog({

  actorManv:
    approverManv,

  module:
    "ChamCongBu",

  action:
    trangThai,

  targetId:
    maDon,

  oldValue:
    {
      trangThai: currentStatus
    },

  newValue:
    {
      trangThai: trangThai,
      nguoiDuyet: nguoiDuyet,
      ghiChuDuyet: ghiChuDuyet
    },

  note:
    "Duyệt/từ chối đơn chấm công bù"

});

return textResponse("OK");

    }

    return textResponse(
      "Không tìm thấy đơn chấm công bù"
    );

  }
  catch (error) {

    logError(
      "updateAttendanceAdjustmentStatus",
      error
    );

    return textResponse(
      "Không xử lý được đơn chấm công bù"
    );

  }
  finally {

    lock.releaseLock();

  }

}


/**
 * Danh sách đơn chấm công bù cho Admin.
 */
function getAttendanceAdjustmentRequests(
  status,
  keyword
) {

  status =
    normalizeText(status);

  keyword =
    normalizeText(keyword)
      .toLowerCase();

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE_ADJUSTMENTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const employeeMap =
    getEmployeeBriefMapForAttendanceAdjustment_();

  const siteMap =
    getSiteBriefMapForAttendanceAdjustment_();

  const result = [];

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const maDon =
      normalizeText(row[0]);

    const manv =
      normalizeText(row[1]);

    if (
      isEmpty(maDon) ||
      isEmpty(manv)
    ) {

      continue;

    }

    const trangThai =
      normalizeText(row[7]);

    if (
      !isEmpty(status) &&
      trangThai !== status
    ) {

      continue;

    }

    const employee =
      employeeMap[manv] || {};

    const mact =
      normalizeText(row[3]);

    const site =
      siteMap[mact] || {};

    const searchText = [

      maDon,

      manv,

      employee.hoten,

      employee.pb,

      mact,

      site.tenct,

      row[6],

      trangThai

    ]
      .join(" ")
      .toLowerCase();

    if (
      !isEmpty(keyword) &&
      searchText.indexOf(keyword) < 0
    ) {

      continue;

    }

    result.push({

      maDon: maDon,

      manv: manv,

      hoten:
        employee.hoten || "",

      pb:
        employee.pb || "",

      ngayChamCong:
  formatAttendanceAdjustmentDateForClient_(row[2]),

      mact:
        mact,

      tenct:
        site.tenct || "",

      gioVao:
  formatAttendanceAdjustmentTimeForClient_(row[4]),

gioRa:
  formatAttendanceAdjustmentTimeForClient_(row[5]),

      lyDo:
        row[6],

      trangThai:
        trangThai,

      nguoiDuyet:
        row[8],

      ngayDuyet:
        row[9],

      ghiChuDuyet:
        row[10],

      createdAt:
        row[11]

    });

  }

  result.sort(function(a, b) {

    return String(b.createdAt || "")
      .localeCompare(
        String(a.createdAt || "")
      );

  });

  return jsonResponse(result);

}


/**
 * Danh sách đơn chấm công bù của nhân viên.
 */
function getEmployeeAttendanceAdjustmentRequests(manv) {

  manv =
    normalizeText(manv);

  if (isEmpty(manv)) {

    return jsonResponse([]);

  }

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE_ADJUSTMENTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const siteMap =
    getSiteBriefMapForAttendanceAdjustment_();

  const result = [];

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    if (
      normalizeText(row[1]) !== manv
    ) {

      continue;

    }

    const mact =
      normalizeText(row[3]);

    const site =
      siteMap[mact] || {};

    result.push({

      maDon:
        row[0],

      manv:
        row[1],

     ngayChamCong:
  formatAttendanceAdjustmentDateForClient_(row[2]),

      mact:
        mact,

      tenct:
        site.tenct || "",

      gioVao:
  formatAttendanceAdjustmentTimeForClient_(row[4]),

gioRa:
  formatAttendanceAdjustmentTimeForClient_(row[5]),

      lyDo:
        row[6],

      trangThai:
        row[7],

      nguoiDuyet:
        row[8],

      ngayDuyet:
        row[9],

      ghiChuDuyet:
        row[10],

      createdAt:
        row[11]

    });

  }

  result.sort(function(a, b) {

    return String(b.createdAt || "")
      .localeCompare(
        String(a.createdAt || "")
      );

  });

  return jsonResponse(result);

}


/**
 * Validate khi nhân viên gửi đơn.
 */
function validateAttendanceAdjustmentInput_(data) {

  data = data || {};

  const request = {

    manv:
      normalizeText(data.manv),

    ngayChamCong:
      normalizeText(data.ngayChamCong),

    mact:
      normalizeText(data.mact),

    gioVao:
      normalizeText(data.gioVao),

    gioRa:
      normalizeText(data.gioRa),

    lyDo:
      normalizeText(data.lyDo)

  };

  if (isEmpty(request.manv)) {

    return {
      success: false,
      message: "Thiếu nhân viên"
    };

  }

  if (
    !employeeExistsForAttendanceAdjustment_(
      request.manv
    )
  ) {

    return {
      success: false,
      message: "Không tìm thấy nhân viên"
    };

  }

  if (isEmpty(request.ngayChamCong)) {

    request.ngayChamCong =
      formatAttendanceAdjustmentDateKey_(
        new Date()
      );

  }

  if (
    !isValidAttendanceAdjustmentDateText_(
      request.ngayChamCong
    )
  ) {

    return {
      success: false,
      message: "Ngày chấm công bù không hợp lệ"
    };

  }

  if (
    !isTodayAttendanceAdjustment_(
      request.ngayChamCong
    )
  ) {

    return {
      success: false,
      message: "Chỉ được tạo đơn chấm công bù trong ngày"
    };

  }

  if (isEmpty(request.mact)) {

    return {
      success: false,
      message: "Vui lòng chọn công trình/địa điểm"
    };

  }

  if (
    !siteExistsForAttendanceAdjustment_(
      request.mact
    )
  ) {

    return {
      success: false,
      message: "Không tìm thấy công trình/địa điểm"
    };

  }

  if (
    isEmpty(request.gioVao) &&
    isEmpty(request.gioRa)
  ) {

    return {
      success: false,
      message: "Vui lòng nhập giờ vào hoặc giờ ra cần bù"
    };

  }

  if (
    !isEmpty(request.gioVao) &&
    !isValidAttendanceAdjustmentTimeText_(
      request.gioVao
    )
  ) {

    return {
      success: false,
      message: "Giờ vào không hợp lệ"
    };

  }

  if (
    !isEmpty(request.gioRa) &&
    !isValidAttendanceAdjustmentTimeText_(
      request.gioRa
    )
  ) {

    return {
      success: false,
      message: "Giờ ra không hợp lệ"
    };

  }

  if (
    !isEmpty(request.gioVao) &&
    !isEmpty(request.gioRa)
  ) {

    const checkInTime =
      buildAttendanceAdjustmentDateTime_(
        request.ngayChamCong,
        request.gioVao
      );

    const checkOutTime =
      buildAttendanceAdjustmentDateTime_(
        request.ngayChamCong,
        request.gioRa
      );

    if (
      checkOutTime.getTime() <=
      checkInTime.getTime()
    ) {

      return {
        success: false,
        message: "Giờ ra phải lớn hơn giờ vào"
      };

    }

  }

  if (isEmpty(request.lyDo)) {

    return {
      success: false,
      message: "Vui lòng nhập lý do chấm công bù"
    };

  }

  if (
    hasPendingAttendanceAdjustment_(
      request.manv,
      request.ngayChamCong
    )
  ) {

    return {
      success: false,
      message: "Nhân viên đã có đơn chấm công bù đang chờ duyệt trong ngày này"
    };

  }

  return {
    success: true,
    request: request
  };

}


/**
 * Validate khi admin duyệt.
 */
function validateAttendanceAdjustmentApproval_(request) {

  if (
    !isTodayAttendanceAdjustment_(
      request.ngayChamCong
    )
  ) {

    return {
      success: false,
      message: "Chỉ được duyệt đơn chấm công bù trong ngày"
    };

  }

  if (
    !isEmpty(request.gioVao) &&
    hasAttendanceTypeOnDate_(
      request.manv,
      request.ngayChamCong,
      CONFIG.ATTENDANCE_TYPE.CHECK_IN
    )
  ) {

    return {
      success: false,
      message: "Nhân viên đã có Check In trong ngày này"
    };

  }

  if (
    !isEmpty(request.gioRa) &&
    hasAttendanceTypeOnDate_(
      request.manv,
      request.ngayChamCong,
      CONFIG.ATTENDANCE_TYPE.CHECK_OUT
    )
  ) {

    return {
      success: false,
      message: "Nhân viên đã có Check Out trong ngày này"
    };

  }

  return {
    success: true
  };

}


/**
 * Ghi đơn đã duyệt vào Sheet ChamCong.
 */
function writeAttendanceAdjustmentToAttendance_(
  request,
  nguoiDuyet
) {

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  );

  if (
    !isEmpty(request.gioVao)
  ) {

    sheet.appendRow([

      buildAttendanceAdjustmentDateTime_(
        request.ngayChamCong,
        request.gioVao
      ),

      request.manv,

      request.mact,

      CONFIG.ATTENDANCE_TYPE.CHECK_IN,

      "",

      "",

      0,

      "ADMIN_APPROVED",

      "ChamCongBu",

      request.maDon,

      nguoiDuyet

    ]);

  }

  if (
    !isEmpty(request.gioRa)
  ) {

    sheet.appendRow([

      buildAttendanceAdjustmentDateTime_(
        request.ngayChamCong,
        request.gioRa
      ),

      request.manv,

      request.mact,

      CONFIG.ATTENDANCE_TYPE.CHECK_OUT,

      "",

      "",

      0,

      "ADMIN_APPROVED",

      "ChamCongBu",

      request.maDon,

      nguoiDuyet

    ]);

  }

}


/**
 * Kiểm tra đã có đơn đang chờ duyệt cùng ngày.
 */
function hasPendingAttendanceAdjustment_(
  manv,
  ngayChamCong
) {

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE_ADJUSTMENTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const rowDate =
  formatAttendanceAdjustmentDateForClient_(
    values[i][2]
  );

if (
  normalizeText(values[i][1]) === manv &&
  rowDate === ngayChamCong &&
  normalizeText(values[i][7]) === "Chờ duyệt"
) {

      return true;

    }

  }

  return false;

}


/**
 * Kiểm tra đã có Check In / Check Out trong ngày.
 */
function hasAttendanceTypeOnDate_(
  manv,
  ngayChamCong,
  type
) {

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const timestamp =
      parseAttendanceAdjustmentDateTime_(
        values[i][0]
      );

    if (!timestamp) {

      continue;

    }

    if (
      normalizeText(values[i][1]) !== manv
    ) {

      continue;

    }

    if (
      normalizeText(values[i][3]) !== type
    ) {

      continue;

    }

    const dateKey =
      formatAttendanceAdjustmentDateKey_(
        timestamp
      );

    if (
      dateKey === ngayChamCong
    ) {

      return true;

    }

  }

  return false;

}


/**
 * Kiểm tra nhân viên tồn tại.
 */
function employeeExistsForAttendanceAdjustment_(manv) {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      normalizeText(values[i][0]) === manv &&
      normalizeText(values[i][5]) === CONFIG.STATUS.ACTIVE
    ) {

      return true;

    }

  }

  return false;

}


/**
 * Kiểm tra công trình tồn tại.
 */
function siteExistsForAttendanceAdjustment_(mact) {

  const sheet = getSheet(
    CONFIG.SHEETS.SITES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const currentMaCT =
      normalizeText(values[i][0]);

    const status =
      normalizeText(values[i][7]);

    if (
      currentMaCT === mact &&
      status === CONFIG.STATUS.ACTIVE
    ) {

      return true;

    }

  }

  return false;

}


/**
 * Kiểm tra admin duyệt.
 */
function getAdminApproverForAttendanceAdjustment_(manv) {

  manv =
    normalizeText(manv);

  if (isEmpty(manv)) {

    return null;

  }

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const currentManv =
      normalizeText(values[i][0]);

    if (currentManv !== manv) {

      continue;

    }

    const role =
      normalizeText(values[i][4])
        .toLowerCase();

    const status =
      normalizeText(values[i][5]);

    if (
      role !== "admin" ||
      status !== CONFIG.STATUS.ACTIVE
    ) {

      return null;

    }

    return {

      manv: currentManv,

      hoten:
        values[i][1]

    };

  }

  return null;

}


/**
 * Map nhân viên.
 */
function getEmployeeBriefMapForAttendanceAdjustment_() {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const map = {};

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const manv =
      normalizeText(values[i][0]);

    if (isEmpty(manv)) {

      continue;

    }

    map[manv] = {

      hoten:
        values[i][1],

      pb:
        values[i][7]

    };

  }

  return map;

}


/**
 * Map công trình.
 */
function getSiteBriefMapForAttendanceAdjustment_() {

  const sheet = getSheet(
    CONFIG.SHEETS.SITES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const map = {};

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const mact =
      normalizeText(values[i][0]);

    if (isEmpty(mact)) {

      continue;

    }

    map[mact] = {

      tenct:
        values[i][1]

    };

  }

  return map;

}


/**
 * Validate ngày yyyy-mm-dd.
 */
function isValidAttendanceAdjustmentDateText_(value) {

  return /^\d{4}-\d{2}-\d{2}$/
    .test(value);

}


/**
 * Validate giờ HH:mm.
 */
function isValidAttendanceAdjustmentTimeText_(value) {

  return /^([01]\d|2[0-3]):[0-5]\d$/
    .test(value);

}


/**
 * Chỉ trong ngày.
 */
function isTodayAttendanceAdjustment_(dateText) {

  const today =
    formatAttendanceAdjustmentDateKey_(
      new Date()
    );

  return dateText === today;

}


/**
 * Build Date từ yyyy-mm-dd + HH:mm.
 */
/**
 * Build Date từ ngày + giờ.
 *
 * Nhận:
 * - dateText: yyyy-mm-dd hoặc Date
 * - timeText: HH:mm hoặc Date object từ Google Sheet
 */
function buildAttendanceAdjustmentDateTime_(
  dateText,
  timeText
) {

  const dateKey =
    formatAttendanceAdjustmentDateForClient_(
      dateText
    );

  const timeKey =
    formatAttendanceAdjustmentTimeForClient_(
      timeText
    );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  ) {

    throw new Error(
      "Ngày chấm công bù không hợp lệ: " + dateText
    );

  }

  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeKey)
  ) {

    throw new Error(
      "Giờ chấm công bù không hợp lệ: " + timeText
    );

  }

  const parts =
    dateKey.split("-");

  const timeParts =
    timeKey.split(":");

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
    Number(timeParts[0]),
    Number(timeParts[1]),
    0
  );

}


/**
 * Parse DateTime.
 */
function parseAttendanceAdjustmentDateTime_(value) {

  if (!value) {

    return null;

  }

  if (
    Object.prototype.toString.call(value) === "[object Date]"
  ) {

    if (
      isNaN(value.getTime())
    ) {

      return null;

    }

    return value;

  }

  const date =
    new Date(value);

  if (
    isNaN(date.getTime())
  ) {

    return null;

  }

  return date;

}


/**
 * Format yyyy-mm-dd.
 */
function formatAttendanceAdjustmentDateKey_(date) {

  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return year + "-" + month + "-" + day;

}


/**
 * Lấy hoặc tạo Sheet ChamCongBu.
 */
function getOrCreateAttendanceAdjustmentSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.ATTENDANCE_ADJUSTMENTS
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.SHEETS.ATTENDANCE_ADJUSTMENTS
      );

  }

  return sheet;

}
/**
 * Format giờ chấm công bù để trả frontend.
 */
function formatAttendanceAdjustmentTimeForClient_(value) {

  if (!value) {

    return "";

  }

  if (
    Object.prototype.toString.call(value) === "[object Date]"
  ) {

    if (
      isNaN(value.getTime())
    ) {

      return "";

    }

    return String(value.getHours())
      .padStart(2, "0") +
      ":" +
      String(value.getMinutes())
        .padStart(2, "0");

  }

  const text =
    normalizeText(value);

  if (
    /^([01]\d|2[0-3]):[0-5]\d$/.test(text)
  ) {

    return text;

  }

  return text;

}
/**
 * Format ngày chấm công bù để trả frontend / xử lý nội bộ.
 */
function formatAttendanceAdjustmentDateForClient_(value) {

  if (!value) {

    return "";

  }

  if (
    Object.prototype.toString.call(value) === "[object Date]"
  ) {

    if (
      isNaN(value.getTime())
    ) {

      return "";

    }

    return formatAttendanceAdjustmentDateKey_(value);

  }

  const text =
    normalizeText(value);

  if (
    /^\d{4}-\d{2}-\d{2}/.test(text)
  ) {

    return text.substring(0, 10);

  }

  const date =
    new Date(text);

  if (
    !isNaN(date.getTime())
  ) {

    return formatAttendanceAdjustmentDateKey_(date);

  }

  return text;

}