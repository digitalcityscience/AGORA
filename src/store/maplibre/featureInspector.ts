import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import bbox from "@turf/bbox";
import type { Feature, FeatureCollection } from "geojson";
import type { GeoJSONSource, MapGeoJSONFeature } from "maplibre-gl";
import {
    closeSlideoverSidebar,
    openSlideoverSidebar,
} from "../../core/helpers/slideoverSidebarRegistry";
import { useMapStore } from "./map";

const inspectorSidebarId = "map-feature-inspector";
const highlightSourceId = "feature-inspector-highlight-source";
const highlightFillLayerId = "feature-inspector-highlight-fill";
const highlightHaloLayerId = "feature-inspector-highlight-halo";
const highlightLineLayerId = "feature-inspector-highlight-line";
const highlightPointHaloLayerId = "feature-inspector-highlight-point-halo";
const highlightPointLayerId = "feature-inspector-highlight-point";

const emptyFeatureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
};

export const useFeatureInspectorStore = defineStore("featureInspector", () => {
    const mapStore = useMapStore();
    const features = shallowRef<MapGeoJSONFeature[]>([]);
    const selectedIndex = ref(0);
    const selectedFeature = computed(() => features.value[selectedIndex.value]);

    function getFeatures(): MapGeoJSONFeature[] {
        return features.value;
    }

    function getSelectedFeature(): MapGeoJSONFeature | undefined {
        return selectedFeature.value;
    }

    function getSelectedIndex(): number {
        return selectedIndex.value;
    }

    function showFeatures(clickedFeatures: MapGeoJSONFeature[]): void {
        features.value = clickedFeatures;
        selectedIndex.value = 0;
        restoreHighlight();
        openSlideoverSidebar(inspectorSidebarId);
    }

    function selectFeature(index: number): void {
        if (index < 0 || index >= features.value.length) return;
        selectedIndex.value = index;
        restoreHighlight();
    }

    function clearSelection(): void {
        features.value = [];
        selectedIndex.value = 0;
        clearHighlight();
    }

    function dismiss(): void {
        clearSelection();
        closeSlideoverSidebar(inspectorSidebarId);
    }

    function restoreHighlight(): void {
        const feature = selectedFeature.value;
        if (!feature) {
            clearHighlight();
            return;
        }

        ensureHighlightLayers();
        getHighlightSource()?.setData(toGeoJSONFeature(feature));
    }

    function clearHighlight(): void {
        getHighlightSource()?.setData(emptyFeatureCollection);
    }

    function zoomToSelectedFeature(): void {
        const feature = selectedFeature.value;
        const map = mapStore.map;
        if (!feature || !map) return;

        const bounds = bbox(toGeoJSONFeature(feature));
        const panelWidth = Math.min(512, window.innerWidth * 0.34);
        map.fitBounds(bounds, {
            padding: {
                top: 48,
                bottom: 48,
                left: 48,
                right: panelWidth + 72,
            },
            maxZoom: 18,
            duration: 600,
        });
    }

    function ensureHighlightLayers(): void {
        const map = mapStore.map;
        if (!map) return;

        if (map.getSource(highlightSourceId) === undefined) {
            map.addSource(highlightSourceId, {
                type: "geojson",
                data: emptyFeatureCollection,
            });
        }

        if (map.getLayer(highlightFillLayerId) === undefined) {
            map.addLayer({
                id: highlightFillLayerId,
                type: "fill",
                source: highlightSourceId,
                filter: ["==", ["geometry-type"], "Polygon"],
                paint: {
                    "fill-color": "#22d3ee",
                    "fill-opacity": 0.28,
                },
            });
        }
        if (map.getLayer(highlightHaloLayerId) === undefined) {
            map.addLayer({
                id: highlightHaloLayerId,
                type: "line",
                source: highlightSourceId,
                filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]],
                paint: {
                    "line-color": "#ffffff",
                    "line-width": 7,
                    "line-opacity": 0.95,
                },
            });
        }
        if (map.getLayer(highlightLineLayerId) === undefined) {
            map.addLayer({
                id: highlightLineLayerId,
                type: "line",
                source: highlightSourceId,
                filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]],
                paint: {
                    "line-color": "#0891b2",
                    "line-width": 4,
                    "line-opacity": 1,
                },
            });
        }
        if (map.getLayer(highlightPointHaloLayerId) === undefined) {
            map.addLayer({
                id: highlightPointHaloLayerId,
                type: "circle",
                source: highlightSourceId,
                filter: ["==", ["geometry-type"], "Point"],
                paint: {
                    "circle-color": "#ffffff",
                    "circle-radius": 10,
                    "circle-opacity": 0.95,
                },
            });
        }
        if (map.getLayer(highlightPointLayerId) === undefined) {
            map.addLayer({
                id: highlightPointLayerId,
                type: "circle",
                source: highlightSourceId,
                filter: ["==", ["geometry-type"], "Point"],
                paint: {
                    "circle-color": "#0891b2",
                    "circle-radius": 6,
                    "circle-opacity": 1,
                },
            });
        }
    }

    function getHighlightSource(): GeoJSONSource | undefined {
        return mapStore.map?.getSource(highlightSourceId) as GeoJSONSource | undefined;
    }

    function toGeoJSONFeature(feature: MapGeoJSONFeature): Feature {
        return {
            type: "Feature",
            id: feature.id,
            geometry: feature.geometry,
            properties: feature.properties ?? {},
        };
    }

    return {
        showFeatures,
        selectFeature,
        clearSelection,
        dismiss,
        restoreHighlight,
        clearHighlight,
        zoomToSelectedFeature,
        getFeatures,
        getSelectedFeature,
        getSelectedIndex,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useFeatureInspectorStore, import.meta.hot));
}
