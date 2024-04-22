import { defineStore, acceptHMRUpdate } from "pinia"
import { useCriteriaStore } from "./criteria"
import { useMetricStore } from "./metric"
import { useGeometryStore } from "./geometry"
import { useMapStore } from "../map"

export const useLigfinderMainStore = defineStore("main", () => {
    const criteria = useCriteriaStore()
    const metric = useMetricStore()
    const geometry = useGeometryStore()
    const mapStore = useMapStore()
    const layerName: string = `${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`
    async function applyAllFilters(): Promise<void> {
        try {
            const mainExpression: any[] = [];
            console.log("s0", mainExpression)

            // Safely attempt to add criteria and metric expressions
            const criteriaExpression = criteria.createCriteriaFilter();
            if (criteriaExpression.length > 0){
                mainExpression.push(criteriaExpression);
                console.log("s1", mainExpression)
            }
            const metricExpression = metric.createGeneralExpression()
            if (metricExpression.length > 0){
                mainExpression.push(metricExpression);
                console.log("s2", mainExpression)
            }

            // Attempt to get the geometry filter
            const areaFilterResult = await geometry.createGeometryFilter(); // Ensure this function is available and imported
            console.log("s3.1", areaFilterResult)
            if (areaFilterResult.gids.length > 0) {
                const areaFilterExpression = geometry.createGeometryFilterExpression(areaFilterResult.gids);
                mainExpression.push(areaFilterExpression);
                console.log("s3", mainExpression)
            }

            if (mainExpression.length > 0) {
                mainExpression.unshift("all");
                console.log("s4", mainExpression)
                mapStore.map.setFilter(layerName, mainExpression);
            } else {
                // If no filters are to be applied, consider if you should indeed clear the filter or just not set it at all
                mapStore.map.setFilter(layerName, null);
                throw new Error("No filters applied");
            }
            geometry.activeAdministrativeArea = null
            geometry.changeActiveAdminLayerOnMap()
        } catch (error) {
            // Handle different kinds of errors appropriately
            console.error("Error applying filters:", error);
            throw error; // Optionally re-throw error if you need calling function to handle it
        }
    }
    function resetFilters(): void{
        mapStore.map.setFilter(layerName, null)
    }
    return {
        applyAllFilters,
        resetFilters
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useLigfinderMainStore, import.meta.hot))
}
