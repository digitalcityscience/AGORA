import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue"
import { useMetricStore, type ResultMetric } from "./metric"
import { type FeatureCollection } from "geojson"
import { useLigfinderMainStore } from "./main"
import { useMapStore } from "../map"
import { type GeoServerFeatureTypeAttribute } from "../geoserver"
import { useToast } from "primevue/usetoast"
import { useCriteriaStore, type AppliedCriteria } from "./criteria"
import { useGrzStore } from "./grz"
import { useI18n } from "vue-i18n"
interface TableHeader {
    text: string,
    value: string
}
export interface ResultTableAPIRequestBody {
    geometry: number[],
    criteria: AppliedCriteria[],
    metric: ResultMetric[],
    grz: ResultMetric[],
    table_name?: string
}
export const useResultStore = defineStore("result", () => {
    const mapStore = useMapStore()
    const criteria = useCriteriaStore()
    const metric = useMetricStore()
    const ligfinder = useLigfinderMainStore()
    const grz = useGrzStore()
    const toast = useToast()
    const { t } = useI18n()
    const attributeList = ref<GeoServerFeatureTypeAttribute[]>([])
    const isFilterApplied = ref<boolean>(false)
    const appliedFilterResult = ref<FeatureCollection>()
    const lastAppliedFilter = ref<ResultTableAPIRequestBody>()
    /**
     * Fetches the result of the currently applied filter from the backend.
     * @returns A Promise resolving to a FeatureCollection of filtered results.
     * @throws Error if no filter is applied or the fetch fails.
     */
    async function fetchAppliedFilterResult(): Promise<FeatureCollection>{
        if (lastAppliedFilter.value === undefined) {
            throw new Error(t("ligfinder.table.errors.pinia.noFilterApplied"))
        }
        const response = await fetch(`${import.meta.env.VITE_AGORA_API_BASE_URL}/ligfinder/filter`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(lastAppliedFilter.value)
            }
        )
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(t("ligfinder.table.errors.pinia.fetchFailed", { status: response.status, message: errorText }));
        }
        return await response.json()
    }
    /**
     * Creates the request body for the currently applied filter, including geometry, criteria, metric, and grz.
     * @returns The request body for the filter API.
     */
    function createAppliedFilterBody(): ResultTableAPIRequestBody{
        const usedMetrics = metric.createMetricFilter(metric.metricFilters, ligfinder.isMaximizerActive)
        const usedGrz = grz.createMetricFilter(grz.grzFilters)
        const usedGeometryResult = ligfinder.appliedGeometryFilterResult
        const filter: ResultTableAPIRequestBody = {
            geometry: usedGeometryResult,
            criteria: criteria.criteriaInUse,
            metric: usedMetrics,
            grz: usedGrz,
        }
        return filter
    }
    /**
     * Resets the result information, clearing filter state and results.
     */
    function resetResultInfo(): void{
        isFilterApplied.value = false
        appliedFilterResult.value = undefined
        lastAppliedFilter.value = undefined
    }
    /**
     * Saves the currently applied filter result as a new map layer.
     * @param layerName - The name of the new layer to be added to the map.
     */
    function saveAsLayer(layerName: string): void {
        if (appliedFilterResult.value === undefined){
            toast.add({ severity: "error", summary: "Error", detail: t("ligfinder.table.messages.noFilter"), life: 3000 });
            return
        }
        if (appliedFilterResult.value.features.length === 0){
            toast.add({ severity: "error", summary: "Error", detail: t("ligfinder.table.messages.noResults"), life: 3000 });
            return
        }
        const isOnMap = mapStore.layersOnMap.filter((layer) => layer.id === layerName).length > 0
        if (!isOnMap) {
            const geomType = mapStore.geometryConversion(appliedFilterResult.value.features[0].geometry.type)
            mapStore.addMapDataSource(
                "geojson",
                layerName,
                false,
                undefined,
                undefined,
                appliedFilterResult.value
            ).then(() => {
                mapStore.addMapLayer(
                    "geojson",
                    layerName,
                    geomType,
                    undefined,
                    undefined,
                    undefined,
                    appliedFilterResult.value,
                    false)
                    .then(() => {
                    }).catch(error => {
                        mapStore.map.value.removeSource(layerName)
                        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                    })
            }).catch((error) => {
                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
            })
        } else {
            toast.add({ severity: "error", summary: "Error", detail: t("ligfinder.table.messages.layerNameInUse"), life: 3000 });
        }
    }
    const tableHeaders: TableHeader[] =[
        { text: "UUID", value: "UUID" },
        { text: "Land Area in m²", value: "Shape_Area" },
        { text: "Grundflächenzahl B-Plan", value: "grz_xplanung" },
        { text: "Grundflächenzahl tatsächlich", value: "grz_alkis" },
        { text: "Verdichtungspotential", value: "grz_potential" },
        { text: "Grundfläche", value: "grz_potential_area" },
        { text: "X-Plan ID", value: "xplanung_id" }
    ]
    return {
        isFilterApplied,
        attributeList,
        fetchAppliedFilterResult,
        createAppliedFilterBody,
        resetResultInfo,
        appliedFilterResult,
        lastAppliedFilter,
        tableHeaders,
        saveAsLayer
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useResultStore, import.meta.hot))
}
