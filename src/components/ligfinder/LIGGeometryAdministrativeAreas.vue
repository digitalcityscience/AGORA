<template>
    <UCard
        class="min-w-0 w-full"
        variant="subtle"
        :ui="{ header: 'p-3 pb-2', body: 'min-w-0 p-3 pt-1' }"
    >
        <template #header>
            <div class="text-sm font-semibold text-highlighted">
                {{ $t("ligfinder.filter.geometry.administrative.title") }}
            </div>
        </template>

        <div class="min-w-0 space-y-2">
            <div v-if="geometry.selectedAdministrativeFeaturesList.length > 0" class="flex min-w-0 flex-wrap gap-1">
                <ChipWrapper
                    v-for="feature in geometry.selectedAdministrativeFeaturesList"
                    :key="`${feature.name}-${feature.data.properties?.name}`"
                    :label="`${feature.name}-${feature.data.properties?.name}`"
                    severity="secondary"
                    removable
                    @remove="removeFromSelectedGeometries(feature)"
                />
            </div>

            <div class="flex min-w-0 gap-1">
                <USelect
                    v-model="activeAdministrativeAreaId"
                    class="min-w-0 flex-1"
                    :items="administrativeAreaOptions"
                    :placeholder="$t('helpers.dropdownSelect')"
                    :aria-label="$t('ligfinder.filter.geometry.administrative.title')"
                />
                <UButton
                    v-if="activeAdministrativeAreaId !== undefined"
                    class="shrink-0"
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    square
                    :aria-label="$t('common.clear')"
                    @click="activeAdministrativeAreaId = undefined"
                />
            </div>

            <div v-if="geometry.activeAdministrativeArea" class="min-w-0 space-y-2">
                <UInput
                    v-model="administrativeSearch"
                    class="w-full"
                    :placeholder="$t('ligfinder.filter.geometry.administrative.search')"
                    :aria-label="$t('ligfinder.filter.geometry.administrative.search')"
                />
                <div class="max-h-72 min-w-0 overflow-auto rounded-md border border-muted">
                    <UTable
                        :data="filteredAdministrativeFeatures"
                        :columns="administrativeColumns"
                        class="min-w-0 w-full"
                        :ui="{ th: 'hidden', td: 'min-w-0 px-2 py-1.5 whitespace-normal' }"
                    >
                        <template #name-cell="{ row }">
                            <span class="break-words text-sm">{{ row.original.data.properties?.name }}</span>
                        </template>
                        <template #actions-cell="{ row }">
                            <div class="flex justify-end">
                                <UButton
                                    icon="i-lucide-plus"
                                    color="primary"
                                    variant="ghost"
                                    size="xs"
                                    square
                                    :aria-label="$t('ligfinder.filter.geometry.administrative.add')"
                                    @click="addToSelectedGeometries(row.original)"
                                />
                            </div>
                        </template>
                    </UTable>
                </div>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { computed, onMounted, ref } from "vue";
import ChipWrapper from "../base/ChipWrapper.vue";
import {
    type AdministrativeFeature,
    useGeometryStore,
} from "../../store/ligfinder/geometry";

const geometry = useGeometryStore();
const administrativeSearch = ref("");
const administrativeColumns: TableColumn<AdministrativeFeature>[] = [
    { id: "name" },
    { id: "actions" },
];
const administrativeAreaOptions = computed(() => geometry.administrativeBoundariesList?.map((area) => ({
    label: area.name,
    value: area.id,
})) ?? []);
const activeAdministrativeAreaId = computed<number | undefined>({
    get: () => geometry.activeAdministrativeArea?.id,
    set: (id) => {
        geometry.activeAdministrativeArea = id === undefined
            ? null
            : geometry.administrativeBoundariesList?.find((area) => area.id === id) ?? null;
        geometry.changeActiveAdminLayerOnMap();
    },
});
const activeAdministrativeAreaFeatures = computed<AdministrativeFeature[]>(() => {
    if (geometry.activeAdministrativeArea == null) return [];
    const activeData = geometry.administrativeDataList.find((item) => item.table_name === geometry.activeAdministrativeArea?.table_name);
    if (activeData === undefined) return [];
    return activeData.data.features
        .map((feature) => ({
            data: { ...feature },
            id: geometry.activeAdministrativeArea!.id,
            name: geometry.activeAdministrativeArea!.name,
            table_name: geometry.activeAdministrativeArea!.table_name,
        }))
        .sort((a, b) => String(a.data.properties?.name ?? "").localeCompare(String(b.data.properties?.name ?? "")));
});
const filteredAdministrativeFeatures = computed(() => {
    const search = administrativeSearch.value.trim().toLocaleLowerCase();
    if (search === "") return activeAdministrativeAreaFeatures.value;
    return activeAdministrativeAreaFeatures.value.filter((feature) => String(feature.data.properties?.name ?? "")
        .toLocaleLowerCase()
        .includes(search));
});

onMounted(() => {
    if ((geometry.administrativeBoundariesList?.length ?? 0) > 0) return;
    geometry.getAdministrativeBoundariesList().then((list) => {
        if (list.data.length === 0 || geometry.administrativeDataList.length === list.data.length) return;
        geometry.administrativeBoundariesList = [...list.data];
        list.data.forEach((item) => {
            geometry.getAdministrativeBoundaryData(item.id).then((boundaryData) => {
                geometry.administrativeDataList.push({ ...item, data: boundaryData });
            }).catch((error) => { console.error(error); });
        });
    }).catch((error) => { console.error(error); });
});

function addToSelectedGeometries(data: AdministrativeFeature): void {
    try {
        geometry.addToselectedAdministrativeFeaturesList(data);
    } catch (error) {
        console.error(error);
    }
}

function removeFromSelectedGeometries(data: AdministrativeFeature): void {
    try {
        geometry.removeFromSelectedAdministrativeFeaturesList(data);
    } catch (error) {
        console.error(error);
    }
}
</script>
