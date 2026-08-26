<template>
    <LIGFilterSection value="grz-filters" :title="$t('ligfinder.filter.grz.title')">
        <div class="space-y-3">
            <section
                v-for="(filter, key) in grz.grzFilters"
                :key="key"
                class="min-w-0 space-y-2"
            >
                <h3 class="break-words text-sm font-semibold text-highlighted">
                    {{ $t(`ligfinder.filter.grz.labels.${key}`) }}
                </h3>
                <div class="range-fields">
                    <UFormField :label="$t('common.minimum')" size="sm">
                        <UInputNumber
                            v-model="filter.min"
                            class="w-full"
                            :increment="false"
                            :decrement="false"
                            :min="0"
                            :max="grz.isRatioFilter(key) ? 0.99 : undefined"
                            :step="grz.isRatioFilter(key) ? 0.01 : 1"
                            :format-options="grz.isRatioFilter(key) ? { minimumFractionDigits: 2 } : undefined"
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
                            :max="grz.isRatioFilter(key) ? 1 : undefined"
                            :step="grz.isRatioFilter(key) ? 0.01 : 1"
                            :format-options="grz.isRatioFilter(key) ? { minimumFractionDigits: 2 } : undefined"
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
import { useGrzStore } from "../../store/ligfinder/grz";

const grz = useGrzStore();
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
        grz.grzFilters[rangeKey] = { min, max };
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
