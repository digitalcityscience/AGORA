<template>
	<div class="geometry-filter w-full" v-if="(props.layer.filterLayer === undefined && isPolygonTiles)">
		<div class="new-filter w-full pt-2" v-if="!hasGeometryFilter">
			<UCard
				variant="subtle"
				:ui="{ header: 'p-3 pb-2', body: 'p-3 pt-1', footer: 'p-3 pt-2' }"
			>
				<template #header>
					<div class="space-y-1">
						<div class="font-semibold text-highlighted">{{ $t('mapLayers.geometryFiltering.title') }}</div>
						<div class="text-sm text-muted">{{ $t('mapLayers.geometryFiltering.subtitle') }}</div>
					</div>
				</template>
					<div class="filterlayer-dropdown w-full">
						<div v-if="filterLayerList.length>0">
							<div class="flex w-full">
								<USelect
									v-model="selectedFilterLayerId"
									class="min-w-0 flex-1"
									:items="filterLayerOptions"
									:placeholder="$t('mapLayers.geometryFiltering.selectLayer')"
									@update:model-value="dropdownFitter"
								/>
								<UButton
									v-if="selectedFilterLayerId !== undefined"
									class="ml-1"
									icon="i-lucide-x"
									color="neutral"
									variant="ghost"
									:aria-label="$t('mapLayers.geometryFiltering.clearLayer')"
									@click="selectedFilterLayerId = undefined"
								/>
							</div>
						</div>
                        <div class="w-full no-current-filter py-2" v-else>
                            <UAlert class="w-full" color="info" variant="soft" :description="$t('mapLayers.geometryFiltering.noLayerMessage')" />
                        </div>
					</div>
					<div v-if="selectedFilterLayer && props.layer.type==='fill'"  class="identifier-dropdown w-full py-2">
						<div class="flex w-full">
							<USelect
								v-model="selectedPropertyName"
								class="min-w-0 flex-1"
								:items="filteredAttributeOptions"
								:placeholder="$t('mapLayers.geometryFiltering.selectIdentifier')"
							/>
							<UButton
								v-if="selectedPropertyName !== undefined"
								class="ml-1"
								icon="i-lucide-x"
								color="neutral"
								variant="ghost"
								:aria-label="$t('mapLayers.geometryFiltering.clearIdentifier')"
								@click="selectedPropertyName = undefined"
							/>
						</div>
					</div>
				<template #footer>
                    <div class="w-full flex flex-row-reverse">
                        <UButton size="sm" :disabled="(isNullOrEmpty(selectedFilterLayer) || (props.layer.type === 'fill' && isNullOrEmpty(selectedProperty)))" @click="applyGeometryFilter">{{ $t('mapLayers.geometryFiltering.addFilter') }}</UButton>
                    </div>
				</template>
			</UCard>
		</div>
        <div class="existing-filter pt-2" v-else>
            <UCard variant="subtle" :ui="{ body: 'p-3' }">
                    <div class="flex flex-row justify-between w-full">
                        <span class="self-center">{{ $t('mapLayers.geometryFiltering.activeFilterMessage') }}</span>
                        <UButton
							icon="i-lucide-x"
							color="error"
							variant="ghost"
							:aria-label="$t('mapLayers.controls.removeFilter')"
							@click="removeGeometryFilter"
						/>
                    </div>
            </UCard>
        </div>
	</div>
</template>

