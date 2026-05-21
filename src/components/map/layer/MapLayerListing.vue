<template>
    <SidebarLayout :id="sidebarID" position="right">
        <div class="w-full" v-if="visibleLayers.length > 0">
            <draggable
                :model-value="visibleLayers"
                item-key="id"
                handle=".layer-drag-handle"
                ghost-class="map-layer-drag-ghost"
                @change="reorderLayer"
            >
                <template #item="{ element }">
                    <div :key="element.id">
                        <MapLayerListingItem :layer="element"></MapLayerListingItem>
                    </div>
                </template>
            </draggable>
        </div>
        <div class="w-full" v-else>
            <InlineMessage class="w-full" severity="info">There is no layer on map</InlineMessage>
        </div>
    </SidebarLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import InlineMessage from "primevue/inlinemessage";
import draggable from "vuedraggable";
// components
import SidebarLayout from "../../base/SidebarLayout.vue";
import MapLayerListingItem from "./MapLayerListingItem.vue";
// JS imports
import { useMapStore } from "../../../store/maplibre/map";
import { SidebarControl } from "../../../core/helpers/sidebarControl"

const mapStore = useMapStore()

const sidebarID = "maplayerListing"

const visibleLayers = computed(() => mapStore.getReorderableVisibleLayersTopToBottom())

function reorderLayer(event: any): void {
    if (event?.moved === undefined || event.moved === null) return;
    const { element, newIndex } = event.moved;
    mapStore.reorderVisibleMapLayer(element.id, newIndex);
}

const iconElement = document.createElement("span")
iconElement.classList.add("material-icons-outlined")
iconElement.textContent = "layers"
const sidebarControl = new SidebarControl("", sidebarID, document.createElement("div"), iconElement)
mapStore.map.addControl(sidebarControl, "top-right")
</script>

<style scoped>
.map-layer-drag-ghost {
    opacity: 0.5;
}
</style>
