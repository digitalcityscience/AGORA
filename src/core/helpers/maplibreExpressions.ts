/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/**
 * Utils for handling MapLibre GL filter expressions
 */

/**
 * Unwraps an \"all\" expression if present, otherwise returns the expression in array form.
 *
 * @param expr - The expression to unwrap.
 * @returns The unwrapped or properly wrapped expression.
 */
export function unwrapIfAll(expr: any[]): any[] {
    if (Array.isArray(expr) && expr[0] === "all") {
        return expr.slice(1);
    } else if (Array.isArray(expr) && typeof expr[0] === "string") {
        return [expr];
    } else {
        return [];
    }
}

/**
   * Flattens incorrectly nested arrays inside a MapLibre expression.
   * Also removes empty \"all\", \"any\", \"none\" blocks to produce the cleanest possible structure.
   *
   * @param expr - The expression to flatten and clean.
   * @returns A cleaned-up valid MapLibre expression or null if nothing is left.
   */
export function flattenFilterExpression(expr: any): any {
    if (!Array.isArray(expr) || expr.length === 0) {
        return null;
    }

    const [operator, ...rest] = expr;

    if (["all", "any", "none"].includes(operator as string)) {
        const flattened = rest.flatMap(item => {
            if (Array.isArray(item) && item.length === 1 && Array.isArray(item[0])) {
                return flattenFilterExpression(item[0]);
            }
            const flatItem = flattenFilterExpression(item);
            return flatItem ? [flatItem] : [];
        });

        if (flattened.length === 0) {
            return null; // No valid expressions left
        }

        return [operator, ...flattened];
    }

    if (operator === "!") {
        const flattenedInner = flattenFilterExpression(rest[0]);
        if (!flattenedInner) {
            return null;
        }
        return [operator, flattenedInner];
    }

    // Base case: simple expression
    return expr;
}

/**
   * Validates whether a given expression is a structurally valid MapLibre filter expression.
   * Checks for known operators, proper arity, and recursive structure for compound filters.
   *
   * @param expr - The expression to validate.
   * @returns True if the expression is valid, false otherwise.
   */
export function isValidMapLibreExpression(expr: any): boolean {
    if (!Array.isArray(expr)) return false;
    if (expr.length === 0) return false;

    const validOperators = new Set([
        "all", "any", "none", "in", "!", "==", "!=", "<", "<=", ">", ">=",
        "has", "!has", "get", "literal", "case", "match",
        "boolean", "string", "number"
    ]);

    const operator = expr[0];

    if (typeof operator !== "string" || !validOperators.has(operator)) {
        return false;
    }

    if (["all", "any", "none"].includes(operator)) {
        return expr.slice(1).every(isValidMapLibreExpression);
    }

    if (operator === "!") {
        return expr.length === 2 && isValidMapLibreExpression(expr[1]);
    }

    if (operator === "in") {
        return (
            expr.length === 3 &&
        Array.isArray(expr[2]) &&
        (
            (expr[2][0] === "get" && typeof expr[2][1] === "string") ||
          (expr[2][0] === "literal" && Array.isArray(expr[2][1]))
        )
        );
    }

    return true;
}
