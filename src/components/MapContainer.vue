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
import { useResultStore } from "../store/ligfinder/result";
import { useGeometryStore } from "../store/ligfinder/geometry";

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
        mapStore.map.on("click", async (e: MapMouseEvent)=>{
            if (!(useDrawStore().drawOnProgress || useDrawStore().editOnProgress || useGeometryStore().selectionOnProgress)) {
                const clickedFeatures: any[] = mapStore.map.queryRenderedFeatures(e.point)
                if (clickedFeatures.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                    const matchedFeatures = clickedFeatures.filter((clickedLayer)=>{ return mapStore.layersOnMap.some((l)=>{ return !(clickedLayer.layer.id.includes("cluster")) && l.source === clickedLayer.source && l.showOnLayerList }) })
                    if (matchedFeatures.length > 0){
                        console.log("matched features", matchedFeatures)
                        console.log(e)
                        const clustered = matchedFeatures.filter((feature)=>{ return feature.properties.cluster })
                        console.log("clustered", clustered)
                        const unclusteredFeatures: any[] = []
                        if (clustered.length>0) {
                            const firstCluster = clustered.pop()
                            const leaves: any[] = await mapStore.map.getSource(firstCluster.source).getClusterLeaves(firstCluster.properties.cluster_id, firstCluster.properties.point_count)
                            leaves.forEach((leaf)=>{
                                leaf.source = firstCluster.source
                            })
                            console.log("clustered leaves", leaves)
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            unclusteredFeatures.push(...leaves)
                        }
                        if (clustered.length>0) {
                            const firstCluster = clustered.pop()
                            const leaves2: any[] = await mapStore.map.getSource(firstCluster.source).getClusterLeaves(firstCluster.properties.cluster_id, firstCluster.properties.point_count)
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            leaves2.forEach((leaf)=>{
                                leaf.source = firstCluster.source
                            })
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            unclusteredFeatures.push(...leaves2)
                        }
                        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                        const nonClustered = matchedFeatures.filter((feature)=>{ return !(feature.properties.cluster) })
                        console.log("non clustered", nonClustered)
                        console.log("unclustered", unclusteredFeatures)
                        clickedLayers.value = nonClustered.concat(unclusteredFeatures)
                        console.log("clicked layers", clickedLayers.value)
                        function calculatePopupAnchor(lngLat: maplibregl.LngLat, map: maplibregl.Map): "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" {
                            // Modal boyutlarını piksel cinsine çevirin
                            const modalWidthPx = 384;
                            const modalHeightPx = 288;

                            const mapBounds = map.getBounds();
                            const northEastPx = map.project(mapBounds.getNorthEast());
                            const southWestPx = map.project(mapBounds.getSouthWest());
                            const pointPx = map.project(lngLat);
                            // Kuzey, güney, doğu ve batıya olan piksel uzaklıklarını hesapla
                            const distanceToNorthPx = pointPx.y - northEastPx.y;
                            const distanceToSouthPx = southWestPx.y - pointPx.y;
                            const distanceToEastPx = northEastPx.x - pointPx.x;
                            const distanceToWestPx = pointPx.x - southWestPx.x;

                            const t = distanceToNorthPx > modalHeightPx ? distanceToSouthPx > modalHeightPx ? "" : "bottom" : "top";
                            const u = distanceToEastPx > modalWidthPx ? distanceToWestPx > modalWidthPx ? "" : "left" : "right";

                            if ((t.length > 0) && (u.length > 0)) return `${t}-${u}` as "top-left" | "top-right" | "bottom-left" | "bottom-right";
                            if (t.length > 0) return t as "top" | "bottom";
                            if (u.length > 0) return u as "left" | "right";
                            return "bottom"; // Varsayılan değer
                        }

                        const anchor = calculatePopupAnchor(e.lngLat, mapStore.map as Map);
                        new maplibre.Popup({ maxWidth:"none", anchor })
                            .setLngLat(e.lngLat)
                            .setHTML("<div id='map-popup-content'></div>")
                            .addTo(mapStore.map as Map)
                        nextTick(() => {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            const popupComp = h(MapAttributeModal, {
                                features: [...nonClustered.concat(unclusteredFeatures)],
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
                                        useResultStore().attributeList = detail.featureType.attributes.attribute.filter((att) => { return att.name !== "geom" })
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
