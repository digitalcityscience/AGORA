<template>
    <div class="legend p-0">
      <h3 class="m-0 mb-3 font-bold">Legend</h3>
      <ul class="list-none m-0 p-3 border-gray-300 border rounded-md">
        <li class="flex items-center p-1 mb-1" v-for="(item, index) in legendItems" :key="index">
          <span class="w-[36px] h-[36px] rounded-sm border border-gray-400" :style="{ backgroundColor: item.color }"></span>
          <span class="ml-3 grow">{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

interface LegendItem { label: string; color: string }

function isColorString(value: unknown): value is string {
    return typeof value === "string";
}

function describeCondition(condition: any): string {
    if (!Array.isArray(condition)) return String(condition);
    const op = condition[0];
    if (op === "<" || op === "<=" || op === ">" || op === ">=" || op === "==" || op === "!=") {
        const attribute = Array.isArray(condition[1]) ? condition[1][1] : condition[1];
        return `${String(attribute)} ${String(op)} ${String(condition[2])}`;
    }
    if (op === "has") {
        return `has ${String(condition[1])}`;
    }
    if (op === "!has") {
        return `missing ${String(condition[1])}`;
    }
    if (op === "!" && Array.isArray(condition[1])) {
        const inner = condition[1];
        if (inner[0] === "has") return `missing ${String(inner[1])}`;
        return `not (${describeCondition(inner)})`;
    }
    if (op === "all" || op === "any") {
        const joiner = op === "all" ? " and " : " or ";
        return condition.slice(1).map(describeCondition).join(joiner);
    }
    if (op === "get") {
        return String(condition[1]);
    }
    return "";
}

function parseStep(expr: any[], attrLabel: string): LegendItem[] {
    // ["step", input, baseColor, stop1, color1, stop2, color2, ...]
    const out: LegendItem[] = [];
    const input = expr[1];
    const inputLabel = Array.isArray(input) ? describeCondition(input) : attrLabel;
    const base = expr[2];
    if (isColorString(base)) out.push({ color: base, label: `${inputLabel} < ${String(expr[3] ?? "")}`.trim() });
    for (let i = 3; i < expr.length - 1; i += 2) {
        const stop = expr[i];
        const color = expr[i + 1];
        const nextStop = expr[i + 2];
        if (!isColorString(color)) continue;
        const label = nextStop !== undefined
            ? `${inputLabel} ≥ ${String(stop)} and < ${String(nextStop)}`
            : `${inputLabel} ≥ ${String(stop)}`;
        out.push({ color, label });
    }
    return out;
}

function parseCase(expr: any[]): LegendItem[] {
    // ["case", cond1, value1, cond2, value2, ..., fallback]
    const out: LegendItem[] = [];
    for (let i = 1; i < expr.length - 1; i += 2) {
        const condition = expr[i];
        const value = expr[i + 1];
        const conditionLabel = describeCondition(condition);
        if (isColorString(value)) {
            if (value !== "rgba(255, 255, 255, 0)") {
                out.push({ label: conditionLabel, color: value });
            }
        } else if (Array.isArray(value) && value[0] === "step") {
            out.push(...parseStep(value, conditionLabel));
        }
    }
    const fallback = expr[expr.length - 1];
    if (isColorString(fallback) && fallback !== "rgba(255, 255, 255, 0)") {
        out.push({ label: "default", color: fallback });
    } else if (Array.isArray(fallback) && fallback[0] === "step") {
        out.push(...parseStep(fallback, "default"));
    }
    return out;
}

export default defineComponent({
    name: "GRZLegend",
    props: {
        mbstyle: {
            type: Array as PropType<any[]>,
            required: true,
        },
    },
    data() {
        return {
            legendItems: [] as LegendItem[],
        };
    },
    watch: {
        mbstyle: {
            immediate: true,
            deep: true,
            handler() {
                this.parseMbStyle();
            },
        },
    },
    methods: {
        parseMbStyle() {
            if (!Array.isArray(this.mbstyle)) {
                this.legendItems = [];
                return;
            }
            const head = this.mbstyle[0];
            let items: LegendItem[] = [];
            if (head === "case") {
                items = parseCase(this.mbstyle);
            } else if (head === "step") {
                items = parseStep(this.mbstyle, "value");
            } else {
                console.warn("Unsupported mbstyle format", head);
            }
            this.legendItems = items.filter(item => item.label.trim().length > 0);
        },
    },
});
</script>

  <style scoped>
  </style>
