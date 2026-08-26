<template>
    <BaseSlideoverSidebarComponent
        :id="sidebarID"
        side="right"
        :collapsed="true"
        width-class="w-[min(24rem,34vw)]"
    >
        <template #header>
            <span>{{ $t("drawing.openTools") }}</span>
        </template>

        <div class="space-y-3">
            <UCard
                :ui="{
                    header: 'p-3',
                    body: 'p-3',
                    footer: 'p-3',
                }"
            >
                <template #header>
                    <h2 class="font-semibold text-highlighted">{{ $t("drawing.createTitle") }}</h2>
                    <p class="text-sm text-muted">{{ $t("drawing.createSubtitle") }}</p>
                </template>

                <URadioGroup
                    v-model="drawTool.drawMode"
                    :items="drawModeItems"
                    value-key="value"
                    orientation="horizontal"
                    variant="card"
                    size="sm"
                    :disabled="drawTool.drawOnProgress || drawTool.editOnProgress"
                    :ui="{
                        fieldset: 'flex-wrap',
                        item: 'min-w-20 flex-1 p-2',
                    }"
                />

                <template #footer>
                    <div class="grid grid-cols-2 gap-2">
                        <UButton
                            block
                            :label="$t(drawTool.drawOnProgress || drawTool.editOnProgress ? 'drawing.continue' : 'drawing.start')"
                            @click="drawTool.initDrawMode"
                        />
                        <UButton
                            block
                            color="neutral"
                            variant="soft"
                            :label="$t('drawing.cancel')"
                            :disabled="!drawTool.drawOnProgress && !drawTool.editOnProgress"
                            @click="drawTool.stopDrawMode"
                        />
                    </div>
                </template>
            </UCard>

            <UCard
                :ui="{
                    header: 'p-3',
                    body: 'p-3',
                }"
            >
                <template #header>
                    <h2 class="font-semibold text-highlighted">{{ $t("drawing.editTitle") }}</h2>
                    <p class="text-sm text-muted">{{ $t("drawing.editSubtitle") }}</p>
                </template>

                <div class="grid grid-cols-2 gap-2">
                    <UButton
                        block
                        color="neutral"
                        variant="soft"
                        :label="$t('drawing.editButton')"
                        :disabled="!drawTool.drawOnProgress"
                        @click="drawTool.editMode"
                    />
                    <UButton
                        block
                        color="error"
                        variant="soft"
                        :label="$t('drawing.deleteSelected')"
                        :disabled="!drawTool.editOnProgress"
                        @click="drawTool.deleteSelectedFeatures"
                    />
                </div>
            </UCard>

            <UCard
                v-if="drawTool.drawOnProgress || drawTool.editOnProgress"
                :ui="{
                    header: 'p-3',
                    body: 'p-3',
                    footer: 'p-3',
                }"
            >
                <template #header>
                    <h2 class="font-semibold text-highlighted">{{ $t("drawing.saveTitle") }}</h2>
                    <p class="text-sm text-muted">{{ $t("drawing.saveSubtitle") }}</p>
                </template>

                <UInput
                    v-model="drawTool.layerName"
                    class="w-full"
                    :placeholder="$t('drawing.layerNamePlaceholder')"
                />

                <template #footer>
                    <UButton
                        block
                        :label="$t('drawing.addLayer')"
                        :disabled="drawTool.layerName.trim().length === 0"
                        @click="drawTool.saveAsLayer"
                    />
                </template>
            </UCard>
        </div>
    </BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDrawStore } from "../../../store/maplibre/draw";
import BaseSlideoverSidebarComponent from "../../base/BaseSlideoverSidebarComponent.vue";

const sidebarID = "map-drawing-tools";
const drawTool = useDrawStore();
const drawModeItems = computed(() => drawTool.drawTypes.map(draw => ({
    label: draw.mode,
    value: draw.name,
})));
</script>
