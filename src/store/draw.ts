import { defineStore, acceptHMRUpdate } from "pinia"
import { TerraDraw, TerraDrawLineStringMode, TerraDrawMapLibreGLAdapter, TerraDrawPointMode, TerraDrawPolygonMode, TerraDrawRectangleMode, TerraDrawSelectMode } from "terra-draw"
import { ref } from "vue";
import { useMapStore } from "./map";
import { type Map } from "maplibre-gl"
import { type Feature, type FeatureCollection } from "geojson";
import { useGeometryStore } from "./ligfinder/geometry";
import { useToast } from "primevue/usetoast";

export const useDrawStore = defineStore("draw", () => {
    const mapStore = useMapStore()
    const geometry = useGeometryStore()
    const toast = useToast()
    const drawTypes = ref([{ name: "point", mode: "Point" }, { name: "linestring", mode: "Line" }, { name: "polygon", mode: "Polygon" }])
    const drawMode = ref("polygon")
    const drawOnProgress = ref(false)
    const editOnProgress = ref(false)
    const terraMap = mapStore.map as unknown as Map
    const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: terraMap }),
        modes: [
            new TerraDrawRectangleMode({
                styles: {
                    fillColor: "#454545",
                    fillOpacity: 0.6,
                    outlineColor: "#ff0000",
                    outlineWidth: 2
                }
            }),
            new TerraDrawLineStringMode(),
            new TerraDrawPointMode({
                styles: {
                    pointColor: "#AA4545",
                    pointWidth: 6
                }
            }),
            new TerraDrawPolygonMode(),
            new TerraDrawSelectMode({
                flags: {
                    point: {
                        feature: {
                            draggable: true,
                            coordinates: {
                                deletable: true
                            }
                        },
                    },
                    polygon: {
                        feature: {
                            draggable: true,
                            coordinates: {
                                midpoints: true,
                                draggable: true,
                                deletable: true,
                            },
                        },
                    },
                    linestring: {
                        feature: {
                            draggable: true,
                            coordinates: {
                                midpoints: true,
                                draggable: true,
                                deletable: true,
                            },
                        },
                    }
                }
            })
        ]
    })
    /**
     * Initializes the drawing mode based on the current state.
     * Starts or resumes drawing, sets the mode, and handles isochrone cancellation.
     */
    function initDrawMode(): void {
        if (draw !== null) {
            if (editOnProgress.value) {
                draw.setMode(drawMode.value)
                editOnProgress.value = false
                drawOnProgress.value = true
            } else {
                draw.start();
                draw.setMode(drawMode.value);
                drawOnProgress.value = true
                editOnProgress.value = false
            }
            geometry.cancelIsochroneSelection()
        } else {
            console.error("Could not find drawing instance")
        }
    }
    /**
     * Switches to edit mode, allowing selection and modification of drawn features.
     */
    function editMode(): void {
        if (draw !== null) {
            draw.setMode("select");
            drawOnProgress.value = false
            editOnProgress.value = true
        } else {
            console.error("Could not find drawing instance")
        }
    }
    /**
     * Stops the drawing mode and resets related state variables.
     */
    function stopDrawMode(): void {
        if (draw !== null && draw.enabled) {
            draw.setMode("static")
            draw.stop()
            drawOnProgress.value = false
            editOnProgress.value = false
            layerName.value = ""
        } else {
            console.error("Could not find drawing instance")
        }
    }
    /**
     * Returns a snapshot of the currently drawn features.
     * @returns An array of GeoJSON Feature objects representing the current drawing state.
     */
    function getSnapshot(): Feature[]{
        return draw.getSnapshot()
    }
    /**
     * Clears all drawn features from the drawing instance.
     */
    function clearSnapshot(): void {
        draw.clear()
    }
    /**
     * Saves the current drawing as a new map layer, handling naming and type checks.
     * Shows error toasts if the operation fails.
     */
    function saveAsLayer(): void {
        const featureList = draw.getSnapshot()
        const processedLayerName = layerName.value.trim().toLowerCase().replaceAll(" ", "_")
        const isOnMap = mapStore.layersOnMap.filter((layer) => layer.id === processedLayerName).length > 0
        if (!isOnMap) {
            if ((featureList.length > 0)) {
                const geoJsonSnapshot: FeatureCollection = {
                    type: "FeatureCollection",
                    features: featureList
                }
                const geomType = mapStore.geometryConversion(featureList[0].geometry.type)
                const isFilterLayer = featureList[0].geometry.type === "Polygon"
                mapStore.addMapDataSource(
                    "geojson",
                    processedLayerName,
                    isFilterLayer,
                    undefined,
                    undefined,
                    geoJsonSnapshot
                ).then(() => {
                    mapStore.addMapLayer(
                        "geojson",
                        processedLayerName,
                        geomType,
                        undefined,
                        undefined,
                        undefined,
                        geoJsonSnapshot,
                        isFilterLayer)
                        .then(() => {
                            stopDrawMode()
                        }).catch(error => {
                            mapStore.map.value.removeSource(isFilterLayer ? `drawn-${processedLayerName}` : processedLayerName)
                            toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                        })
                }).catch((error) => {
                    toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                })
            } else {
                toast.add({ severity: "error", summary: "Error", detail: "There is no feature drawn on map!", life: 3000 });
            }
        } else {
            toast.add({ severity: "error", summary: "Error", detail: "Layer name already in use!", life: 3000 });
        }
    }
    const layerName = ref("")

    return {
        initDrawMode,
        editMode,
        stopDrawMode,
        saveAsLayer,
        getSnapshot,
        clearSnapshot,
        drawMode,
        drawTypes,
        drawOnProgress,
        editOnProgress,
        layerName
    }
})

/* eslint-disable */
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useDrawStore, import.meta.hot))
}
