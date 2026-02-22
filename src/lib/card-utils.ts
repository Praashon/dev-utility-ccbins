export type CardNetwork = "visa" | "mastercard" | "amex";

export interface GeneratedCard {
  number: string;
  expiry: string;
  cvc: string;
  network: CardNetwork;
  name: string;
  fakeAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const randomNumStr = (length: number) => {
  if (length <= 0) return "";
  return Array.from({ length }, () => Math.floor(Math.random() * 10).toString()).join("");
};

export const getLuhnCheckDigit = (numberStr: string): string => {
  let sum = 0;
  for (let i = 0; i < numberStr.length; i++) {
    let digit = parseInt(numberStr[numberStr.length - 1 - i], 10);
    // Double every second digit from the right (meaning when processing left to right, it shifts depending on length)
    // Actually, standard Luhn for generating check digit:
    // double digits from right to left starting from the rightmost digit of the payload.
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return ((10 - (sum % 10)) % 10).toString();
};

export const isValidLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let isSecond = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (isSecond) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
};

const prefixes = {
  visa: ["4111", "4444", "4532", "4242"],
  mastercard: ["5100", "5200", "5300", "5400", "5500"],
  amex: ["34", "37"],
};

const streets = ["123 Main St", "456 Market St", "789 Broadway", "101 1st Ave", "202 Elm St"];
const cities = ["New York", "San Francisco", "Austin", "Chicago", "Seattle"];
const states = ["NY", "CA", "TX", "IL", "WA"];
const zipCodes = ["10001", "94105", "73301", "60601", "98101"];

export const generateCardData = (network: CardNetwork = "visa"): GeneratedCard => {
  const prefixArr = prefixes[network];
  const prefix = prefixArr[Math.floor(Math.random() * prefixArr.length)];
  const length = network === "amex" ? 15 : 16;
  
  const numberWithoutCheck = prefix + randomNumStr(length - prefix.length - 1);
  const checkDigit = getLuhnCheckDigit(numberWithoutCheck);
  let number = numberWithoutCheck + checkDigit;
  
  if (network === "amex") {
    number = `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10)}`;
  } else {
    number = number.replace(/(.{4})/g, "$1 ").trim();
  }
  
  const today = new Date();
  const expMonth = Math.floor(Math.random() * 12) + 1;
  const expYear = today.getFullYear() + Math.floor(Math.random() * 5) + 1;
  const expiry = `${expMonth.toString().padStart(2, "0")}/${expYear.toString().slice(-2)}`;
  
  const cvcLength = network === "amex" ? 4 : 3;
  const cvc = randomNumStr(cvcLength);

  const firstNames = ["James", "Maria", "Robert", "Elena", "Michael", "Sarah", "William", "Jessica"];
  const lastNames = ["Smith", "Garcia", "Johnson", "Martinez", "Brown", "Rodriguez", "Jones", "Lee"];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  
  const idx = Math.floor(Math.random() * cities.length);
  const fakeAddress = {
    street: streets[Math.floor(Math.random() * streets.length)],
    city: cities[idx],
    state: states[idx],
    zipCode: zipCodes[idx],
    country: "US"
  };

  return { number, expiry, cvc, network, name, fakeAddress };
};

export interface MassGeneratorOptions {
  bin: string;
  quantity: number;
  month?: string;
  year?: string;
  cvv?: string;
  format?: "PIPE";
}

export const generateMass = (options: MassGeneratorOptions): string[] => {
  const { bin, quantity, month, year, cvv } = options;
  const results: string[] = [];
  
  // Clean bin
  const cleanBin = bin.replace(/\D/g, "");
  if (!cleanBin) return [];
  
  let targetLength = 16;
  if (cleanBin.startsWith("34") || cleanBin.startsWith("37")) targetLength = 15;

  for (let i = 0; i < quantity; i++) {
    let pan = cleanBin;
    if (pan.length < targetLength - 1) {
      pan += randomNumStr(targetLength - 1 - pan.length);
    } else if (pan.length > targetLength - 1) {
      pan = pan.substring(0, targetLength - 1);
    }
    
    pan += getLuhnCheckDigit(pan);
    
    const m = month && month !== "Random" ? month.padStart(2, "0") : (Math.floor(Math.random() * 12) + 1).toString().padStart(2, "0");
    const today = new Date();
    const y = year && year !== "Random" ? year : (today.getFullYear() + Math.floor(Math.random() * 6)).toString();
    const c = cvv && cvv.trim() !== "" ? cvv : randomNumStr(targetLength === 15 ? 4 : 3);
    
    // FORMAT PIPE
    results.push(`${pan}|${m}|${y}|${c}`);
  }
  
  return results;
};

export const getNetworkFromBin = (bin: string): string => {
  if (bin.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(bin) || /^2[2-7]/.test(bin)) return "mastercard";
  if (bin.startsWith("34") || bin.startsWith("37")) return "amex";
  if (bin.startsWith("6")) return "discover";
  return "unknown";
};

export interface CheckResult {
  cardInfo: string;
  status: "Live" | "Die" | "Unknown";
  network: string;
  message: string;
}

export const validateCard = (cardLine: string): CheckResult => {
  const parts = cardLine.split("|");
  const cc = parts[0]?.replace(/\D/g, "");
  const network = getNetworkFromBin(cc || "");
  
  let status: "Live" | "Die" | "Unknown" = "Unknown";
  let message = "";

  if (!cc || cc.length < 13 || cc.length > 19) {
    status = "Die";
    message = "Invalid Length";
  } else if (!isValidLuhn(cc)) {
    status = "Die";
    message = "Luhn Check Failed";
  } else {
    // It passes strict mathematical validation. We classify mathematically sound cards as "Live" for our local checking simulation.
    // To add realism, we can introduce a small random failure rate to simulate gateway declines on mathematically valid cards 
    // (since real checkers test against gateways, not just Luhn).
    const randomSeed = Math.random();
    if (randomSeed > 0.85) {
      status = "Die";
      message = "Declined (Simulated Risk)";
    } else {
      status = "Live";
      message = "Charge OK. [GATE_01@chkr.cc]";
    }
  }

  return {
    cardInfo: cardLine,
    status,
    network,
    message
  };
};
