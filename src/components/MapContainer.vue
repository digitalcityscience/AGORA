<template>
  <div id="map">
  </div>
</template>

<script setup lang="ts">
import maplibre, { type MapMouseEvent, type Map } from "maplibre-gl"
import { h, nextTick, onMounted, ref, render } from "vue";
import { type LayerStyleOptions, useMapStore } from "../store/map";
import { useDrawStore } from "../store/draw";
import { useGeoserverStore } from "../store/geoserver";
import { isNullOrEmpty } from "../core/helpers/functions";
import MapAttributeModal from "./MapAttributeModal.vue"

const mapStore = useMapStore()
const geoserver = useGeoserverStore()
const clickedLayers = ref()
onMounted(() => {
    mapStore.map = new maplibre.Map({
        container: "map",
        style: `https://api.maptiler.com/maps/${import.meta.env.VITE_MAPTILER_MAP_ID}/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`, // stylesheet location
        center: [9.993163, 53.552123], // starting position [lng, lat]
        zoom: 15 // starting zoom
    })
    // Add zoom and rotation controls to the map.
    const zoomControl = new maplibre.NavigationControl()
    mapStore.map.addControl(zoomControl, "top-right");
    // Add parcel dataset after map is ready.
    loadParcelDataset().then(()=>{}, ()=>{})
    if (mapStore.map !== undefined) {
        mapStore.map.on("click", (e: MapMouseEvent)=>{
            if (!(useDrawStore().drawOnProgress || useDrawStore().editOnProgress)) {
                const clickedFeatures: any[] = mapStore.map.queryRenderedFeatures(e.point)
                if (clickedFeatures.length > 0) {
                    const matchedFeatures = clickedFeatures.filter((clickedLayer)=>{ return mapStore.layersOnMap.some((l)=>{ return l.source === clickedLayer.source }) })
                    if (matchedFeatures.length > 0){
                        console.log("matched features", matchedFeatures)
                        console.log(e)
                        clickedLayers.value = matchedFeatures
                        console.log("clicked layers", clickedLayers.value)
                        new maplibre.Popup({ maxWidth:"none" })
                            .setLngLat(e.lngLat)
                            .setHTML("<div id='map-popup-content'></div>")
                            .addTo(mapStore.map as Map)
                        nextTick(() => {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            const popupComp = h(MapAttributeModal, {
                                features: [...matchedFeatures],
                            });
                            render(popupComp, document.getElementById("map-popup-content")!);
                        }).then(()=>{}, ()=>{})
                    }
                }
            }
        })
    }
})

async function loadParcelDataset(): Promise<void> {
    const layerName: string = `${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`
    const layerInfoURL: string = `${import.meta.env.VITE_PARCEL_DATASET_LAYERINFORMATION_URL}`
    const workspaceName: string = `${import.meta.env.VITE_PARCEL_DATASET_WORKSPACENAME}`
    if (layerName.length>0 && layerInfoURL.length>0){
        geoserver.getLayerInformation({ name:layerName, href:layerInfoURL }, workspaceName)
            .then((layerInformation) => {
                let layerStyling: LayerStyleOptions
                // Currently we are just picking styles which has include mbstyle in name. Further optimization needed after some period
                // TODO: remove mbstyle selector
                if (layerInformation.layer.defaultStyle.href.includes("mbstyle")){
                    const regex = /\.json\b/;
                    const url = layerInformation.layer.defaultStyle.href.replace(regex, ".mbstyle")
                    geoserver.getLayerStyling(url).then(style => {
                        if (style.layers.length > 0){
                            layerStyling = geoserver.convertLayerStylingToMaplibreStyle(style)
                        }
                    }).catch((error) => {
                        window.alert(error)
                    })
                }
                if (layerInformation !== undefined) {
                    geoserver.getLayerDetail(layerInformation.layer.resource.href).then((detail) => {
                        if (!isNullOrEmpty(detail)) {
                            const dataType = (): string => {
                                const feature = detail.featureType.attributes.attribute.filter((att) => { return att.name === "geom" })
                                return feature.length > 0 ? feature[0].binding.split(".").slice(-1)[0] : ""
                            }
                            mapStore.addMapDataSource(
                                "geoserver",
                                detail.featureType.name,
                                false,
                                `${String(import.meta.env.VITE_PARCEL_DATASET_WORKSPACENAME)}`,
                                detail).then(() => {
                                if (!isNullOrEmpty(dataType) && !isNullOrEmpty(detail)) {
                                    mapStore.addMapLayer(
                                        "geoserver",
                                        detail.featureType.name,
                                        mapStore.geometryConversion(dataType()),
                                        !isNullOrEmpty(layerStyling) ? { ...layerStyling }: undefined,
                                        detail,
                                        `${detail.featureType.name}`
                                    ).then(()=>{
                                        mapStore.map.on("click", detail.featureType.name, (e: MapMouseEvent)=>{
                                            const clickedFeatures: any[] = mapStore.map.queryRenderedFeatures(e.point)
                                            console.log("clicked features", clickedFeatures)
                                            const activeAdminIndex = clickedFeatures.findIndex((feature)=>{ return feature.layer.id === "active-admin" })
                                            const parcelIndex = clickedFeatures.findIndex((feature)=>{ return feature.layer.id === detail.featureType.name })
                                            if (activeAdminIndex === -1 || activeAdminIndex>parcelIndex){
                                                console.log("parcel event:", e)
                                            }
                                        })
                                    }).catch(error => {
                                        window.alert(error)
                                    })
                                }
                            }).catch(error => {
                                window.alert(error)
                            })
                        }
                    }).catch(err => { window.alert(err) })
                }
            }).catch(err => { window.alert(err) })
    } else {
        window.alert("could not find parcel dataset information")
    }
}
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}
</style>
