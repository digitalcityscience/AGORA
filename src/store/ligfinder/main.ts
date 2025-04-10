import { defineStore, acceptHMRUpdate } from "pinia"
import { useCriteriaStore } from "./criteria"
import { useMetricStore } from "./metric"
import { useGeometryStore, type ExtendedFeatureCollection } from "./geometry"
import { useMapStore } from "../map"
import { ref } from "vue"

export const useLigfinderMainStore = defineStore("main", () => {
    const criteriaStore = useCriteriaStore()
    const metric = useMetricStore()
    const geometry = useGeometryStore()
    const mapStore = useMapStore()
    const layerName: string = `${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`

    const appliedGeometryFilterResult = ref<number[]>([])
    const appliedGeometry = ref<ExtendedFeatureCollection|null>(null)
    const isFilterApplying = ref<boolean>(false)
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
            const metricExpression = metric.createGeneralExpression()

            const areaFilterResult = await geometry.createGeometryFilter()
            const geometryExpression =
        areaFilterResult.gids.length > 0
            ? geometry.createGeometryFilterExpression(areaFilterResult.gids)
            : [];

            if (areaFilterResult.gids.length > 0) {
                appliedGeometryFilterResult.value = areaFilterResult.gids
                appliedGeometry.value = geometry.createSelectedGeometryGeoJSON(true) as ExtendedFeatureCollection
            }

            const finalFilterExpression = mergeAllExpressions(
                criteriaExpression,
                metricExpression,
                geometryExpression
            );
            if (isValidMapLibreExpression(finalFilterExpression)) {
                mapStore.map.setFilter(layer, finalFilterExpression)
            } else {
                mapStore.map.setFilter(layer, null);
                if (finalFilterExpression.length > 0) {
                    throw new Error("No filter to apply")
                } else {
                    console.error("Invalid filter expression:", finalFilterExpression)
                    throw new Error("Invalid filter expression")
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
        geometry: any[]
    ): any[] {
        const expressions: any[] = [];

        const unwrapIfAll = (expr: any[]): any[] => {
            if (Array.isArray(expr) && expr[0] === "all") {
                return expr.slice(1);
            } else if (Array.isArray(expr) && typeof expr[0] === "string") {
                return [expr];
            } else {
                return [];
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expressions.push(...unwrapIfAll(criteria));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expressions.push(...unwrapIfAll(general));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expressions.push(...unwrapIfAll(geometry));

        return expressions.length > 0 ? ["all", ...expressions] : [];
    }

    /**
   * Validates whether a given expression is a structurally valid MapLibre filter expression.
   * Checks for known operators, proper arity, and recursive structure for compound filters.
   *
   * @param {any} expr - The expression to validate.
   * @returns {boolean} - True if the expression is valid, false otherwise.
   */
    function isValidMapLibreExpression(expr: any): boolean {
        if (!Array.isArray(expr)) return false;
        if (expr.length === 0) return false;

        const validOperators = new Set([
            "all",
            "any",
            "none",
            "in",
            "!",
            "==",
            "!=",
            "<",
            "<=",
            ">",
            ">=",
            "has",
            "!has",
            "get",
            "literal",
            "case",
            "match",
            "boolean",
            "string",
            "number",
        ]);

        const operator = expr[0];
        if (typeof operator !== "string" || !validOperators.has(operator)) {
            return false;
        }
        if (["all", "any", "none"].includes(operator)) {
            return expr.slice(1).every(isValidMapLibreExpression);
        }
        if (operator === "!") {
            return expr.length === 2 && isValidMapLibreExpression(expr[1]);
        }
        if (operator === "in") {
            return (
                expr.length === 3 &&
              Array.isArray(expr[2]) &&
              (
                  (expr[2][0] === "get" && typeof expr[2][1] === "string") ||
                (expr[2][0] === "literal" && Array.isArray(expr[2][1]))
              )
            );
        }
        return true;
    }

    function resetFilters(): void {
        mapStore.map.setFilter(layerName, null)
        metric.resetMetricFilters()
        criteriaStore.resetCriteriaFilters()
        geometry.resetSelectedAreas()
    }
    return {
        applyAllFilters,
        resetFilters,
        appliedGeometry,
        appliedGeometryFilterResult,
        isFilterApplying
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useLigfinderMainStore, import.meta.hot))
}
