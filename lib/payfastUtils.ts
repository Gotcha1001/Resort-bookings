// import crypto from "crypto";

// /**
//  * PayFast credentials returned by getPayFastCredentials()
//  */
// export type PayFastCredentials = {
//   merchantId: string;
//   merchantKey: string;
//   passphrase: string | null;
// };

// /**
//  * Generate PayFast signature – EXACTLY like your old working project
//  */
// export function generateSignature(
//   data: Record<string, string | number | undefined>,
//   passPhrase: string | null = null,
// ): string {
//   const keys = [
//     "merchant_id",
//     "merchant_key",
//     "return_url",
//     "cancel_url",
//     "notify_url",
//     "name_first",
//     "name_last",
//     "email_address",
//     "cell_number",
//     "m_payment_id",
//     "amount",
//     "item_name",
//     "item_description",
//     "custom_int1",
//     "custom_int2",
//     "custom_int3",
//     "custom_int4",
//     "custom_int5",
//     "custom_str1",
//     "custom_str2",
//     "custom_str3",
//     "custom_str4",
//     "custom_str5",
//     "email_confirmation",
//     "confirmation_address",
//     "payment_method",
//   ] as const;

//   let pfOutput = "";

//   keys.forEach((key) => {
//     const value = data[key];
//     if (value != null && value !== "") {
//       const str = String(value).trim();
//       const encoded = encodeURIComponent(str).replace(/%20/g, "+");
//       pfOutput += `${key}=${encoded}&`;
//     }
//   });

//   let getString = pfOutput.slice(0, -1); // remove last &

//   if (passPhrase?.trim()) {
//     getString += `&passphrase=${passPhrase.trim()}`;
//     console.log("PayFast – Appended RAW passphrase");
//   } else {
//     console.log("PayFast – No passphrase used");
//   }

//   console.log("PayFast – Final MD5 string:", getString);

//   return crypto.createHash("md5").update(getString).digest("hex");
// }

// /**
//  * Validate incoming ITN signature
//  * For ITN validation, we must include ALL parameters PayFast sends (except signature)
//  * Use the order as received (NO SORTING)
//  */
// export function validateSignature(
//   params: Record<string, string>,
//   passPhrase: string | null = null,
// ): boolean {
//   const received = params.signature;
//   if (!received) {
//     console.error("PayFast ITN – No signature received");
//     return false;
//   }

//   // Remove signature from params
//   const { signature, ...dataWithoutSignature } = params;

//   // Build query string in the received order (NO SORTING)
//   let pfOutput = "";

//   // Use Object.keys to iterate in insertion order (preserved from formData)
//   Object.keys(dataWithoutSignature).forEach((key) => {
//     const value = dataWithoutSignature[key];
//     // Always include, even if empty
//     const str = value.trim();
//     const encoded = encodeURIComponent(str).replace(/%20/g, "+");
//     pfOutput += `${key}=${encoded}&`;
//   });

//   // Remove trailing &
//   let getString = pfOutput.slice(0, -1);

//   // Append passphrase if provided (not encoded)
//   if (passPhrase?.trim()) {
//     getString += `&passphrase=${passPhrase.trim()}`;
//     console.log("PayFast ITN – Appended passphrase");
//   }

//   // Generate MD5 hash
//   const calculated = crypto.createHash("md5").update(getString).digest("hex");

//   console.log("PayFast ITN – Signature string:", getString);
//   console.log("PayFast ITN – Calculated signature:", calculated);
//   console.log("PayFast ITN – Received signature:  ", received);

//   return calculated === received;
// }

// /**
//  * Returns the correct PayFast URL (sandbox or live)
//  */
// export function getPayFastUrl(): string {
//   const isProd = process.env.NODE_ENV === "production";
//   return isProd
//     ? "https://www.payfast.co.za/eng/process"
//     : "https://sandbox.payfast.co.za/eng/process";
// }

// /**
//  * Returns merchant credentials + passphrase based on environment
//  */
// export function getPayFastCredentials(): PayFastCredentials {
//   const isProd = process.env.NODE_ENV === "production";

//   if (!isProd) {
//     // Development / Sandbox
//     return {
//       merchantId: process.env.PAYFAST_SANDBOX_MERCHANT_ID || "10034923",
//       merchantKey: process.env.PAYFAST_SANDBOX_MERCHANT_KEY || "p8kuuecgvf2fr",
//       passphrase: process.env.PAYFAST_SANDBOX_PASSPHRASE || "codenow101747", // your sandbox passphrase
//     };
//   }

