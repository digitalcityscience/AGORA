<template>
	<div class="w-full">
		<Panel toggleable>
			<template #header>
				<span class="font-bold">{{ $t('ligfinder.filter.geometry.title')}}</span>
			</template>
			<div class="w-full">
				<div class="pl-2">
                    <SelectButton v-model="geometry.isUnion" :options="geometry.unionSelectionList" option-value="value" option-label="name">
						<template #option="slotProps">
							{{ $t(`ligfinder.filter.geometry.methods.${slotProps.option.name}`)}}
						</template>
					</SelectButton>
                </div>
			</div>
			<div class="w-full flex flex-col mt-1">
				<LIGGeometryAdministrativeAreas/>
			</div>
			<div class="w-full flex flex-col mt-1">
				<LIGGeometryDrawnAreas></LIGGeometryDrawnAreas>
			</div>
			<div class="w-full flex flex-col mt-1">
				<LIGGeometryIsochroneAreas></LIGGeometryIsochroneAreas>
			</div>
		</Panel>
	</div>
</template>

<script setup lang="ts">
import Panel from "primevue/panel";
import SelectButton from "primevue/selectbutton";
import LIGGeometryAdministrativeAreas from "./LIGGeometryAdministrativeAreas.vue"
import LIGGeometryDrawnAreas from "./LIGGeometryDrawnAreas.vue"
import LIGGeometryIsochroneAreas from "./LIGGeometryIsochroneAreas.vue"
import { useGeometryStore } from "../../store/ligfinder/geometry";
import { onMounted } from "vue";
import { useMapStore } from "../../store/map";
const geometry = useGeometryStore()
const mapStore = useMapStore()
onMounted(()=>{
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (mapStore.map.getSource("selectedAreasTempLayer")) { geometry.createSelectedAreasTempLayer() }
})
</script>

<style scoped>
</style>
