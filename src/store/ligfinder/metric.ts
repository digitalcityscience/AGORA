import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue";

export interface ResultMetric {
    column: string,
    operation: "<"|">",
    value: string
}
export type RangeInput = Record<string, {
    min: number;
    max: number;
}>;
export const useMetricStore = defineStore("metric", () => {
    const metricFilters = ref<RangeInput>(getDefaultMetricFilters())
    /**
     * Returns the default metric filter ranges for all metric-related properties.
     * @returns The default range input object for metric filters.
     */
    function getDefaultMetricFilters(): RangeInput {
        return {
            Shape_Area: { min: 0, max: 0 },
            dist_train_station: { min: 0, max: 0 },
            dist_supermarket: { min: 0, max: 0 },
            dist_kindergarten: { min: 0, max: 0 },
            dist_bus_stop: { min: 0, max: 0 },
            dist_hospitals: { min: 0, max: 0 },
            dist_pharmacies: { min: 0, max: 0 },
            dist_airport: { min: 0, max: 0 },
            dist_fire_departments: { min: 0, max: 0 },
        };
    }
    /**
     * Resets the metric filters to their default values.
     */
    function resetMetricFilters(): void {
        metricFilters.value = getDefaultMetricFilters()
    }
    /**
     * Creates a general MapLibre GL expression for the current metric filters.
     * @param excludeShapeArea - Whether to exclude the Shape_Area property from the filter.
     * @returns An array representing the filter expression.
     */
    function createGeneralExpression(excludeShapeArea: boolean): any[] {
        const metricExpressions = createRangeExpressions(metricFilters.value, excludeShapeArea)
        const expression = [...metricExpressions]
        return [...expression]
    }
    /**
     * Creates an array of MapLibre GL JS expressions for filtering based on the specified range filters. Each filter is
     * evaluated to create expressions that check if a property value is greater than the minimum value (`min`) and less than
     * the maximum value (`max`) specified in the filter, excluding boundaries set to 0. The resulting expressions are
     * combined into a single "all" expression to ensure all conditions must be met. If no filters are specified or all
     * filters have 0 as both min and max, an empty array is returned, indicating no filtering conditions.
     *
     * @param {RangeInput} filters - An object containing keys representing property names to filter on, with associated
     * values specifying the min and max range. Each property in `filters` should conform to the structure { min: number, max: number }.
     * @returns {any[]} - An array of MapLibre GL JS expressions. If one or more range filters are provided, the array
     * starts with the "all" operator followed by sub-expressions for each filter. If no valid range filters are provided,
     * an empty array is returned.
     */
    function createRangeExpressions(filters: RangeInput, excludeShapeArea: boolean): any[] {
        const expression: any[] = []
        Object.entries(filters).forEach(([key, value]) => {
            if (excludeShapeArea && key === "Shape_Area") return;
            if (value.min !== 0) {
                expression.push([">", ["to-number", ["get", key]], value.min])
            }
            if (value.max !== 0) {
                expression.push(["<", ["to-number", ["get", key]], value.max])
            }
        })
        if (expression.length > 0) {
            return ["all", ...expression]
        } else {
            return []
        }
    }
    /**
     * Creates a list of metric filter objects for the current metric filters.
     * @param filters - The range input object for metric filters.
     * @param excludeShapeArea - Whether to exclude the Shape_Area property from the filter.
     * @returns An array of ResultMetric objects representing the filter conditions.
     */
    function createMetricFilter(filters: RangeInput, excludeShapeArea: boolean): ResultMetric[] {
        const list: ResultMetric[] = []
        Object.entries(filters).forEach(([key, value]) => {
            if (excludeShapeArea && key === "Shape_Area") return;
            if (value.min !== 0) {
                list.push({ operation:">", column: key, value: String(value.min) })
            }
            if (value.max !== 0) {
                list.push({ operation:"<", column: key, value: String(value.max) })
            }
        })
        if (list.length > 0) {
            return list
        } else {
            return []
        }
    }
    return {
        metricFilters,
        resetMetricFilters,
        createGeneralExpression,
        createRangeExpressions,
        createMetricFilter
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useMetricStore, import.meta.hot))
}
