<template>
    <div class="py-1 space-y-3">
        <div class="py-1">
            <label for="start-date" class="block text-sm mb-1">{{ $t('geoparsing.parliament.startDate') }}:</label>
            <UPopover :ui="{ content: 'z-[80]' }">
                <UButton id="start-date" color="neutral" variant="outline" icon="i-lucide-calendar" block>
                    {{ startDate ? formatDate(startDate) : $t('geoparsing.parliament.startDate') }}
                </UButton>
                <template #content>
                    <UCalendar
                        :model-value="startDateValue"
                        :min-value="minDateValue"
                        :max-value="todayValue"
                        @update:model-value="(value) => startDate = value ? calendarDateToJsDate(value as DateValue) : null"
                    />
                </template>
            </UPopover>
        </div>
        <div class="py-1">
            <label for="end-date" class="block text-sm mb-1">{{ $t('geoparsing.parliament.endDate') }}:</label>
            <UPopover :ui="{ content: 'z-[80]' }">
                <UButton id="end-date" color="neutral" variant="outline" icon="i-lucide-calendar" block>
                    {{ endDate ? formatDate(endDate) : $t('geoparsing.parliament.endDate') }}
                </UButton>
                <template #content>
                    <UCalendar
                        :model-value="endDateValue"
                        :max-value="maxDateValue"
                        @update:model-value="(value) => endDate = value ? calendarDateToJsDate(value as DateValue) : null"
                    />
                </template>
            </UPopover>
        </div>
        <div class="py-1">
            <label for="topic-list" class="block text-sm mb-1">{{ $t('geoparsing.parliament.topicsLabel') }}:</label>
            <USelectMenu
                id="topic-list"
                v-model="selectedTopicNames"
                :items="topicItems"
                value-key="value"
                multiple
                class="w-full"
                :ui="{ content: 'z-[80] max-h-[150px] overflow-y-auto' }"
            />
        </div>
        <div class="filter-control">
                <div class="relation-control w-full flex flex-row ml-auto py-2 justify-between items-center">
                    <span class="self-center" v-if="relationType==='AND'">{{ $t("mapLayers.attributeFiltering.matchAll") }}</span>
                    <span class="self-center" v-else>{{ $t("mapLayers.attributeFiltering.matchAny") }}</span>
                    <UFieldGroup>
                        <UButton
                            :color="relationType==='AND' ? 'primary' : 'neutral'"
                            :variant="relationType==='AND' ? 'solid' : 'outline'"
                            size="sm"
                            @click="relationType = 'AND'"
                        >
                            {{ $t("helpers.logical.and") }}
                        </UButton>
                        <UButton
                            :color="relationType==='OR' ? 'primary' : 'neutral'"
                            :variant="relationType==='OR' ? 'solid' : 'outline'"
                            size="sm"
                            @click="relationType = 'OR'"
                        >
                            {{ $t("helpers.logical.or") }}
                        </UButton>
                    </UFieldGroup>
                </div>
            </div>
        <div class="py-1 w-full flex justify-between">
            <UButton size="sm" @click="applyFilters">{{ $t('geoparsing.parliament.applyFilters') }}</UButton>
            <UButton size="sm" color="neutral" variant="outline" @click="clearFilters">{{ $t('geoparsing.parliament.clearFilters') }}</UButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { type DateValue, fromDate, getLocalTimeZone, toCalendarDate, today } from "@internationalized/date";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useMapStore, type LayerObjectWithAttributes } from "../../store/maplibre/map";
import { type RelationTypes } from "../../store/maplibre/filter";

const { t } = useI18n();
const timeZone = getLocalTimeZone();

function jsDateToCalendarDate(date: Date): DateValue {
    return toCalendarDate(fromDate(date, timeZone));
}
function calendarDateToJsDate(value: DateValue): Date {
    return value.toDate(timeZone);
}
function formatDate(date: Date): string {
    return date.toLocaleDateString("de-DE");
}

