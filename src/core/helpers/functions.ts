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
