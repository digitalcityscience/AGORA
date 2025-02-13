import { defineStore, acceptHMRUpdate } from "pinia"
import criteria from "../../../criteria.json"
import { ref } from "vue";
import { type TreeNode } from "primevue/treenode";

export interface CriteriaValueData {
    filter: "value",
    columns: string[],
    value: string
}
export interface CriteriaPercentageData {
    filter: "prozent",
    columns: string[],
    value: number
}
export interface AppliedCriteria extends TreeNode {
    status: "included"|"excluded",
    data?: CriteriaValueData | CriteriaPercentageData,
    label: string
}
export const useCriteriaStore = defineStore("criteria", () => {
    const list = criteria.items;
    const criteriaInUse = ref<AppliedCriteria[]>([])
    const addCriteria = (criteria: AppliedCriteria): void => {
        console.log("incoming criteria", criteria)
        if (criteriaInUse.value.filter((crit)=>{ return crit.key === criteria.key }).length === 0){
            criteriaInUse.value.push(criteria)
        } else {
            const index = criteriaInUse.value.findIndex(crit => crit.key === criteria.key)
            if (criteriaInUse.value[index].status !== criteria.status) {
                criteriaInUse.value[index].status = criteria.status
            }
        }
        console.log("criteriaInUse", criteriaInUse.value)
    }
    const removeCriteria = (criteria: AppliedCriteria): void => {
        criteriaInUse.value = criteriaInUse.value.filter(c => c.key !== criteria.key)
    }
    function createCriteriaExpression(data: CriteriaValueData|CriteriaPercentageData): any[]{
        const expression = []
        if (data.filter === "value"){
            expression.push("any")
            data.columns.forEach(col => {
                expression.push(["==", ["get", col], data.value])
            })
        } else {
            expression.push(">")
            expression.push(["get", data.columns[0]])
            expression.push(data.value)
        }
        return expression
    }
    function createCriteriaFilter(): any[]{
        const includedExpression: any[] = []
        const excludedExpression: any[] = []
        const expression: any[] = []
        criteriaInUse.value.forEach(crit => {
            if (crit.data !== undefined && crit.data !== null){
                const criteriumExpression = createCriteriaExpression(crit.data)
                if (criteriumExpression.length>0) {
                    console.log("criterium", criteriumExpression)
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
            console.log("expression", expression)
            return ["all", ...expression]
        } else {
            return []
        }
    }
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
