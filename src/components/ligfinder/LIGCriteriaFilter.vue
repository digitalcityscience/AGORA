<template>
    <LIGFilterSection value="criteria-filters" :title="$t('ligfinder.filter.criteria.title')">
        <div class="min-w-0 space-y-3">
            <URadioGroup
                v-model="filterMode"
                :items="filterModeOptions"
                variant="card"
                orientation="horizontal"
                size="xs"
            />

            <template v-if="filterMode === 'simple'">
            <div v-if="criteria.criteriaInUse.length > 0" class="space-y-3">
                <section v-if="includedCriteria.length > 0" class="space-y-1">
                    <div class="flex min-w-0 items-center justify-between gap-2">
                        <h3 class="min-w-0 text-sm font-semibold text-highlighted">
                            {{ $t("ligfinder.filter.criteria.included") }}
                        </h3>
                        <UButton
                            class="shrink-0"
                            :label="$t('ligfinder.filter.criteria.removeall')"
                            color="neutral"
                            variant="link"
                            size="xs"
                            @click="removeAllSelectedCriteria('included')"
                        />
                    </div>
                    <div class="flex min-w-0 flex-wrap items-center gap-1">
                        <template v-for="(criterion, index) in includedCriteria" :key="criterion.key">
                            <ChipWrapper
                                :label="criterion.label"
                                severity="success"
                                removable
                                @remove="removeFromAppliedCriteria(criterion)"
                            />
                            <span v-if="index < includedCriteria.length - 1" class="text-xs italic text-muted">
                                {{ $t("helpers.logical.or") }}
                            </span>
                        </template>
                    </div>
                </section>
                <section v-if="excludedCriteria.length > 0" class="space-y-1">
                    <div class="flex min-w-0 items-center justify-between gap-2">
                        <h3 class="min-w-0 text-sm font-semibold text-highlighted">
                            {{ $t("ligfinder.filter.criteria.excluded") }}
                        </h3>
                        <UButton
                            class="shrink-0"
                            :label="$t('ligfinder.filter.criteria.removeall')"
                            color="neutral"
                            variant="link"
                            size="xs"
                            @click="removeAllSelectedCriteria('excluded')"
                        />
                    </div>
                    <div class="flex min-w-0 flex-wrap items-center gap-1">
                        <template v-for="(criterion, index) in excludedCriteria" :key="criterion.key">
                            <ChipWrapper
                                :label="criterion.label"
                                severity="danger"
                                removable
                                @remove="removeFromAppliedCriteria(criterion)"
                            />
                            <span v-if="index < excludedCriteria.length - 1" class="text-xs italic text-muted">
                                {{ $t("helpers.logical.and") }}
                            </span>
                        </template>
                    </div>
                </section>
            </div>
            <UAlert
                v-else
                color="info"
                variant="soft"
                :description="$t('ligfinder.filter.criteria.none')"
            />

            <LIGCriteriaDomainTree @include="includeNode" @exclude="excludeNode" />
            </template>
            <LIGAdvancedCriteriaFilter v-else />
        </div>
    </LIGFilterSection>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ChipWrapper from "../base/ChipWrapper.vue";
import LIGFilterSection from "./LIGFilterSection.vue";
import LIGCriteriaDomainTree, { type CriteriaTreeNode } from "./LIGCriteriaDomainTree.vue";
import LIGAdvancedCriteriaFilter from "./LIGAdvancedCriteriaFilter.vue";
import { type AppliedCriteria, useCriteriaStore } from "../../store/ligfinder/criteria.ts";
import { useCriteriaAdvancedStore } from "../../store/ligfinder/criteriaAdvanced.ts";
import { useI18n } from "vue-i18n";

type CriteriaStatus = "included" | "excluded";

const { t } = useI18n();
const criteria = useCriteriaStore();
const criteriaAdvanced = useCriteriaAdvancedStore();
const includedCriteria = computed(() => criteria.criteriaInUse.filter((criterion) => criterion.status === "included"));
const excludedCriteria = computed(() => criteria.criteriaInUse.filter((criterion) => criterion.status === "excluded"));

const filterModeOptions = [
    { label: t("ligfinder.filter.criteria.advanced.modeSimple"), value: "simple" },
    { label: t("ligfinder.filter.criteria.advanced.modeAdvanced"), value: "advanced" },
];
const filterMode = computed({
    get: () => criteriaAdvanced.isActive ? "advanced" : "simple",
    set: (mode: string) => criteriaAdvanced.setActive(mode === "advanced"),
});

function isAggregateUsageNode(node: CriteriaTreeNode): node is CriteriaTreeNode & { children: CriteriaTreeNode[] } {
    return node.children !== undefined && Object.prototype.hasOwnProperty.call(node, "nutzungvalue");
}

function includeNode(node: CriteriaTreeNode): void {
    isAggregateUsageNode(node) ? addAllChildren(node, "included") : addToAppliedCriteria(node, "included");
}

function excludeNode(node: CriteriaTreeNode): void {
    isAggregateUsageNode(node) ? addAllChildren(node, "excluded") : addToAppliedCriteria(node, "excluded");
}

function addToAppliedCriteria(node: CriteriaTreeNode, status: CriteriaStatus): void {
    const criterion: AppliedCriteria = {
        data: node,
        status,
        label: node.label,
        key: node.key,
    };
    criteria.addCriteria(criterion);
}

function removeFromAppliedCriteria(criterion: AppliedCriteria): void {
    criteria.removeCriteria(criterion);
}

function addAllChildren(node: { children: CriteriaTreeNode[] }, status: CriteriaStatus): void {
    node.children.forEach((child) => addToAppliedCriteria(child, status));
}

function removeAllSelectedCriteria(status: CriteriaStatus): void {
    criteria.criteriaInUse
        .filter((criterion) => criterion.status === status)
        .forEach((criterion) => criteria.removeCriteria(criterion));
}
</script>
