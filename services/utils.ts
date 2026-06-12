export const formatAmount = (amount: number): string => {
  const rounded = Number(amount.toFixed(2));
  // If it's a whole number, don't show .00
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }
  return rounded.toFixed(2);
};
