<template>
	<Panel toggleable>
		<template #header>
			<span class="font-bold">Metric Based Filtering</span>
		</template>
		<div class="metric-filter">
			<div class="filter-section">
                <div class="attribute w-full py-1"  v-for="(filter, key) in ligfinder.metricFilters" :key="key">
                    <!-- Dynamically display filter name with some formatting -->
                    <p class="font-bold normal-case">{{$t(`metricsFilter.${key}`)}}</p>
                    <div class="range-input flex flex-start">
						<div class="input-group flex flex-col font-light text-xs italic">
							<label :for="`${key}-min`" class="pl-1">Min</label>
							<InputNumber :inputId="`${key}-min`" v-model="filter.min" @update:model-value="() => validateAndSet(filter, key)" :min="0"></InputNumber>
						</div>
						<div class="input-group flex flex-col font-light text-xs italic pl-2">
							<label :for="`${key}-max`" class="pl-1">Max</label>
							<InputNumber :inputId="`${key}-max`" v-model="filter.max" @update:model-value="() => validateAndSet(filter, key)" :min="0"></InputNumber>
						</div>
                    </div>
                </div>
            </div>
		</div>
		<div>
		</div>
	</Panel>
	</template>

<script setup lang="ts">
import Panel from "primevue/panel";
import InputNumber from "primevue/inputnumber";
import { nextTick, ref } from "vue";
import { useLigfinderStore } from "../../store/ligfinder";

const ligfinder = useLigfinderStore()
const validationInProgress = ref(false)
/**
 * Validates and corrects the min and max values of a given range object. Sets null values to 0 for validation, but does not include
 * 0 values in the filter to maintain intended range limits. Swaps min and max values if min is greater than max. This process
 * ensures valid ranges are maintained for filtering purposes. The adjustments are applied asynchronously using Vue's nextTick,
 * ensuring the filters state reflects the latest valid range values post-DOM updates.
 *
 * Note: The swapping is conditional, excluding scenarios where introducing a 0 would contradict the intended use of the range,
 * thus 0 values are not considered valid inputs for the filters.
 *
 * @param {Object} range - The range object with min and max values, where `null` is temporarily treated as 0 for logic processing.
 * @param {string} rangeKey - The identifier for the specific filter range within the filters state object, used for updates.
 * @returns {void} - Updates the filters state asynchronously, without returning a value.
 */
function validateRangeInput(range: { min: number; max: number }, rangeKey: string): void {
    if (!validationInProgress.value) {
        validationInProgress.value = true;
        let min = range.min;
        let max = range.max;
        if (min === null){
            min = 0
        }
        if (max === null) {
            max = 0
        }
        if ((min > max) && !(min === 0 || max === 0)) {
            [min, max] = [max, min]; // Swap min and max if necessary
        }
        nextTick(() => {
            ligfinder.metricFilters[rangeKey] = { min, max };
        }).then(() => {}, () => {});
    }
}
/**
 * A wrapper function around `validateRangeInput` that also resets the `validationInProgress` state. This function
 * is designed to be used as an event handler for updates to the min and max values of filter ranges. It ensures that
 * the validation logic is applied and then sets the `validationInProgress` flag back to false.
 *
 * @param {Object} filter - The current filter object containing the min and max values to validate.
 * @param {string} key - The key corresponding to the filter being validated. This is used to update the specific filter in the filters state object.
 * @returns {void}
 */
function validateAndSet(filter: { min: number; max: number; }, key: string): void {
    validateRangeInput(filter, key);
    validationInProgress.value = false; // Reset after validation
}
</script>

	<style scoped>

	</style>
