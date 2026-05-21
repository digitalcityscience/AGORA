<template>
    <div class="py-1">
        <Panel class="map-layer-listing-panel" @update:collapsed="collapsedState" :collapsed="true" toggleable>
            <template #toggleicon="slotProps">
                <i v-if="slotProps.collapsed" class="pi pi-chevron-up"></i>
                <i v-else class="pi pi-chevron-down"></i>
            </template>
            <template #header>
                <span class="layer-color-rail"
                      :class="`layer-color-rail-${layerHeaderIndicator.kind}`"
                      :style="layerHeaderIndicatorStyle"
                      :title="layerHeaderIndicatorTitle"
                      aria-hidden="true"></span>
                <Button class="layer-drag-handle w-8 h-8 p-0 mr-1 cursor-move"
                        icon="pi pi-bars" text rounded
                        aria-label="Reorder layer" @click.stop />
                <ToggleSwitch v-model="checked" @update:model-value="changeLayerVisibility"></ToggleSwitch>
                <h3 class="capitalize mr-auto ml-2" v-tooltip.bottom="layerFullName">{{ layerDisplayName }}</h3>
                <Button class="w-8 h-8 p-0 mr-1" icon="pi pi-trash" severity="danger" text rounded aria-label="Delete"
                    @click="confirmDialogVisibility = true"></Button>
                <Dialog v-model:visible="confirmDialogVisibility" modal :header="$t('mapLayers.actions.deleteHeader')" :style="{ width: '25rem' }">
                    <span class="p-text-secondary block mb-5">{{ $t("mapLayers.actions.deleteQuestion",[props.layer.displayName ?? props.layer.source.replaceAll("_", " ")])}}</span>
                    <div class="flex justify-content-end gap-2">
                        <Button size="small" type="button" label="Cancel" severity="secondary" @click="confirmDialogVisibility = false">{{ $t("mapLayers.actions.cancel") }}</Button>
                        <Button size="small" type="button" label="Delete" severity="danger" @click="deleteLayerConfirmation(props.layer)">{{ $t("mapLayers.actions.delete") }}</Button>
                    </div>
                </Dialog>
            </template>
            <div>
                <label v-if="hasEditableLayerColor" class="flex w-full leading-none pointer-events-none items-baseline">
                    <span class="mt-2 min-w-[25%]">{{ $t("mapLayers.styling.color")}}</span>
                    <ColorPicker aria-label="Change Color" class="pointer-events-auto" format="hex" v-model="color" :baseZIndex="10"
                        @update:model-value="queueLayerColorChange"
                        @hide="flushLayerColorChange"></ColorPicker>
                </label>
                <div v-else>
                    <div v-if="layerLegendStyle !== undefined">
                        <div class="legend">
                            <MBStyleLegend :mbstyle="layerLegendStyle"></MBStyleLegend>
                        </div>
                    </div>
                </div>
                <label class="flex w-full leading-none items-center mt-2 pr-1">
                    <span class="mt-2 min-w-[25%]">{{ $t("mapLayers.styling.opacity") }}</span>
                    <Slider aria-label="Change Opacity" class="mt-2 ml-2 flex-grow" v-model="opacity" :step="0.1" :min=0 :max=1
                        @update:model-value="changeLayerOpac" :pt="{
                            range: { style: { 'background': `#${color}` } },
                            handle: { style: { 'background': `#${color}`, 'border-color': `#${color}` } }
                        }" />
                </label>
            </div>
            <div v-if="props.layer.id === 'parliament_database'">
                <ParliamentDBFilter :layer="props.layer"></ParliamentDBFilter>
            </div>
            <div v-else-if="props.layer.id==='ewb_elbe_wochenblatt'">
                <ElbewochenblattDBFilter></ElbewochenblattDBFilter>
            </div>
            <div v-else>
                <div v-if="props.layer.filterLayer == undefined || props.layer.filterLayer === false" class="py-2">
                    <AttributeFiltering :layer="props.layer"></AttributeFiltering>
                    <GeometryFiltering :layer="props.layer"></GeometryFiltering>
                </div>
                <div class="py-1" v-else></div>
            </div>
            <div v-if="props.layer.sourceType === 'geojson' && props.layer.filterLayerData !== undefined && props.layer.filterLayerData !== null">
                <DownloadForm :layerData="props.layer.filterLayerData"></DownloadForm>
            </div>
        </Panel>
    </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { type LayerObjectWithAttributes, type MapLibreLayerTypes, useMapStore } from "../../../store/maplibre/map"
