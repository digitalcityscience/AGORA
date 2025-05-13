<template>
    <div class="py-1">
        <Panel @update:collapsed="collapsedState" :collapsed="true" toggleable>
            <template #toggleicon="slotProps">
                <i v-if="slotProps.collapsed" class="pi pi-chevron-up"></i>
                <i v-else class="pi pi-chevron-down"></i>
            </template>
            <template #header>
                <ToggleSwitch v-model="checked" @update:model-value="changeLayerVisibility"></ToggleSwitch>
                <h3 class="capitalize mr-auto ml-2">{{ props.layer.displayName ?? props.layer.source.replaceAll("_", " ") }}</h3>
                <Button class="w-8 h-8 p-0 mr-1" icon="pi pi-trash" severity="danger" text rounded aria-label="Delete"
                    @click="confirmDialogVisibility = true"></Button>
                <Dialog v-model:visible="confirmDialogVisibility" modal header="Delete Map Layer" :style="{ width: '25rem' }">
                    <span class="p-text-secondary block mb-5">{{ $t("mapLayers.actions.deleteQuestion",[props.layer.displayName ?? props.layer.source.replaceAll("_", " ")])}}</span>
                    <div class="flex justify-content-end gap-2">
                        <Button size="small" type="button" label="Cancel" severity="secondary" @click="confirmDialogVisibility = false">{{ $t("mapLayers.actions.cancel") }}</Button>
                        <Button size="small" type="button" label="Delete" severity="danger" @click="deleteLayerConfirmation(props.layer)">{{ $t("mapLayers.actions.delete") }}</Button>
                    </div>
                </Dialog>
            </template>
            <div>
                <label v-if="!(props.layer.clustered !== undefined && props.layer.clustered || typeof mapStore.map.getPaintProperty(props.layer.id, props.layer.type ==='circle' ? 'circle-color' : props.layer.type === 'fill' ? 'fill-color' : 'line-color') !== 'string')" class="flex w-full leading-none pointer-events-none items-baseline">
                    <span class="mt-2 min-w-[25%]">{{ $t("mapLayers.styling.color")}}</span>
                    <ColorPicker aria-label="Change Color" class="pointer-events-auto" format="hex" v-model="color" :baseZIndex="10"
                        @update:model-value="changeLayerColor"></ColorPicker>
                </label>
                <div v-else>
                    <div v-if="(typeof mapStore.map.getPaintProperty(props.layer.id, props.layer.type ==='circle' ? 'circle-color' : props.layer.type === 'fill' ? 'fill-color' : 'line-color') === 'object')">
                        <div class="legend">
                            <MBStyleLegend :mbstyle="mapStore.map.getPaintProperty(props.layer.id, props.layer.type ==='circle' ? 'circle-color' : props.layer.type === 'fill' ? 'fill-color' : 'line-color')"></MBStyleLegend>
                        </div>
                    </div>
                </div>
                <label class="flex w-full leading-none items-center mt-2 pr-1">
                    <span class="mt-2 min-w-[25%]">{{ $t("mapLayers.styling.opacity") }}</span>
                    <Slider aria-label="Change Opacity" class="mt-2 ml-2 flex-grow" v-model="opacity" :step="0.1" :min=0 :max=1
                        @update:model-value="changeLayerOpac" :pt="{
                            range: { style: { 'background': `#${color}` } },
                            handle: { style: { 'background': `#${color}`, 'border-color': `#${color}` } }
                        }" />
                </label>
            </div>
            <div v-if="props.layer.id === 'parliament_database'">
                <ParliamentDBFilter :layer="props.layer"></ParliamentDBFilter>
            </div>
            <div v-else-if="props.layer.id==='ewb_elbe_wochenblatt'">
                <ElbewochenblattDBFilter></ElbewochenblattDBFilter>
            </div>
            <div v-else>
                <div v-if="props.layer.filterLayer == undefined || props.layer.filterLayer === false" class="py-2">
                    <AttributeFiltering :layer="props.layer"></AttributeFiltering>
                    <GeometryFiltering :layer="props.layer"></GeometryFiltering>
                </div>
                <div class="py-1" v-else></div>
            </div>
        </Panel>
    </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { type LayerObjectWithAttributes, useMapStore } from "../store/map"
import Panel from "primevue/panel";
import ColorPicker from "primevue/colorpicker";
import Slider from "primevue/slider";
import ToggleSwitch from "primevue/toggleswitch";
import AttributeFiltering from "./AttributeFiltering.vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { useToast } from "primevue/usetoast"
import { isNullOrEmpty } from "../core/helpers/functions";
import ParliamentDBFilter from "./geoparsing/ParliamentDBFilter.vue";
import ElbewochenblattDBFilter from "./geoparsing/ElbewochenblattDBFilter.vue";
import MBStyleLegend from "./MBStyleLegend.vue";

