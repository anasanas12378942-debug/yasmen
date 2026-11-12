const finance = require("./finance");
const {
  getWithdrawalLimits,
  validateWithdrawalAmount
} = require("./withdrawalRules");

function requestWithdrawalWithRules(userId, amountCents) {
  const balances = finance.getBalances(userId);
  const limits = getWithdrawalLimits(balances.withdrawable);

  validateWithdrawalAmount(amountCents, balances.withdrawable);

  return finance.requestWithdrawal(userId, amountCents);
}

function getUserWithdrawalLimits(userId) {
  const balances = finance.getBalances(userId);
  return getWithdrawalLimits(balances.withdrawable);
}

module.exports = {
  requestWithdrawalWithRules,
  getUserWithdrawalLimits,
  getWithdrawalLimits
};
