<template>
    <div class="w-full">
        <UCard v-if="isLoading" class="bg-default/95 dark:bg-elevated/80" :ui="{ body: 'p-3' }">
            <div class="space-y-3">
                <USkeleton class="h-5 w-2/3" />
                <USkeleton class="h-4 w-full" />
                <USkeleton class="h-8 w-28" />
            </div>
        </UCard>
        <UAlert
            v-else-if="loadError"
            class="w-full"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :description="$t('datastore.layer.noInfo')"
        />
        <UCard
            v-else
            class="workspace-layer-card bg-default/95 dark:bg-elevated/80"
            :ui="{ header: 'p-3 pb-2', body: 'p-3 pt-1', footer: 'p-3 pt-2' }"
        >
            <template #header>
                <div class="min-w-0 space-y-2">
                    <p class="layer-card-title font-semibold capitalize text-highlighted">{{ cleanLayerName }}</p>
                    <div v-if="layerDetail?.featureType.keywords.string.length" class="flex flex-wrap gap-1.5">
                        <UBadge
                            v-for="(keyword, index) in layerDetail.featureType.keywords.string"
                            :key="index"
                            color="neutral"
                            variant="soft"
                            size="sm"
                            :label="keyword"
                        />
                    </div>
                </div>
            </template>
            <p
                v-if="layerDetail?.featureType.abstract"
                class="line-clamp-3 text-sm text-muted hover:line-clamp-none"
            >
                {{ layerDetail.featureType.abstract }}
            </p>
            <template #footer>
                <div class="flex justify-end">
                    <UButton
                        size="sm"
                        :label="$t('datastore.layer.add')"
                        @click="add2Map"
                    />
                </div>
            </template>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { type GeoServerFeatureType, type GeoserverLayerInfo, type GeoserverLayerListItem, useGeoserverStore } from "../../store/api/geoserver";
import { type LayerStyleOptions, useMapStore } from "../../store/maplibre/map";
import { isNullOrEmpty } from "../../core/helpers/functions";
import { useToast } from "../../core/helpers/toast";

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
const isLoading = ref(true)
const loadError = ref(false)

async function loadLayerInformation(): Promise<void> {
    try {
        const response = await geoserver.getLayerInformation(props.item, props.workspace)
        layerInformation.value = response.layer

        // Currently we are just picking styles which has include mbstyle in name. Further optimization needed after some period
        // TODO: remove mbstyle selector
        if (response.layer.defaultStyle.href.includes("mbstyle")) {
            const regex = /\.json\b/
            const url = response.layer.defaultStyle.href.replace(regex, ".mbstyle")
            try {
                const style = await geoserver.getLayerStyling(url)
                if (style.layers.length > 0) {
                    layerStyling.value = geoserver.convertLayerStylingToMaplibreStyle(style)
                }
            } catch (error) {
                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 })
            }
        }

        if (layerInformation.value !== undefined) {
            layerDetail.value = await geoserver.getLayerDetail(layerInformation.value.resource.href)
        }
    } catch (error) {
        loadError.value = true
        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 })
    } finally {
        isLoading.value = false
    }
}

void loadLayerInformation()

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
                            const parentId = layerDetail.value!.featureType.name;
                            mapStore.addCompanionLayer(parentId, {
                                id: `${parentId}-cluster`,
                                type: "symbol",
                                source: parentId,
                                filter: ["has", "point_count"],
                                layout: {
                                    "text-field": "{point_count_abbreviated}",
                                    "text-font": ["Open Sans Regular"],
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
                        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                    })
                }
            }).catch(error => {
                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
            })
        }
    }
}
</script>

<style scoped>
.layer-card-title {
    min-width: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
}
</style>
