/**
 * Utility to generate robust UPI URLs compatible with various apps like GPay, PhonePe, Paytm.
 */

export interface UPIParams {
  pa: string;         // Payee address (UPI ID) - Required
  pn?: string;        // Payee name - Highly recommended
  am?: string;        // Amount
  cu?: string;        // Currency (Default: INR)
  tn?: string;        // Transaction note
  mc?: string;        // Merchant code
  tr?: string;        // Transaction reference ID
  tid?: string;       // Transaction ID
  url?: string;       // Transaction URL
  [key: string]: string | undefined;
}

/**
 * Formats amount for UPI:
 * - If it's a whole number, don't show .00 (some banks fail with .00)
 * - Otherwise show 2 decimal places.
 */
const formatUPIAmount = (am: string): string => {
  const num = parseFloat(am);
  if (isNaN(num)) return am;
  // ALWAYS return 2 decimal places for consistent parsing by all UPI apps (GPay/PhonePe)
  return num.toFixed(2);
};

export const generateUPIUrl = (
  baseParams: Record<string, string>,
  overrides: {
    pa: string;
    am: string;
    description?: string;
    isAmountModified?: boolean;
  }
): string => {
  const { pa, am, description, isAmountModified } = overrides;

  const formattedAmount = formatUPIAmount(am);

  // Parameters that are tied to specific merchant transactions/signatures.
  // 'sign' and 'url' are ALWAYS stripped if amount is modified as they are signatures.
  // However, if amount is NOT modified, we should keep them if they exist in baseParams
  // because some merchants require them for validation.
  const signatureParams = ['sign', 'url'];

  // These are stripped if the amount is modified, as they are tied to the original transaction.
  const conditionalStrip = ['tr', 'tid', 'mc', 'sid', 'qrMedium', 'mode', 'orgid'];

  // 3. Build the parameter map
  const finalParams: Record<string, string> = {};

  // Add original scanned params first
  Object.entries(baseParams).forEach(([key, value]) => {
    if (!value) return;

    if (isAmountModified && signatureParams.includes(key)) return;
    if (isAmountModified && conditionalStrip.includes(key)) return;

    // Always skip these as we override them
    if (key === 'pa' || key === 'am' || key === 'cu') return;

    finalParams[key] = value;
  });

  // 4. Set/Override core parameters
  finalParams['pa'] = pa;
  finalParams['am'] = formattedAmount;
  finalParams['cu'] = 'INR';

  // Ensure Payee Name (pn) is present - critical for GPay
  if (!finalParams['pn']) {
    finalParams['pn'] = description || 'FinSight Payment';
  }

  // Add Transaction Note (tn) if description is provided
  if (description && description !== finalParams['pn']) {
    finalParams['tn'] = description;
  } else if (!finalParams['tn'] && description) {
    finalParams['tn'] = description;
  }

  // 5. Construct the URL manually to ensure %20 for spaces instead of +
  // and maintain a specific order (pa first, then pn)
  const order = ['pa', 'pn', 'am', 'cu', 'mc', 'tn'];
  const queryString: string[] = [];

  // Add ordered params
  order.forEach(key => {
    if (finalParams[key]) {
      let val = finalParams[key];
      // CRITICAL: Many UPI apps fail to parse the UPI ID (pa) if the '@' is encoded as %40
      // We encode and then specifically revert %40 to @ for max compatibility
      let encodedVal = encodeURIComponent(val).replace(/\+/g, '%20');
      if (key === 'pa') {
        encodedVal = encodedVal.replace(/%40/g, '@');
      }
      queryString.push(`${key}=${encodedVal}`);
      delete finalParams[key];
    }
  });

  // Add remaining params
  Object.entries(finalParams).forEach(([key, value]) => {
    queryString.push(`${key}=${encodeURIComponent(value).replace(/\+/g, '%20')}`);
  });

  const finalUrl = `upi://pay?${queryString.join('&')}`;
  console.log('[UPI] Generated URL:', finalUrl);
  return finalUrl;
};
