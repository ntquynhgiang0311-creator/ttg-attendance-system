const CONFIG = {

  SHEETS: {
    EMPLOYEES: "NhanVien",
    SITES: "CongTrinh",
    ATTENDANCE: "ChamCong",
    DEPARTMENTS: "PhongBan",
    POSITIONS: "ChucVu",
    CONTRACTS: "HopDong",
    LEAVES: "NghiPhep",
     ADVANCES: "TamUng",
     PAYROLL_CONFIG: "CauHinhLuong",
     ATTENDANCE_ADJUSTMENTS: "ChamCongBu",
     SYSTEM_LOGS: "NhatKyHeThong"
  },

  STATUS: {
    ACTIVE: "Active",
    INACTIVE: "Inactive"
  },

  ATTENDANCE_TYPE: {
    CHECK_IN: "Check In",
    CHECK_OUT: "Check Out"
  },

  CODE_PREFIX: {
    EMPLOYEE: "NV",
    SITE: "CT",
    CONTRACT: "HD",
    LEAVE: "NP",
    ADVANCE: "TU",
    ATTENDANCE_ADJUSTMENT: "CCB"
  },

  CODE_LENGTH: {
    EMPLOYEE: 3,
    SITE: 3,
    CONTRACT: 3,
    LEAVE: 3,
    ADVANCE: 3,
    ATTENDANCE_ADJUSTMENT: "CCB"
  },

  /**
   * Quy tắc chấm công hiện tại
   *
   * Sau này module Nhân sự / Ca làm
   * sẽ đưa các thông số này vào Sheet cấu hình.
   */
  WORK_RULES: {

    START_HOUR: 7,
    START_MINUTE: 30,

    END_HOUR: 17,
    END_MINUTE: 0,

    FULL_DAY_HOURS: 9.5,

    HALF_DAY_HOURS: 4

  },
  LEAVE_RULES: {
  MIN_NOTICE_DAYS: 3,
  URGENT_TYPES: [
    "Nghỉ bệnh"
  ]
}

};