import Panel from "primevue/panel";
import Slider from "primevue/slider";
import ToggleSwitch from "primevue/toggleswitch";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast"
import { isNullOrEmpty } from "../../../core/helpers/functions";
import ParliamentDBFilter from "../../geoparsing/ParliamentDBFilter.vue";
import ElbewochenblattDBFilter from "../../geoparsing/ElbewochenblattDBFilter.vue";
import MBStyleLegend from "./MBStyleLegend.vue";
import DownloadForm from "./DownloadForm.vue";
import Tooltip from "primevue/tooltip";

const ColorPicker = defineAsyncComponent(async () => await import("primevue/colorpicker"));
const Dialog = defineAsyncComponent(async () => await import("primevue/dialog"));
const AttributeFiltering = defineAsyncComponent(async () => await import("./AttributeFiltering.vue"));
const GeometryFiltering = defineAsyncComponent(async () => await import("./GeometryFiltering.vue"));

export interface Props {
    layer: LayerObjectWithAttributes
}
const props = defineProps<Props>()
const mapStore = useMapStore()
const collapsed = ref<boolean>(true)
const color = ref<string>("000000")
const opacity = ref<number>(1)
const checked = ref<boolean>(true)
const layerFullName = computed(() => props.layer.displayName ?? props.layer.source.replaceAll("_", " "))
const layerDisplayName = computed(() => layerFullName.value.length > 19 ? `${layerFullName.value.slice(0, 19)}...` : layerFullName.value)
const vTooltip = Tooltip;

type LayerHeaderIndicatorKind = "single" | "multi" | "raster" | "heatmap" | "unknown";
interface LayerHeaderIndicator {
    kind: LayerHeaderIndicatorKind;
    colors: string[];
}

const fallbackHeatmapColors = ["#0000ff", "#00ffff", "#00ff00", "#ffff00", "#ff0000"];
const namedColorLiterals = new Set([
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue",
    "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk",
    "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki",
    "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue",
    "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey",
    "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
    "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
    "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow",
    "lightgray", "lightgreen", "lightgrey", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
    "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine",
    "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise",
    "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive",
    "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred", "papayawhip",
    "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown",
    "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow",
    "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke",
    "yellow", "yellowgreen", "transparent"
]);

const initialLayerHeaderIndicator = ref<LayerHeaderIndicator>({ kind: "unknown", colors: [] })
let pendingColorChangeTimeout: ReturnType<typeof setTimeout> | null = null

function getEditableColorPaintProperty(type: MapLibreLayerTypes): string {
    if (type === "circle") return "circle-color";
    if (type === "fill") return "fill-color";
    if (type === "line") return "line-color";
    if (type === "heatmap") return "heatmap-color";
    return "";
}

function getOpacityPaintProperty(type: MapLibreLayerTypes): string {
    if (type === "circle") return "circle-opacity";
    if (type === "fill") return "fill-opacity";
    if (type === "line") return "line-opacity";
    if (type === "heatmap") return "heatmap-opacity";
    if (type === "raster") return "raster-opacity";
    if (type === "fill-extrusion") return "fill-extrusion-opacity";
    return "";
}

function getLayerPaintProperty(prop: string): any {
    if (prop === "") return undefined;
    if (isNullOrEmpty(mapStore.map)) return undefined;
    try {
        return mapStore.map.getPaintProperty(props.layer.id, prop);
    } catch {
        return undefined;
    }
}

