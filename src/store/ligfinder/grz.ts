import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue";
import { type ResultMetric, type RangeInput } from "./metric";

export const useGrzStore = defineStore("grz", () => {
    const grzFilters = ref<RangeInput>(getDefaultGrzFilters())
    function getDefaultGrzFilters(): RangeInput {
        return {
            grz_alkis: { min: 0, max: 0 },
            grz_xplanung: { min: 0, max: 0 },
            grz_potential: { min: 0, max: 0 },
            grz_potential_area: { min: 0, max: 0 }
        };
    }
    function isRatioFilter(key: string): boolean {
        if (key === "grz_alkis" || key === "grz_xplanung" || key === "grz_potential") {
            return true
        }
        return false
    }
    function resetGrzFilters(): void {
        grzFilters.value = getDefaultGrzFilters()
    }
    function createGeneralExpression(): any[] {
        const metricExpressions = createRangeExpressions(grzFilters.value)
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
    function createRangeExpressions(filters: RangeInput): any[] {
        const expression: any[] = []
        Object.entries(filters).forEach(([key, value]) => {
            if (value.min !== 0) {
                expression.push([">", ["get", key], value.min])
            }
            if (value.max !== 0) {
                expression.push(["<", ["get", key], value.max])
            }
        })
        if (expression.length > 0) {
            return ["all", ...expression]
        } else {
            return []
        }
    }
    function createMetricFilter(filters: RangeInput): ResultMetric[] {
        const list: ResultMetric[] = []
        Object.entries(filters).forEach(([key, value]) => {
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
        grzFilters,
        resetGrzFilters,
        createGeneralExpression,
        createRangeExpressions,
        createMetricFilter,
        isRatioFilter
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useGrzStore, import.meta.hot))
}
