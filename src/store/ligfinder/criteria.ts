import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue";
import { type TreeNode } from "primevue/treenode";
import { type LGBTypData, type Domain, type NutzungItemData } from "../../domains";
import domains from "../../../domain_structure.json"

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
    function createCriteriaExpression(data: LGBTypData|NutzungItemData): any[]{
        const expression = []
        if ("typ" in data){
            expression.push("all")
            data.typ.forEach(typ => {
                expression.push(["in", typ, ["get", "lgb_typ_values"]])
            })
        } else {
            expression.push([
                "all",
                ...data.nutzungvalue.map(item =>
                    ["in", item, ["get", "nutzart_list_final"]]
                )
            ])
        }
        return expression
    }
    /**
     * Create criteria filter
     * @returns filter expression as MapLibre Style Expressions
     */
    function createCriteriaFilter(): any[]{
        const includedExpression: any[] = []
        const excludedExpression: any[] = []
        const expression: any[] = []
        criteriaInUse.value.forEach(crit => {
            if (crit.data !== undefined && crit.data !== null){
                const criteriumExpression = createCriteriaExpression(crit.data)
                if (criteriumExpression.length>0) {
                    if (crit.status === "included") {
                        includedExpression.push(criteriumExpression)
                    } else {
                        excludedExpression.push(["!", criteriumExpression])
                    }
                }
            }
        })
        if (includedExpression.length>0) {
            expression.push(["any", ...includedExpression])
        }
        if (excludedExpression.length>0) {
            expression.push(["any", ...excludedExpression])
        }
        if (expression.length>0) {
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
