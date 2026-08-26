<template>
    <div class="flex min-w-0 flex-col gap-3">
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <span class="text-sm text-muted">
                {{ $t("ligfinder.table.count", [`${filterResultTableItems.length}`]) }}
            </span>
            <div class="flex flex-wrap items-center gap-2">
                <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    :label="$t('ligfinder.table.zoomToResults')"
                    @click="$emit('zoom')"
                />
                <UButton
                    v-if="showExpand"
                    icon="i-lucide-expand"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="$t('ligfinder.table.expand')"
                    @click="$emit('expand')"
                />
            </div>
        </div>

        <section v-if="resultStore.lastAppliedFilter" class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ $t("ligfinder.table.summary.title") }}
            </h2>
            <div class="flex min-w-0 flex-wrap gap-2">
                <UBadge
                    v-for="(criteria, index) in resultStore.lastAppliedFilter.criteria"
                    :key="`criteria-${index}`"
                    color="primary"
                    variant="subtle"
                    class="max-w-full whitespace-normal"
                >
                    {{ criteria.status === "included"
                        ? $t("ligfinder.table.summary.included", [criteria.data.label])
                        : $t("ligfinder.table.summary.excluded", [criteria.data.label]) }}
                </UBadge>
                <UBadge
                    v-for="(metric, index) in resultStore.lastAppliedFilter.metric"
                    :key="`metric-${index}`"
                    color="primary"
                    variant="subtle"
                    class="max-w-full whitespace-normal"
                >
                    {{ $t(`ligfinder.filter.metrics.labels.${metric.column}`) }}
                    {{ $t(`helpers.filterNames.${metric.operation}`) }}
                    {{ metric.value }}
                </UBadge>
                <UBadge
                    v-if="resultStore.lastAppliedFilter.geometry.length > 0"
                    color="primary"
                    variant="subtle"
                    class="max-w-full whitespace-normal"
                >
                    {{ $t("ligfinder.table.summary.geometry") }}
                </UBadge>
            </div>
        </section>

        <UAccordion
            :items="filterAccordionItems"
            :unmount-on-hide="false"
            :ui="{
                root: 'rounded-lg border border-default px-3',
                trigger: 'py-2 text-sm',
                content: 'pb-3',
            }"
        >
            <template #body>
                <div class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
                    <UFormField
                        v-for="column in filterableColumns"
                        :key="column.key"
                        :label="column.label"
                        size="sm"
                    >
                        <UInput
                            v-model="filterValues[column.key]"
                            class="w-full"
                            :type="column.numeric ? 'number' : 'search'"
                            :placeholder="$t('ligfinder.table.searchByColumn', { column: column.label })"
                        />
                    </UFormField>
                </div>
                <div class="mt-3 flex justify-end">
                    <UButton
                        color="neutral"
                        variant="soft"
                        size="sm"
                        :label="$t('ligfinder.table.clearFilters')"
                        :disabled="!hasActiveFilters"
                        @click="clearFilters"
                    />
                </div>
            </template>
        </UAccordion>

        <div class="min-w-0 overflow-hidden rounded-lg border border-default">
            <UTable
                v-model:pagination="pagination"
                :data="filteredRows"
                :columns="columns"
                :pagination-options="paginationOptions"
                sticky="header"
                class="max-h-[min(56dvh,38rem)] w-full"
                :ui="{
                    th: 'px-3 py-2 whitespace-nowrap',
                    td: 'px-3 py-2',
                }"
            >
                <template #focus-cell="{ row }">
                    <UButton
                        icon="i-lucide-search"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        :aria-label="$t('ligfinder.table.focusParcel')"
                        @click="$emit('focus', row.original)"
                    />
                </template>
                <template #empty>
                    {{ $t("ligfinder.table.noResults") }}
                </template>
            </UTable>
        </div>

        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <UFormField :label="$t('ligfinder.table.rowsPerPage')" size="sm" orientation="horizontal">
                <USelect v-model="pagination.pageSize" :items="pageSizeOptions" class="w-20" />
            </UFormField>
            <UPagination
                :page="pagination.pageIndex + 1"
                :items-per-page="pagination.pageSize"
                :total="filteredRows.length"
                size="sm"
                @update:page="pagination.pageIndex = $event - 1"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, h, reactive, ref, resolveComponent, watch } from "vue";
import { getPaginationRowModel, type PaginationState } from "@tanstack/vue-table";
import type { TableColumn } from "@nuxt/ui";
import type { Feature } from "geojson";
import { useI18n } from "vue-i18n";
import { formatNumber } from "../../core/helpers/functions";
import { useResultStore } from "../../store/ligfinder/result";

