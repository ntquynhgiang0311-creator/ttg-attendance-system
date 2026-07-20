/**
 * Setup Sheet Nghỉ phép.
 *
 * Chạy 1 lần.
 */
function setupLeaveSheet() {

  const sheet =
    getOrCreateLeaveSheet_();

  const headers = [

    "MaDon",

    "MaNV",

    "LoaiNghi",

    "TuNgay",

    "DenNgay",

    "SoNgay",

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

  return textResponse(
    "SETUP_LEAVE_OK"
  );

}


/**
 * Lấy danh sách đơn nghỉ phép.
 *
 * Dùng cho Admin.
 */
function getLeaveRequests(
  status,
  keyword
) {

  status =
    normalizeText(status);

  keyword =
    normalizeText(keyword)
      .toLowerCase();

  const sheet = getSheet(
    CONFIG.SHEETS.LEAVES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const employeeMap =
    getEmployeeBriefMapForLeave_();

  const result = [];

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const maDon =
      normalizeText(row[0]);

    const maNV =
      normalizeText(row[1]);

    if (
      isEmpty(maDon) ||
      isEmpty(maNV)
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
      employeeMap[maNV] || {};

    const searchText = [

      maDon,

      maNV,

      employee.hoten,

      employee.pb,

      row[2],

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

      manv: maNV,

      hoten:
        employee.hoten || "",

      pb:
        employee.pb || "",

      loaiNghi:
        row[2],

      tuNgay:
        row[3],

      denNgay:
        row[4],

      soNgay:
        row[5],

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
 * Lấy đơn nghỉ phép theo nhân viên.
 */
function getEmployeeLeaveRequests(manv) {

  manv =
    normalizeText(manv);

  if (isEmpty(manv)) {

    return jsonResponse([]);

  }

  const sheet = getSheet(
    CONFIG.SHEETS.LEAVES
  );

  const values = sheet
    .getDataRange()
    .getValues();

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

    result.push({

      maDon:
        row[0],

      manv:
        row[1],

      loaiNghi:
        row[2],

      tuNgay:
        row[3],

      denNgay:
        row[4],

      soNgay:
        row[5],

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

  return jsonResponse(result);

}


/**
 * Thêm đơn nghỉ phép.
 */
function addLeaveRequest(data) {

  const validation =
    validateLeaveInput_(data);

  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }

  const leave =
    validation.leave;

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(10000);

    const sheet = getSheet(
      CONFIG.SHEETS.LEAVES
    );

    const maDon =
      generateNextCode(
        sheet,
        1,
        CONFIG.CODE_PREFIX.LEAVE,
        CONFIG.CODE_LENGTH.LEAVE
      );

    sheet.appendRow([

      maDon,

      leave.manv,

      leave.loaiNghi,

      leave.tuNgay,

      leave.denNgay,

      leave.soNgay,

      leave.lyDo,

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
      "addLeaveRequest",
      error
    );

    return textResponse(
      "Không tạo được đơn nghỉ phép"
    );

  }
  finally {

    lock.releaseLock();

  }

}

/**
 * Duyệt / Từ chối đơn nghỉ phép.
 *
 * Backend kiểm tra người duyệt có phải Admin thật không.
 */
function updateLeaveRequestStatus(data) {

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
    getAdminApproverForLeave_(
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
    CONFIG.SHEETS.LEAVES
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
    "NghiPhep",

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
    "Duyệt/từ chối đơn nghỉ phép"

});
    return textResponse("OK");

  }

  return textResponse(
    "Không tìm thấy đơn nghỉ phép"
  );

}


/**
 * Validate đơn nghỉ phép.
 */
function validateLeaveInput_(data) {

  data = data || {};

  const leave = {

    manv:
      normalizeText(data.manv),

    loaiNghi:
      normalizeText(data.loaiNghi),

    tuNgay:
      normalizeText(data.tuNgay),

    denNgay:
      normalizeText(data.denNgay),

    lyDo:
      normalizeText(data.lyDo)

  };

  if (isEmpty(leave.manv)) {

    return {
      success: false,
      message: "Thiếu nhân viên"
    };

  }

  if (
    !employeeExistsForLeave_(leave.manv)
  ) {

    return {
      success: false,
      message: "Không tìm thấy nhân viên"
    };

  }

  if (isEmpty(leave.loaiNghi)) {

    return {
      success: false,
      message: "Vui lòng chọn loại nghỉ"
    };

  }

  if (isEmpty(leave.tuNgay)) {

    return {
      success: false,
      message: "Vui lòng nhập từ ngày"
    };

  }

  if (isEmpty(leave.denNgay)) {

    return {
      success: false,
      message: "Vui lòng nhập đến ngày"
    };

  }

  if (
    !isValidLeaveDateText_(leave.tuNgay) ||
    !isValidLeaveDateText_(leave.denNgay)
  ) {

    return {
      success: false,
      message: "Ngày nghỉ không hợp lệ"
    };

  }

  const tuNgayDate =
    parseLeaveDate_(leave.tuNgay);

  const denNgayDate =
    parseLeaveDate_(leave.denNgay);

  if (
    denNgayDate.getTime() <
    tuNgayDate.getTime()
  ) {

    return {
      success: false,
      message: "Đến ngày không được nhỏ hơn từ ngày"
    };

  }

  const today =
  getDateOnlyForLeave_(
    new Date()
  );

const noticeDays =
  Math.floor(
    (
      tuNgayDate.getTime() -
      today.getTime()
    ) /
    (
      1000 * 60 * 60 * 24
    )
  );

if (noticeDays < 0) {

  return {
    success: false,
    message: "Không thể tạo đơn nghỉ cho ngày đã qua"
  };

}

const urgentTypes =
  CONFIG.LEAVE_RULES.URGENT_TYPES || [];

const isUrgentType =
  urgentTypes.indexOf(
    leave.loaiNghi
  ) >= 0;

const minNoticeDays =
  Number(
    CONFIG.LEAVE_RULES.MIN_NOTICE_DAYS || 1
  );

if (
  !isUrgentType &&
  noticeDays < minNoticeDays
) {

  return {
    success: false,
    message:
      "Đơn nghỉ phép phải được tạo trước ít nhất " +
      minNoticeDays +
      " ngày. Trường hợp nghỉ gấp vui lòng chọn Nghỉ bệnh hoặc báo Admin."
  };

}

leave.soNgay =
  calculateLeaveDays_(
    tuNgayDate,
    denNgayDate
  );

if (leave.soNgay <= 0) {

  return {
    success: false,
    message: "Số ngày nghỉ không hợp lệ"
  };

}

  return {
    success: true,
    leave: leave
  };

}


/**
 * Tính số ngày nghỉ.
 *
 * Bản V1 tính cả thứ 7, CN.
 * Sau này có thể cấu hình lịch làm việc.
 */
function calculateLeaveDays_(
  startDate,
  endDate
) {

  const msPerDay =
    1000 * 60 * 60 * 24;

  return Math.floor(
    (
      endDate.getTime() -
      startDate.getTime()
    ) / msPerDay
  ) + 1;

}


/**
 * Validate ngày yyyy-mm-dd.
 */
function isValidLeaveDateText_(value) {

  return /^\d{4}-\d{2}-\d{2}$/
    .test(value);

}


/**
 * Parse ngày nghỉ.
 */
function parseLeaveDate_(value) {

  return new Date(
    value + "T00:00:00"
  );

}


/**
 * Kiểm tra nhân viên tồn tại.
 */
function employeeExistsForLeave_(manv) {

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
      normalizeText(values[i][0]) === manv
    ) {

      return true;

    }

  }

  return false;

}


/**
 * Map nhân viên cho đơn nghỉ.
 */
function getEmployeeBriefMapForLeave_() {

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

      manv: manv,

      hoten:
        values[i][1],

      sdt:
        values[i][2],

      status:
        values[i][5],

      pb:
        values[i][7]

    };

  }

  return map;

}


