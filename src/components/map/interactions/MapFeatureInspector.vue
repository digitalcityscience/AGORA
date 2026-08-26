<template>
    <BaseSlideoverSidebarComponent
        :id="sidebarID"
        side="right"
        :collapsed="true"
        width-class="w-[min(32rem,34vw)]"
        @after-open="inspectorStore.restoreHighlight"
        @after-close="inspectorStore.clearSelection"
    >
        <template #header>
            <span>{{ $t("map.featureInspector.title") }}</span>
        </template>

        <UAlert
            v-if="!hasFeatures"
            color="info"
            variant="subtle"
            :title="$t('map.featureInspector.empty')"
        />

        <div v-else-if="selectedFeature" class="min-w-0 space-y-4">
            <div class="flex min-w-0 items-start justify-between gap-3">
                <div class="min-w-0">
                    <h2 class="truncate text-base font-semibold capitalize text-highlighted">
                        {{ sourceDisplayName }}
                    </h2>
                    <p class="text-sm text-muted">
                        {{ $t("map.featureInspector.position", {
                            current: selectedIndexModel + 1,
                            total: featureCount,
                        }) }}
                    </p>
                </div>
                <UBadge color="neutral" variant="subtle" class="shrink-0">
                    {{ selectedFeature.geometry.type }}
                </UBadge>
            </div>

            <UFormField
                v-if="featureCount > 1"
                :label="$t('map.featureInspector.selectFeature')"
            >
                <USelect
                    v-model="selectedIndexModel"
                    :items="featureOptions"
                    value-key="value"
                    class="w-full"
                />
            </UFormField>

            <dl class="divide-y divide-default rounded-lg border border-default px-3">
                <div
                    v-for="property in visibleProperties"
                    :key="property.name"
                    class="grid min-w-0 gap-1 py-3 [grid-template-columns:minmax(8rem,0.42fr)_minmax(0,0.58fr)]"
                >
                    <dt class="break-words text-sm font-semibold text-highlighted">
                        {{ propertyLabel(property.name) }}
                    </dt>
                    <dd class="min-w-0 break-words text-sm text-muted">
                        <span
                            v-if="sourceName === 'parliament_database' && property.name === 'hyperlink'"
                            class="attribute-link underline underline-offset-2"
                            v-html="String(property.value ?? '')"
                        />
                        <button
                            v-else-if="sourceName === 'elbe_wochenblatt' && property.name === 'Elbe_Wochenblatt_text_Article_Full'"
                            type="button"
                            class="text-start underline underline-offset-2 hover:text-highlighted"
                            @click="openTextInNewTab(String(property.value ?? ''))"
                        >
                            {{ articlePreview(property.value) }}
                        </button>
                        <template v-else>
                            {{ displayValue(property.name, property.value) }}
                        </template>
                    </dd>
                </div>
            </dl>
        </div>

        <template v-if="hasFeatures" #footer>
            <UButton
                block
                :label="$t('map.featureInspector.zoomToFeature')"
                @click="inspectorStore.zoomToSelectedFeature"
            />
        </template>
    </BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { useMapStore } from "../../../store/maplibre/map";
import { useFeatureInspectorStore } from "../../../store/maplibre/featureInspector";
import { formatNumber } from "../../../core/helpers/functions";
import BaseSlideoverSidebarComponent from "../../base/BaseSlideoverSidebarComponent.vue";

interface AttributeItem {
    name: string;
    value: unknown;
}

const sidebarID = "map-feature-inspector";
const mapStore = useMapStore();
const inspectorStore = useFeatureInspectorStore();