<script setup lang="ts">
import { useToast } from "../../../core/helpers/toast";
import { type CustomAddLayerObject, useMapStore, type LayerObjectWithAttributes } from "../../../store/maplibre/map";
import { computed, onMounted, ref } from "vue";
import bbox from "@turf/bbox"
import bboxPolygon from "@turf/bbox-polygon"
import { type FeatureCollection, type Feature } from "geojson";
import { isNullOrEmpty } from "../../../core/helpers/functions";
import { type GeometryFilterItem, useFilterStore } from "../../../store/maplibre/filter";
import { type GeoServerFeatureTypeAttribute } from "../../../store/api/geoserver";
import { type LngLatBounds } from "maplibre-gl";
import booleanWithin from "@turf/boolean-within";
export interface Props {
    layer: LayerObjectWithAttributes
}
const props = defineProps<Props>()
const mapStore = useMapStore()
const toast = useToast()
const selectedFilterLayer = ref<CustomAddLayerObject>()
const selectedFilterLayerId = computed({
    get: () => selectedFilterLayer.value?.id,
    set: (id: string | undefined) => {
        selectedFilterLayer.value = filterLayerList.value.find((layer) => layer.id === id)
    },
})
const filterLayerList = computed(() => {
    return mapStore.layersOnMap.filter((layer) => { return layer.filterLayer === true })
})
const filterLayerOptions = computed(() => filterLayerList.value.map((layer) => ({
    label: layer.source,
    value: layer.id,
})))
const hasGeometryFilter = computed(()=>{
    return filterStore.appliedFiltersList.filter((layer)=> { return layer.layerName === props.layer.id && layer.geometryFilters !== undefined }).length > 0
})
const isPolygonTiles = computed(()=>{
    const sourceID = props.layer.source
    if (mapStore.map.getSource(sourceID) !== undefined && mapStore.map.getSource(sourceID).type === "vector" && (props.layer.type === "fill" || props.layer.type === "circle" || props.layer.type === "line")){
        return true
    } else {
        return false
    }
})
function dropdownFitter(layerId: unknown): void{
    const layer = filterLayerList.value.find((item) => item.id === layerId)
    if (!isNullOrEmpty(layer)){
        fitToFilterLayer(layer!.filterLayerData!).then(
            () => {},
            () => {},
        )
    }
}
/**
 * Gets target layer, creates bbox and fits map to this bbox
 * @param layerName
 */
async function fitToFilterLayer(filterLayerData: FeatureCollection): Promise<void>{
    if (filterLayerData.features.length > 0){
        const box = bbox(filterLayerData)
        mapStore.map.fitBounds(box, { padding: { top: 40, bottom:40, left: 40, right: 40 }, minZoom:16 })
        await new Promise<void>((resolve) => {
            mapStore.map.once("moveend", () => {
                resolve();
            });
        });
    }
}
/**
Checks if the geometry of a filter layer is currently visible
within the map bounds.
@param {FeatureCollection} filterLayerData - The filter layer data
@returns {boolean} True if the layer is within the bounds, false otherwise
*/
function isFilterLayerInView(filterLayerData: FeatureCollection): boolean{
    const mapBounds: LngLatBounds = mapStore.map.getBounds()
    const screenBox: Feature = bboxPolygon([mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()])
    for (const feature of filterLayerData.features) {
        const featureBox: Feature = bboxPolygon(bbox(feature))
        if (booleanWithin(featureBox, screenBox)){
            return true
        }
    }
    return false
}
// Identifier selection logic
/**
 * First we are going to check has layer any attribute named 'id', 'gid' or 'uuid' in order.
 * If there is no match we are showing dropdown empty. Then users can select their own identifier.
 */
const filterStore = useFilterStore()
const filteredAttributes = computed(() => {
    return props.layer.details?.featureType.attributes.attribute.filter(attr => filterStore.allowedIDBindings.includes(attr.binding))
})
const selectedPropertyName = computed({
    get: () => selectedProperty.value?.name,
    set: (name: string | undefined) => {
        selectedProperty.value = filteredAttributes.value?.find((attribute) => attribute.name === name)
    },
})
const filteredAttributeOptions = computed(() => filteredAttributes.value?.map((attribute) => ({
    label: attribute.name,
    value: attribute.name,
})) ?? [])
onMounted(()=>{
    identifierChecker()
})
/**
Checks if the layer details contain an identifier attribute
(either "gid" or "id") and sets the selected property value
accordingly.
@param {Object} props - The component props
@returns {void}
*/
function identifierChecker(): void{
    if (props.layer.details !== undefined) {
        const hasGID = props.layer.details?.featureType.attributes.attribute.some(attr => {
            if (attr.name === "gid"){
                return true
            }
            return false
        })
        const hasID = props.layer.details?.featureType.attributes.attribute.some(attr => {
            if (attr.name === "id"){
                return true
            }
            return false
        })
        if (hasGID) {
            selectedProperty.value = filteredAttributes.value?.filter((attr) => { return attr.name === "gid" })[0]
        } else {
            if (hasID) {
                selectedProperty.value = filteredAttributes.value?.filter((attr) => { return attr.name === "gid" })[0]
            }
        }
    }
}
const selectedProperty = ref<GeoServerFeatureTypeAttribute>()
/**
 * Checks geometry filter result array and other variables. If all variables checks populates geometry filter. Otherwise deletes filter.
 */
