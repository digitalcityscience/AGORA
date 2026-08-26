<template>
    <BaseSlideoverSidebarComponent
        :id="sidebarID"
        side="left"
        :collapsed="false"
        width-class="w-[min(33rem,34vw)]"
    >
        <template #header>
            <span>{{ $t("ligfinder.title") }}</span>
        </template>

        <div class="min-w-0 w-full space-y-2">
            <LIGParcelSyleSelection />
            <LIGCriteriaFilter />
            <LIGMetricsFilter />
            <LIGGRZFilter />
            <LIGGeometryFilter />
            <LIGParcelMaximizer />
        </div>

        <template #footer>
            <div class="grid w-full grid-cols-2 gap-3 py-1">
                <UButton
                    block
                    :label="$t('ligfinder.filter.apply')"
                    :loading="ligFilterStore.isFilterApplying"
                    @click="applier"
                />
                <UButton
                    block
                    color="error"
                    variant="soft"
                    :label="$t('ligfinder.filter.reset')"
                    @click="resetAppliedFilters"
                />
                <UButton
                    v-if="resultStore.isFilterApplied"
                    block
                    class="col-span-2"
                    color="neutral"
                    variant="outline"
                    :label="$t('ligfinder.filter.getTable')"
                    :loading="isTableDataLoading"
                    @click="getTable"
                />
            </div>
        </template>
    </BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "@nuxt/ui/composables";
import BaseSlideoverSidebarComponent from "../base/BaseSlideoverSidebarComponent.vue";
import { useLigfinderMainStore } from "../../store/ligfinder/main";
import { useResultStore } from "../../store/ligfinder/result";
import { useParcelStore } from "../../store/ligfinder/parcel";
import { useFeatureInspectorStore } from "../../store/maplibre/featureInspector";
import {
    closeSlideoverSidebar,
    openSlideoverSidebar,
} from "../../core/helpers/slideoverSidebarRegistry";

const LIGGeometryFilter = defineAsyncComponent(async () => await import("./LIGGeometryFilter.vue"));
const LIGCriteriaFilter = defineAsyncComponent(async () => await import("./LIGCriteriaFilter.vue"));
const LIGMetricsFilter = defineAsyncComponent(async () => await import("./LIGMetricsFilter.vue"));
const LIGGRZFilter = defineAsyncComponent(async () => await import("./LIGGRZFilter.vue"));
const LIGParcelSyleSelection = defineAsyncComponent(async () => await import("./LIGParcelSyleSelection.vue"));
const LIGParcelMaximizer = defineAsyncComponent(async () => await import("./LIGParcelMaximizer.vue"));

const toast = useToast();
const { t } = useI18n();
const resultStore = useResultStore();
const ligFilterStore = useLigfinderMainStore();
const parcelStore = useParcelStore();
const featureInspectorStore = useFeatureInspectorStore();
const sidebarID = "ligfinder-sidebar";
const isTableDataLoading = ref(false);

function applier(): void {
    featureInspectorStore.dismiss();
    ligFilterStore.applyAllFilters(String(import.meta.env.VITE_PARCEL_DATASET_LAYERNAME)).then(() => {
        resultStore.isFilterApplied = true;
        resultStore.lastAppliedFilter = resultStore.createAppliedFilterBody();
        if (parcelStore.maximizedParcelsOnMap) {
            parcelStore.cancelTempMaximizedParcels(false, false);
        }
        if (ligFilterStore.isMaximizerActive) {
            void parcelStore.getResults();
        }
        closeSlideoverSidebar("ligfinder-result-table");
    }).catch((error) => {
        console.error(error);
        showError(error);
    });
}

function resetAppliedFilters(): void {
    featureInspectorStore.dismiss();
    ligFilterStore.resetFilters();
    resultStore.resetResultInfo();
}

function getTable(): void {
    featureInspectorStore.dismiss();
    isTableDataLoading.value = true;
    resultStore.fetchAppliedFilterResult().then((response) => {
        resultStore.appliedFilterResult = response;
        openSlideoverSidebar("ligfinder-result-table");
    }).catch((error) => {
        console.error(error);
        showError(error);
    }).finally(() => {
        isTableDataLoading.value = false;
    });
}

function showError(error: unknown): void {
    toast.add({
        title: t("common.error"),
        description: error instanceof Error ? error.message : String(error),
        color: "error",
        duration: 10000,
    });
}
</script>
