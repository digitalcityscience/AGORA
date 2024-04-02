import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue";

export type RangeInput = Record<string, {
    min: number;
    max: number;
}>;
export const useLigfinderStore = defineStore("ligfinder", () => {
    const metricFilters = ref<RangeInput>({
        area_fme:{
            min:0,
            max:0
        },
        bgf_sum:{
            min:0,
            max:0
        },
        fl_unbeb_a:{
            min:0,
            max:0
        },
        ms_dist:{
            min:0,
            max:0
        },
        sm_dist:{
            min:0,
            max:0
        },
        kita_dist:{
            min:0,
            max:0
        },
        bus_dist:{
            min:0,
            max:0
        },
        krankenhaus_dist:{
            min:0,
            max:0
        },
        park_dist:{
            min:0,
            max:0
        },
    })
    async function createGeneralExpression(): Promise<any[]> {
        const metricExpressions = createRangeExpressions(metricFilters.value)
        const expression = [...metricExpressions]
        return await Promise.resolve([...expression])
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
    return {
        metricFilters,
        createGeneralExpression,
        createRangeExpressions
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useLigfinderStore, import.meta.hot))
}
