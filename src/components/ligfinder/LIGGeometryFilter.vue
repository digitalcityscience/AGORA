<template>
	<div class="w-full">
		<Panel toggleable>
			<template #header>
				<span class="font-bold">Location Based Filtering</span>
			</template>
			<div class="w-full flex flex-col">
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
import LIGGeometryAdministrativeAreas from "./LIGGeometryAdministrativeAreas.vue"
import LIGGeometryDrawnAreas from "./LIGGeometryDrawnAreas.vue"
import LIGGeometryIsochroneAreas from "./LIGGeometryIsochroneAreas.vue"
</script>

<style scoped>
</style>
