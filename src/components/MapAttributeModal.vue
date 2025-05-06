<template>
	<div class="w-full text-base">
		<Card class="w-96 h-72 overflow-y-auto">
			<template v-if="props.features !== undefined" #content>
				<Accordion :multiple="true" :value="[]">
                    <AccordionPanel v-for="(source, index) in Object.entries(mergedFeatures).map(([name, value]) => ({ name, value }))"
                    :key="index" :value="index">
                        <AccordionHeader>
                            <span class="capitalize">{{ createDisplayName(source.name) }}</span>
                        </AccordionHeader>
                        <AccordionContent>
                            <div v-if="source.name==='parliament_database'" class="max-h-60 overflow-y-auto">
                                <div v-for="(feature, ind) in source.value" :key="ind" class="rounded-md mt-1 px-1 first:mt-0 odd:bg-slate-300 even:bg-slate-100">
                                    <Panel class="featurePanel" toggleable :collapsed="true">
                                        <template #toggleicon="slotProps">
                                            <i v-if="slotProps.collapsed" class="pi pi-chevron-up"></i>
                                            <i v-else class="pi pi-chevron-down"></i>
                                        </template>
                                        <template #header>
                                            <span class="panel-title">{{feature.properties.info_table_pdfs_title?.substring(0,30) || ''}}</span>
                                        </template>
                                        <div v-for="(property, i) in Object.entries(feature.properties).map(([name, value]) => ({ name, value }))"
                                            :key="i">
                                            <div class="p-1" v-if="allowedParliamentColumns.findIndex((columnName)=> {return columnName === property.name})>=0">
                                                <p class="font-bold">{{ property.name }}</p>
                                                <span v-if="property.name ==='hyperlink'">
                                                <p class="font-normal italic text-sm">
                                                    <span class="underline" v-html="property.value"></span>
                                                </p>
                                                </span>
                                                <span v-else>
                                                    <p class="font-normal italic text-sm">{{ attrIsNumber(source.name,property.name) ? formatNumber(property.value) : property.value}}</p>
                                                </span>
                                            </div>
                                        </div>
                                    </Panel>
                                </div>
                            </div>
                            <div v-else-if="source.name==='elbe_wochenblatt'" class="max-h-60 overflow-y-auto">
                                <div v-for="(feature, ind) in source.value" :key="ind" class="rounded-md mt-1 px-1 first:mt-0 odd:bg-slate-300 even:bg-slate-100">
                                    <Panel class="featurePanel" toggleable :collapsed="true">
                                        <template #toggleicon="slotProps">
                                            <i v-if="slotProps.collapsed" class="pi pi-chevron-up"></i>
                                            <i v-else class="pi pi-chevron-down"></i>
                                        </template>
                                        <template #header>
                                            <span class="panel-title">{{feature.properties.Elbe_Wochenblatt_text_Title?.substring(0,30) || ''}}</span>
                                        </template>
                                        <div v-for="(property, i) in Object.entries(feature.properties).map(([name, value]) => ({ name, value }))"
                                            :key="i">
                                            <div class="p-1" v-if="allowedEWBColumns.findIndex((columnName)=> {return columnName === property.name})>=0">
                                                <p class="font-bold">{{ elbeColumnNames[property.name] }}</p>
                                                <span v-if="property.name ==='Elbe_Wochenblatt_text_Article_Full'">
                                                <p class="font-normal italic text-sm">
                                                    <span class="underline">
                                                        <a href="#" @click.prevent="openTextInNewTab(property.value)" >"{{property.value.substring(0,20)}}..."</a>
                                                    </span>
                                                </p>
                                                </span>
                                                <span v-else>
                                                    <p class="font-normal italic text-sm">{{ attrIsNumber(source.name,property.name) ? formatNumber(property.value) : property.value}}</p>
                                                </span>
                                            </div>
                                        </div>
                                    </Panel>
                                </div>
                            </div>
                            <div v-else-if="source.name==='parcel_grz_29042025'">
                                <div v-for="(feature, ind) in source.value" :key="ind"
                                    class="rounded-md border mt-1 px-1 first:mt-0 divide-y-2 divide-dashed">
                                    <div v-for="(property, i) in Object.entries(feature.properties)
                                        .map(([name, value]) => ({ name, value }))
                                        .filter(property => attributeFormatInfo.some(attr => attr.name === property.name))"
                                         :key="i">
                                        <p class="font-bold">
                                          {{ attributeFormatInfo.find(item => item.name === property.name)?.label || property.name }}
                                        </p>
                                        <p class="font-normal italic text-sm">
                                          {{ attrIsNumber(source.name, property.name)
                                            ? formatAttributeValue(property.value, attributeFormatInfo.find(item => item.name === property.name)?.format || 'string')
                                            : property.value }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="max-h-60 overflow-y-auto">
                                <div v-for="(feature, ind) in source.value" :key="ind"
                                    class="rounded-md border mt-1 px-1 first:mt-0 divide-y-2 divide-dashed">
                                    <div v-for="(property, i) in Object.entries(feature.properties).map(([name, value]) => ({ name, value }))"
                                        :key="i">
                                        <p class="font-bold">{{ property.name }}</p>
                                        <p class="font-normal italic text-sm">{{ attrIsNumber(source.name,property.name) ? formatNumber(property.value) : property.value}}</p>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>
				</Accordion>
			</template>
		</Card>
	</div>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import Panel from "primevue/panel";
import { useMapStore } from "../store/map"
import { computed } from "vue";
import { type MapGeoJSONFeature } from "maplibre-gl";
import { formatNumber } from "../core/helpers/functions";

const mapStore = useMapStore()
interface Props {
    features: MapGeoJSONFeature[] | undefined
}
type GroupedFeatures = Record<string, MapGeoJSONFeature[]>;
const props = defineProps<Props>()
const mergedFeatures = computed(() => {
    if (props.features !== undefined) {
        const groupedFeatures = props.features.reduce<GroupedFeatures>((acc, feature) => {
            const source = feature.source;
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (!acc[source]) {
                acc[source as any] = [];
            }
            acc[source as any].push(feature);
            return acc;
        }, {})
        return groupedFeatures
    }
    return []
})
function createDisplayName(source: string): string {
    const layer = mapStore.layersOnMap.filter((layer) => { return source === layer.source })[0]
    if (layer !== undefined) {
        return (layer.displayName !== undefined && layer.displayName !== "") ? layer.displayName.replaceAll("_", " ") : layer.source.replaceAll("_", " ")
    } else {
        return "-x-x-x-"
    }
}
function attrIsNumber(source: string, attrName: string): boolean {
    const layer = mapStore.layersOnMap.filter((layer) => { return source === layer.source })[0]
    if (layer?.details !== undefined && layer.details.featureType.attributes.attribute.length > 0){
        const attr = layer.details.featureType.attributes.attribute.find((attr)=>{ return attr.name===attrName })
        if (attr !== undefined && attr.binding !== "java.lang.String") {
            return true
        }
        return false
    } else {
        return false
    }
}
function openTextInNewTab(text: string): void {
    const newWindow = window.open();
    const content = text;
    newWindow!.document.write(`<html><body><pre>${content}</pre></body></html>`);
    newWindow!.document.close();
}
const allowedParliamentColumns: string[] = [
    "word",
    "hyperlink",
    "doc_num",
    "date",
    "info_table_pdfs_summary"
]
const allowedEWBColumns: string[] = [
    "word",
    "keywords",
    "Elbe_Wochenblatt_text_Title",
    "Elbe_Wochenblatt_text_Date",
    "Elbe_Wochenblatt_text_Article_Full"
]
const elbeColumnNames: Record<string, string> = {
    Elbe_Wochenblatt_text_Title: "Kategorie",
    Elbe_Wochenblatt_text_Date: "Datum",
    word: "Ort",
    keywords: "Schlüsselwörter",
    Elbe_Wochenblatt_text_Article_Full: "vollständiger Artikel"
}
const attributeFormatInfo = [
    { name: "UUID", format: "string", label: "Flurstück UUID" },
    { name: "AFL", format: "number", label: "Fläche Flurstück" },
    { name: "dist_pharmacies", format: "number_round", label: "Entfernung Apotheke" },
    { name: "dist_bus_stop", format: "number_round", label: "Entfernung Bushaltestelle" },
    { name: "dist_kindergarten", format: "number_round", label: "Entfernung Kita" },
    { name: "dist_hospitals", format: "number_round", label: "Entfernung Krankenhaus" },
    { name: "dist_train_station", format: "number_round", label: "Entfernung S/U-Bahn Haltestelle" },
    { name: "dist_supermarket", format: "number_round", label: "Entfernung Supermarkt" },
    { name: "dist_airport", format: "number_round", label: "Entfernung Flughafen" },
    { name: "dist_fire_departments", format: "number_round", label: "Entfernung Feuerwehr" },
    { name: "grz_alkis", format: "number", label: "ALKIS GRZ" },
    { name: "xplanung_id", format: "string", label: "X-Plan ID" },
    { name: "grz_xplanung", format: "number", label: "X-Plan GRZ" },
    { name: "grz_potential", format: "number", label: "Potential GRZ" },
    { name: "grz_potential_area", format: "number", label: "Potential GRZ Fläche" },
    { name: "lgb_art_values", format: "string", label: "LGB Art" },
    { name: "lgb_typ_values", format: "string", label: "LGB Typ" },
    { name: "nutzart_list_final", format: "string", label: "Nutzung" },
];

/**
 * Formats a numeric value according to the specified format.
 *
 * Supported formats:
 * - `"number"`: formats the number with 2 decimal places and thousand separators (e.g. 1,234.56)
 * - `"number_round"`: rounds the number to the nearest integer and applies thousand separators (e.g. 1,235)
 * - Any other format: returns the value as a string without formatting
 *
 * If the input value is `null`, `undefined`, or not a valid number, `"-"` is returned.
 *
 * @param value - The value to format. Can be any type, but will be converted to a number if possible.
 * @param format - A string describing the desired formatting. Valid options are "number" and "number_round".
 * @returns A formatted string representation of the value, or `"-"` for invalid input.
 *
 * @example
 * ```ts
 * formatAttributeValue(1234567.89, "number");       // "1,234,567.89"
 * formatAttributeValue(1234567.89, "number_round"); // "1,234,568"
 * formatAttributeValue(null, "number");             // "-"
 * ```
 */
function formatAttributeValue(value: unknown, format: string): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return "-";
    }

    const numberValue = Number(value);

    switch (format) {
        case "number_round":
            return numberValue.toLocaleString("en-US", {
                maximumFractionDigits: 0
            });
        case "number":
            return numberValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        default:
            return String(value);
    }
}
</script>

<style scoped>
.featurePanel {
    background-color: transparent;
    border:none;
}
.featurePanel:deep(.p-panel-header) {
    background-color: transparent;
    border:none;
    padding:0;
}
.featurePanel:deep(.panel-title) {
    background-color: transparent;
    border:none;
    padding-left: 0.5rem;
}
</style>
