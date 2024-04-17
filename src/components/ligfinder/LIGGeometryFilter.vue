<template>
	<div class="w-full">
		<Panel toggleable>
			<template #header>
				<span class="font-bold">Location Based Filtering</span>
			</template>
			<div class="w-full flex flex-col">
				<LIGGeometryAdministrativeAreas/>
			</div>
		</Panel>
	</div>
</template>

<script setup lang="ts">
import Panel from "primevue/panel";
import LIGGeometryAdministrativeAreas from "./LIGGeometryAdministrativeAreas.vue"
</script>

<style scoped>
</style>