function applyGeometryFilter(): void{
    if (selectedFilterLayer.value?.filterLayerData != null && ((selectedProperty.value?.name != null && selectedProperty.value.name !== "" && props.layer.type === "fill") || props.layer.type === "circle" || props.layer.type ==="line")){
        if (!isFilterLayerInView(selectedFilterLayer.value.filterLayerData)){
            fitToFilterLayer(selectedFilterLayer.value.filterLayerData).then(() => {
                geomFilterApplier()
            }).catch((error)=>{ toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 }); })
        } else {
            geomFilterApplier()
        }
    }
}
/**
Applies a geometry filter to the layer by creating and adding
a filter to the store, then setting the filter on the map.
@param {Object} props - The component props
@returns {void}
 */
function geomFilterApplier(): void{
    if (props.layer.type === "fill"){
        if (selectedFilterLayer.value?.filterLayerData != null && selectedProperty.value?.name != null && selectedProperty.value.name !== ""){
            const filterArray: Array<string|number> = filterStore.createGeometryFilter(props.layer.id, {
                filterGeoJSON: selectedFilterLayer.value.filterLayerData,
                identifier: selectedProperty.value?.name
            })
            if (filterArray.length > 0){
                const item: GeometryFilterItem = {
                    filterGeoJSON: selectedFilterLayer.value.filterLayerData,
                    targetLayerSourceType: props.layer.type,
                    identifier: selectedProperty.value?.name,
                    filterArray
                }
                filterStore.addGeometryFilter(props.layer.id, item).then((response)=>{
                    filterStore.populateLayerFilter(response, "AND").then((expression)=> {
                        if (expression.length > 1){
                            mapStore.map.setFilter(props.layer.id, expression)
                        } else {
                            mapStore.map.setFilter(props.layer.id, null)
                        }
                    }).catch((error)=>{
                        mapStore.map.setFilter(props.layer.id, null)
                        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                    })
                }).catch((error)=>{
                    toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                })
            }
        }
    }
    if (props.layer.type === "circle" || props.layer.type === "line"){
        if (selectedFilterLayer.value?.filterLayerData != null){
            const item: GeometryFilterItem = {
                filterGeoJSON: selectedFilterLayer.value.filterLayerData,
                targetLayerSourceType: props.layer.type
            }
            filterStore.addGeometryFilter(props.layer.id, item).then((response)=>{
                filterStore.populateLayerFilter(response, "AND").then((expression)=> {
                    if (expression.length > 1){
                        mapStore.map.setFilter(props.layer.id, expression)
                    } else {
                        mapStore.map.setFilter(props.layer.id, null)
                    }
                }).catch((error)=>{
                    mapStore.map.setFilter(props.layer.id, null)
                    toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                })
            }).catch((error)=>{
                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
            })
        }
    }
}
/**
Removes any existing geometry filter applied to the layer by
calling the filter store remove method and updating the map filter.
@param {Object} props - The component props
@returns {void}
*/
function removeGeometryFilter(): void{
    filterStore.removeGeometryFilter(props.layer.id).then((response)=>{
        filterStore.populateLayerFilter(response, "AND").then((expression)=>{
            if (expression.length > 1){
                mapStore.map.setFilter(props.layer.id, expression)
            } else {
                mapStore.map.setFilter(props.layer.id, null)
            }
        }).catch((error)=>{ toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 }); })
    }).catch((error)=>{
        mapStore.map.setFilter(props.layer.id, null)
        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
    })
}
</script>

<style scoped></style>
