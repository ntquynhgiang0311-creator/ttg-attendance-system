/**
 * Lấy chi tiết hồ sơ nhân viên HR.
 */
function getHREmployeeDetail(manv) {

  manv = normalizeText(manv);

  if (isEmpty(manv)) {

    return textResponse(
      "Thiếu mã nhân viên"
    );

  }

  const employee = findHREmployeeByCode_(manv);

  if (!employee) {

    return textResponse(
      "Không tìm thấy nhân viên"
    );

  }

  return jsonResponse(employee);

}


/**
 * Cập nhật hồ sơ nhân viên HR.
 *
 * Chỉ cập nhật cột I → V.
 * Không sửa A-H.
 */
function updateHREmployeeProfile(data) {

  const manv = normalizeText(
    data.manv
  );

  if (isEmpty(manv)) {

    return textResponse(
      "Thiếu mã nhân viên"
    );

  }

  const validation =
    validateHRProfileInput_(data);

  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const profile =
    validation.profile;

  const duplicateCCCD =
    findEmployeeByCCCD_(
      sheet,
      profile.cccd,
      manv
    );

  if (duplicateCCCD) {

    return textResponse(
      "CCCD đã được sử dụng bởi " +
      duplicateCCCD.manv +
      " - " +
      duplicateCCCD.hoten
    );

  }

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      normalizeText(values[i][0]) !== manv
    ) {

      continue;

    }

    const oldValue = {

      manv:
        values[i][0],

      hoten:
        values[i][1],

      ngaySinh:
        values[i][8],

      gioiTinh:
        values[i][9],

      cccd:
        values[i][10],

      ngayCapCCCD:
        values[i][11],

      noiCapCCCD:
        values[i][12],

      diaChi:
        values[i][13],

      email:
        values[i][14],

      maChucVu:
        values[i][15],

      ngayVaoLam:
        values[i][16],

      taiKhoanNganHang:
        values[i][17],

      tenNganHang:
        values[i][18],

      trangThaiNhanSu:
        values[i][19],

      avatarURL:
        values[i][20],

      ghiChu:
        values[i][21]

    };

    const newValue = {

      manv:
        manv,

      hoten:
        values[i][1],

      ngaySinh:
        profile.ngaySinh,

      gioiTinh:
        profile.gioiTinh,

      cccd:
        profile.cccd,

      ngayCapCCCD:
        profile.ngayCapCCCD,

      noiCapCCCD:
        profile.noiCapCCCD,

      diaChi:
        profile.diaChi,

      email:
        profile.email,

      maChucVu:
        profile.maChucVu,

      ngayVaoLam:
        profile.ngayVaoLam,

      taiKhoanNganHang:
        profile.taiKhoanNganHang,

      tenNganHang:
        profile.tenNganHang,

      trangThaiNhanSu:
        profile.trangThaiNhanSu,

      avatarURL:
        profile.avatarURL,

      ghiChu:
        profile.ghiChu

    };

    /**
     * I  NgaySinh
     * J  GioiTinh
     * K  CCCD
     * L  NgayCapCCCD
     * M  NoiCapCCCD
     * N  DiaChi
     * O  Email
     * P  MaChucVu
     * Q  NgayVaoLam
     * R  TaiKhoanNganHang
     * S  TenNganHang
     * T  TrangThaiNhanSu
     * U  AvatarURL
     * V  GhiChu
     */

    sheet
      .getRange(
        i + 1,
        9,
        1,
        14
      )
      .setValues([

        [

          newValue.ngaySinh,

          newValue.gioiTinh,

          newValue.cccd,

          newValue.ngayCapCCCD,

          newValue.noiCapCCCD,

          newValue.diaChi,

          newValue.email,

          newValue.maChucVu,

          newValue.ngayVaoLam,

          newValue.taiKhoanNganHang,

          newValue.tenNganHang,

          newValue.trangThaiNhanSu,

          newValue.avatarURL,

          newValue.ghiChu

        ]

      ]);

    SpreadsheetApp.flush();

    try {

      writeSystemLog({

        actorManv:
          normalizeText(data.actorManv),

        module:
          "NhanVien",

        action:
          "Sửa hồ sơ HR",

        targetId:
          manv,

        oldValue:
          oldValue,

        newValue:
          newValue,

        note:
          "Cập nhật hồ sơ nhân sự"

      });

    }
    catch (error) {

      Logger.log(
        "System log update HR profile error: " +
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
 * Tìm hồ sơ nhân viên theo mã.
 */
function findHREmployeeByCode_(manv) {

  const employeeSheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const employeeValues = employeeSheet
    .getDataRange()
    .getValues();

  const positionMap =
    getPositionMap_();

  for (
    let i = 1;
    i < employeeValues.length;
    i++
  ) {

    const row = employeeValues[i];

    if (
      normalizeText(row[0]) !== manv
    ) {

      continue;

    }

    const maChucVu =
      normalizeText(row[15]);

    return {

      manv: row[0],

      hoten: row[1],

      sdt: row[2],

      role: row[4],

      status: row[5],

      pb: row[7],

      ngaySinh: row[8],

      gioiTinh: row[9],

      cccd: row[10],

      ngayCapCCCD: row[11],

      noiCapCCCD: row[12],

      diaChi: row[13],

      email: row[14],

      maChucVu: maChucVu,

      tenChucVu:
        positionMap[maChucVu] || "",

      ngayVaoLam: row[16],

      taiKhoanNganHang: row[17],

      tenNganHang: row[18],

      trangThaiNhanSu: row[19],

      avatarURL: row[20],

      ghiChu: row[21]

    };

  }

  return null;

}


/**
 * Validate hồ sơ HR.
 */
function validateHRProfileInput_(data) {

  data = data || {};

  const profile = {

    ngaySinh:
      normalizeText(data.ngaySinh),

    gioiTinh:
      normalizeText(data.gioiTinh),

    cccd:
      normalizeText(data.cccd),

    ngayCapCCCD:
      normalizeText(data.ngayCapCCCD),

    noiCapCCCD:
      normalizeText(data.noiCapCCCD),

    diaChi:
      normalizeText(data.diaChi),

    email:
      normalizeText(data.email),

    maChucVu:
      normalizeText(data.maChucVu),

    ngayVaoLam:
      normalizeText(data.ngayVaoLam),

    taiKhoanNganHang:
      normalizeText(data.taiKhoanNganHang),

    tenNganHang:
      normalizeText(data.tenNganHang),

    trangThaiNhanSu:
      normalizeText(data.trangThaiNhanSu),

    avatarURL:
      normalizeText(data.avatarURL),

    ghiChu:
      normalizeText(data.ghiChu)

  };

  if (
    !isEmpty(profile.email) &&
    !isValidEmail_(profile.email)
  ) {

    return {

      success: false,

      message:
        "Email không hợp lệ"

    };

  }

  if (
    !isEmpty(profile.cccd) &&
    !/^[0-9]{9,12}$/.test(profile.cccd)
  ) {

    return {

      success: false,

      message:
        "CCCD/CMND phải gồm 9 đến 12 chữ số"

    };

  }

  if (
    isEmpty(profile.trangThaiNhanSu)
  ) {

    profile.trangThaiNhanSu =
      "Đang làm";

  }

  return {

    success: true,

    profile: profile

  };

}


/**
 * Kiểm tra email đơn giản.
 */
function isValidEmail_(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


/**
 * Tìm nhân viên theo CCCD.
 */
function findEmployeeByCCCD_(
  sheet,
  cccd,
  excludeManv
) {

  cccd = normalizeText(cccd);

  excludeManv =
    normalizeText(excludeManv);

  if (isEmpty(cccd)) {

    return null;

  }

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const manv =
      normalizeText(values[i][0]);

    const currentCCCD =
      normalizeText(values[i][10]);

    if (manv === excludeManv) {

      continue;

    }

    if (currentCCCD === cccd) {

      return {

        manv: manv,

        hoten: values[i][1]

      };

    }

  }

  return null;

}


/**
 * Map chức vụ.
 */
function getPositionMap_() {

  const sheet = getSheet(
    CONFIG.SHEETS.POSITIONS
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

    const ma =
      normalizeText(values[i][0]);

    const ten =
      normalizeText(values[i][1]);

    if (
      isEmpty(ma) ||
      isEmpty(ten)
    ) {

      continue;

    }

    map[ma] = ten;

  }

  return map;

}