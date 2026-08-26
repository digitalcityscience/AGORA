<template>
    <BaseSlideoverSidebarComponent :id="sidebarID" side="right" :collapsed="true">
        <template #header>
            <span>{{ $t('map.sideFrame.layers') }}</span>
        </template>
        <div class="w-full space-y-2" v-if="visibleLayers.length > 0">
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
            <UAlert
                class="w-full"
                color="info"
                variant="soft"
                icon="i-lucide-info"
                :description="$t('mapLayers.noLayers')"
            />
        </div>
    </BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import draggable from "vuedraggable";
// components
import BaseSlideoverSidebarComponent from "../../base/BaseSlideoverSidebarComponent.vue";
import MapLayerListingItem from "./MapLayerListingItem.vue";
// JS imports
import { useMapStore } from "../../../store/maplibre/map";

const mapStore = useMapStore()

const sidebarID = "maplayerListing"

const visibleLayers = computed(() => mapStore.getReorderableVisibleLayersTopToBottom())

function reorderLayer(event: any): void {
    if (event?.moved === undefined || event.moved === null) return;
    const { element, newIndex } = event.moved;
    mapStore.reorderVisibleMapLayer(element.id, newIndex);
}

</script>

<style scoped>
.map-layer-drag-ghost {
    opacity: 0.5;
}
</style>
