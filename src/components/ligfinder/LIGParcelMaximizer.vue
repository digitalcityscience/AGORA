<template>
    <LIGFilterSection value="parcel-maximizer" :title="$t('ligfinder.filter.parcel.title')">
        <div class="min-w-0 space-y-3">
            <USwitch
                v-model="ligfinderStore.isMaximizerActive"
                :label="ligfinderStore.isMaximizerActive
                    ? $t('ligfinder.filter.parcel.disable')
                    : $t('ligfinder.filter.parcel.enable')"
            />

            <template v-if="ligfinderStore.isMaximizerActive">
                <USeparator />
                <section class="min-w-0 space-y-3">
                    <h3 class="text-sm font-semibold text-highlighted">
                        {{ $t("ligfinder.filter.parcel.createHeader") }}
                    </h3>
                    <UFormField
                        :label="$t('ligfinder.filter.parcel.threshold')"
                        :description="$t('ligfinder.filter.parcel.thresholdDescription')"
                        size="sm"
                    >
                        <UInputNumber
                            v-model="parcelStore.threshold"
                            class="w-full"
                            :increment="false"
                            :decrement="false"
                            :min="0"
                        />
                    </UFormField>
                    <UCheckbox
                        v-model="parcelStore.include"
                        :label="$t('ligfinder.filter.parcel.exclusion')"
                        :description="$t('ligfinder.filter.parcel.exclusionList')"
                    />
                </section>

                <template v-if="parcelStore.maximizedParcelsOnMap">
                    <USeparator />
                    <section class="min-w-0 space-y-3">
                        <h3 class="text-sm font-semibold text-highlighted">
                            {{ $t("ligfinder.filter.parcel.saveHeader") }}
                        </h3>
                        <div class="save-fields">
                            <UFormField
                                :label="$t('ligfinder.filter.parcel.layerName')"
                                :description="$t('ligfinder.filter.parcel.layerNameDescription')"
                                size="sm"
                            >
                                <UInput
                                    v-model.trim="parcelStore.layerName"
                                    class="w-full"
                                    :minlength="3"
                                    :maxlength="35"
                                />
                            </UFormField>
                            <UFormField
                                :label="$t('ligfinder.filter.parcel.layerType')"
                                :description="$t('ligfinder.filter.parcel.layerTypeDescription')"
                                size="sm"
                            >
                                <USelect
                                    v-model="parcelStore.layerType"
                                    class="w-full"
                                    :items="layerTypeOptions"
                                />
                            </UFormField>
                        </div>
                        <UButton
                            block
                            :label="$t('ligfinder.filter.parcel.saveLayer')"
                            :disabled="parcelStore.layerName.trim().length < 3"
                            @click="saveLayer"
                        />
                    </section>
                </template>
            </template>
        </div>
    </LIGFilterSection>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "@nuxt/ui/composables";
import LIGFilterSection from "./LIGFilterSection.vue";
import { useParcelStore } from "../../store/ligfinder/parcel";
import { useMapStore } from "../../store/maplibre/map";
import { getRandomHexColor } from "../../core/helpers/functions";
import { useLigfinderMainStore } from "../../store/ligfinder/main";

const toast = useToast();
const parcelStore = useParcelStore();
const mapStore = useMapStore();
const ligfinderStore = useLigfinderMainStore();
const { t } = useI18n();
const layerTypeOptions = computed(() => [
    { label: t("helpers.layerTypes.fill"), value: "fill" },
    { label: t("helpers.layerTypes.line"), value: "line" },
]);

function saveLayer(): void {
    const geojson = parcelStore.maximizedParcelsGeoJSON;
    if (geojson == null || !Array.isArray(geojson.features) || geojson.features.length === 0) return;
    const id = `user-layer-${Math.random().toString(36).substring(2, 10)}`;
    const sourceId = `${id}-src`;

    void mapStore.addMapDataSource("geojson", sourceId, false, undefined, undefined, geojson).then(async () => {
        const style = parcelStore.layerType === "fill"
            ? { paint: { "fill-color": getRandomHexColor(), "fill-opacity": 0.3, "fill-outline-color": "#000" } }
            : { paint: { "line-color": getRandomHexColor(), "line-width": 3, "line-opacity": 1 } };

        return await mapStore.addMapLayer("geojson", id, parcelStore.layerType, style, undefined, undefined, geojson, false, parcelStore.layerName, sourceId, true);
    }).then(() => {
        toast.add({
            title: t("ligfinder.filter.parcel.errors.addLayerSuccessSummary"),
            description: t("ligfinder.filter.parcel.errors.addLayerSuccess", { name: parcelStore.layerName }),
            color: "success",
            duration: 10000,
        });
        parcelStore.layerName = "";
    }).catch(() => {
        toast.add({
            title: t("ligfinder.filter.parcel.errors.addLayerFailedSummary"),
            description: t("ligfinder.filter.parcel.errors.addLayerFailed"),
            color: "error",
            duration: 10000,
        });
    });
}
</script>

<style scoped>
.save-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
    gap: 0.75rem;
}
</style>
