const CONFIG = {

  SHEETS: {
    EMPLOYEES: "NhanVien",
    SITES: "CongTrinh",
    ATTENDANCE: "ChamCong"
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
    SITE: "CT"
  },

  CODE_LENGTH: {
    EMPLOYEE: 3,
    SITE: 3
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

  }

};