<template>
	<Panel toggleable>
		<template #toggleicon="slotProps">
                <i v-if="slotProps.collapsed" class="pi pi-chevron-up"></i>
                <i v-else class="pi pi-chevron-down"></i>
            </template>
		<template #header>
			<span class="font-bold">{{ $t('ligfinder.filter.criteria.title')}}</span>
		</template>
		<div>
			<div class="used-criteria" v-if="criteria.criteriaInUse.length > 0">
				<div class="included py-1">
					<div class="text-surface-700 dark:text-surface-0 font-bold w-full">
						{{ $t('ligfinder.filter.criteria.included')}}
					</div>
					<div class="w-full flex flex-wrap p-1">
						<span v-for="(crit, index) in includedCriteria" :key="crit.key" class="flex items-center gap-1 flex-wrap p-1">
							<ChipWrapper :label="crit.label" @remove="removeFromAppliedCriteria(crit)" removable severity="success"/>
							<span v-if="index < includedCriteria.length - 1" class="italic text-xs text-surface-500 dark:text-surface-400">{{ $t('helpers.logical.or')}}</span>
						</span>
					</div>
				</div>
				<div class="excluded py-1">
					<div class="text-surface-700 dark:text-surface-0 font-bold w-full">
						{{ $t('ligfinder.filter.criteria.excluded')}}
					</div>
					<div class="w-full flex flex-wrap p-1">
						<span v-for="(crit, index) in excludedCriteria" :key="crit.key" class="flex items-center gap-1 flex-wrap p-1">
							<ChipWrapper :label="crit.label" @remove="removeFromAppliedCriteria(crit)" removable severity="danger"/>
							<span v-if="index < excludedCriteria.length - 1" class="italic text-xs text-surface-500 dark:text-surface-400">{{ $t('helpers.logical.and')}}</span>
						</span>
					</div>
				</div>
			</div>
			<div class="no-criteria py-1" v-else>
				<InlineMessage severity="info">{{ $t('ligfinder.filter.criteria.none')}}</InlineMessage>
			</div>
			<Tree :value="domains.data" :filter="true" filterMode="strict" class="w-full md:w-30rem" :pt="{nodeLabel:'w-full'}">
			<template #default="slotProps">
				<div class="w-full flex justify-between">
					<div class="text flex flex-col justify-center">
						<span class="label">{{ slotProps.node.label }}</span>
					</div>
					<div v-if="!(slotProps.node.children && Object.prototype.hasOwnProperty.call(slotProps.node,'nutzungvalue'))">
						<div class="actions min-w-24">
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
import InlineMessage from "primevue/inlinemessage";
import ChipWrapper from "../ChipWrapper.vue"
import { type AppliedCriteria, useCriteriaStore } from "../../store/ligfinder/criteria.ts"
import { type TreeNode } from "primevue/treenode";
import { computed } from "vue";
import domains, { type LGBArtData, type LGBTypData, type NutzungItemData } from "../../domains.ts"
const criteria = useCriteriaStore()

const includedCriteria = computed(()=> { return criteria.criteriaInUse.filter((crit)=> { return crit.status === "included" }) })
const excludedCriteria = computed(()=> { return criteria.criteriaInUse.filter((crit)=> { return crit.status === "excluded" }) })

type CriteriaStatus="included"|"excluded"
function addToAppliedCriteria(node: TreeNode, stat: CriteriaStatus): void{
    const criterium: AppliedCriteria = {
        data: node as LGBArtData|LGBTypData|NutzungItemData,
        status: stat,
        label: node.label ?? "",
        key: node.key
    }
    criteria.addCriteria(criterium)
}
function removeFromAppliedCriteria(crit: AppliedCriteria): void {
    criteria.removeCriteria(crit)
}
</script>

<style scoped>

</style>
