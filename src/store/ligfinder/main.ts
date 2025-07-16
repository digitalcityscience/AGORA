import { defineStore, acceptHMRUpdate } from "pinia"
import { useI18n } from "vue-i18n";
import { useCriteriaStore } from "./criteria"
import { useMetricStore } from "./metric"
import { useGrzStore } from "./grz"
import { useGeometryStore, type ExtendedFeatureCollection } from "./geometry"
import { useMapStore } from "../map"
import { ref } from "vue"
import { unwrapIfAll, flattenFilterExpression, isValidMapLibreExpression } from "../../core/helpers/maplibreExpressions"
import { useParcelStore } from "./parcel"

export const useLigfinderMainStore = defineStore("main", () => {
    const { t } = useI18n();
    const criteriaStore = useCriteriaStore()
    const metric = useMetricStore()
    const geometry = useGeometryStore()
    const grz = useGrzStore()
    const mapStore = useMapStore()
    const parcelStore = useParcelStore()
    const layerName: string = `${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`

    const appliedGeometryFilterResult = ref<number[]>([])
    const appliedGeometry = ref<ExtendedFeatureCollection|null>(null)
    const isFilterApplying = ref<boolean>(false)
    const isMaximizerActive = ref<boolean>(false)
    /**
   * Applies all filters (criteria, metric, and geometry) to the specified MapLibre layer.
   * Combines the filters using a top-level "all" expression, validates the result,
   * and applies it to the map. Clears the filter if invalid or empty.
   *
   * @param {string} layer - The ID of the MapLibre layer to apply the filters to.
   */
    async function applyAllFilters(layer: string): Promise<void> {
        try {
            isFilterApplying.value = true

            const criteriaExpression = criteriaStore.createCriteriaFilter()
            const metricExpression = metric.createGeneralExpression(isMaximizerActive.value)
            const grzExpression = grz.createGeneralExpression()
            const areaFilterResult = await geometry.createGeometryFilter()
            const geometryExpression =
        areaFilterResult.UUIDs.length > 0
            ? geometry.createGeometryFilterExpression(areaFilterResult.UUIDs)
            : [];

            if (areaFilterResult.UUIDs.length > 0) {
                appliedGeometryFilterResult.value = areaFilterResult.UUIDs
                appliedGeometry.value = geometry.createSelectedGeometryGeoJSON(true) as ExtendedFeatureCollection
            }

            const rawFilterExpression = mergeAllExpressions(
                criteriaExpression,
                metricExpression,
                geometryExpression,
                grzExpression
            );

            // 🔥 New step: flatten nested/invalid expressions
            const finalFilterExpression = flattenFilterExpression(rawFilterExpression);

            if ((Boolean(finalFilterExpression)) && isValidMapLibreExpression(finalFilterExpression)) {
                mapStore.map.setFilter(layer, finalFilterExpression);
            } else {
                mapStore.map.setFilter(layer, null);
                if (rawFilterExpression.length > 0) {
                    throw new Error(t("ligfinder.filter.errors.pinia.noFilterToApply"));
                } else {
                    console.error("Invalid filter expression:", rawFilterExpression);
                    throw new Error(t("ligfinder.filter.errors.pinia.invalidExpression"));
                }
            }
            geometry.activeAdministrativeArea = null
            geometry.changeActiveAdminLayerOnMap()
        } catch (error) {
            console.error("Error applying filters:", error)
            throw error
        } finally {
            isFilterApplying.value = false
        }
    }

    /**
   * Merges multiple MapLibre filter expressions (criteria, metric, geometry)
   * into a single valid expression starting with "all".
   * Ensures each sub-expression is unwrapped correctly and avoids nesting errors.
   *
   * @param {any[]} criteria - The criteria filter expression (from createCriteriaFilter).
   * @param {any[]} general - The metric filter expression (from createGeneralExpression).
   * @param {any[]} geometry - The geometry filter expression (from createGeometryFilterExpression).
   * @returns {any[]} - A single valid MapLibre expression starting with "all", or an empty array.
   */
    function mergeAllExpressions(
        criteria: any[],
        general: any[],
        geometry: any[],
        grz: any[]
    ): any[] {
        const expressions: any[] = [];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expressions.push(...unwrapIfAll(criteria));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expressions.push(...unwrapIfAll(general));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expressions.push(...unwrapIfAll(geometry));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expressions.push(...unwrapIfAll(grz));

        return expressions.length > 0 ? ["all", ...expressions] : [];
    }
    /**
     * Resets all filters and clears temporary layers from the map.
     */
    function resetFilters(): void {
        mapStore.map.setFilter(layerName, null)
        metric.resetMetricFilters()
        criteriaStore.resetCriteriaFilters()
        geometry.resetSelectedAreas()
        grz.resetGrzFilters()
        parcelStore.cancelTempMaximizedParcels()
    }
    return {
        applyAllFilters,
        resetFilters,
        appliedGeometry,
        appliedGeometryFilterResult,
        isFilterApplying,
        isMaximizerActive
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useLigfinderMainStore, import.meta.hot))
}