/**
 * Lấy hoặc tạo Sheet NghiPhep.
 */
function getOrCreateLeaveSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.LEAVES
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.SHEETS.LEAVES
      );

  }

  return sheet;

}
/**
 * Kiểm tra người duyệt có phải Admin thật không.
 */
function getAdminApproverForLeave_(manv) {

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

      hoten: values[i][1],

      role: values[i][4]

    };

  }

  return null;

}


/**
 * Lấy ngày, bỏ phần giờ.
 */
function getDateOnlyForLeave_(date) {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}
/**
 * Lấy các ngày nghỉ phép đã duyệt của 1 nhân viên trong tháng.
 *
 * Dùng cho bảng công chi tiết.
 */
function getApprovedEmployeeLeaves(manv, month, year) {

  manv = normalizeText(manv);
  month = Number(month);
  year = Number(year);

  if (
    isEmpty(manv) ||
    isNaN(month) ||
    isNaN(year)
  ) {

    return jsonResponse([]);

  }

  const sheet = getSheet(
    CONFIG.SHEETS.LEAVES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const result = [];

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const maDon =
      normalizeText(row[0]);

    const rowManv =
      normalizeText(row[1]);

    const loaiNghi =
      normalizeText(row[2]);

    const trangThai =
      normalizeText(row[7]);

    if (
      rowManv !== manv ||
      trangThai !== "Đã duyệt"
    ) {

      continue;

    }

    const tuNgay =
      parseLeaveDateForReport_(row[3]);

    const denNgay =
      parseLeaveDateForReport_(row[4]);

    if (
      !tuNgay ||
      !denNgay
    ) {

      continue;

    }

    const current = new Date(
      tuNgay.getFullYear(),
      tuNgay.getMonth(),
      tuNgay.getDate()
    );

    while (
      current.getTime() <= denNgay.getTime()
    ) {

      const currentMonth =
        current.getMonth() + 1;

      const currentYear =
        current.getFullYear();

      if (
        currentMonth === month &&
        currentYear === year
      ) {

        result.push({

          maDon: maDon,

          manv: rowManv,

          ngay:
            formatLeaveDateKeyForReport_(
              current
            ),

          loaiNghi: loaiNghi,

          lyDo: row[6],

          trangThai: trangThai

        });

      }

      current.setDate(
        current.getDate() + 1
      );

    }

  }

  result.sort(function(a, b) {

    return String(a.ngay)
      .localeCompare(
        String(b.ngay)
      );

  });

  return jsonResponse(result);

}


/**
 * Parse ngày nghỉ cho báo cáo.
 */
function parseLeaveDateForReport_(value) {

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

    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );

  }

  const text =
    normalizeText(value);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {

    return null;

  }

  const date =
    new Date(
      text + "T00:00:00"
    );

  if (
    isNaN(date.getTime())
  ) {

    return null;

  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}


/**
 * Format yyyy-mm-dd.
 */
function formatLeaveDateKeyForReport_(date) {

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