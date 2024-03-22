<template>
	<Panel toggleable>
		<template #header>
			<span class="font-bold">Properties Based Filtering</span>
		</template>
		<div>
			<Tree :value="criteria.list" :filter="true" filterMode="strict" class="w-full md:w-30rem"></Tree>
		</div>
	</Panel>
	</template>

<script setup lang="ts">
import Panel from "primevue/panel";
import Tree from "primevue/tree";
import { useCriteriaStore } from "../../store/criteria"
const criteria = useCriteriaStore()
</script>

	<style scoped>

	</style>
