const express = require("express");
const helmet = require("helmet");
const path = require("path");

const config = require("./config");
const { sessionMiddleware, requireLogin, requireAdmin } = require("./middleware/auth");
const { generalLimiter } = require("./middleware/rateLimit");
const { getCsrfToken, csrfProtection } = require("./middleware/csrf");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
if (config.env === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(sessionMiddleware);
app.use(generalLimiter);
app.use(csrfProtection);

app.use("/api/auth", require("./routes/auth"));

app.get("/api/csrf", (req, res) => {
  res.json({ success: true, csrfToken: getCsrfToken(req) });
});

app.use("/api/markets", require("./routes/markets"));
app.use("/api/market-prices", require("./routes/marketPrices"));
app.use("/api/public", require("./routes/public"));
app.use("/api/member", require("./routes/member"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/deposits", require("./routes/deposits"));
app.use("/api/withdrawals", require("./routes/withdrawals"));
app.use("/api/withdrawal-balance", require("./routes/withdrawalBalance"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/profile", require("./routes/barcode"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/support", require("./routes/support"));
app.use("/api/teams", require("./routes/teams"));
app.use("/api/activity", require("./routes/activity"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/announcement-reads", require("./routes/announcementReads"));

app.use("/api/admin", require("./routes/adminSetup"));
app.use("/api/admin/task-report", require("./routes/adminTaskReport"));
app.use("/api/admin", require("./routes/adminActivity"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/consents", require("./routes/adminConsents"));
app.use("/api/admin/users", require("./routes/adminUsers"));
app.use("/api/admin/deposits", require("./routes/adminDeposits"));
app.use("/api/admin/withdrawals", require("./routes/adminWithdrawalActions"));
app.use("/api/admin/barcodes", require("./routes/adminBarcodes"));
app.use("/api/admin/profits", require("./routes/adminProfits"));
app.use("/api/admin/tasks", require("./routes/adminTaskFunding"));
app.use("/api/admin/moderation", require("./routes/adminModeration"));
app.use("/api/admin/notifications", require("./routes/adminNotifications"));
app.use("/api/admin/trading", require("./routes/adminTrading"));
app.use("/api/admin/market-assets", require("./routes/adminMarketAssets"));
app.use("/api/team-details", require("./routes/teamDetails"));
app.use("/api/task-achievements", require("./routes/taskAchievements"));
app.use("/api/weekly-task-summary", require("./routes/weeklyTaskSummary"));
app.use("/api/admin/weekly-tasks", require("./routes/adminWeeklyTasks"));

app.get("/market.html", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "market.html"));
});

app.get("/admin-trading.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin-trading.html"));
});

app.get("/portfolio.html", requireAdmin, (req, res) => {
  res.redirect("/admin-trading.html");
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/statement", require("./routes/statement"));
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`YASMIN AL-SHAM running on port ${config.port}`);
});
