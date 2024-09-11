<template>
    <div>
        <Popover ref="op" :dismissable="false" :close-on-escape="false">
            <div class="flex flex-col min-w-72">
                <div class="w-full">
                    <Card>
                        <template #title>Create</template>
                        <template #subtitle>Select a mode and start drawing</template>
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
                                    <span v-if="!(drawTool.drawOnProgress || drawTool.editOnProgress)">Start Drawing</span>
                                    <span v-else>Continue</span>
                                </Button>
                                <Button size="small" v-if="(drawTool.drawOnProgress || drawTool.editOnProgress)" :disabled="!(drawTool.drawOnProgress || drawTool.editOnProgress)" @click="drawTool.stopDrawMode">Cancel</Button>
                            </div>
                        </template>
                    </Card>
                </div>
                <div class="w-full pt-1">
                    <Card>
                        <template #title>Edit</template>
                        <template #subtitle>Edit your drawings</template>
                        <template #content>
                            <Button size="small" :disabled="!drawTool.drawOnProgress" @click="drawTool.editMode">Edit</Button>
                        </template>
                    </Card>
                </div>
                <div class="w-full pt-1">
                    <Card v-if="drawTool.drawOnProgress || drawTool.editOnProgress">
                        <template #title>Save</template>
                        <template #subtitle>Save your drawing as a Layer</template>
                        <template #content>
                            <InputText v-model="drawTool.layerName" placeholder="Layer Name"></InputText>
                        </template>
                        <template #footer>
                            <Button size="small" @click="drawTool.saveAsLayer" :disabled="drawTool.layerName.length === 0">Add Layer</Button>
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
import { useDrawStore } from "../store/draw"
import { useMapStore } from "../store/map";
import { DrawControl } from "../core/helpers/drawControl";
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
