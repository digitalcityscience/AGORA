<template>
    <LIGFilterSection value="metric-filters" :title="$t('ligfinder.filter.metrics.title')">
        <div class="space-y-3">
            <section
                v-for="(filter, key) in metric.metricFilters"
                :key="key"
                class="min-w-0 space-y-2"
            >
                <h3 class="break-words text-sm font-semibold text-highlighted">
                    {{ $t(`ligfinder.filter.metrics.labels.${key}`) }}
                </h3>
                <div class="range-fields">
                    <UFormField :label="$t('common.minimum')" size="sm">
                        <UInputNumber
                            v-model="filter.min"
                            class="w-full"
                            :increment="false"
                            :decrement="false"
                            :min="0"
                            :disabled="key === 'Shape_Area' && ligfinderStore.isMaximizerActive"
                            @update:model-value="validateAndSet(filter, key)"
                        />
                    </UFormField>
                    <UFormField :label="$t('common.maximum')" size="sm">
                        <UInputNumber
                            v-model="filter.max"
                            class="w-full"
                            :increment="false"
                            :decrement="false"
                            :min="0"
                            :disabled="key === 'Shape_Area' && ligfinderStore.isMaximizerActive"
                            @update:model-value="validateAndSet(filter, key)"
                        />
                    </UFormField>
                </div>
            </section>
        </div>
    </LIGFilterSection>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import LIGFilterSection from "./LIGFilterSection.vue";
import { useMetricStore } from "../../store/ligfinder/metric";
import { useLigfinderMainStore } from "../../store/ligfinder/main";

const metric = useMetricStore();
const ligfinderStore = useLigfinderMainStore();
const validationInProgress = ref(false);

function validateRangeInput(range: { min: number; max: number }, rangeKey: string): void {
    if (validationInProgress.value) return;
    validationInProgress.value = true;
    let min = range.min ?? 0;
    let max = range.max ?? 0;
    if (min > max && min !== 0 && max !== 0) {
        [min, max] = [max, min];
    }
    nextTick(() => {
        metric.metricFilters[rangeKey] = { min, max };
        validationInProgress.value = false;
    }).catch(() => {
        validationInProgress.value = false;
    });
}

function validateAndSet(filter: { min: number; max: number }, key: string): void {
    validateRangeInput(filter, key);
}
</script>

<style scoped>
.range-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
    gap: 0.5rem;
}
</style>
