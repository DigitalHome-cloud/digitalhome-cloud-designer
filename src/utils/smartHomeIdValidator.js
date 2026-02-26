/**
 * SmartHome ID format: {country}-{zip}-{street3letter}{housenumber}-{nn}
 * Examples: DE-80331-MAR12-01, FR-75001-RUE5-01
 *
 * Parts:
 *   country     — 2-letter ISO country code (uppercase)
 *   zip         — 3-5 digit postal code
 *   streetCode  — 3 uppercase letters
 *   houseNumber — 1-5 digit number
 *   suffix      — 2-digit sequence number
 */

const SMARTHOME_ID_REGEX = /^[A-Z]{2}-\d{3,5}-[A-Z]{3}\d{1,5}-\d{2}$/;

/**
 * Validate a SmartHome ID string.
 * @param {string} id
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSmartHomeId(id) {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "SmartHome ID is required." };
  }

  const trimmed = id.trim().toUpperCase();

  if (!SMARTHOME_ID_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        "Invalid format. Expected: CC-ZIPCODE-STR##-NN (e.g. DE-80331-MAR12-01)",
    };
  }

  return { valid: true };
}

/**
 * Parse a SmartHome ID into its components.
 * @param {string} id
 * @returns {{ country, zip, streetCode, houseNumber, suffix } | null}
 */
export function parseSmartHomeId(id) {
  const match = id
    .trim()
    .toUpperCase()
    .match(/^([A-Z]{2})-(\d{3,5})-([A-Z]{3})(\d{1,5})-(\d{2})$/);

  if (!match) return null;

  return {
    country: match[1],
    zip: match[2],
    streetCode: match[3],
    houseNumber: match[4],
    suffix: match[5],
  };
}
