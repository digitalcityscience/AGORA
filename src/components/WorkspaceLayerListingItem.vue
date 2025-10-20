<template>
    <div v-if="props.item" class="first:pt-0 pt-1">
        <Card>
            <template #title>
                <span class="capitalize">{{ cleanLayerName }}</span>
            </template>
            <template #subtitle v-if="layerDetail && layerDetail?.featureType.abstract?.length > 0">
                <span class="line-clamp-3 hover:line-clamp-none xl:line-clamp-none">{{ layerDetail.featureType.abstract }}</span></template>
            <template #content v-if="layerDetail">
                <div class="grid grid-cols-4 w-full pt-1">
                    <span class="font-bold lg:col-span-2 2xl:col-span-2 3xl:col-span-2 4xl:col-span-1 self-center">{{$t('datastore.layer.keywords')}}:</span>
                    <span class="lg:col-span-2 2xl:col-span-2 3xl:col-span-2 4xl:col-span-3 pl-1">
                        <Tag class="mb-1 mr-1 last:mr-0" severity="secondary" v-for="(keyword,index) in layerDetail.featureType.keywords.string" :key="index" :value="keyword"></Tag>
                    </span>
                </div>
            </template>
            <template #footer>
                <Button size="small" @click="add2Map">{{$t('datastore.layer.add')}}</button>
            </template>
        </Card>
    </div>
    <div v-else class="first:pt-0 pt-1 w-full">
        <InlineMessage class="w-full" severity="info">{{$t('datastore.layer.noInfo')}}</InlineMessage>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Tag from "primevue/tag"
import Button from "primevue/button"
import InlineMessage from "primevue/inlinemessage";
import { type GeoServerFeatureType, type GeoserverLayerInfo, type GeoserverLayerListItem, useGeoserverStore } from "../store/api/geoserver";
import { type LayerStyleOptions, useMapStore } from "../store/maplibre/map";
import Card from "primevue/card";
import { isNullOrEmpty } from "../core/helpers/functions";
import { useToast } from "primevue/usetoast";

export interface Props {
    item: GeoserverLayerListItem
    workspace: string
}
export interface LayerStylingPaint {
    paint: object
}
const props = defineProps<Props>()
const cleanLayerName = computed(() => {
    return ((layerDetail.value?.featureType.title) != null) ? layerDetail.value?.featureType.title.replaceAll("_", " ") : props.item.name.replaceAll("_", " ")
})
const geoserver = useGeoserverStore()
const toast = useToast()
const layerInformation = ref<GeoserverLayerInfo>()
const layerDetail = ref<GeoServerFeatureType>()
const layerStyling = ref<LayerStyleOptions>()
geoserver.getLayerInformation(props.item, props.workspace).then((response) => {
    layerInformation.value = response.layer
    // Currently we are just picking styles which has include mbstyle in name. Further optimization needed after some period
    // TODO: remove mbstyle selector
    if (response.layer.defaultStyle.href.includes("mbstyle")){
        const regex = /\.json\b/;
        const url = response.layer.defaultStyle.href.replace(regex, ".mbstyle")
        geoserver.getLayerStyling(url).then(style => {
            if (style.layers.length > 0){
                layerStyling.value = geoserver.convertLayerStylingToMaplibreStyle(style)
            }
        }).catch((error) => {
            toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
        })
    }
    if (layerInformation.value !== undefined) {
        geoserver.getLayerDetail(layerInformation.value?.resource.href).then((detail) => {
            layerDetail.value = detail
        }).catch(err => { toast.add({ severity: "error", summary: "Error", detail: err, life: 3000 }); })
    }
}).catch(err => { toast.add({ severity: "error", summary: "Error", detail: err, life: 3000 }); })

const dataType = computed(() => {
    if (!isNullOrEmpty(layerDetail.value)) {
        const feature = layerDetail.value!.featureType.attributes.attribute.filter((att) => { return att.name.includes("geom") })
        return feature.length > 0 ? feature[0].binding.split(".").slice(-1)[0] : ""
    } else { return "" }
})

const mapStore = useMapStore()
function add2Map(): void{
    if (!isNullOrEmpty(layerDetail.value)) {
        if (layerDetail.value!.featureType.name === "parliament_database" || layerDetail.value!.featureType.name === "elbe_wochenblatt"){
            /** @todo download layers as a geojson and add */
            const box = layerDetail.value!.featureType.latLonBoundingBox
            geoserver.getLayerDataGeoJSON(layerDetail.value!.featureType.name, props.workspace, [box.minx, box.miny, box.maxx, box.maxy].join(",")).then((response)=>{
                console.log(response)
                mapStore.addMapDataSource(
                    "geojson",
                    layerDetail.value!.featureType.name,
                    false,
                    props.workspace,
                    layerDetail.value,
                    response,
                    true
                ).then(() => {
                    if (!isNullOrEmpty(dataType) && !isNullOrEmpty(layerDetail.value)) {
                        mapStore.addMapLayer(
                            "geojson",
                            layerDetail.value!.featureType.name,
                            "circle",
                            undefined,
                            layerDetail.value,
                            undefined,
                            response,
                            undefined,
                            layerDetail.value!.featureType.title?? layerDetail.value!.featureType.name,
                            undefined,
                            undefined,
                            true,
                        ).then(()=>{
                            mapStore.map.addLayer({
                                id: `${layerDetail.value!.featureType.name}-cluster`,
                                type: "symbol",
                                source: `${layerDetail.value!.featureType.name}`,
                                filter: ["has", "point_count"],
                                layout: {
                                    "text-field": "{point_count_abbreviated}",
                                    "text-font": ["Helvetica", "Arial Unicode MS Bold"],
                                    "text-size": 12
                                }
                            });
                        }).catch(error => {
                            console.log(error)
                        })
                    }
                }).catch(error => {
                    console.log(error)
                })
            }).catch(error => {
                console.log(error)
            })
        } else {
            mapStore.addMapDataSource(
                "geoserver",
                layerDetail.value!.featureType.name,
                false,
                props.workspace,
                layerDetail.value,
                undefined,
                !!(layerDetail.value!.featureType.name === "parliament_database" || layerDetail.value!.featureType.name === "elbe_wochenblatt")
            ).then(() => {
                if (!isNullOrEmpty(dataType) && !isNullOrEmpty(layerDetail.value)) {
                    mapStore.addMapLayer(
                        "geoserver",
                        layerDetail.value!.featureType.name,
                        mapStore.geometryConversion(dataType.value),
                        !isNullOrEmpty(layerStyling.value) ? { ...layerStyling.value }: undefined,
                        layerDetail.value,
                        `${layerDetail.value!.featureType.name}`,
                        undefined,
                        undefined,
                        layerDetail.value!.featureType.title?? layerDetail.value!.featureType.name,
                        undefined,
                        undefined,
                        !!((layerDetail.value!.featureType.name === "parliament_database" || layerDetail.value!.featureType.name === "elbe_wochenblatt")),
                    ).then(()=>{
                    }).catch(error => {
                        console.log(error)
                    })
                }
            }).catch(error => {
                console.log(error)
            })
        }
    }
}
</script>
