/**
 * Setup nền dữ liệu Nhân sự.
 *
 * Chạy 1 lần trước khi làm module HR.
 */
function setupHRSheets() {

  setupEmployeeHRColumns_();

  setupDepartmentsSheet_();

  setupPositionsSheet_();

  setupContractsSheet_();

  return textResponse("SETUP_HR_OK");

}


/**
 * Mở rộng Sheet NhanVien từ cột I trở đi.
 *
 * Không đụng A-H.
 */
function setupEmployeeHRColumns_() {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );


  const headers = [

    "NgaySinh",

    "GioiTinh",

    "CCCD",

    "NgayCapCCCD",

    "NoiCapCCCD",

    "DiaChi",

    "Email",

    "MaChucVu",

    "NgayVaoLam",

    "TaiKhoanNganHang",

    "TenNganHang",

    "TrangThaiNhanSu",

    "AvatarURL",

    "GhiChu"

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
 * Tạo Sheet PhongBan.
 */
function setupDepartmentsSheet_() {

  const sheet =
    getOrCreateSheet_("PhongBan");


  const headers = [

    "MaPB",

    "TenPB",

    "MoTa",

    "TrangThai",

    "CreatedAt"

  ];


  setupHeader_(
    sheet,
    headers
  );


  if (
    sheet.getLastRow() > 1
  ) {

    return;

  }


  const now = new Date();


  const defaultRows = [

    [
      "PB001",
      "Ban Giám Đốc",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB002",
      "KTNS",
      "Kế toán - Nhân sự",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB003",
      "Thiết Kế",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB004",
      "Kế Hoạch",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB005",
      "Xây lắp",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB006",
      "Văn Phòng",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ]

  ];


  sheet
    .getRange(
      2,
      1,
      defaultRows.length,
      headers.length
    )
    .setValues(
      defaultRows
    );

}


/**
 * Tạo Sheet ChucVu.
 */
function setupPositionsSheet_() {

  const sheet =
    getOrCreateSheet_("ChucVu");


  const headers = [

    "MaCV",

    "TenCV",

    "MoTa",

    "TrangThai",

    "CreatedAt"

  ];


  setupHeader_(
    sheet,
    headers
  );


  if (
    sheet.getLastRow() > 1
  ) {

    return;

  }


  const now = new Date();


  const defaultRows = [

    [
      "CV001",
      "Giám đốc",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "CV002",
      "Quản lý",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "CV003",
      "Kỹ sư",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "CV004",
      "Giám sát",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "CV005",
      "Nhân viên văn phòng",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "CV006",
      "Công nhân",
      "",
      CONFIG.STATUS.ACTIVE,
      now
    ]

  ];


  sheet
    .getRange(
      2,
      1,
      defaultRows.length,
      headers.length
    )
    .setValues(
      defaultRows
    );

}


/**
 * Tạo Sheet HopDong.
 */
function setupContractsSheet_() {

  const sheet =
    getOrCreateSheet_("HopDong");


  const headers = [

    "MaHD",

    "MaNV",

    "LoaiHD",

    "NgayKy",

    "NgayHieuLuc",

    "NgayHetHan",

    "LuongCoBan",

    "PhuCap",

    "TrangThai",

    "FileURL",

    "GhiChu",

    "CreatedAt"

  ];


  setupHeader_(
    sheet,
    headers
  );

}


/**
 * Lấy hoặc tạo Sheet.
 */
function getOrCreateSheet_(
  sheetName
) {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  let sheet =
    ss.getSheetByName(
      sheetName
    );


  if (!sheet) {

    sheet =
      ss.insertSheet(
        sheetName
      );

  }


  return sheet;

}


/**
 * Setup header.
 */
function setupHeader_(
  sheet,
  headers
) {

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


  sheet
    .setFrozenRows(1);

}
/**
 * Reset danh sách phòng ban theo thực tế công ty.
 *
 * Chạy 1 lần khi chuẩn hóa HR.
 */
function resetTTGDepartments() {

  const sheet = getSheet(
    CONFIG.SHEETS.DEPARTMENTS
  );

  sheet.clearContents();

  const now = new Date();

  const rows = [

    [
      "MaPB",
      "TenPB",
      "MoTa",
      "TrangThai",
      "CreatedAt"
    ],

    [
      "PB001",
      "Ban Giám Đốc",
      "Ban điều hành công ty",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB002",
      "Văn Phòng",
      "Bộ phận văn phòng",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB003",
      "KTNS",
      "Kế toán - Nhân sự",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB004",
      "Kế Hoạch",
      "Kế hoạch - điều phối",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB005",
      "Thiết Kế",
      "Bộ phận thiết kế",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB006",
      "MEP",
      "Cơ điện",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB007",
      "Ban Chỉ Huy Công Trình",
      "Quản lý và điều hành công trình",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB008",
      "Xưởng Sản Xuất",
      "Xưởng sản xuất tổng",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB009",
      "Mộc",
      "Tổ mộc",
      CONFIG.STATUS.ACTIVE,
      now
    ],

    [
      "PB010",
      "PU",
      "Tổ PU",
      CONFIG.STATUS.ACTIVE,
      now
    ]

  ];

  sheet
    .getRange(
      1,
      1,
      rows.length,
      rows[0].length
    )
    .setValues(rows);

  sheet.setFrozenRows(1);

  normalizeEmployeeDepartmentNames_();

  return textResponse(
    "RESET_TTG_DEPARTMENTS_OK"
  );

}


/**
 * Chuẩn hóa tên phòng ban cũ trong Sheet NhanVien cột H.
 */
function normalizeEmployeeDepartmentNames_() {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {

    return;

  }

  const range = sheet.getRange(
    2,
    8,
    lastRow - 1,
    1
  );

  const values =
    range.getValues();

  const map = {

    "Văn phòng": "Văn Phòng",
    "Văn Phòng": "Văn Phòng",

    "Thiết kế": "Thiết Kế",
    "Thiết Kế": "Thiết Kế",

    "Kế hoạch": "Kế Hoạch",
    "Kế Hoạch": "Kế Hoạch",

    "Xưởng sản xuất": "Xưởng Sản Xuất",
    "Xưởng Sản Xuất": "Xưởng Sản Xuất",

    "Ban chỉ huy công trình": "Ban Chỉ Huy Công Trình",
    "Ban Chỉ Huy Công Trình": "Ban Chỉ Huy Công Trình",

    "KTNS": "KTNS",
    "MEP": "MEP",
    "Mộc": "Mộc",
    "PU": "PU"

  };

  const newValues = values.map(
    function(row) {

      const current =
        normalizeText(row[0]);

      return [
        map[current] || current
      ];

    }
  );

  range.setValues(newValues);

}