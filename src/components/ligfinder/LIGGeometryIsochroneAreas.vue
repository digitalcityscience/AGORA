<template>
    <UCard
        class="min-w-0 w-full"
        variant="subtle"
        :ui="{ header: 'p-3 pb-2', body: 'min-w-0 p-3 pt-1' }"
    >
        <template #header>
            <div class="text-sm font-semibold text-highlighted">{{ $t("ligfinder.filter.geometry.isochrone.title") }}</div>
        </template>
        <div class="min-w-0 space-y-3">
            <div v-if="geometry.selectedIsochrone.length > 0" class="flex min-w-0 flex-wrap gap-1">
                <ChipWrapper
                    v-for="(isochrone, index) in geometry.selectedIsochrone"
                    :key="index"
                    :label="String(isochrone.properties?.name ?? 'Isochrone')"
                    severity="secondary"
                    removable
                    @remove="geometry.removeSelectedIsochrone"
                />
            </div>

            <UButton
                v-if="!geometry.selectionOnProgress"
                block
                size="sm"
                :label="$t('ligfinder.filter.geometry.isochrone.selectCenter')"
                @click="geometry.startCenterSelection"
            />
            <UButton
                v-else
                block
                color="neutral"
                variant="outline"
                size="sm"
                :label="$t('ligfinder.filter.geometry.isochrone.cancelCenter')"
                @click="geometry.cancelCenterSelection"
            />

            <URadioGroup
                v-model="selectedTravelMode"
                class="w-full"
                :legend="$t('ligfinder.filter.geometry.isochrone.travelMode')"
                :items="travelModeItems"
                value-key="value"
                variant="card"
                orientation="horizontal"
                size="sm"
                :ui="{ fieldset: 'flex flex-wrap gap-2', item: 'min-w-0 flex-1 basis-24' }"
            />

            <UFormField :label="$t('ligfinder.filter.geometry.isochrone.travelTime')" size="sm">
                <UInputNumber
                    v-model="geometry.travelTime"
                    class="w-full"
                    :increment="false"
                    :decrement="false"
                    :min="0"
                />
            </UFormField>

            <UButton
                block
                size="sm"
                :disabled="geometry.centerPoint === undefined || geometry.travelTime <= 0"
                :label="$t('ligfinder.filter.geometry.isochrone.create')"
                @click="geometry.createIsochrone"
            />

            <div v-if="geometry.isochroneOnTheMap && geometry.isochroneOnTheMapData" class="isochrone-actions">
                <UButton
                    block
                    size="sm"
                    :label="$t('ligfinder.filter.geometry.isochrone.add')"
                    @click="geometry.addSelectedIsochrone(geometry.isochroneOnTheMapData)"
                />
                <UButton
                    block
                    color="neutral"
                    variant="outline"
                    size="sm"
                    :label="$t('ligfinder.filter.geometry.isochrone.cancel')"
                    @click="geometry.cancelIsochroneSelection"
                />
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ChipWrapper from "../base/ChipWrapper.vue";
import { useGeometryStore, type TravelModes } from "../../store/ligfinder/geometry";

const geometry = useGeometryStore();
const { t } = useI18n();
const selectedTravelMode = computed<TravelModes>({
    get: () => geometry.selectedTravelMode.value,
    set: (value) => {
        const mode = geometry.traveModeList.find((item) => item.value === value);
        if (mode !== undefined) geometry.selectedTravelMode = mode;
    },
});
const travelModeItems = computed(() => geometry.traveModeList.map((mode) => ({
    label: t(`ligfinder.filter.geometry.isochrone.${mode.name}`),
    value: mode.value,
})));
</script>

<style scoped>
.isochrone-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: 0.5rem;
}
</style>
