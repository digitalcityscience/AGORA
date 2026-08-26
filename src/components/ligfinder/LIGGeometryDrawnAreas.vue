<template>
    <UCard
        class="min-w-0 w-full"
        variant="subtle"
        :ui="{ header: 'p-3 pb-2', body: 'min-w-0 p-3 pt-1' }"
    >
        <template #header>
            <div class="text-sm font-semibold text-highlighted">{{ $t("ligfinder.filter.geometry.drawn.title") }}</div>
        </template>
        <div class="min-w-0 space-y-2">
            <div v-if="geometry.selectedDrawnGeometry.length > 0" class="flex min-w-0 flex-wrap gap-1">
                <ChipWrapper
                    v-for="feature in geometry.selectedDrawnGeometry"
                    :key="feature.id"
                    :label="String(feature.properties?.name ?? '')"
                    severity="secondary"
                    removable
                    @remove="removeFromSelectedDrawnGeometries(feature)"
                />
            </div>
            <div class="draw-actions">
                <UButton
                    v-if="!drawTool.drawOnProgress && !drawTool.editOnProgress"
                    block
                    size="sm"
                    :label="$t('ligfinder.filter.geometry.drawn.start')"
                    @click="startDraw"
                />
                <UButton
                    v-if="drawTool.drawOnProgress || drawTool.editOnProgress"
                    block
                    color="neutral"
                    variant="outline"
                    size="sm"
                    :label="$t('ligfinder.filter.geometry.drawn.cancel')"
                    @click="drawTool.stopDrawMode"
                />
                <UButton
                    v-if="drawTool.drawOnProgress && !drawTool.editOnProgress"
                    block
                    color="neutral"
                    variant="soft"
                    size="sm"
                    :label="$t('ligfinder.filter.geometry.drawn.edit')"
                    @click="drawTool.editMode"
                />
                <UButton
                    v-if="drawTool.editOnProgress"
                    block
                    color="neutral"
                    variant="soft"
                    size="sm"
                    :label="$t('ligfinder.filter.geometry.drawn.continue')"
                    @click="startDraw"
                />
                <UButton
                    block
                    size="sm"
                    :disabled="drawTool.drawMode !== 'polygon'"
                    :label="$t('ligfinder.filter.geometry.drawn.add')"
                    @click="addToDrawnArea"
                />
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { Feature } from "geojson";
import ChipWrapper from "../base/ChipWrapper.vue";
import { useDrawStore } from "../../store/maplibre/draw";
import { useGeometryStore } from "../../store/ligfinder/geometry";

const geometry = useGeometryStore();
const drawTool = useDrawStore();
const drawMode = "polygon";

function startDraw(): void {
    drawTool.drawMode = drawMode;
    drawTool.initDrawMode();
}

function addToDrawnArea(): void {
    if (drawMode !== "polygon") return;
    const drawnAreas = drawTool.getSnapshot();
    if (drawnAreas.length === 0) {
        console.error("There is no polygon to add");
        return;
    }
    drawnAreas.forEach((feature) => {
        try {
            geometry.addToSelectedDrawnGeometry(feature);
        } catch (error) {
            console.error(error);
        }
    });
    drawTool.stopDrawMode();
}

function removeFromSelectedDrawnGeometries(item: Feature): void {
    try {
        geometry.removeFromSelectedDrawnGeometry(item);
        geometry.updateSelectedAreasTempLayer();
    } catch (error) {
        console.error(error);
    }
}
</script>

<style scoped>
.draw-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: 0.5rem;
}
</style>
