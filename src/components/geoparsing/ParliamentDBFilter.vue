<template>
    <div class="py-1">
        <div class="py-1">
            <label for="start-date">Start Date:</label>
            <DatePicker id="start-date" v-model="startDate" :min-date="minDate" :max-date="new Date()" dateFormat="dd/mm/yy" showIcon fluid iconDisplay="input"/>
        </div>
        <div class="py-1">
            <label for="end-date">End Date:</label>
            <DatePicker id="end-date" v-model="endDate" :max-date="maxDate" dateFormat="dd/mm/yy" showIcon fluid iconDisplay="input"/>
        </div>
        <div class="py-1">
            <label for="topic-list">Topics:</label>
            <Listbox id="topic-list" v-model="selectedTopics" :options="topics" optionLabel="name" multiple listStyle="max-height:150px">
                <template #option="slotProps">
                    <div class="flex items-center">
                        <div>{{ $t(`geoparsing.parliament.topics.${slotProps.option.name}`) }}</div>
                    </div>
                </template>
            </Listbox>
        </div>
        <div class="filter-control">
                <div class="relation-control w-full flex flex-row ml-auto py-2 justify-between">
                    <span class="self-center" v-if="relationType==='AND'">{{ $t("mapLayers.attributeFiltering.matchAll") }}</span>
                    <span class="self-center" v-else>{{ $t("mapLayers.attributeFiltering.matchAny") }}</span>
                    <SelectButton v-model="relationType" :options="relationList" :allow-empty="false"></SelectButton>
                </div>
            </div>
        <div class="py-1 w-full flex justify-between">
            <Button size="small" @click="applyFilters">Apply Filters</Button>
            <Button size="small" @click="clearFilters">Clear Filters</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import DatePicker from "primevue/datepicker";
import Listbox from "primevue/listbox";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import { computed, ref } from "vue";
import { useMapStore, type LayerObjectWithAttributes } from "../../store/map";
import { type RelationTypes } from "../../store/filter";

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
const selectedTopics = ref<Topic[]>([
    { name: "info_table_pdfs_baugb", value: "info_table_pdfs_baugb" },
    { name: "info_table_pdfs_hafenbahn", value: "info_table_pdfs_hafenbahn" },
    { name: "info_table_pdfs_hauptbahnhof", value: "info_table_pdfs_hauptbahnhof" },
    { name: "info_table_pdfs_reeperbahn", value: "info_table_pdfs_reeperbahn" },
    { name: "info_table_pdfs_stadtentwicklung", value: "info_table_pdfs_stadtentwicklung" },
    { name: "info_table_pdfs_baulandmobilisierung", value: "info_table_pdfs_baulandmobilisierung" },
    { name: "info_table_pdfs_busbeschleunigungsprogramm", value: "info_table_pdfs_busbeschleunigungsprogramm" },
    { name: "info_table_pdfs_entwicklungsplan", value: "info_table_pdfs_entwicklungsplan" },
    { name: "info_table_pdfs_finanzbehörde", value: "info_table_pdfs_finanzbehörde" },
    { name: "info_table_pdfs_erbbaurechts", value: "info_table_pdfs_erbbaurechts" },
    { name: "info_table_pdfs_fernwärme", value: "info_table_pdfs_fernwärme" },
    { name: "info_table_pdfs_hochwasser", value: "info_table_pdfs_hochwasser" },
    { name: "info_table_pdfs_immobilien", value: "info_table_pdfs_immobilien" },
    { name: "info_table_pdfs_denkmalschutz", value: "info_table_pdfs_denkmalschutz" },
    { name: "info_table_pdfs_bildung", value: "info_table_pdfs_bildung" },
    { name: "info_table_pdfs_verkehr", value: "info_table_pdfs_verkehr" },
    { name: "info_table_pdfs_stadtgrün", value: "info_table_pdfs_stadtgrün" },
    { name: "info_table_pdfs_wohnungsbau", value: "info_table_pdfs_wohnungsbau" },
    { name: "info_table_pdfs_erholung", value: "info_table_pdfs_erholung" },
    { name: "info_table_pdfs_grundvermögen", value: "info_table_pdfs_grundvermögen" },
    { name: "info_table_pdfs_vorkaufsrecht", value: "info_table_pdfs_vorkaufsrecht" },
    { name: "hafenentwicklungsgesetz", value: "hafenentwicklungsgesetz" }
])
interface Topic {
    name: string;
    value: string;
}
const topics = [
    { name: "info_table_pdfs_baugb", value: "info_table_pdfs_baugb" },
    { name: "info_table_pdfs_hafenbahn", value: "info_table_pdfs_hafenbahn" },
    { name: "info_table_pdfs_hauptbahnhof", value: "info_table_pdfs_hauptbahnhof" },
    { name: "info_table_pdfs_reeperbahn", value: "info_table_pdfs_reeperbahn" },
    { name: "info_table_pdfs_stadtentwicklung", value: "info_table_pdfs_stadtentwicklung" },
    { name: "info_table_pdfs_baulandmobilisierung", value: "info_table_pdfs_baulandmobilisierung" },
    { name: "info_table_pdfs_busbeschleunigungsprogramm", value: "info_table_pdfs_busbeschleunigungsprogramm" },
    { name: "info_table_pdfs_entwicklungsplan", value: "info_table_pdfs_entwicklungsplan" },
    { name: "info_table_pdfs_finanzbehörde", value: "info_table_pdfs_finanzbehörde" },
    { name: "info_table_pdfs_erbbaurechts", value: "info_table_pdfs_erbbaurechts" },
    { name: "info_table_pdfs_fernwärme", value: "info_table_pdfs_fernwärme" },
    { name: "info_table_pdfs_hochwasser", value: "info_table_pdfs_hochwasser" },
    { name: "info_table_pdfs_immobilien", value: "info_table_pdfs_immobilien" },
    { name: "info_table_pdfs_denkmalschutz", value: "info_table_pdfs_denkmalschutz" },
    { name: "info_table_pdfs_bildung", value: "info_table_pdfs_bildung" },
    { name: "info_table_pdfs_verkehr", value: "info_table_pdfs_verkehr" },
    { name: "info_table_pdfs_stadtgrün", value: "info_table_pdfs_stadtgrün" },
    { name: "info_table_pdfs_wohnungsbau", value: "info_table_pdfs_wohnungsbau" },
    { name: "info_table_pdfs_erholung", value: "info_table_pdfs_erholung" },
    { name: "info_table_pdfs_grundvermögen", value: "info_table_pdfs_grundvermögen" },
    { name: "info_table_pdfs_vorkaufsrecht", value: "info_table_pdfs_vorkaufsrecht" },
    { name: "hafenentwicklungsgesetz", value: "hafenentwicklungsgesetz" }
]

const relationList = ["AND", "OR"]
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
            ? selectedTopics.value.some((topic) => {
                return feature.properties![topic.value] === true;
            })
            : selectedTopics.value.every((topic) => {
                return feature.properties![topic.value] === true;
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
    selectedTopics.value = topics
    relationType.value = "OR"
    startDate.value = null
    endDate.value = null
}
</script>

<style scoped>

</style>
