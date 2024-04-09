import { defineStore, acceptHMRUpdate } from "pinia"
import criteria from "../../criteria.json"
import { ref } from "vue";
import { type TreeNode } from "primevue/treenode";

export interface CriteriaValueData {
    filter: string,
    columns: string[],
    value: string
}
export interface CriteriaPercentageData {
    filter: string,
    columns: string[]
}
export interface AppliedCriteria extends TreeNode {
    status: "included"|"excluded",
    data?: CriteriaValueData | CriteriaPercentageData,
}
export const useCriteriaStore = defineStore("criteria", () => {
    const list = criteria.items;
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
    return {
        list,
        criteriaInUse,
        addCriteria,
        removeCriteria
    }
})
/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useCriteriaStore, import.meta.hot))
}
