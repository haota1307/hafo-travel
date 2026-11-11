module.exports = {
  // Kế thừa rules chuẩn của Conventional Commits
  extends: ['@commitlint/config-conventional'],

  /* * ĐÃ XÓA: parserPreset
   * (Để mặc định sử dụng format chuẩn: type(scope): subject)
   */

  rules: {
    // 1. Các type được phép sử dụng
    'type-enum': [
      2,
      'always',
      [
        'feat', // Tính năng mới
        'fix', // Sửa lỗi
        'docs', // Tài liệu (README,...)
        'style', // Format code (spaces, semi,...)
        'refactor', // Cấu trúc lại code
        'test', // Thêm test
        'chore', // Việc vặt (build, package manager...)
        'revert', // Revert commit
        'ci', // CI/CD
        'perf', // Hiệu năng
      ],
    ],

    // 2. Độ dài tối thiểu của Header (giữ nguyên setting cũ của bạn là 10)
    'header-min-length': [2, 'always', 10],

    // 3. Độ dài tối đa của Header
    'header-max-length': [2, 'always', 160],

    // 4. Quy tắc viết hoa/thường cho Subject (mô tả ngắn)
    // Chuẩn thường dùng 'lower-case', nhưng bạn có thể để tắt (0) như cũ nếu muốn thoải mái
    'subject-case': [
      0,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
  },
};
