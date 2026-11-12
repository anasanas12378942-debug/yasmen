const MIN_WITHDRAWAL_CENTS = 10000;
const MAX_WITHDRAWAL_CENTS = 100000;
const RESERVED_BALANCE_CENTS = 100000;

function getWithdrawalLimits(fundedBalanceCents) {
  const balance = Number(fundedBalanceCents);

  if (!Number.isSafeInteger(balance) || balance < 0) {
    throw new Error("INVALID_BALANCE");
  }

  const available = Math.max(0, balance - RESERVED_BALANCE_CENTS);

  return {
    balanceCents: balance,
    reservedCents: Math.min(balance, RESERVED_BALANCE_CENTS),
    availableCents: available,
    maximumRequestCents: Math.min(available, MAX_WITHDRAWAL_CENTS),
    minimumRequestCents: MIN_WITHDRAWAL_CENTS
  };
}

function validateWithdrawalAmount(amountCents, fundedBalanceCents) {
  const amount = Number(amountCents);

  if (!Number.isSafeInteger(amount)) {
    throw new Error("INVALID_WITHDRAWAL_AMOUNT");
  }

  const limits = getWithdrawalLimits(fundedBalanceCents);

  if (amount < MIN_WITHDRAWAL_CENTS) {
    throw new Error("MINIMUM_WITHDRAWAL_IS_100_DOLLARS");
  }

  if (amount > MAX_WITHDRAWAL_CENTS) {
    throw new Error("MAXIMUM_WITHDRAWAL_IS_1000_DOLLARS");
  }

  if (amount > limits.availableCents) {
    throw new Error("WITHDRAWAL_EXCEEDS_AVAILABLE_BALANCE");
  }

  return true;
}

module.exports = {
  getWithdrawalLimits,
  validateWithdrawalAmount
};
