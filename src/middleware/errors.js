function notFound(req, res, next) {
  res.status(404).sendFile(require("path").join(__dirname, "../../public/404.html"));
}

function errorHandler(err, req, res, next) {
  console.error("Server error:", err);

  if (res.headersSent) return next(err);

  if (req.path.startsWith("/api/")) {
    return res.status(err.status || 500).json({
      success: false,
      message: "حدث خطأ تقني. يرجى المحاولة لاحقاً."
    });
  }

  return res.status(500).sendFile(
    require("path").join(__dirname, "../../public/500.html")
  );
}

module.exports = { notFound, errorHandler };
