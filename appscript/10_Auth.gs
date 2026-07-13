/**
 * Đăng nhập
 */
function login(data) {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const sdt = normalizeText(data.sdt);
  const matkhau = normalizeText(data.matkhau);
  const deviceId = normalizeText(data.deviceId);

  for (let i = 1; i < values.length; i++) {

    const employeePhone =
      normalizeText(values[i][2]);

    const employeePassword =
      normalizeText(values[i][3]);

    const employeeStatus =
      normalizeText(values[i][5]);

    const savedDeviceId =
      normalizeText(values[i][6]);

    if (
      employeePhone === sdt &&
      employeePassword === matkhau &&
      employeeStatus === CONFIG.STATUS.ACTIVE
    ) {

      // Tài khoản chưa liên kết thiết bị
      if (isEmpty(savedDeviceId)) {

        sheet
          .getRange(i + 1, 7)
          .setValue(deviceId);

      }
      else if (
        savedDeviceId !== deviceId
      ) {

        return jsonResponse({
          success: false,
          message:
            "Tài khoản đã được đăng nhập trên thiết bị khác."
        });

      }

      return jsonResponse({

        success: true,

        manv: values[i][0],

        hoten: values[i][1],

        role: values[i][4]

      });

    }

  }

  return jsonResponse({

    success: false,

    message:
      "Số điện thoại hoặc mật khẩu không đúng."

  });

}