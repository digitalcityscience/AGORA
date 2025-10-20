<template>
  <div id="map">
  </div>
</template>

<script setup lang="ts">
import maplibre, { type MapMouseEvent, type Map } from "maplibre-gl"
import { h, nextTick, onMounted, ref, render } from "vue";
import { type LayerStyleListItem, type LayerStyleOptions, useMapStore } from "../store/maplibre/map";
import { useDrawStore } from "../store/maplibre/draw";
import { type StyleEntry, useGeoserverStore } from "../store/geoserver";
import { isNullOrEmpty } from "../core/helpers/functions";
import MapAttributeModal from "./MapAttributeModal.vue"
import { useResultStore } from "../store/ligfinder/result";
import { useGeometryStore } from "../store/ligfinder/geometry";
import { useToast } from "primevue/usetoast";

const mapStore = useMapStore()
const geoserver = useGeoserverStore()
const toast = useToast()
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
                if (clickedFeatures.length > 0 && clickedFeatures[0].layer.id !== "active-admin") {
                    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                    const matchedFeatures = clickedFeatures.filter((clickedLayer)=>{ return mapStore.layersOnMap.some((l)=>{ return !(clickedLayer.layer.id.includes("cluster")) && l.source === clickedLayer.source && l.showOnLayerList }) })
                    if (matchedFeatures.length > 0){
                        console.log("matched features", matchedFeatures)
                        console.log(e)
                        const clustered = matchedFeatures.filter((feature)=>{ return feature.properties.cluster })
                        console.log("clustered", clustered)
                        const unclusteredFeatures: any[] = []
                        while (clustered.length > 0) {
                            const firstCluster = clustered.pop();
                            const leaves: any[] = await mapStore.map.getSource(firstCluster.source).getClusterLeaves(
                                firstCluster.properties.cluster_id,
                                firstCluster.properties.point_count
                            );
                            leaves.forEach((leaf) => {
                                leaf.source = firstCluster.source;
                            });
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            unclusteredFeatures.push(...leaves);
                        }
                        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                        const nonClustered = matchedFeatures.filter((feature)=>{ return !(feature.properties.cluster) })
                        // Deduplicate only for the target layer
                        const targetLayerName = `${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`

                        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                        const getUniqueFeatures = (features: any[], comparatorProperty: string) => {
                            const uniqueIds = new Set();
                            const uniqueFeatures = [];
                            for (const feature of features) {
                                const id = feature.properties?.[comparatorProperty];
                                if ((Boolean(id)) && !uniqueIds.has(id)) {
                                    uniqueIds.add(id);
                                    uniqueFeatures.push(feature);
                                }
                            }
                            return uniqueFeatures;
                        };

                        const targetLayerFeatures = nonClustered.filter(f => f.layer.id === targetLayerName);
                        const otherFeatures = nonClustered.filter(f => f.layer.id !== targetLayerName);
                        const uniqueTargetFeatures = getUniqueFeatures(targetLayerFeatures, "UUID");
                        const uniqueNonClustered = otherFeatures.concat(uniqueTargetFeatures);
                        console.log("non clustered", uniqueNonClustered)
                        console.log("unclustered", unclusteredFeatures)
                        clickedLayers.value = uniqueNonClustered.concat(unclusteredFeatures)
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
                                features: [...uniqueNonClustered.concat(unclusteredFeatures)],
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
            .then(async (layerInformation) => {
                let layerStyling: LayerStyleOptions
                const regex = /\.json\b/;
                // Currently we are just picking styles which has include mbstyle in name. Further optimization needed after some period
                // TODO: remove mbstyle selector
                if (layerInformation.layer.defaultStyle.href.includes("mbstyle")){
                    const url = layerInformation.layer.defaultStyle.href.replace(regex, ".mbstyle")
                    geoserver.getLayerStyling(url).then(style => {
                        if (style.layers.length > 0){
                            layerStyling = geoserver.convertLayerStylingToMaplibreStyle(style)
                        }
                    }).catch((error) => {
                        layerStyling = geoserver.convertLayerStylingToMaplibreStyle({
                            version: 8,
                            name: "lig-polygon-mbstyle",
                            layers: [
                                {
                                    id: "lig-polygon-mbstyle",
                                    type: "fill",
                                    paint: {
                                        "fill-color": "#D6333A",
                                        "fill-opacity": 0.7,
                                        "fill-outline-color":"#000000"
                                    }
                                }
                            ]
                        })
                        console.log(error)
                    })
                }
                if (layerInformation.layer.styles.style.length > 0) {
                    const mbStyleList: StyleEntry[] = layerInformation.layer.styles.style.filter(
                        style => style.name.includes("grz_potential") || style.name.includes("lig-polygon")
                    );
                    // Load all mbstyles in parallel and wait for completion
                    const parcelStyles = await Promise.all(
                        mbStyleList.map(async styleEntry => {
                            try {
                                const mbStyle = await geoserver.getLayerStyling(
                                    styleEntry.href.replace(regex, ".mbstyle")
                                );
                                if (mbStyle.layers.length > 0) {
                                    return {
                                        options: geoserver.convertLayerStylingToMaplibreStyle(mbStyle),
                                        name: mbStyle.name
                                    } satisfies LayerStyleListItem;
                                }
                            } catch (error) {
                                console.error("Parcel mbstyle list error:", error);
                            }
                            return null;
                        })
                    );
                    // Filter out any failed loads
                    const validStyles = parcelStyles.filter(
                        (ps): ps is LayerStyleListItem => ps !== null
                    );
                    if (validStyles.length > 0) {
                        mapStore.parcelDataStyles = validStyles;
                    }
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
                                        console.log("added layer", detail.featureType.name)
                                        useResultStore().attributeList = detail.featureType.attributes.attribute.filter((att) => { return att.name !== "geom" })
                                        mapStore.map.on("click", detail.featureType.name, (e: MapMouseEvent)=>{
                                            const clickedFeatures: any[] = mapStore.map.queryRenderedFeatures(e.point)
                                            // Deduplicate only for the specified parcel layer
                                            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                                            const getUniqueFeatures = (features: any[], comparatorProperty: string) => {
                                                const uniqueIds = new Set();
                                                const uniqueFeatures = [];
                                                for (const feature of features) {
                                                    const id = feature.properties?.[comparatorProperty];
                                                    if ((Boolean(id)) && !uniqueIds.has(id)) {
                                                        uniqueIds.add(id);
                                                        uniqueFeatures.push(feature);
                                                    }
                                                }
                                                return uniqueFeatures;
                                            };

                                            const targetLayerName = import.meta.env.VITE_PARCEL_DATASET_LAYERNAME;
                                            const parcelFeatures = clickedFeatures.filter((feature) => feature.layer.id === targetLayerName);
                                            const otherFeatures = clickedFeatures.filter((feature) => feature.layer.id !== targetLayerName);
                                            const uniqueTargetFeatures = getUniqueFeatures(parcelFeatures, "UUID");
                                            const uniqueParcelFeatures = otherFeatures.concat(uniqueTargetFeatures);
                                            const nonParcelFeatures = clickedFeatures.filter((feature) => feature.layer.id !== detail.featureType.name);
                                            const uniqueClickedFeatures = nonParcelFeatures.concat(uniqueParcelFeatures);

                                            console.log("clicked features", uniqueClickedFeatures)
                                            const activeAdminIndex = uniqueClickedFeatures.findIndex((feature)=>{ return feature.layer.id === "active-admin" })
                                            const parcelIndex = uniqueClickedFeatures.findIndex((feature)=>{ return feature.layer.id === detail.featureType.name })
                                            if (activeAdminIndex === -1 || activeAdminIndex>parcelIndex){
                                                console.log("parcel event:", e)
                                            }
                                        })
                                    }).catch(error => {
                                        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                                    })
                                }
                            }).catch(error => {
                                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                            })
                        }
                    }).catch(err => { toast.add({ severity: "error", summary: "Error", detail: err, life: 3000 }); })
                }
            }).catch(err => { toast.add({ severity: "error", summary: "Error", detail: err, life: 3000 }); })
    } else {
        toast.add({ severity: "error", summary: "Error", detail: "could not find parcel dataset information", life: 3000 });
    }
}
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}
</style>
