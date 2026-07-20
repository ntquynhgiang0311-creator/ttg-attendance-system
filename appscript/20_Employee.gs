/**
 * Danh sách nhân viên.
 */
function getEmployees() {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
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

    const manv = normalizeText(
      values[i][0]
    );


    if (isEmpty(manv)) {

      continue;

    }


    result.push({

      manv: manv,

      hoten: values[i][1],

      sdt: values[i][2],

      role: values[i][4],

      status: values[i][5],

      pb: values[i][7]

    });

  }


  return jsonResponse(result);

}


/**
 * Thêm nhân viên.
 */
function addEmployeeV2(data) {

  const validation =
    validateEmployeeInput_(
      data,
      true
    );


  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }


  const lock = LockService
    .getScriptLock();


  if (!lock.tryLock(5000)) {

    return textResponse(
      "Hệ thống đang xử lý. Vui lòng thử lại."
    );

  }


  try {

    const sheet = getSheet(
      CONFIG.SHEETS.EMPLOYEES
    );


    const employee =
      validation.employee;


    // =========================
    // KIỂM TRA SĐT TRÙNG
    // =========================

    const duplicate =
      findEmployeeByPhone_(
        sheet,
        employee.sdt,
        ""
      );


    if (duplicate) {

      return textResponse(

        "Số điện thoại đã được sử dụng bởi " +

        duplicate.manv +

        " - " +

        duplicate.hoten

      );

    }


    // =========================
    // SINH MÃ NHÂN VIÊN
    // =========================

    const maNV = generateNextCode(

      sheet,

      1,

      CONFIG.CODE_PREFIX.EMPLOYEE,

      CONFIG.CODE_LENGTH.EMPLOYEE

    );


    // =========================
    // GHI NHÂN VIÊN
    // =========================

    sheet.appendRow([

      maNV,

      employee.hoten,

      employee.sdt,

      employee.matkhau,

      employee.role,

      CONFIG.STATUS.ACTIVE,

      "",

      employee.pb

    ]);

    try {

  writeSystemLog({

    actorManv:
      normalizeText(data.actorManv),

    module:
      "NhanVien",

    action:
      "Thêm nhân viên",

    targetId:
      maNV,

    oldValue:
      "",

    newValue:
      {
        manv: maNV,
        hoten: employee.hoten,
        sdt: employee.sdt,
        role: employee.role,
        status: CONFIG.STATUS.ACTIVE,
        pb: employee.pb
      },

    note:
      "Thêm nhân viên mới"

  });

}
catch (error) {

  Logger.log(
    "System log addEmployeeV2 error: " +
    error.message
  );

}

    SpreadsheetApp.flush();


    return textResponse("OK");

  }
  catch (error) {

    logError(
      "addEmployee",
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
 * Cập nhật nhân viên.
 *
 * Hiện tại không cập nhật mật khẩu.
 */
function updateEmployeeV2(data) {

  const manv = normalizeText(
    data.manv
  );

  if (isEmpty(manv)) {

    return textResponse(
      "Thiếu mã nhân viên"
    );

  }

  const validation =
    validateEmployeeInput_(
      data,
      false
    );

  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(5000)) {

    return textResponse(
      "Hệ thống đang xử lý. Vui lòng thử lại."
    );

  }

  try {

    const sheet = getSheet(
      CONFIG.SHEETS.EMPLOYEES
    );

    const values = sheet
      .getDataRange()
      .getValues();

    const employee =
      validation.employee;

    // =========================
    // KIỂM TRA SĐT TRÙNG
    // =========================

    const duplicate =
      findEmployeeByPhone_(
        sheet,
        employee.sdt,
        manv
      );

    if (duplicate) {

      return textResponse(
        "Số điện thoại đã được sử dụng bởi " +
        duplicate.manv +
        " - " +
        duplicate.hoten
      );

    }

    // =========================
    // TÌM NHÂN VIÊN
    // =========================

    for (
      let i = 1;
      i < values.length;
      i++
    ) {

      if (
        normalizeText(
          values[i][0]
        ) !== manv
      ) {

        continue;

      }

      const oldValue = {

        manv:
          values[i][0],

        hoten:
          values[i][1],

        sdt:
          values[i][2],

        role:
          values[i][4],

        status:
          values[i][5],

        pb:
          values[i][7]

      };

      /**
       * B = Họ tên
       * C = SĐT
       * D = Mật khẩu giữ nguyên
       * E = Role
       * F = Status giữ nguyên
       * G = DeviceID giữ nguyên
       * H = Phòng ban
       */

      sheet
        .getRange(
          i + 1,
          2
        )
        .setValue(
          employee.hoten
        );

      sheet
        .getRange(
          i + 1,
          3
        )
        .setValue(
          employee.sdt
        );

      sheet
        .getRange(
          i + 1,
          5
        )
        .setValue(
          employee.role
        );

      sheet
        .getRange(
          i + 1,
          8
        )
        .setValue(
          employee.pb
        );

      SpreadsheetApp.flush();

      try {

        writeSystemLog({

          actorManv:
            normalizeText(data.actorManv),

          module:
            "NhanVien",

          action:
            "Sửa thông tin nhân viên",

          targetId:
            manv,

          oldValue:
            oldValue,

          newValue:
            {
              manv:
                manv,

              hoten:
                employee.hoten,

              sdt:
                employee.sdt,

              role:
                employee.role,

              status:
                oldValue.status,

              pb:
                employee.pb
            },

          note:
            "Cập nhật thông tin nhân viên"

        });

      }
      catch (error) {

        Logger.log(
          "System log updateEmployeeV2 error: " +
          error.message
        );

      }

      return textResponse("OK");

    }

    return textResponse(
      "Không tìm thấy nhân viên"
    );

  }
  catch (error) {

    logError(
      "updateEmployeeV2",
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
 * Bật / tắt nhân viên.
 */
function toggleEmployeeV2(data) {

  const manv = normalizeText(
    data.manv
  );


  if (isEmpty(manv)) {

    return textResponse(
      "Thiếu mã nhân viên"
    );

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

    if (
      normalizeText(
        values[i][0]
      ) !== manv
    ) {

      continue;

    }


    const currentStatus =
      normalizeText(
        values[i][5]
      );


 const newStatus =
  currentStatus === CONFIG.STATUS.ACTIVE
    ? CONFIG.STATUS.INACTIVE
    : CONFIG.STATUS.ACTIVE;

sheet
  .getRange(i + 1, 6)
  .setValue(newStatus);

try {

  writeSystemLog({

    actorManv:
      normalizeText(data.actorManv),

    module:
      "NhanVien",

    action:
      newStatus === CONFIG.STATUS.ACTIVE
        ? "Mở khóa nhân viên"
        : "Khóa nhân viên",

    targetId:
      manv,

    oldValue:
      {
        status: currentStatus
      },

    newValue:
      {
        status: newStatus
      },

    note:
      "Khóa/mở khóa tài khoản nhân viên"

  });

}
catch (error) {

  Logger.log(
    "System log toggleEmployeeV2 error: " +
    error.message
  );

}

return textResponse("OK");

  }


  return textResponse(
    "Không tìm thấy nhân viên"
  );

}


/**
 * Kiểm tra dữ liệu nhân viên.
 */
function validateEmployeeInput_(
  data,
  requirePassword
) {

  data = data || {};


  const hoten = normalizeText(
    data.hoten
  );


  const sdt = normalizeText(
    data.sdt
  );


  const matkhau = normalizeText(
    data.matkhau
  );


  const role = normalizeText(
    data.role
  );


  const pb = normalizeText(
    data.pb
  );


  if (isEmpty(hoten)) {

    return {

      success: false,

      message:
        "Vui lòng nhập họ tên"

    };

  }


  if (isEmpty(sdt)) {

    return {

      success: false,

      message:
        "Vui lòng nhập số điện thoại"

    };

  }


  if (
    !/^[0-9]+$/.test(sdt)
  ) {

    return {

      success: false,

      message:
        "Số điện thoại chỉ được chứa chữ số"

    };

  }


  if (
    sdt.length < 9 ||
    sdt.length > 11
  ) {

    return {

      success: false,

      message:
        "Số điện thoại không hợp lệ"

    };

  }


  if (
    requirePassword === true &&
    isEmpty(matkhau)
  ) {

    return {

      success: false,

      message:
        "Vui lòng nhập mật khẩu"

    };

  }


  if (isEmpty(role)) {

    return {

      success: false,

      message:
        "Vui lòng chọn vai trò"

    };

  }


  if (isEmpty(pb)) {

    return {

      success: false,

      message:
        "Vui lòng chọn phòng ban"

    };

  }


  return {

    success: true,

    employee: {

      hoten: hoten,

      sdt: sdt,

      matkhau: matkhau,

      role: role,

      pb: pb

    }

  };

}


/**
 * Tìm nhân viên theo số điện thoại.
 *
 * excludeManv:
 * - rỗng khi thêm mới
 * - mã NV hiện tại khi cập nhật
 */
function findEmployeeByPhone_(
  sheet,
  phone,
  excludeManv
) {

  const values = sheet
    .getDataRange()
    .getValues();


  const targetPhone =
    normalizeText(phone);


  const excludedEmployee =
    normalizeText(excludeManv);


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const manv = normalizeText(
      values[i][0]
    );


    const sdt = normalizeText(
      values[i][2]
    );


    if (
      manv === excludedEmployee
    ) {

      continue;

    }


    if (
      sdt === targetPhone
    ) {

      return {

        manv: manv,

        hoten: values[i][1]

      };

    }

  }


  return null;

}