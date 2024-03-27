<template>
	<Panel toggleable>
		<template #header>
			<span class="font-bold">Properties Based Filtering</span>
		</template>
		<div>
			<div class="used-criteria">
				<div class="included py-1">
					<div class="text-surface-700 dark:text-surface-0 font-bold w-full">
						Included Criteria
					</div>
					<div class="w-full p-1">
						<ChipWrapper v-for="crit in includedCriteria" :key="crit.key" :label="crit.label" @remove="removeFromAppliedCriteria(crit)" removable severity="success"/>
					</div>
				</div>
				<div class="excluded py-1">
					<div class="text-surface-700 dark:text-surface-0 font-bold w-full">
						Excluded Criteria
					</div>
					<div class="w-full p-1">
						<ChipWrapper v-for="crit in excludedCriteria" :key="crit.key" :label="crit.label" @remove="removeFromAppliedCriteria(crit)" removable severity="danger"/>
					</div>
				</div>
			</div>
			<Tree :value="criteria.list" :filter="true" filterMode="strict" class="w-full md:w-30rem">
			<template #default="slotProps">
				<div class="w-full flex justify-between">
					<div class="text flex flex-col justify-center">
						<span class="label">{{ slotProps.node.label }}</span>
					</div>
					<div v-if="slotProps.node.children?.length === 0">
						<div class="actions">
							<Button icon="pi pi-search-plus" @click="addToAppliedCriteria(slotProps.node,'included')" text rounded aria-label="Include"></Button>
							<Button icon="pi pi-search-minus" @click="addToAppliedCriteria(slotProps.node,'excluded')" severity="danger" text rounded aria-label="Exclude"></Button>
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
import ChipWrapper from "../ChipWrapper.vue"
import { type AppliedCriteria, useCriteriaStore } from "../../store/criteria"
import { type TreeNode } from "primevue/treenode";
import { computed } from "vue";
const criteria = useCriteriaStore()

const includedCriteria = computed(()=> { return criteria.criteriaInUse.filter((crit)=> { return crit.status === "included" }) })
const excludedCriteria = computed(()=> { return criteria.criteriaInUse.filter((crit)=> { return crit.status === "excluded" }) })

type CriteriaStatus="included"|"excluded"
function addToAppliedCriteria(node: TreeNode, stat: CriteriaStatus): void{
    const criterium: AppliedCriteria = { ...node, status:stat }
    criteria.addCriteria(criterium)
}
function removeFromAppliedCriteria(crit: AppliedCriteria): void {
    criteria.removeCriteria(crit)
}
</script>

<style scoped>

</style>