export interface Props {
    layer: LayerObjectWithAttributes
}
const mapStore = useMapStore()
const props = defineProps<Props>()
const startDate = ref<Date|null>(null)
const endDate = ref<Date|null>(null)
const dateArray = computed(() => {
    const dateArray: any[] = []
    if (props.layer.filterLayerData === undefined) {
        return dateArray
    }
    props.layer.filterLayerData.features.forEach((feature) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        dateArray.push(new Date(feature.properties!.date))
    })
    const sorted = dateArray.slice()
        .sort(function(a, b) {
            return a - b;
        });
    return sorted
})
const minDate = computed(() => {
    if (dateArray.value.length === 0) {
        return null
    }
    return dateArray.value[0]
})
const maxDate = computed(() => {
    if (dateArray.value.length === 0) {
        return null
    }
    return dateArray.value[dateArray.value.length - 1]
})
const startDateValue = computed(() => startDate.value !== null ? jsDateToCalendarDate(startDate.value) : undefined)
const endDateValue = computed(() => endDate.value !== null ? jsDateToCalendarDate(endDate.value) : undefined)
const minDateValue = computed(() => minDate.value !== null ? jsDateToCalendarDate(minDate.value as Date) : undefined)
const maxDateValue = computed(() => maxDate.value !== null ? jsDateToCalendarDate(maxDate.value as Date) : undefined)
const todayValue = today(timeZone)

const topicNames = [
    "info_table_pdfs_baugb",
    "info_table_pdfs_hafenbahn",
    "info_table_pdfs_hauptbahnhof",
    "info_table_pdfs_reeperbahn",
    "info_table_pdfs_stadtentwicklung",
    "info_table_pdfs_baulandmobilisierung",
    "info_table_pdfs_busbeschleunigungsprogramm",
    "info_table_pdfs_entwicklungsplan",
    "info_table_pdfs_finanzbehörde",
    "info_table_pdfs_erbbaurechts",
    "info_table_pdfs_fernwärme",
    "info_table_pdfs_hochwasser",
    "info_table_pdfs_immobilien",
    "info_table_pdfs_denkmalschutz",
    "info_table_pdfs_bildung",
    "info_table_pdfs_verkehr",
    "info_table_pdfs_stadtgrün",
    "info_table_pdfs_wohnungsbau",
    "info_table_pdfs_erholung",
    "info_table_pdfs_grundvermögen",
    "info_table_pdfs_vorkaufsrecht",
    "hafenentwicklungsgesetz"
]
const topicItems = computed(() => topicNames.map((name) => ({
    label: t(`geoparsing.parliament.topics.${name}`),
    value: name
})))
const selectedTopicNames = ref<string[]>([...topicNames])

const relationType = ref<RelationTypes>("OR")
function applyFilters(): void {
    const features = props.layer.filterLayerData!.features;
    const filteredFeatures = features.filter((feature) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const date = new Date(feature.properties!.date);

        // Date range filtering logic
        const dateInRange = ((startDate.value != null) && (endDate.value != null))
            ? date >= startDate.value && date <= endDate.value
            : (startDate.value != null)
                ? date >= startDate.value
                : (endDate.value != null)
                    ? date <= endDate.value
                    : true; // No date filter applied if both are null

        // Topic filtering logic
        const topicMatches = relationType.value === "OR"
            ? selectedTopicNames.value.some((name) => {
                return feature.properties![name] === true;
            })
            : selectedTopicNames.value.every((name) => {
                return feature.properties![name] === true;
            });

        return dateInRange && topicMatches;
    });

    mapStore.map.getSource(props.layer.id)?.setData({
        type: "FeatureCollection",
        features: filteredFeatures
    });
}
function clearFilters(): void{
    mapStore.map.getSource(props.layer.id)?.setData(props.layer.filterLayerData)
    selectedTopicNames.value = [...topicNames]
    relationType.value = "OR"
    startDate.value = null
    endDate.value = null
}
</script>

<style scoped>

</style>
