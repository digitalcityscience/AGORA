<template>
  <div id="map">
  </div>
</template>

<script setup lang="ts">
import maplibre from "maplibre-gl"
import { onMounted } from "vue";
import { useMapStore } from "../store/map";
import { useGeoserverStore } from "../store/geoserver";
import { isNullOrEmpty } from "../core/helpers/functions";

const mapStore = useMapStore()
const geoserver = useGeoserverStore()
onMounted(() => {
    mapStore.map = new maplibre.Map({
        container: "map",
        style: `https://api.maptiler.com/maps/a2eb63ba-7d0e-4b25-9cfc-9ef74d786ec4/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`, // stylesheet location
        center: [9.993163, 53.552123], // starting position [lng, lat]
        zoom: 15 // starting zoom
    })
    // Add zoom and rotation controls to the map.
    const zoomControl = new maplibre.NavigationControl()
    mapStore.map.addControl(zoomControl, "top-right");

    geoserver.getLayerDetail(`${import.meta.env.VITE_PARCEL_DATASET_LAYERDETAIL_URL}`).then((detail) => {
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
                        undefined,
                        detail,
                        `${detail.featureType.name}`
                    ).then(()=>{
                    }).catch(error => {
                        window.alert(error)
                    })
                }
            }).catch(error => {
                window.alert(error)
            })
        }
    }).catch(err => { window.alert(err) })
})
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}
</style>