function isColorLiteral(value: string): boolean {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v)) return true;
    if (/^rgba?\(/.test(v)) return true;
    if (/^hsla?\(/.test(v)) return true;
    if (namedColorLiterals.has(v)) return true;
    return false;
}

function collectColorLiterals(value: unknown, out: string[], seen: WeakSet<object>, max = 4): void {
    if (out.length >= max) return;
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
        if (isColorLiteral(value) && !out.includes(value)) out.push(value);
        return;
    }
    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
        for (const item of value) {
            if (out.length >= max) return;
            collectColorLiterals(item, out, seen, max);
        }
        return;
    }
    for (const key of Object.keys(value as Record<string, unknown>)) {
        if (out.length >= max) return;
        collectColorLiterals((value as Record<string, unknown>)[key], out, seen, max);
    }
}

function extractColorLiterals(value: unknown, max = 4): string[] {
    const out: string[] = [];
    collectColorLiterals(value, out, new WeakSet<object>(), max);
    return out;
}

function resolveLayerHeaderIndicator(layerType: MapLibreLayerTypes): LayerHeaderIndicator {
    if (layerType === "raster" || layerType === "hillshade" || layerType === "background") {
        return { kind: "raster", colors: [] };
    }
    if (layerType === "heatmap") {
        const expr = getLayerPaintProperty("heatmap-color");
        const colors = extractColorLiterals(expr);
        if (colors.length > 0) return { kind: "heatmap", colors };
        return { kind: "heatmap", colors: fallbackHeatmapColors };
    }
    const prop = getEditableColorPaintProperty(layerType);
    if (prop === "") return { kind: "unknown", colors: [] };
    const value = getLayerPaintProperty(prop);
    if (typeof value === "string" && isColorLiteral(value)) {
        return { kind: "single", colors: [value] };
    }
    if (typeof value === "object" && value !== null) {
        const colors = extractColorLiterals(value);
        if (colors.length > 1) return { kind: "multi", colors };
        if (colors.length === 1) return { kind: "single", colors };
    }
    return { kind: "unknown", colors: [] };
}

function createLayerHeaderIndicatorBackground(indicator: LayerHeaderIndicator): string {
    const firstColor = indicator.colors[0];
    if (indicator.kind === "single" && firstColor !== undefined && firstColor.length > 0) {
        return firstColor;
    }
    if ((indicator.kind === "multi" || indicator.kind === "heatmap") && indicator.colors.length > 0) {
        const n = indicator.colors.length;
        const stops = indicator.colors.map((c, i) => {
            const start = (i * 100) / n;
            const end = ((i + 1) * 100) / n;
            return `${c} ${start}%, ${c} ${end}%`;
        }).join(", ");
        return `linear-gradient(to bottom, ${stops})`;
    }
    return "repeating-linear-gradient(45deg, rgba(120,120,120,0.45) 0 3px, rgba(255,255,255,0.65) 3px 6px)";
}

const layerHeaderIndicator = computed<LayerHeaderIndicator>(() => {
    // Re-evaluate whenever the map style changes (e.g. setPaintProperty from parcel style selection).
    void mapStore.paintVersion;
    void initialLayerHeaderIndicator.value;
    return resolveLayerHeaderIndicator(props.layer.type);
})

const layerHeaderIndicatorStyle = computed(() => ({
    background: createLayerHeaderIndicatorBackground(layerHeaderIndicator.value)
}))

const layerHeaderIndicatorTitle = computed(() => {
    const ind = layerHeaderIndicator.value;
    if (ind.kind === "single") return ind.colors[0];
    if (ind.kind === "multi" || ind.kind === "heatmap") return ind.colors.join(", ");
    if (ind.kind === "raster") return "Raster layer";
    return "";
})

const hasEditableLayerColor = computed(() => {
    void mapStore.paintVersion;
    if (props.layer.clustered === true) return false;
    const prop = getEditableColorPaintProperty(props.layer.type);
    if (prop === "") return false;
    const value = getLayerPaintProperty(prop);
    return typeof value === "string";
})

const layerLegendStyle = computed<any[] | undefined>(() => {
    void mapStore.paintVersion;
    const prop = getEditableColorPaintProperty(props.layer.type);
    if (prop === "") return undefined;
    const value = getLayerPaintProperty(prop);
    if (!Array.isArray(value)) return undefined;
    return value;
})

function normalizeColorPickerValue(input: any): string {
    if (typeof input !== "string") return "";
    return input.startsWith("#") ? input.slice(1) : input;
}

