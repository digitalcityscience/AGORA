/* HELPER FUNCTIONS
    Please add your multi project focused functions in this file and use in the project from here.
*/

import { type FeatureCollection } from "geojson";

/**
 * Creates a random hexadecimal formatted color
 * @returns
 */
export function getRandomHexColor(): string {
    // Generate random values for red, green, and blue
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    // Convert decimal values to hexadecimal and ensure two digits
    const redHex = red.toString(16).padStart(2, "0");
    const greenHex = green.toString(16).padStart(2, "0");
    const blueHex = blue.toString(16).padStart(2, "0");
    // Combine the values to create a hex color code
    const hexColor = `#${redHex}${greenHex}${blueHex}`;
    return hexColor;
}
/**
 * Converts HSL (Hue, Saturation, Lightness) color values to a hexadecimal color string.
 *
 * @param h - The hue value (0-360).
 * @param s - The saturation value (0-100).
 * @param l - The lightness value (0-100).
 * @returns The hexadecimal color string.
 */
function hslToHex(h: number, s: number, l: number): string {
    // Convert HSL to RGB first
    s /= 100;
    l /= 100;

    const k = (n: number): number => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number): number =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    // Convert to hex and return
    const toHex = (x: number): string =>
        Math.round(x * 255).toString(16).padStart(2, "0");

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Generates an array of distinct hexadecimal colors.
 *
 * @param numColors - The number of colors to generate.
 * @returns An array of distinct hexadecimal colors.
 */
export function generateDistinctHexColors(numColors: number): string[] {
    const colors: string[] = [];
    const hueStep = 360 / numColors; // Divide the hue spectrum equally

    const randomHue = Math.floor(Math.random() * 360); // Generate a random hue value

    for (let i = 0; i < numColors; i++) {
        const hue = (randomHue + i * hueStep) % 360; // Add the hue step to the random hue
        const hexColor = hslToHex(hue, 70, 50); // HSL to HEX conversion
        colors.push(hexColor);
    }

    return colors;
}
/**
 * Checks if a given argument is null, undefined, or an empty string.
 * @param arg - The argument to check.
 * @returns True if the argument is null, undefined, or an empty string; otherwise, false.
 */
export function isNullOrEmpty(arg: any): boolean{
    if (arg !== null && arg !== undefined && arg !== ""){
        return false
    } else {
        return true
    }
}
/**
 * Formats a given number by separating thousands with periods (".") and
 * decimals with commas (","), and limiting the result to two decimal places.
 *
 * @param num - The number to format.
 * @returns The formatted number as a string.
 *
 * @example
 * ```typescript
 * const formattedNumber = formatNumber(1234567.8912);
 * console.log(formattedNumber); // Output: "1.234.567,89"
 * ```
 */
export function formatNumber(num: number): string {
    if (isNaN(num)) {
        return String(num);
    }
    const fixedNum = Number(num).toFixed(2);
    const [integerPart, decimalPart] = fixedNum.split(".");
    const integerWithThousandsSeparator = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${integerWithThousandsSeparator},${decimalPart}`;
}
/**
 * Escapes a field for CSV output by wrapping it in double quotes and doubling any quotes inside.
 * @param field - The field value to escape.
 * @returns The escaped field.
 */
function escapeCsv(field: unknown): string {
    const fieldStr = field == null ? "" : String(field);
    return `"${fieldStr.replace(/"/g, "\"\"")}"`;
}

/**
   * Sanitizes a filename by removing characters that are not allowed on most filesystems.
   * @param input - The input filename.
   * @returns The sanitized filename.
   */
function sanitizeFilename(input: string): string {
    // Remove characters like / \ ? % * : | " < > and trim whitespace.
    return input.replace(/[/\\?%*:|"<>]/g, "").trim();
}

/**
   * Converts a GeoJSON FeatureCollection to CSV and triggers a download.
   * @param geojson - The GeoJSON FeatureCollection.
   * @param fileName - The desired filename for the CSV.
   */
export function downloadCSVFromGeoJSON(geojson: FeatureCollection, fileName: string): void {
    // Validate the input.
    if (geojson === null || geojson === undefined || !Array.isArray(geojson.features) || geojson.features.length === 0) {
        console.error("Invalid GeoJSON FeatureCollection provided.");
        return;
    }

    // Sanitize the provided filename.
    let sanitizedFilename = sanitizeFilename(fileName);
    if (sanitizedFilename.length === 0) {
        sanitizedFilename = "data";
    }
    if (!sanitizedFilename.toLowerCase().endsWith(".csv")) {
        sanitizedFilename += ".csv";
    }

    // 1. Collect all property keys from the features.
    const propertyKeys = new Set<string>();
    geojson.features.forEach(feature => {
        // Ensure feature and its properties are valid.
        if (((feature?.properties) != null) && typeof feature.properties === "object") {
            Object.keys(feature.properties).forEach(key => propertyKeys.add(key));
        }
    });
    // Convert the set to a sorted array for predictable ordering and add "geometry" as the last column.
    const headers: string[] = [...propertyKeys].sort();
    headers.push("geometry");

    // 2. Build CSV rows.
    const csvRows: string[] = [];
    // Add header row.
    csvRows.push(headers.join(","));

    // Process each feature.
    geojson.features.forEach(feature => {
        const row = headers.map(header => {
            if (header === "geometry") {
                // Use JSON.stringify to convert the geometry object.
                // If geometry is null or undefined, JSON.stringify returns undefined,
                // so fallback to an empty string.
                return escapeCsv(JSON.stringify(feature.geometry) ?? "");
            } else {
                // Use optional chaining to retrieve the property value.
                const value = feature.properties?.[header] ?? "";
                return escapeCsv(value);
            }
        });
        csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");

    // 3. Create a Blob from the CSV string.
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // 4. Trigger the download.
    if (typeof (navigator as any).msSaveBlob === "function") {
        // For Internet Explorer.
        (navigator as any).msSaveBlob(blob, sanitizedFilename);
    } else {
        const link = document.createElement("a");
        if (typeof link.download !== "undefined") { // Feature detection.
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = sanitizedFilename;
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Revoke the object URL after a short delay to free up memory.
            setTimeout(() => { URL.revokeObjectURL(url); }, 100);
        } else {
        // Fallback for older browsers.
            window.open(URL.createObjectURL(blob));
        }
    }
}
/**
 * Downloads a GeoJSON FeatureCollection as a .geojson file.
 * @param data - The GeoJSON FeatureCollection to download.
 * @param fileName - The desired filename for the downloaded file (without extension).
 */
export function downloadAsGeojson(data: FeatureCollection, fileName: string): void {
    if (data === null || data === undefined || !Array.isArray(data.features) || data.features.length === 0) {
        console.error("Invalid GeoJSON FeatureCollection provided.");
        return;
    }
    // Sanitize the provided filename.
    let sanitizedFilename = sanitizeFilename(fileName);
    if (sanitizedFilename.length === 0) {
        sanitizedFilename = "data";
    }
    if (!sanitizedFilename.toLowerCase().endsWith(".geojson")) {
        sanitizedFilename += ".geojson";
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", sanitizedFilename);
    document.body.appendChild(downloadAnchorNode); // required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
