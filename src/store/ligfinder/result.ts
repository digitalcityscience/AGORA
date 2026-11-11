import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue"
import { useMetricStore, type ResultMetric, type RangeInput } from "./metric"
import { type FeatureCollection } from "geojson"
import { useLigfinderMainStore } from "./main"
import { useMapStore } from "../maplibre/map"
import { type GeoServerFeatureTypeAttribute } from "../api/geoserver"
import { useToast } from "@nuxt/ui/composables"
import { useCriteriaStore, type AppliedCriteria } from "./criteria"
import { useCriteriaAdvancedStore, type CriteriaGroupNode, type CriteriaBlock, type CriteriaOperator } from "./criteriaAdvanced"
import { useGrzStore } from "./grz"
import { useGeometryStore, type ExtendedFeatureCollection, type GeometrySelectionSnapshot } from "./geometry"
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
export interface AdvancedFilterRequestBody {
    geometry: number[],
    criteria_group: CriteriaGroupNode | null,
    metric: ResultMetric[],
    grz: ResultMetric[],
    table_name?: string
}
/**
 * Everything needed to re-run or edit the filter behind a saved layer: the exact request body
 * plus the filter panel state it was built from. Stored on the layer instead of the GeoJSON result.
 */
export interface LigfinderFilterSnapshot {
    request: ResultTableAPIRequestBody | AdvancedFilterRequestBody,
    geometry: GeometrySelectionSnapshot,
    advanced: {
        isActive: boolean,
        blocks: CriteriaBlock[],
        blocksOperator: CriteriaOperator
    },
    metricFilters: RangeInput,
    grzFilters: RangeInput,
    isMaximizerActive: boolean
}
export const useResultStore = defineStore("result", () => {
    const mapStore = useMapStore()
    const criteria = useCriteriaStore()
    const criteriaAdvanced = useCriteriaAdvancedStore()
    const metric = useMetricStore()
    const ligfinder = useLigfinderMainStore()
    const grz = useGrzStore()
    const geometry = useGeometryStore()
    const toast = useToast()
    const { t } = useI18n()
    const attributeList = ref<GeoServerFeatureTypeAttribute[]>([])
    const isFilterApplied = ref<boolean>(false)
    const appliedFilterResult = ref<FeatureCollection>()
    const lastAppliedFilter = ref<ResultTableAPIRequestBody | AdvancedFilterRequestBody>()
    /** Snapshot of the filter panel taken when the filter was last applied. */
    const lastAppliedSnapshot = ref<LigfinderFilterSnapshot>()
    /** Snapshot of the filter that produced `appliedFilterResult`; the two always belong together. */
    const appliedResultSnapshot = ref<LigfinderFilterSnapshot>()
    /**
     * Fetches the result of the currently applied filter from the backend.
     * @returns A Promise resolving to a FeatureCollection of filtered results.
     * @throws Error if no filter is applied or the fetch fails.
     */
    async function fetchAppliedFilterResult(): Promise<FeatureCollection>{
        if (lastAppliedFilter.value === undefined) {
            throw new Error(t("ligfinder.table.errors.pinia.noFilterApplied"))
        }
        return await fetchFilterResult(lastAppliedFilter.value)
    }
    /**
     * Posts a filter request body to the backend. Uses the advanced endpoint when the body
     * carries a criteria_group (advanced mode was active), otherwise the simple one -
     * mirroring the mode check in useLigfinderMainStore.applyAllFilters.
     * @param body - The filter request body to send.
     * @returns A Promise resolving to a FeatureCollection of filtered results.
     * @throws Error if the fetch fails.
     */
    async function fetchFilterResult(body: ResultTableAPIRequestBody | AdvancedFilterRequestBody): Promise<FeatureCollection>{
        const endpoint = "criteria_group" in body ? "/ligfinder/filter/advanced" : "/ligfinder/filter"
        const response = await fetch(`${import.meta.env.VITE_AGORA_API_BASE_URL}${endpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
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
     * Builds the advanced (criteria_group) shape when advanced mode is active, otherwise the simple one.
     * @returns The request body for the filter API.
     */
    function createAppliedFilterBody(): ResultTableAPIRequestBody | AdvancedFilterRequestBody {
        const usedMetrics = metric.createMetricFilter(metric.metricFilters, ligfinder.isMaximizerActive)
        const usedGrz = grz.createMetricFilter(grz.grzFilters)
        const usedGeometryResult = ligfinder.appliedGeometryFilterResult
        if (criteriaAdvanced.isActive) {
            const advancedFilter: AdvancedFilterRequestBody = {
                geometry: usedGeometryResult,
                criteria_group: criteriaAdvanced.buildCriteriaTree(),
                metric: usedMetrics,
                grz: usedGrz,
            }
            return advancedFilter
        }
        const filter: ResultTableAPIRequestBody = {
            geometry: usedGeometryResult,
            criteria: criteria.criteriaInUse,
            metric: usedMetrics,
            grz: usedGrz,
        }
        return filter
    }
    /**
     * Records the filter that was just applied: the request body plus a detached snapshot
     * of the filter panel, so a layer saved from its result can later be refreshed or edited.
     */
    function recordAppliedFilter(): void {
        const body = createAppliedFilterBody()
        lastAppliedFilter.value = body
        lastAppliedSnapshot.value = JSON.parse(JSON.stringify({
            request: body,
            geometry: geometry.getSelectedAreasSnapshot(),
            advanced: {
                isActive: criteriaAdvanced.isActive,
                blocks: criteriaAdvanced.blocks,
                blocksOperator: criteriaAdvanced.blocksOperator
            },
            metricFilters: metric.metricFilters,
            grzFilters: grz.grzFilters,
            isMaximizerActive: ligfinder.isMaximizerActive
        } satisfies LigfinderFilterSnapshot))
    }
    /**
     * Resets the result information, clearing filter state and results.
     */
    function resetResultInfo(): void{
        isFilterApplied.value = false
        appliedFilterResult.value = undefined
        lastAppliedFilter.value = undefined
        lastAppliedSnapshot.value = undefined
        appliedResultSnapshot.value = undefined
    }
    /**
     * Saves the currently applied filter result as a new map layer.
     * @param layerName - The name of the new layer to be added to the map.
     */
    function saveAsLayer(layerName: string): void {
        if (appliedFilterResult.value === undefined){
            showError(t("ligfinder.table.messages.noFilter"));
            return
        }
        if (appliedFilterResult.value.features.length === 0){
            showError(t("ligfinder.table.messages.noResults"));
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
                        const savedLayer = mapStore.layersOnMap.find((layer) => layer.id === layerName)
                        if (savedLayer !== undefined && appliedResultSnapshot.value !== undefined) {
                            savedLayer.filterSnapshot = JSON.parse(JSON.stringify(appliedResultSnapshot.value))
                        }
                    }).catch(error => {
                        if (mapStore.map.getSource(layerName) !== undefined) {
                            mapStore.map.removeSource(layerName)
                        }
                        showError(error);
                    })
            }).catch((error) => {
                showError(error);
            })
        } else {
            showError(t("ligfinder.table.messages.layerNameInUse"));
        }
    }
    /**
     * Re-runs the stored filter of a saved layer against the current data and swaps in the new result.
     * Stored areas are sent to the geometry filter again, so the parcel list follows the current data.
     * @param layerId - The id of the saved layer to refresh.
     * @returns A Promise resolving to the new result.
     * @throws Error if the layer has no stored filter, the stored areas no longer cover any parcels, or a fetch fails.
     */
    async function refreshLayer(layerId: string): Promise<FeatureCollection> {
        const layer = mapStore.layersOnMap.find((item) => item.id === layerId)
        const snapshot = layer?.filterSnapshot
        if (layer === undefined || snapshot === undefined) {
            throw new Error(t("mapLayers.errors.pinia.noStoredFilter"))
        }
        const request: ResultTableAPIRequestBody | AdvancedFilterRequestBody = JSON.parse(JSON.stringify(snapshot.request))
        const areas = snapshot.geometry
        const areaFeatures = [
            ...areas.administrative.map((item) => item.data),
            ...areas.drawn,
            ...areas.isochrone
        ]
        if (areaFeatures.length > 0) {
            const areaFilter: ExtendedFeatureCollection = {
                type: "FeatureCollection",
                features: areaFeatures,
                union: areas.union,
                tableName: import.meta.env.VITE_PARCEL_DATASET_LAYERNAME
            }
            const { UUIDs } = await geometry.fetchGeometryFilter(areaFilter)
            // An empty list would mean "no area filter" to the backend and return every parcel
            if (UUIDs.length === 0) {
                throw new Error(t("mapLayers.errors.pinia.noParcelsInAreas"))
            }
            request.geometry = UUIDs
        }
        const result = await fetchFilterResult(request)
        const source = mapStore.map.getSource(layer.source)
        if (source === undefined) {
            throw new Error(t("map.errors.pinia.sourceNotFound", { identifier: layer.source }))
        }
        source.setData(result)
        layer.filterLayerData = result
        return result
    }
    /**
     * Replaces the whole LIG-Finder filter panel with a saved layer's stored filter, so it can be changed and applied again.
     * Clears the current filters and results first, the same way "Reset All" does.
     * @param snapshot - The stored filter to load.
     */
    function loadFilterSnapshot(snapshot: LigfinderFilterSnapshot): void {
        const copy: LigfinderFilterSnapshot = JSON.parse(JSON.stringify(snapshot))
        ligfinder.resetFilters()
        resetResultInfo()
        if ("criteria" in copy.request) {
            criteria.criteriaInUse = copy.request.criteria
        }
        criteriaAdvanced.blocks = copy.advanced.blocks
        criteriaAdvanced.setBlocksOperator(copy.advanced.blocksOperator)
        criteriaAdvanced.setActive(copy.advanced.isActive)
        metric.metricFilters = copy.metricFilters
        grz.grzFilters = copy.grzFilters
        ligfinder.isMaximizerActive = copy.isMaximizerActive
        geometry.restoreSelectedAreas(copy.geometry)
    }
    function showError(error: unknown): void {
        toast.add({
            title: t("common.error"),
            description: error instanceof Error ? error.message : String(error),
            color: "error",
            duration: 3000,
        })
    }
    const tableHeaders: TableHeader[] =[
        { text: "Flurstücknummer", value: "flurst_nr" },
        { text: "Land Area in m²", value: "Shape_Area" },
        { text: "Grundflächenzahl B-Plan", value: "grz_xplanung" },
        { text: "Grundflächenzahl tatsächlich", value: "grz_alkis" },
        { text: "Verdichtungspotential", value: "grz_potential" },
        { text: "Zusätzlich bebaubare Fläche auf Flurstück", value: "grz_potential_area" },
        { text: "X-Plan ID", value: "xplanung_id" }
    ]
    return {
        isFilterApplied,
        attributeList,
        fetchAppliedFilterResult,
        createAppliedFilterBody,
        recordAppliedFilter,
        resetResultInfo,
        appliedFilterResult,
        lastAppliedFilter,
        lastAppliedSnapshot,
        appliedResultSnapshot,
        tableHeaders,
        saveAsLayer,
        refreshLayer,
        loadFilterSnapshot
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useResultStore, import.meta.hot))
}
