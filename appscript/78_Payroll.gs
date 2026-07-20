/**
 * Bảng lương nháp V1.
 *
 * Chỉ tính thử, chưa chốt lương.
 */
function getPayrollDraft(month, year, pb) {

  month = Number(month);
  year = Number(year);
  pb = normalizeText(pb || "all");

  if (
    isNaN(month) ||
    isNaN(year) ||
    month < 1 ||
    month > 12
  ) {

    return jsonResponse({
      success: false,
      message: "Tháng/năm không hợp lệ"
    });

  }

  const congChuan =
    getPayrollStandardDaysForDraft_(
      month,
      year
    );

  const employees =
    getPayrollEmployees_(pb);

  const attendanceMap =
    getPayrollAttendanceMap_(
      month,
      year
    );

  const leaveMap =
    getPayrollLeaveMap_(
      month,
      year
    );

  const advanceMap =
    getPayrollAdvanceMap_(
      month,
      year
    );

  const contractMap =
    getPayrollContractMap_(
      month,
      year
    );

  const rows = [];

  employees.forEach(function(emp) {

    const manv =
      emp.manv;

    const attendance =
      attendanceMap[manv] || {
        ngayCong: 0,
        tongGio: 0
      };

    const leave =
      leaveMap[manv] || {
        nghiPhepCoLuong: 0,
        nghiKhongLuong: 0
      };

    const advance =
      advanceMap[manv] || 0;

    const contract =
      contractMap[manv] || {
        mahd: "",
        loaiHD: "",
        luongCoBan: 0,
        phuCap: 0
      };

    const luongCoBan =
      Number(contract.luongCoBan || 0);

    const phuCap =
      Number(contract.phuCap || 0);

    const luongNgay =
      congChuan > 0
        ? luongCoBan / congChuan
        : 0;

    const ngayCong =
      Number(attendance.ngayCong || 0);

    const nghiPhepCoLuong =
      Number(leave.nghiPhepCoLuong || 0);

    const nghiKhongLuong =
      Number(leave.nghiKhongLuong || 0);

    const tienCong =
      roundMoney_(
        luongNgay * ngayCong
      );

    const tienNghiPhep =
      roundMoney_(
        luongNgay * nghiPhepCoLuong
      );

    const tongThuNhap =
      roundMoney_(
        tienCong +
        tienNghiPhep +
        phuCap
      );

    const thucLanh =
      roundMoney_(
        tongThuNhap -
        advance
      );

    rows.push({

      manv: manv,

      hoten: emp.hoten,

      pb: emp.pb,

      mahd: contract.mahd,

      loaiHD: contract.loaiHD,

      congChuan: congChuan,

      luongCoBan: luongCoBan,

      phuCap: phuCap,

      luongNgay:
        roundMoney_(luongNgay),

      ngayCong: ngayCong,

      tongGio:
        roundNumber_(
          attendance.tongGio || 0,
          2
        ),

      nghiPhepCoLuong:
        nghiPhepCoLuong,

      nghiKhongLuong:
        nghiKhongLuong,

      tienCong:
        tienCong,

      tienNghiPhep:
        tienNghiPhep,

      tongThuNhap:
        tongThuNhap,

      tamUng:
        advance,

      thucLanh:
        thucLanh,

      ghiChu:
        contract.mahd
          ? ""
          : "Chưa có hợp đồng hiệu lực / chưa có lương cơ bản"

    });

  });

  const summary =
    buildPayrollSummary_(rows);

  return jsonResponse({

    success: true,

    month: month,

    year: year,

    pb: pb,

    congChuan: congChuan,

    rows: rows,

    summary: summary

  });

}


/**
 * Lấy công chuẩn tháng.
 *
 * Ưu tiên sheet CauHinhLuong.
 * Nếu chưa có thì tự tính ngày trong tháng trừ Chủ nhật.
 */
function getPayrollStandardDaysForDraft_(
  month,
  year
) {

  const sheet = getSheet(
    CONFIG.SHEETS.PAYROLL_CONFIG
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const rowMonth =
      Number(values[i][0]);

    const rowYear =
      Number(values[i][1]);

    if (
      rowMonth === month &&
      rowYear === year
    ) {

      const congChuan =
        Number(values[i][2] || 0);

      if (congChuan > 0) {

        return congChuan;

      }

    }

  }

  return calculatePayrollStandardDays_(
    month,
    year
  );

}


/**
 * Tự tính công chuẩn = số ngày trong tháng - Chủ nhật.
 */
function calculatePayrollStandardDays_(
  month,
  year
) {

  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();

  let count = 0;

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    if (date.getDay() !== 0) {

      count++;

    }

  }

  return count;

}


/**
 * Lấy nhân viên active theo phòng ban.
 */
