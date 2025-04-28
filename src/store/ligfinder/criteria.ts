import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue";
import { type TreeNode } from "primevue/treenode";
import { type LGBTypData, type Domain, type NutzungItemData } from "../../domains";
import domains from "../../../domain_structure.json"
import { unwrapIfAll } from "../../core/helpers/maplibreExpressions";

export interface AppliedCriteria extends TreeNode {
    status: "included"|"excluded",
    data: LGBTypData|NutzungItemData,
    label: string
}

export const useCriteriaStore = defineStore("criteriaStore", () => {
    const list: Domain = domains;
    const criteriaInUse = ref<AppliedCriteria[]>([])
    const addCriteria = (criteria: AppliedCriteria): void => {
        if (criteriaInUse.value.filter((crit)=>{ return crit.key === criteria.key }).length === 0){
            criteriaInUse.value.push(criteria)
        } else {
            const index = criteriaInUse.value.findIndex(crit => crit.key === criteria.key)
            if (criteriaInUse.value[index].status !== criteria.status) {
                criteriaInUse.value[index].status = criteria.status
            }
        }
    }
    const removeCriteria = (criteria: AppliedCriteria): void => {
        criteriaInUse.value = criteriaInUse.value.filter(c => c.key !== criteria.key)
    }
    /**
 * Creates a MapLibre GL expression for a single applied criterion.
 * Handles both LGBTypData and NutzungItemData cleanly.
 *
 * @param data - The criterion data (typ or nutzungvalue)
 * @returns {any[]} - A single valid MapLibre expression starting with "all"
 */
    function createCriteriaExpression(data: LGBTypData | NutzungItemData): any[] {
        if ("typ" in data) {
            return [
                "all",
                ...data.typ.map(typ => ["in", typ, ["get", "lgb_typ_values"]])
            ];
        } else {
            return [
                "all",
                ...data.nutzungvalue.map(item =>
                    ["in", item, ["get", "nutzart_list_final"]]
                )
            ];
        }
    }
    /**
 * Creates a combined MapLibre GL filter expression based on the currently applied criteria.
 *
 * - Criteria with status `"included"` are combined using an `"any"` block.
 * - Criteria with status `"excluded"` are negated with `"!"` and also combined under another `"any"` block.
 * - The final expression combines included and excluded parts under a top-level `"all"` block,
 *   ensuring both inclusion and exclusion are enforced.
 *
 * If no criteria are active, an empty array is returned, meaning no filter will be applied.
 *
 * @returns {any[]} A MapLibre GL filter expression starting with "all", or an empty array if no criteria are set.
 */
    function createCriteriaFilter(): any[] {
        const includedExpression: any[] = []
        const excludedExpression: any[] = []
        const expression: any[] = []

        criteriaInUse.value.forEach(crit => {
            if (crit.data !== undefined && crit.data !== null) {
                const criteriumExpression = createCriteriaExpression(crit.data)
                if (criteriumExpression.length > 0) {
                    const cleaned = unwrapIfAll(criteriumExpression)
                    if (crit.status === "included") {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        includedExpression.push(...cleaned)
                    } else {
                        excludedExpression.push(["!", ["all", ...cleaned]])
                    }
                }
            }
        })
        if (includedExpression.length > 0) {
            expression.push(["any", ...includedExpression])
        }
        if (excludedExpression.length > 0) {
            expression.push(["any", ...excludedExpression])
        }
        if (expression.length > 0) {
            return ["all", ...expression]
        } else {
            return []
        }
    }
    /**
     * Reset criteria filters
     */
    function resetCriteriaFilters(): void {
        criteriaInUse.value = []
    }
    return {
        list,
        criteriaInUse,
        addCriteria,
        removeCriteria,
        createCriteriaFilter,
        resetCriteriaFilters
    }
})
/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useCriteriaStore, import.meta.hot))
}