const selectedFeature = computed(() => inspectorStore.getSelectedFeature());
const featureCount = computed(() => inspectorStore.getFeatures().length);
const hasFeatures = computed(() => featureCount.value > 0);
const sourceName = computed(() => String(selectedFeature.value?.source ?? ""));
const sourceDisplayName = computed(() => createDisplayName(sourceName.value));
const selectedIndexModel = computed({
    get: () => inspectorStore.getSelectedIndex(),
    set: (index: number) => inspectorStore.selectFeature(index),
});
const inspectorFeatures = computed<MapGeoJSONFeature[]>(() => inspectorStore.getFeatures());
const featureOptions = computed<Array<{ label: string; value: number }>>(() => inspectorFeatures.value.map((feature, index) => ({
    label: `${createDisplayName(String(feature.source))} · ${featureIdentifier(feature.properties, index)}`,
    value: index,
})));
const visibleProperties = computed<AttributeItem[]>(() => {
    const feature = selectedFeature.value;
    if (!feature) return [];

    const properties = Object.entries(feature.properties ?? {});
    if (sourceName.value === "parliament_database") {
        return properties
            .filter(([name]) => allowedParliamentColumns.includes(name))
            .map(([name, value]) => ({ name, value }));
    }
    if (sourceName.value === "elbe_wochenblatt") {
        return properties
            .filter(([name]) => allowedEWBColumns.includes(name))
            .map(([name, value]) => ({ name, value }));
    }
    if (sourceName.value === "parcel_grz_29042025") {
        const propertyMap = new Map(properties);
        return attributeFormatInfo
            .filter(attribute => propertyMap.has(attribute.name))
            .map(attribute => ({ name: attribute.name, value: propertyMap.get(attribute.name) }));
    }
    return properties.map(([name, value]) => ({ name, value }));
});

function createDisplayName(source: string): string {
    const layer = mapStore.layersOnMap.find(item => source === item.source);
    return (layer?.displayName || layer?.source || source || "–").replaceAll("_", " ");
}

function featureIdentifier(properties: Record<string, unknown> | null, index: number): string {
    const value = properties?.flurst_nr
        ?? properties?.info_table_pdfs_title
        ?? properties?.Elbe_Wochenblatt_text_Title
        ?? properties?.name
        ?? properties?.id;
    return String(value ?? index + 1).slice(0, 56);
}

function propertyLabel(propertyName: string): string {
    if (sourceName.value === "elbe_wochenblatt") {
        return elbeColumnNames[propertyName] ?? propertyName;
    }
    if (sourceName.value === "parcel_grz_29042025") {
        return attributeFormatInfo.find(item => item.name === propertyName)?.label ?? propertyName;
    }
    return propertyName;
}

function displayValue(propertyName: string, value: unknown): string {
    if (sourceName.value === "parcel_grz_29042025") {
        const format = attributeFormatInfo.find(item => item.name === propertyName)?.format ?? "string";
        return formatAttributeValue(value, format);
    }
    return attrIsNumber(sourceName.value, propertyName) ? formatNumber(Number(value)) : String(value ?? "–");
}

function attrIsNumber(source: string, attributeName: string): boolean {
    const layer = mapStore.layersOnMap.find(item => source === item.source);
    const attribute = layer?.details?.featureType.attributes.attribute.find(item => item.name === attributeName);
    return attribute !== undefined && attribute.binding !== "java.lang.String";
}

function articlePreview(value: unknown): string {
    const text = String(value ?? "");
    return text.length > 48 ? `“${text.slice(0, 48)}…”` : text;
}

function openTextInNewTab(text: string): void {
    const newWindow = window.open();
    if (!newWindow) return;
    const pre = newWindow.document.createElement("pre");
    pre.textContent = text;
    newWindow.document.body.appendChild(pre);
}

function formatAttributeValue(value: unknown, format: string): string {
    if (value === null || value === undefined) return "–";
    if (format === "string") return String(value);

    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "–";
    return numberValue.toLocaleString("en-US", format === "number_round"
        ? { maximumFractionDigits: 0 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const allowedParliamentColumns = [
    "word",
    "hyperlink",
    "doc_num",
    "date",
    "info_table_pdfs_summary",
];

const allowedEWBColumns = [
    "word",
    "keywords",
    "Elbe_Wochenblatt_text_Title",
    "Elbe_Wochenblatt_text_Date",
    "Elbe_Wochenblatt_text_Article_Full",
];

const elbeColumnNames: Record<string, string> = {
    Elbe_Wochenblatt_text_Title: "Kategorie",
    Elbe_Wochenblatt_text_Date: "Datum",
    word: "Ort",
    keywords: "Schlüsselwörter",
    Elbe_Wochenblatt_text_Article_Full: "vollständiger Artikel",
};

const attributeFormatInfo = [
    { name: "flurst_nr", format: "string", label: "Flurstücknummer" },
    { name: "Shape_Area", format: "number", label: "Fläche Flurstück" },
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
</script>

<style scoped>
.attribute-link :deep(a) {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
}
</style>
