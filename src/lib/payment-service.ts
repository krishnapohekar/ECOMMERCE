function checkLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let val = parseInt(digits[i], 10);
    if (shouldDouble) {
      val *= 2;
      if (val > 9) val -= 9;
    }
    sum += val;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function detectCardBrand(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, "");
  if (clean.startsWith("4")) return "VISA";
  if (/^5[1-5]/.test(clean)) return "MASTERCARD";
  if (/^3[47]/.test(clean)) return "AMERICAN_EXPRESS";
  if (/^6(?:011|5)/.test(clean)) return "DISCOVER";
  return "UNKNOWN";
}

function validateVpa(vpa: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,256}$/.test(vpa);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CardAuthRequest {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
  amount: number;
  orderNumber: string;
}

export interface UpiAuthRequest {
  vpa: string;
  amount: number;
  orderNumber: string;
}

export interface GatewayResponse {
  authorized: boolean;
  transactionId: string;
  authCode?: string;
  declineReason?: string;
  brand?: string;
  gatewayResponseCode:
    | "APPROVED"
    | "DECLINED_FRAUD"
    | "DECLINED_INSUFFICIENT_FUNDS"
    | "DECLINED_EXPIRED"
    | "DECLINED_INVALID_CARD"
    | "DECLINED_TIMEOUT"
    | "DECLINED_VPA_ERROR";
  timestamp: string;
}

export class ExternalPaymentGateway {
  static async authorizeCard(req: CardAuthRequest): Promise<GatewayResponse> {
    await delay(1500); // Simulate API latency

    const cleanCard = req.cardNumber.replace(/\s/g, "");

    // 1. Validation checks
    if (!checkLuhn(cleanCard)) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason: "Invalid card number: failed Luhn checksum validation check.",
        gatewayResponseCode: "DECLINED_INVALID_CARD",
        timestamp: new Date().toISOString(),
      };
    }

    const brand = detectCardBrand(cleanCard);

    // 2. Mock decline cases based on end of card number
    if (cleanCard.endsWith("4444")) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason: "Transaction declined: Insufficient funds in card account.",
        gatewayResponseCode: "DECLINED_INSUFFICIENT_FUNDS",
        brand,
        timestamp: new Date().toISOString(),
      };
    }

    if (cleanCard.endsWith("0000")) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason:
          "Transaction blocked: Card flagged by risk analysis engine (Potential Fraud Alert).",
        gatewayResponseCode: "DECLINED_FRAUD",
        brand,
        timestamp: new Date().toISOString(),
      };
    }

    if (cleanCard.endsWith("9999")) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason:
          "Transaction declined: Credit card expiration date is invalid or has expired.",
        gatewayResponseCode: "DECLINED_EXPIRED",
        brand,
        timestamp: new Date().toISOString(),
      };
    }

    // 3. Successful Authorization
    return {
      authorized: true,
      transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
      authCode: String(Math.floor(100000 + Math.random() * 900000)),
      gatewayResponseCode: "APPROVED",
      brand,
      timestamp: new Date().toISOString(),
    };
  }

  static async authorizeUpi(req: UpiAuthRequest): Promise<GatewayResponse> {
    await delay(1500); // Simulate API latency

    const cleanVpa = req.vpa.trim().toLowerCase();

    // 1. Structural Validation
    if (!validateVpa(cleanVpa)) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason:
          "Invalid UPI VPA structure. Standard format is name@bank (e.g. user@okaxis).",
        gatewayResponseCode: "DECLINED_VPA_ERROR",
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Mock decline cases based on UPI address keywords
    if (cleanVpa.startsWith("decline") || cleanVpa.startsWith("insufficient")) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason: "Transaction declined: Insufficient funds in linked bank account.",
        gatewayResponseCode: "DECLINED_INSUFFICIENT_FUNDS",
        timestamp: new Date().toISOString(),
      };
    }

    if (cleanVpa.startsWith("fraud") || cleanVpa.startsWith("blocked")) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason:
          "Transaction blocked: Risk alert. Suspected fraudulent merchant request or account locked.",
        gatewayResponseCode: "DECLINED_FRAUD",
        timestamp: new Date().toISOString(),
      };
    }

    if (cleanVpa.startsWith("timeout")) {
      return {
        authorized: false,
        transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        declineReason:
          "Transaction timed out: Request expired or customer failed to approve payment request in UPI App.",
        gatewayResponseCode: "DECLINED_TIMEOUT",
        timestamp: new Date().toISOString(),
      };
    }

    // 3. Successful Authorization
    return {
      authorized: true,
      transactionId: "TXN-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
      authCode: String(Math.floor(100000 + Math.random() * 900000)),
      gatewayResponseCode: "APPROVED",
      timestamp: new Date().toISOString(),
    };
  }
}
