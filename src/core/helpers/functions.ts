/* HELPER FUNCTIONS
    Please add your multi project focused functions in this file and use in the project from here.
*/

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