const GeometryFiltering = defineAsyncComponent(async () => await import("../components/GeometryFiltering.vue"));

export interface Props {
    layer: LayerObjectWithAttributes
}
const props = defineProps<Props>()
const mapStore = useMapStore()
const collapsed = ref<boolean>(true)
const color = ref<string>("000000")
const opacity = ref<number>(1)
const checked = ref<boolean>(true)
onMounted(() => {
    let prop = ""
    let opac = ""
    if (props.layer.type === "circle") {
        prop = "circle-color"
        opac = "circle-opacity"
    }
    if (props.layer.type === "fill") {
        prop = "fill-color"
        opac = "fill-opacity"
    }
    if (props.layer.type === "line") {
        prop = "line-color"
        opac = "line-opacity"
    }
    if (!isNullOrEmpty(mapStore.map.getPaintProperty(props.layer.id, prop))) {
        console.log(`${props.layer.id} upcoming color:`, mapStore.map.getPaintProperty(props.layer.id, prop))
        color.value = ((props.layer.clustered !== undefined && props.layer.clustered) || typeof mapStore.map.getPaintProperty(props.layer.id, prop) !== "string")?"000000":(mapStore.map.getPaintProperty(props.layer.id, prop) as string).substring(1)
        console.log(`${props.layer.id} color:`, color.value)
    }
    if (!isNullOrEmpty(mapStore.map.getPaintProperty(props.layer.id, opac))) {
        opacity.value = mapStore.map.getPaintProperty(props.layer.id, opac)
    }
    if (!isNullOrEmpty(mapStore.map.getLayoutProperty(props.layer.id, "visibility"))){
        if (mapStore.map.getLayoutProperty(props.layer.id, "visibility") === "none"){
            checked.value = false
        }
    }
})
function changeLayerColor(color: any): void {
    let prop = ""
    if (props.layer.type === "circle") {
        prop = "circle-color"
    }
    if (props.layer.type === "fill") {
        prop = "fill-color"
    }
    if (props.layer.type === "line") {
        prop = "line-color"
    }
    mapStore.map.setPaintProperty(props.layer.id, prop, `#${color}`)
}
function changeLayerOpac(layerOpacity: any): void {
    let opac = ""
    if (props.layer.type === "circle") {
        opac = "circle-opacity"
    }
    if (props.layer.type === "fill") {
        opac = "fill-opacity"
    }
    if (props.layer.type === "line") {
        opac = "line-opacity"
    }
    mapStore.map.setPaintProperty(props.layer.id, opac, layerOpacity)
}
function changeLayerVisibility(layerVisibility: boolean): void {
    if (layerVisibility) {
        mapStore.map.setLayoutProperty(props.layer.id, "visibility", "visible")
        if (props.layer.clustered !== undefined && props.layer.clustered){
            mapStore.map.setLayoutProperty(`${props.layer.id}-cluster`, "visibility", "visible")
        }
    } else {
        mapStore.map.setLayoutProperty(props.layer.id, "visibility", "none")
        if (props.layer.clustered !== undefined && props.layer.clustered){
            mapStore.map.setLayoutProperty(`${props.layer.id}-cluster`, "visibility", "none")
        }
    }
}
function collapsedState(isCollapsed: boolean): void {
    collapsed.value = isCollapsed
}
const confirmDialogVisibility = ref<boolean>(false)
const toast = useToast();
function deleteLayerConfirmation(layer: LayerObjectWithAttributes): void {
    mapStore.deleteMapLayer(layer.id).then(()=>{
        if (layer.id === "elbe_wochenblatt"||layer.id === "parliament_database"){
            mapStore.map.removeLayer(`${layer.id}-cluster`)
            mapStore.deleteMapDataSource(layer.source).then(()=>{
                toast.add({ severity: "success", summary: "Deleted", detail: "Layer deleted", life: 3000 });
            }).catch((error)=>{
                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
            })
        } else {
            mapStore.deleteMapDataSource(layer.source).then(()=>{
                toast.add({ severity: "success", summary: "Deleted", detail: "Layer deleted", life: 3000 });
            }).catch((error)=>{
                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
            })
        }
    }).catch((error)=>{
        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
    })
    confirmDialogVisibility.value = false
}
</script>

<style scoped></style>
