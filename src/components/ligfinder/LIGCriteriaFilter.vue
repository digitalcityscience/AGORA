<template>
	<Panel toggleable>
		<template #header>
			<span class="font-bold">Properties Based Filtering</span>
		</template>
		<div>
			<Tree :value="criteria.list" :filter="true" filterMode="strict" class="w-full md:w-30rem">
			<template #default="slotProps">
				<div class="w-full flex justify-between">
					<div class="text flex flex-col justify-center">
						<span class="label">{{ slotProps.node.label }}</span>
					</div>
					<div v-if="slotProps.node.children?.length === 0">
						<div class="actions">
							<Button icon="pi pi-search-plus" text rounded aria-label="Include"></Button>
							<Button icon="pi pi-search-minus" severity="danger" text rounded aria-label="Exclude"></Button>
						</div>
					</div>
				</div>
			</template>
			</Tree>
		</div>
	</Panel>
	</template>

<script setup lang="ts">
import Panel from "primevue/panel";
import Tree from "primevue/tree";
import Button from "primevue/button";
import { useCriteriaStore } from "../../store/criteria"
const criteria = useCriteriaStore()
</script>

	<style scoped>

	</style>
