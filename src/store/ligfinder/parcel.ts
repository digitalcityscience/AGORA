import { acceptHMRUpdate, defineStore } from "pinia";
import { type ResultTableAPIRequestBody } from "./result";
import { ref } from "vue";
import { type FeatureCollection } from "geojson";
import { useMapStore } from "../map";
import { useI18n } from "vue-i18n";
interface ParcelMaximizationRequestBody extends ResultTableAPIRequestBody {
    threshold: number
}

export const useParcelStore = defineStore("parcelStore", () => {
    const { t } = useI18n();
    const mapStore = useMapStore();
    const excludedKeys = ref<string[]>([
        "strassenverkehr", "weg", "fliessgewaesser", "stehendesgewaesser",
        "meer", "moor", "sumpf", "friedhof", "flugverkehr", "schiffsverkehr",
        "bahnverkehr", "platz", "wald", "gehoelz", "heide", "hafenbecken",
        "sportfreizeitunderholungsflaeche", "unlandvegetationsloseflaeche"
    ]);
    /**
     * Sends a request to the backend to compute parcel maximization based on the given filters.
     * If the 'exclude' flag is true, it programmatically appends excluded usage categories to the criteria.
     * @param appliedFilters - Current active filter state including geometry and criteria
     * @param threshold - Minimum size threshold for parcel maximization
     * @param exclude - Whether to exclude certain usage categories automatically
     * @returns A FeatureCollection of maximized parcel geometries
     * @throws Error if response is not ok or if appliedFilters is undefined
     */
    async function fetchParcelMaximizationResult(appliedFilters: ResultTableAPIRequestBody, threshold: number, exclude: boolean): Promise<FeatureCollection> {
        if (appliedFilters === undefined) {
            throw new Error(t("ligfinder.filter.parcel.errors.pinia.noFilterApplied"));
        }

        const requestBody: ParcelMaximizationRequestBody = {
            geometry: appliedFilters.geometry,
            criteria: [...(appliedFilters.criteria ?? [])],
            metric: [...(appliedFilters.metric ?? [])],
            grz: [...(appliedFilters.grz ?? [])],
            table_name: appliedFilters.table_name,
            threshold
        };

        requestBody.criteria ??= [];

        if (exclude) {
            const domain = (await import("../../../domain_structure.json")).default;
            const found = domain.data.find((d: any) =>
                d?.nutzungvalue != null && Array.isArray(d.children)
            );
            const nutzungDomain = Array.isArray(found?.children) ? found.children : [];
            for (const key of excludedKeys.value) {
                const exists = requestBody.criteria?.some((c: any) =>
                    c.data?.nutzungvalue?.[0] === key && c.status === "excluded"
                );
                if (!exists) {
                    const dataObj = nutzungDomain.find((item: any) =>
                        item.nutzungvalue?.[0] === key
                    );
                    if (dataObj !== undefined && dataObj !== null) {
                        requestBody.criteria.push({
                            key: dataObj.key,
                            status: "excluded",
                            data: dataObj,
                            label: dataObj.label
                        });
                    }
                }
            }
        }
        const response = await fetch(`${import.meta.env.VITE_AGORA_API_BASE_URL}/ligfinder/maximizer`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }
        )
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${t("ligfinder.filter.parcel.errors.pinia.fetchFailed")} ${response.status}: ${errorText}`);
        }
        const json = await response.json();
        return json as FeatureCollection;
    }

    const maximizedParcelsOnMap = ref(false);
    const maximizedParcelsGeoJSON = ref<FeatureCollection>();
    /**
     * Adds the given FeatureCollection to the map as temporary fill and line layers.
     * Replaces any previously existing temporary maximized parcel layers.
     * @param src - The GeoJSON FeatureCollection to be displayed
     * @throws Error if the input is invalid or if layers fail to render
     */
    function addTempMaximizedParcels(src: FeatureCollection): void {
        const sourceId = "maximized-parcels";
        const fillLayerId = `${sourceId}-fill`;
        const lineLayerId = `${sourceId}-line`;

        if (src == null || src.type !== "FeatureCollection" || !Array.isArray(src.features) || src.features.length === 0) {
            throw new Error(t("ligfinder.filter.parcel.errors.pinia.emptyData"));
        }

        // Remove previous if exists
        if (mapStore.map.getLayer(fillLayerId) !== undefined) {
            void mapStore.deleteMapLayer(fillLayerId);
        }
        if (mapStore.map.getLayer(lineLayerId) !== undefined) {
            void mapStore.deleteMapLayer(lineLayerId);
        }
        if (mapStore.map.getSource(sourceId) !== undefined) {
            void mapStore.deleteMapDataSource(sourceId);
        }

        void mapStore.addMapDataSource("geojson", sourceId, false, undefined, undefined, src).then(() => {
            const fillStyle = {
                paint: {
                    "fill-color": "#abcdef",
                    "fill-opacity": 0.2,
                    "fill-outline-color": "#000000"
                }
            };
            const lineStyle = {
                paint: {
                    "line-color": "#123456",
                    "line-width": 4,
                    "line-opacity": 0.8
                }
            };

            Promise.all([
                mapStore.addMapLayer("geojson", fillLayerId, "fill", fillStyle, undefined, undefined, src, false, "Maximierte Fläche", sourceId, false),
                mapStore.addMapLayer("geojson", lineLayerId, "line", lineStyle, undefined, undefined, src, false, "Maximierte Umriss", sourceId, false)
            ]).then(() => {
                maximizedParcelsOnMap.value = true;
                maximizedParcelsGeoJSON.value = src;
            }).catch(() => {
                throw new Error(t("ligfinder.filter.parcel.errors.pinia.addToMapFailed"));
            });
        }).catch(() => {
            throw new Error(t("ligfinder.filter.parcel.errors.pinia.fetchFailed"));
        });
    }
    /**
     * Removes all temporary maximized parcel layers and their data source from the map.
     * Resets the corresponding state in the store.
     */
    function cancelTempMaximizedParcels(): void {
        const sourceId = "maximized-parcels";
        const fillLayerId = `${sourceId}-fill`;
        const lineLayerId = `${sourceId}-line`;

        if (mapStore.map.getLayer(fillLayerId) !== undefined) {
            mapStore.map.removeLayer(fillLayerId);
        }
        if (mapStore.map.getLayer(lineLayerId) !== undefined) {
            mapStore.map.removeLayer(lineLayerId);
        }
        if (mapStore.map.getSource(sourceId) !== undefined) {
            mapStore.map.removeSource(sourceId);
        }

        maximizedParcelsOnMap.value = false;
        maximizedParcelsGeoJSON.value = undefined;
    }
    return {
        fetchParcelMaximizationResult,
        excludedKeys,
        addTempMaximizedParcels,
        cancelTempMaximizedParcels,
        maximizedParcelsOnMap,
        maximizedParcelsGeoJSON
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useParcelStore, import.meta.hot))
}