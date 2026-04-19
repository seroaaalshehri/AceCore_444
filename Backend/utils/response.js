
exports.success = (res, data, code = 200) => {
  res.status(code).json({
    success: true,
    data,
  });
};

// Error response helper
exports.error = (res, message, code = 500) => {
  res.status(code).json({
    success: false,
    error: message,
  });
};
