import { defineStore, acceptHMRUpdate } from "pinia"
import { TerraDraw, TerraDrawLineStringMode, TerraDrawMapLibreGLAdapter, TerraDrawPointMode, TerraDrawPolygonMode, TerraDrawRectangleMode, TerraDrawSelectMode } from "terra-draw"
import { ref } from "vue";
import { useMapStore } from "./map";
import { type Map } from "maplibre-gl"
import { type FeatureCollection } from "geojson";

export const useDrawStore = defineStore("draw", () => {
    const mapStore = useMapStore()
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
        } else {
            console.error("Could not find drawing instance")
        }
    }
    function editMode(): void {
        if (draw !== null) {
            draw.setMode("select");
            drawOnProgress.value = false
            editOnProgress.value = true
        } else {
            console.error("Could not find drawing instance")
        }
    }
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
    // Saving draw result as a layer
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
                            window.alert(error)
                        })
                }).catch((error) => {
                    window.alert(error)
                })
            } else {
                window.alert("There is no feature drawn on map!")
            }
        } else {
            window.alert("Layer name already in use!")
        }
    }
    const layerName = ref("")

    return {
        initDrawMode,
        editMode,
        stopDrawMode,
        saveAsLayer,
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
