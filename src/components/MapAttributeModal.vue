<template>
	<div class="w-full text-base">
		<Card class="w-72 h-72 overflow-y-auto">
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
                                </div>
                            </div>
                            <div v-else-if="source.name==='elbe_wochenblatt'" class="max-h-60 overflow-y-auto">
                                <div v-for="(feature, ind) in source.value" :key="ind" class="rounded-md mt-1 px-1 first:mt-0 odd:bg-slate-300 even:bg-slate-100">
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
</script>

<style scoped></style>