function getPayrollEmployees_(pb) {

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

    const manv =
      normalizeText(values[i][0]);

    const hoten =
      normalizeText(values[i][1]);

    const status =
      normalizeText(values[i][5]);

    const employeePB =
      normalizeText(values[i][7]);

    if (
      isEmpty(manv) ||
      isEmpty(hoten)
    ) {

      continue;

    }

    if (
      status !== CONFIG.STATUS.ACTIVE
    ) {

      continue;

    }

    if (
      pb !== "all" &&
      employeePB !== pb
    ) {

      continue;

    }

    result.push({

      manv: manv,

      hoten: hoten,

      pb: employeePB

    });

  }

  result.sort(function(a, b) {

    return String(a.manv)
      .localeCompare(
        String(b.manv)
      );

  });

  return result;

}


/**
 * Tính ngày công từ Sheet ChamCong.
 */
function getPayrollAttendanceMap_(
  month,
  year
) {

  const sheet = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const dailyMap = {};

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const timestamp =
      parsePayrollDateTime_(row[0]);

    if (!timestamp) {

      continue;

    }

    if (
      timestamp.getMonth() + 1 !== month ||
      timestamp.getFullYear() !== year
    ) {

      continue;

    }

    const manv =
      normalizeText(row[1]);

    const type =
      normalizeText(row[3]);

    if (isEmpty(manv)) {

      continue;

    }

    const dateKey =
      formatPayrollDateKey_(timestamp);

    const key =
      manv + "|" + dateKey;

    if (!dailyMap[key]) {

      dailyMap[key] = {
        manv: manv,
        dateKey: dateKey,
        checkIn: null,
        checkOut: null
      };

    }

    if (
      type === CONFIG.ATTENDANCE_TYPE.CHECK_IN
    ) {

      if (
        !dailyMap[key].checkIn ||
        timestamp.getTime() <
        dailyMap[key].checkIn.getTime()
      ) {

        dailyMap[key].checkIn =
          timestamp;

      }

    }

    if (
      type === CONFIG.ATTENDANCE_TYPE.CHECK_OUT
    ) {

      if (
        !dailyMap[key].checkOut ||
        timestamp.getTime() >
        dailyMap[key].checkOut.getTime()
      ) {

        dailyMap[key].checkOut =
          timestamp;

      }

    }

  }

  const result = {};

  Object.keys(dailyMap).forEach(function(key) {

    const item =
      dailyMap[key];

    if (
      !item.checkIn ||
      !item.checkOut
    ) {

      return;

    }

    const hours =
      (
        item.checkOut.getTime() -
        item.checkIn.getTime()
      ) /
      (
        1000 * 60 * 60
      );

    if (hours <= 0) {

      return;

    }

    const dayWork =
      calculatePayrollDayWork_(hours);

    if (!result[item.manv]) {

      result[item.manv] = {
        ngayCong: 0,
        tongGio: 0
      };

    }

    result[item.manv].ngayCong +=
      dayWork;

    result[item.manv].tongGio +=
      hours;

  });

  return result;

}


/**
 * Quy đổi giờ thành ngày công.
 */
function calculatePayrollDayWork_(hours) {

  if (
    hours >= CONFIG.WORK_RULES.FULL_DAY_HOURS
  ) {

    return 1;

  }

  if (
    hours >= CONFIG.WORK_RULES.HALF_DAY_HOURS
  ) {

    return 0.5;

  }

  return 0;

}


/**
 * Lấy nghỉ phép đã duyệt.
 */
function getPayrollLeaveMap_(
  month,
  year
) {

  const sheet = getSheet(
    CONFIG.SHEETS.LEAVES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const result = {};

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const manv =
      normalizeText(row[1]);

    const loaiNghi =
      normalizeText(row[2]);

    const trangThai =
      normalizeText(row[7]);

    if (
      isEmpty(manv) ||
      trangThai !== "Đã duyệt"
    ) {

      continue;

    }

    const startDate =
      parsePayrollDateOnly_(row[3]);

    const endDate =
      parsePayrollDateOnly_(row[4]);

    if (
      !startDate ||
      !endDate
    ) {

      continue;

    }

    const daysInMonth =
      countPayrollLeaveDaysInMonth_(
        startDate,
        endDate,
        month,
        year
      );

    if (daysInMonth <= 0) {

      continue;

    }

    if (!result[manv]) {

      result[manv] = {
        nghiPhepCoLuong: 0,
        nghiKhongLuong: 0
      };

    }

    if (
      isPaidPayrollLeaveType_(loaiNghi)
    ) {

      result[manv].nghiPhepCoLuong +=
        daysInMonth;

    }
    else {

      result[manv].nghiKhongLuong +=
        daysInMonth;

    }

  }

  return result;

}


/**
 * Loại nghỉ có lương.
 */
function isPaidPayrollLeaveType_(loaiNghi) {

  const paidTypes = [
    "Nghỉ phép năm"
  ];

  return paidTypes.indexOf(
    loaiNghi
  ) >= 0;

}


/**
 * Đếm số ngày nghỉ nằm trong tháng.
 */