defineProps<{
    showExpand?: boolean;
}>();

defineEmits<{
    expand: [];
    focus: [parcel: Feature];
    zoom: [];
}>();

interface ResultColumn {
    key: string;
    label: string;
    numeric: boolean;
    sortable: boolean;
}

const UButton = resolveComponent("UButton");
const { t } = useI18n();
const resultStore = useResultStore();
const filterValues = reactive<Record<string, string>>({});
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 });
const paginationOptions = { getPaginationRowModel: getPaginationRowModel() };
const pageSizeOptions = [10, 20, 50];

const filterResultTableItems = computed<Feature[]>(() => resultStore.appliedFilterResult?.features ?? []);

const resultColumns = computed<ResultColumn[]>(() => {
    if (resultStore.attributeList.length > 0) {
        return orderParcelColumnFirst(resultStore.attributeList)
            .filter(column => !isHidden(column.name))
            .map(column => ({
                key: column.name,
                label: getHeaderText(column.name),
                numeric: column.binding !== "java.lang.String",
                sortable: column.name === "Shape_Area",
            }));
    }

    return orderParcelColumnFirst(resultStore.tableHeaders).map(column => ({
        key: column.value,
        label: getHeaderText(column.value, column.text),
        numeric: column.value !== "flurst_nr" && column.value !== "xplanung_id" && column.value !== "bezname",
        sortable: column.value === "Shape_Area",
    }));
});

const filterableColumns = computed(() => resultColumns.value);
const hasActiveFilters = computed(() => Object.values(filterValues).some(value => value.trim().length > 0));
const filterAccordionItems = computed(() => [{
    label: t("ligfinder.table.filters"),
    value: "filters",
    slot: "body",
}]);

const filteredRows = computed(() => filterResultTableItems.value.filter((row) => {
    return resultColumns.value.every((column) => {
        const filter = filterValues[column.key]?.trim();
        if (!filter) return true;

        const value = row.properties?.[column.key];
        if (column.numeric) {
            const maximum = Number(filter);
            const numericValue = Number(value);
            return Number.isFinite(maximum) && Number.isFinite(numericValue) && numericValue < maximum;
        }

        return String(value ?? "").toLocaleLowerCase().includes(filter.toLocaleLowerCase());
    });
}));

const columns = computed<TableColumn<Feature>[]>(() => [
    {
        id: "focus",
        header: t("ligfinder.table.focus"),
        enableSorting: false,
    },
    ...resultColumns.value.map((resultColumn): TableColumn<Feature> => ({
        id: resultColumn.key,
        accessorFn: row => row.properties?.[resultColumn.key],
        enableSorting: resultColumn.sortable,
        header: resultColumn.sortable
            ? ({ column }) => h(UButton, {
                color: "neutral",
                variant: "ghost",
                size: "xs",
                label: `${resultColumn.label}${column.getIsSorted() === "asc" ? " ↑" : column.getIsSorted() === "desc" ? " ↓" : ""}`,
                onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
            })
            : resultColumn.label,
        cell: ({ row }) => {
            const value = row.original.properties?.[resultColumn.key];
            return resultColumn.numeric && value != null ? formatNumber(Number(value)) : String(value ?? "");
        },
    })),
]);

watch(filterValues, resetPage, { deep: true });
watch(() => pagination.value.pageSize, resetPage);

function orderParcelColumnFirst<T extends { name?: string; value?: string }>(source: T[]): T[] {
    const columnsToOrder = [...source];
    const parcelIndex = columnsToOrder.findIndex(column => (column.name ?? column.value) === "flurst_nr");
    if (parcelIndex > 0) {
        const [parcelColumn] = columnsToOrder.splice(parcelIndex, 1);
        if (parcelColumn) columnsToOrder.unshift(parcelColumn);
    }
    return columnsToOrder;
}

function getHeaderText(attributeName: string, fallback = attributeName): string {
    const key = `ligfinder.table.headers.${attributeName}`;
    const translated = t(key);
    return key === translated ? fallback : translated;
}

function isHidden(attributeName: string): boolean {
    const key = `ligfinder.table.headers.${attributeName}`;
    return t(key) === key;
}

function clearFilters(): void {
    Object.keys(filterValues).forEach((key) => {
        filterValues[key] = "";
    });
}

function resetPage(): void {
    pagination.value.pageIndex = 0;
}
</script>
