import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue"
import { useCriteriaStore } from "./criteria"
import { useMetricStore, type ResultMetric } from "./metric"
import { type FeatureCollection } from "geojson"
import { useLigfinderMainStore } from "./main"
import { useMapStore } from "../map"
interface TableHeader {
    text: string,
    value: string
}
interface FilterCriteria {
    status: "included"|"excluded",
    data: {
        type: "value"|"prozent",
        column: string[],
        value: string
    }
}
export interface ResultTableAPIRequestBody {
    geometry: number[],
    criteria: FilterCriteria[],
    metric: ResultMetric[]
}
export const useResultStore = defineStore("result", () => {
    const mapStore = useMapStore()
    const criteria = useCriteriaStore()
    const metric = useMetricStore()
    const ligfinder = useLigfinderMainStore()
    const isFilterApplied = ref<boolean>(false)
    const appliedFilterResult = ref<FeatureCollection>()
    const lastAppliedFilter = ref<ResultTableAPIRequestBody>()
    async function fetchAppliedFilterResult(): Promise<FeatureCollection>{
        if (lastAppliedFilter.value === undefined) {
            throw new Error("No filter applied")
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
        return await response.json()
    }
    function createAppliedFilterBody(): ResultTableAPIRequestBody{
        const usedMetrics = metric.createMetricFilter(metric.metricFilters)
        const usedGeometryResult = ligfinder.appliedGeometryFilterResult
        const convertedCriteria = criteria.criteriaInUse.length>0
            ? criteria.criteriaInUse.map((item) => {
                return {
                    status: item.status,
                    data: {
                        type: item.data!.filter,
                        column: item.data!.columns,
                        value: String(item.data!.value)
                    }
                }
            })
            : []
        const filter: ResultTableAPIRequestBody = {
            geometry: usedGeometryResult,
            criteria: convertedCriteria,
            metric: usedMetrics
        }
        return filter
    }
    function resetResultInfo(): void{
        isFilterApplied.value = false
        appliedFilterResult.value = undefined
        lastAppliedFilter.value = undefined
    }
    function saveAsLayer(layerName: string): void {
        if (appliedFilterResult.value === undefined){
            window.alert("No filter applied!")
            return
        }
        if (appliedFilterResult.value.features.length === 0){
            window.alert("No result found!")
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
                        window.alert(error)
                    })
            }).catch((error) => {
                window.alert(error)
            })
        } else {
            window.alert("Layer name already in use!")
        }
    }
    const tableHeaders: TableHeader[] =[
        { text: "Flurstücknummer", value: "flurst_hh" },
        { text: "Bezirk", value: "bezname" },
        { text: "Stadtteil", value: "stadtteil" },
        { text: "Land Area in m²", value: "area_fme" },
        { text: "Gebäudegrundfläche", value: "geb_grf_a" },
        { text: "Unbebaute Fläche", value: "fl_unbeb_a" },
        { text: "GRZ (Alkis)", value: "alkis_grz" },
        { text: "GRZ (B-Plan)", value: "bplan_grz" },
    ]
    return {
        isFilterApplied,
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
