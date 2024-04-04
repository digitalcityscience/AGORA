<template>
  <div id="map">
  </div>
</template>

<script setup lang="ts">
import maplibre from "maplibre-gl"
import { onMounted } from "vue";
import { type LayerStyleOptions, useMapStore } from "../store/map";
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
    // Add parcel dataset after map is ready.
    loadParcelDataset().then(()=>{}, ()=>{})
})

async function loadParcelDataset(): Promise<void> {
    const layerName: string = `${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`
    const layerInfoURL: string = `${import.meta.env.VITE_PARCEL_DATASET_LAYERINFORMATION_URL}`
    if (layerName.length>0 && layerInfoURL.length>0){
        geoserver.getLayerInformation({ name:"parcel3857", href:"http://dev.geoserver.tosca.dcs.hcu-hamburg.de/geoserver/rest/workspaces/public/layers/parcel3857.json" }, "public")
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