function countPayrollLeaveDaysInMonth_(
  startDate,
  endDate,
  month,
  year
) {

  let count = 0;

  const current =
    new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );

  const end =
    new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

  while (
    current.getTime() <= end.getTime()
  ) {

    if (
      current.getMonth() + 1 === month &&
      current.getFullYear() === year
    ) {

      count++;

    }

    current.setDate(
      current.getDate() + 1
    );

  }

  return count;

}


/**
 * Lấy tạm ứng đã duyệt theo nhân viên.
 */
function getPayrollAdvanceMap_(
  month,
  year
) {

  const sheet = getSheet(
    CONFIG.SHEETS.ADVANCES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const result = {};

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const manv =
      normalizeText(row[1]);

    const ngayTamUng =
      parsePayrollDateOnly_(row[2]);

    const soTien =
      Number(row[3] || 0);

    const trangThai =
      normalizeText(row[5]);

    if (
      isEmpty(manv) ||
      trangThai !== "Đã duyệt" ||
      !ngayTamUng
    ) {

      continue;

    }

    if (
      ngayTamUng.getMonth() + 1 !== month ||
      ngayTamUng.getFullYear() !== year
    ) {

      continue;

    }

    if (!result[manv]) {

      result[manv] = 0;

    }

    result[manv] += soTien;

  }

  return result;

}


/**
 * Lấy hợp đồng hiệu lực và lương cơ bản.
 */
function getPayrollContractMap_(
  month,
  year
) {

  const sheet = getSheet(
    CONFIG.SHEETS.CONTRACTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const monthStart =
    new Date(
      year,
      month - 1,
      1
    );

  const monthEnd =
    new Date(
      year,
      month,
      0
    );

  const result = {};

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const mahd =
      normalizeText(row[0]);

    const manv =
      normalizeText(row[1]);

    const trangThai =
      normalizeText(row[8]);

    if (
      isEmpty(mahd) ||
      isEmpty(manv) ||
      trangThai !== "Hiệu lực"
    ) {

      continue;

    }

    const ngayHieuLuc =
      parsePayrollDateOnly_(row[4]);

    const ngayHetHan =
      parsePayrollDateOnly_(row[5]);

    if (
      ngayHieuLuc &&
      ngayHieuLuc.getTime() >
      monthEnd.getTime()
    ) {

      continue;

    }

    if (
      ngayHetHan &&
      ngayHetHan.getTime() <
      monthStart.getTime()
    ) {

      continue;

    }

    const current =
      result[manv];

    const currentEffective =
      current
        ? current.ngayHieuLucDate
        : null;

    const shouldReplace =
      !current ||
      (
        ngayHieuLuc &&
        (
          !currentEffective ||
          ngayHieuLuc.getTime() >
          currentEffective.getTime()
        )
      );

    if (shouldReplace) {

      result[manv] = {

        mahd: mahd,

        manv: manv,

        loaiHD:
          row[2],

        ngayHieuLucDate:
          ngayHieuLuc,

        luongCoBan:
          Number(row[6] || 0),

        phuCap:
          Number(row[7] || 0)

      };

    }

  }

  return result;

}


/**
 * Tổng hợp summary.
 */
function buildPayrollSummary_(rows) {

  const summary = {

    tongNhanVien:
      rows.length,

    tongLuongCoBan:
      0,

    tongPhuCap:
      0,

    tongTienCong:
      0,

    tongTienNghiPhep:
      0,

    tongThuNhap:
      0,

    tongTamUng:
      0,

    tongThucLanh:
      0

  };

  rows.forEach(function(row) {

    summary.tongLuongCoBan +=
      Number(row.luongCoBan || 0);

    summary.tongPhuCap +=
      Number(row.phuCap || 0);

    summary.tongTienCong +=
      Number(row.tienCong || 0);

    summary.tongTienNghiPhep +=
      Number(row.tienNghiPhep || 0);

    summary.tongThuNhap +=
      Number(row.tongThuNhap || 0);

    summary.tongTamUng +=
      Number(row.tamUng || 0);

    summary.tongThucLanh +=
      Number(row.thucLanh || 0);

  });

  Object.keys(summary).forEach(function(key) {

    summary[key] =
      roundMoney_(
        summary[key]
      );

  });

  return summary;

}


/**
 * Parse DateTime.
 */
function parsePayrollDateTime_(value) {

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
 * Parse Date Only.
 */
function parsePayrollDateOnly_(value) {

  const date =
    parsePayrollDateTime_(value);

  if (!date) {

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
function formatPayrollDateKey_(date) {

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
 * Làm tròn tiền.
 */
function roundMoney_(value) {

  return Math.round(
    Number(value || 0)
  );

}


/**
 * Làm tròn số.
 */
function roundNumber_(
  value,
  digits
) {

  const factor =
    Math.pow(
      10,
      digits || 0
    );

  return Math.round(
    Number(value || 0) * factor
  ) / factor;

}