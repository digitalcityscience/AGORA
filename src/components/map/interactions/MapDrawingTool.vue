<template>
    <div>
        <Popover ref="op" :dismissable="false" :close-on-escape="false">
            <div class="flex flex-col min-w-72">
                <div class="w-full">
                    <Card>
                        <template #title>{{ $t('drawing.createTitle') }}</template>
                        <template #subtitle>{{ $t('drawing.createSubtitle') }}</template>
                        <template #content>
                                <div class="flex justify-between">
                                    <div v-for="draw in drawTool.drawTypes" :key="draw.name" class="flex align-items-center">
                                        <RadioButton :disabled="drawTool.drawOnProgress||drawTool.editOnProgress" v-model="drawTool.drawMode" :inputId="draw.name" :value="draw.name" />
                                        <label :for="draw.name" class="ml-2">{{ draw.mode }}</label>
                                    </div>
                                </div>
                        </template>
                        <template #footer>
                            <div class="w-full flex justify-between">
                                <Button size="small" class="col" @click="drawTool.initDrawMode">
                                    <span v-if="!(drawTool.drawOnProgress || drawTool.editOnProgress)">{{ $t('drawing.start') }}</span>
                                    <span v-else>{{ $t('drawing.continue') }}</span>
                                </Button>
                                <Button size="small" v-if="(drawTool.drawOnProgress || drawTool.editOnProgress)" :disabled="!(drawTool.drawOnProgress || drawTool.editOnProgress)" @click="drawTool.stopDrawMode">{{ $t('drawing.cancel') }}</Button>
                            </div>
                        </template>
                    </Card>
                </div>
                <div class="w-full pt-1">
                    <Card>
                        <template #title>{{ $t('drawing.editTitle') }}</template>
                        <template #subtitle>{{ $t('drawing.editSubtitle') }}</template>
                        <template #content>
                            <Button size="small" :disabled="!drawTool.drawOnProgress" @click="drawTool.editMode">{{ $t('drawing.editButton') }}</Button>
                        </template>
                    </Card>
                </div>
                <div class="w-full pt-1">
                    <Card v-if="drawTool.drawOnProgress || drawTool.editOnProgress">
                        <template #title>{{ $t('drawing.saveTitle') }}</template>
                        <template #subtitle>{{ $t('drawing.saveSubtitle') }}</template>
                        <template #content>
                            <InputText v-model="drawTool.layerName" :placeholder="$t('drawing.layerNamePlaceholder')"></InputText>
                        </template>
                        <template #footer>
                            <Button size="small" @click="drawTool.saveAsLayer" :disabled="drawTool.layerName.length === 0">{{ $t('drawing.addLayer') }}</Button>
                        </template>
                    </Card>
                </div>
            </div>
        </Popover>
    </div>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import RadioButton from "primevue/radiobutton";
import Popover from "primevue/popover";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { useDrawStore } from "../../../store/maplibre/draw";
import { useMapStore } from "../../../store/maplibre/map";
import { DrawControl } from "../../../core/helpers/drawControl";
const mapStore = useMapStore()
const drawTool = useDrawStore()
// Overlay Panel operations
const op = ref()
function toggle(event: Event): void {
    op.value.toggle(event)
}

// Terradraw operations
const drawControl = new DrawControl(toggle)
if (mapStore.map !== null || mapStore.map !== undefined) {
    mapStore.map.addControl(drawControl, "top-right")
}
</script>

<style scoped></style>
