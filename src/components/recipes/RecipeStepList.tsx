import type { RecipeStep } from "@/lib/types/database";

export function RecipeStepList({ steps }: { steps: RecipeStep[] }) {
  if (!steps.length) {
    return <p className="text-sm text-foreground-secondary">尚無製作步驟</p>;
  }

  const ordered = [...steps].sort(
    (a, b) => a.sort_order - b.sort_order || a.step_number - b.step_number
  );

  return (
    <ol className="space-y-4">
      {ordered.map((step) => (
        <li
          key={step.id}
          className="rounded-[18px] border border-border-soft bg-surface p-4 shadow-[0_2px_8px_rgba(74,49,36,0.04)]"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {step.step_number}
            </span>
            <div className="min-w-0 flex-1">
              {step.title && <h3 className="font-semibold text-caramel">{step.title}</h3>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{step.description}</p>
              {step.note && (
                <p className="mt-2 rounded-xl bg-butter-soft/60 px-3 py-2 text-xs text-caramel">
                  注意：{step.note}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
