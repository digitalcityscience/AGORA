<template>
    <div class="min-w-0 space-y-3">
        <UAlert
            v-if="criteriaAdvanced.blocks.length === 0 && !criteriaAdvanced.draftBlock"
            color="info"
            variant="soft"
            :description="$t('ligfinder.filter.criteria.advanced.noBlocks')"
        />

        <div v-if="criteriaAdvanced.blocks.length > 0" class="space-y-2">
            <div
                v-for="(block, index) in criteriaAdvanced.blocks"
                :key="block.id"
                class="min-w-0 space-y-1 rounded-md border border-default p-2"
            >
                <div class="flex min-w-0 items-center justify-between gap-2">
                    <h4 class="min-w-0 text-sm font-semibold text-highlighted">
                        {{ $t("ligfinder.filter.criteria.advanced.blockLabel", { index: index + 1 }) }}
                        <span class="font-normal text-muted">
                            ({{ block.operator === "and" ? $t("ligfinder.filter.criteria.advanced.blockMatchAll") : $t("ligfinder.filter.criteria.advanced.blockMatchAny") }})
                        </span>
                    </h4>
                    <div class="flex shrink-0 items-center gap-0.5">
                        <UButton
                            icon="i-lucide-pencil"
                            color="neutral"
                            variant="ghost"
                            size="xs"
                            square
                            :aria-label="$t('ligfinder.filter.criteria.advanced.editBlock')"
                            @click="criteriaAdvanced.startEditingBlock(block.id)"
                        />
                        <UButton
                            icon="i-lucide-trash-2"
                            color="error"
                            variant="ghost"
                            size="xs"
                            square
                            :aria-label="$t('ligfinder.filter.criteria.advanced.removeBlock')"
                            @click="criteriaAdvanced.removeBlock(block.id)"
                        />
                    </div>
                </div>
                <div class="flex min-w-0 flex-wrap items-center gap-1">
                    <template v-for="(condition, conditionIndex) in block.conditions" :key="conditionIndex">
                        <ChipWrapper
                            :label="condition.label ?? condition.attribute"
                            :severity="condition.negate ? 'danger' : 'success'"
                        />
                        <span v-if="conditionIndex < block.conditions.length - 1" class="text-xs italic text-muted">
                            {{ block.operator === "and" ? $t("helpers.logical.and") : $t("helpers.logical.or") }}
                        </span>
                    </template>
                </div>
            </div>
        </div>

        <div v-if="criteriaAdvanced.blocks.length > 1" class="flex min-w-0 items-center justify-between gap-2">
            <span class="text-sm text-muted">{{ $t("ligfinder.filter.criteria.advanced.blocksOperatorLabel") }}</span>
            <URadioGroup
                :model-value="criteriaAdvanced.blocksOperator"
                :items="operatorOptions"
                variant="card"
                orientation="horizontal"
                size="xs"
                @update:model-value="(value) => criteriaAdvanced.setBlocksOperator(value as CriteriaOperator)"
            />
        </div>

        <div v-if="criteriaAdvanced.draftBlock" class="min-w-0 space-y-2 rounded-md border border-dashed border-primary p-2">
            <div class="flex min-w-0 items-center justify-between gap-2">
                <span class="text-sm text-muted">{{ $t("ligfinder.filter.criteria.advanced.blockOperatorLabel") }}</span>
                <URadioGroup
                    :model-value="criteriaAdvanced.draftBlock.operator"
                    :items="operatorOptions"
                    variant="card"
                    orientation="horizontal"
                    size="xs"
                    @update:model-value="(value) => criteriaAdvanced.setDraftOperator(value as CriteriaOperator)"
                />
            </div>

            <div v-if="criteriaAdvanced.draftBlock.conditions.length > 0" class="flex min-w-0 flex-wrap items-center gap-1">
                <template v-for="(condition, index) in criteriaAdvanced.draftBlock.conditions" :key="index">
                    <ChipWrapper
                        :label="condition.label ?? condition.attribute"
                        :severity="condition.negate ? 'danger' : 'success'"
                        removable
                        @remove="criteriaAdvanced.removeConditionFromDraft(index)"
                    />
                </template>
            </div>
            <UAlert
                v-else
                color="neutral"
                variant="soft"
                :description="$t('ligfinder.filter.criteria.advanced.blockConditionsNone')"
            />

            <LIGCriteriaDomainTree @include="includeNode" @exclude="excludeNode" />

            <div class="flex justify-end gap-2 pt-1">
                <UButton
                    color="neutral"
                    variant="soft"
                    :label="$t('ligfinder.filter.criteria.advanced.cancelBlock')"
                    @click="criteriaAdvanced.cancelDraftBlock()"
                />
                <UButton
                    :disabled="criteriaAdvanced.draftBlock.conditions.length === 0"
                    :label="$t('ligfinder.filter.criteria.advanced.saveBlock')"
                    @click="criteriaAdvanced.saveDraftBlock()"
                />
            </div>
        </div>
        <UButton
            v-else
            block
            color="neutral"
            variant="outline"
            icon="i-lucide-plus"
            :label="$t('ligfinder.filter.criteria.advanced.addBlock')"
            @click="criteriaAdvanced.startNewBlock()"
        />
    </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import ChipWrapper from "../base/ChipWrapper.vue";
import LIGCriteriaDomainTree, { type CriteriaTreeNode } from "./LIGCriteriaDomainTree.vue";
import {
    useCriteriaAdvancedStore,
    type CriteriaAttribute,
    type CriteriaOperator,
} from "../../store/ligfinder/criteriaAdvanced.ts";

const { t } = useI18n();
const criteriaAdvanced = useCriteriaAdvancedStore();

const operatorOptions = [
    { label: t("ligfinder.filter.criteria.advanced.blockMatchAll"), value: "and" },
    { label: t("ligfinder.filter.criteria.advanced.blockMatchAny"), value: "or" },
];

/**
 * Maps a domain tree node onto the {attribute, values} shape the advanced
 * criteria store expects. Mirrors the same node-shape dispatch LIGCriteriaFilter.vue
 * uses for the simple mode (children => whole art group, typ => typ leaf,
 * nutzungvalue => nutzung leaf/aggregate), so both modes treat the same tree the same way.
 */
function resolveCondition(node: CriteriaTreeNode): { attribute: CriteriaAttribute, values: string[] } | null {
    const isAggregateUsageNode = node.children !== undefined && Object.prototype.hasOwnProperty.call(node, "nutzungvalue");
    if (isAggregateUsageNode) {
        const values = node.children!.flatMap((child) => "nutzungvalue" in child ? child.nutzungvalue : []);
        return values.length > 0 ? { attribute: "nutzung", values } : null;
    }
    if ("children" in node && "art" in node) {
        return { attribute: "art", values: node.art };
    }
    if ("typ" in node) {
        return { attribute: "typ", values: node.typ };
    }
    if ("nutzungvalue" in node) {
        return { attribute: "nutzung", values: node.nutzungvalue };
    }
    return null;
}

function includeNode(node: CriteriaTreeNode): void {
    const resolved = resolveCondition(node);
    if (resolved !== null) {
        criteriaAdvanced.addConditionToDraft(resolved.attribute, resolved.values, false, node.label as string | undefined);
    }
}

function excludeNode(node: CriteriaTreeNode): void {
    const resolved = resolveCondition(node);
    if (resolved !== null) {
        criteriaAdvanced.addConditionToDraft(resolved.attribute, resolved.values, true, node.label as string | undefined);
    }
}
</script>