//   // Production
//   return {
//     merchantId: process.env.PAYFAST_MERCHANT_ID!,
//     merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
//     passphrase: process.env.PAYFAST_SALT_PASSPHRASE || null,
//   };
// }

import crypto from "crypto";

/**
 * PayFast credentials returned by getPayFastCredentials()
 */
export type PayFastCredentials = {
  merchantId: string;
  merchantKey: string;
  passphrase: string | null;
};

/**
 * PayFast's backend is PHP and recomputes the signature using PHP's
 * urlencode() rules: alphanumerics and - _ . stay raw, spaces become "+",
 * and everything else is percent-encoded (uppercase hex).
 *
 * JS's encodeURIComponent() is close but NOT the same — it deliberately
 * leaves `! * ' ( )` unescaped, since those are legal URI sub-delimiters.
 * Any field value containing one of those (e.g. "2 night(s)") will hash
 * differently here than it does on PayFast's side, which is exactly the
 * "signature does not match" 400 you get back. This wrapper patches that
 * gap on top of encodeURIComponent so the two implementations agree.
 */
function phpUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(
      /[!'()*]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    );
}

/**
 * Generate PayFast signature – EXACTLY like your old working project
 */
export function generateSignature(
  data: Record<string, string | number | undefined>,
  passPhrase: string | null = null,
): string {
  const keys = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_int1",
    "custom_int2",
    "custom_int3",
    "custom_int4",
    "custom_int5",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "email_confirmation",
    "confirmation_address",
    "payment_method",
  ] as const;

  let pfOutput = "";

  keys.forEach((key) => {
    const value = data[key];
    if (value != null && value !== "") {
      const str = String(value).trim();
      const encoded = phpUrlEncode(str);
      pfOutput += `${key}=${encoded}&`;
    }
  });

  let getString = pfOutput.slice(0, -1); // remove last &

  if (passPhrase?.trim()) {
    getString += `&passphrase=${passPhrase.trim()}`;
    console.log("PayFast – Appended RAW passphrase");
  } else {
    console.log("PayFast – No passphrase used");
  }

  console.log("PayFast – Final MD5 string:", getString);

  return crypto.createHash("md5").update(getString).digest("hex");
}

/**
 * Validate incoming ITN signature
 * For ITN validation, we must include ALL parameters PayFast sends (except signature)
 * Use the order as received (NO SORTING)
 */
export function validateSignature(
  params: Record<string, string>,
  passPhrase: string | null = null,
): boolean {
  const received = params.signature;
  if (!received) {
    console.error("PayFast ITN – No signature received");
    return false;
  }

  // Remove signature from params
  const { signature, ...dataWithoutSignature } = params;

  // Build query string in the received order (NO SORTING)
  let pfOutput = "";

  // Use Object.keys to iterate in insertion order (preserved from formData)
  Object.keys(dataWithoutSignature).forEach((key) => {
    const value = dataWithoutSignature[key];
    // Always include, even if empty
    const str = value.trim();
    const encoded = phpUrlEncode(str);
    pfOutput += `${key}=${encoded}&`;
  });

  // Remove trailing &
  let getString = pfOutput.slice(0, -1);

  // Append passphrase if provided (not encoded)
  if (passPhrase?.trim()) {
    getString += `&passphrase=${passPhrase.trim()}`;
    console.log("PayFast ITN – Appended passphrase");
  }

  // Generate MD5 hash
  const calculated = crypto.createHash("md5").update(getString).digest("hex");

  console.log("PayFast ITN – Signature string:", getString);
  console.log("PayFast ITN – Calculated signature:", calculated);
  console.log("PayFast ITN – Received signature:  ", received);

  return calculated === received;
}

/**
 * Returns the correct PayFast URL (sandbox or live)
 */
export function getPayFastUrl(): string {
  const isProd = process.env.NODE_ENV === "production";
  return isProd
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";
}

/**
 * Returns merchant credentials + passphrase based on environment
 */
export function getPayFastCredentials(): PayFastCredentials {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    // Development / Sandbox
    return {
      merchantId: process.env.PAYFAST_SANDBOX_MERCHANT_ID || "10034923",
      merchantKey: process.env.PAYFAST_SANDBOX_MERCHANT_KEY || "p8kuuecgvf2fr",
      passphrase: process.env.PAYFAST_SANDBOX_PASSPHRASE || "codenow101747", // your sandbox passphrase
    };
  }

  // Production
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID!,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
    passphrase: process.env.PAYFAST_SALT_PASSPHRASE || null,
  };
}