function normalizeHexColorInput(input: any): string | null {
    const v = normalizeColorPickerValue(input);
    return /^[0-9a-f]{6}$/i.test(v) ? v : null;
}

function applyLayerColor(rawColor: any): void {
    const normalized = normalizeHexColorInput(rawColor);
    if (normalized === null) return;
    const prop = getEditableColorPaintProperty(props.layer.type);
    if (prop === "") return;
    mapStore.map.setPaintProperty(props.layer.id, prop, `#${normalized}`)
}

function queueLayerColorChange(newColor: any): void {
    if (pendingColorChangeTimeout !== null) clearTimeout(pendingColorChangeTimeout);
    pendingColorChangeTimeout = setTimeout(() => {
        pendingColorChangeTimeout = null;
        applyLayerColor(newColor);
    }, 120);
}

function flushLayerColorChange(): void {
    if (pendingColorChangeTimeout !== null) {
        clearTimeout(pendingColorChangeTimeout);
        pendingColorChangeTimeout = null;
    }
    applyLayerColor(color.value);
}

onMounted(() => {
    const prop = getEditableColorPaintProperty(props.layer.type)
    const opac = getOpacityPaintProperty(props.layer.type)
    if (prop !== "" && !isNullOrEmpty(mapStore.map.getPaintProperty(props.layer.id, prop))) {
        const paintColor = mapStore.map.getPaintProperty(props.layer.id, prop)
        color.value = ((props.layer.clustered !== undefined && props.layer.clustered) || typeof paintColor !== "string")
            ? "000000"
            : paintColor.substring(1)
    }
    if (opac !== "" && !isNullOrEmpty(mapStore.map.getPaintProperty(props.layer.id, opac))) {
        opacity.value = mapStore.map.getPaintProperty(props.layer.id, opac)
    }
    if (!isNullOrEmpty(mapStore.map.getLayoutProperty(props.layer.id, "visibility"))) {
        if (mapStore.map.getLayoutProperty(props.layer.id, "visibility") === "none") {
            checked.value = false
        }
    }
    initialLayerHeaderIndicator.value = resolveLayerHeaderIndicator(props.layer.type)
})

onBeforeUnmount(() => {
    if (pendingColorChangeTimeout !== null) {
        clearTimeout(pendingColorChangeTimeout);
        pendingColorChangeTimeout = null;
    }
})

function changeLayerOpac(layerOpacity: any): void {
    const opac = getOpacityPaintProperty(props.layer.type)
    if (opac === "") return;
    mapStore.map.setPaintProperty(props.layer.id, opac, layerOpacity)
}
function changeLayerVisibility(layerVisibility: boolean): void {
    const value = layerVisibility ? "visible" : "none";
    mapStore.map.setLayoutProperty(props.layer.id, "visibility", value);
    props.layer.companionLayerIds?.forEach((cid: string) => {
        if (mapStore.map.getLayer(cid) !== undefined) {
            mapStore.map.setLayoutProperty(cid, "visibility", value);
        }
    });
}
function collapsedState(isCollapsed: boolean): void {
    collapsed.value = isCollapsed
}
const confirmDialogVisibility = ref<boolean>(false)
const toast = useToast();
function deleteLayerConfirmation(layer: LayerObjectWithAttributes): void {
    mapStore.deleteMapLayer(layer.id).then(()=>{
        mapStore.deleteMapDataSource(layer.source).then(()=>{
            toast.add({ severity: "success", summary: "Deleted", detail: "Layer deleted", life: 3000 });
        }).catch((error)=>{
            toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
        })
    }).catch((error)=>{
        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
    })
    confirmDialogVisibility.value = false
}
</script>

<style scoped>
.layer-color-rail {
    align-self: stretch;
    border-radius: 9999px;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
    flex: 0 0 6px;
    margin: 0.25rem 0.75rem 0.25rem 0;
    min-height: 2.5rem;
}
.map-layer-listing-panel :deep(.p-panel-header) {
    padding-left: 0.35rem;
}
.layer-color-rail-multi,
.layer-color-rail-heatmap,
.layer-color-rail-raster,
.layer-color-rail-unknown {
    border: 1px solid rgb(255 255 255 / 0.7);
}
</style>
