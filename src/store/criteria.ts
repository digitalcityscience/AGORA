import { defineStore, acceptHMRUpdate } from "pinia"
import criteria from "../../criteria.json"

export const useCriteriaStore = defineStore("criteria", () => {
    const list = criteria.items;
    return {
        list
    }
})
/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useCriteriaStore, import.meta.hot))
}
