"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type CmsSectionListItem = {
  id: string;
  label: string;
  enabled?: boolean;
  subtitle?: string;
};

export function CmsSortableSection({
  item,
  selected,
  onSelect,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  disableDrag,
}: {
  item: CmsSectionListItem;
  selected: boolean;
  onSelect: () => void;
  onToggleEnabled?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableDrag?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: disableDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-1 rounded-xl border px-2 py-2 transition-colors",
        selected
          ? "border-[#FFE149] bg-[#FFF5C7]"
          : "border-transparent bg-transparent hover:bg-[#FFFBEA]",
        isDragging && "z-10 opacity-90 shadow-md",
        item.enabled === false && "opacity-60"
      )}
    >
      <button
        type="button"
        className={cn(
          "mt-0.5 touch-none rounded p-1 text-[#153E73]/40 hover:bg-white hover:text-[#153E73]",
          disableDrag && "invisible"
        )}
        aria-label="拖曳排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <p className="text-[14px] font-semibold text-[#153E73]">{item.label}</p>
        {item.subtitle ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.subtitle}</p>
        ) : null}
      </button>

      <div className="flex shrink-0 flex-col gap-0.5">
        {onToggleEnabled ? (
          <button
            type="button"
            className="rounded p-1 text-[#153E73]/50 hover:bg-white hover:text-[#153E73]"
            aria-label={item.enabled === false ? "顯示" : "隱藏"}
            onClick={onToggleEnabled}
          >
            {item.enabled === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        ) : null}
        {onMoveUp ? (
          <button
            type="button"
            className="rounded p-1 text-[#153E73]/40 hover:bg-white"
            aria-label="上移"
            onClick={onMoveUp}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {onMoveDown ? (
          <button
            type="button"
            className="rounded p-1 text-[#153E73]/40 hover:bg-white"
            aria-label="下移"
            onClick={onMoveDown}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CmsSectionList({
  title,
  items,
  selectedId,
  onSelect,
  onReorder,
  onToggleEnabled,
  onMove,
  disableDrag,
  footer,
  headerExtra,
}: {
  title: string;
  items: CmsSectionListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder?: (orderedIds: string[]) => void;
  onToggleEnabled?: (id: string) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
  disableDrag?: boolean;
  footer?: React.ReactNode;
  headerExtra?: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...ids];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved!);
    onReorder(next);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#E8EBF0] px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-[#153E73]">{title}</p>
          <p className="text-[11px] text-muted-foreground">{items.length} 個區塊</p>
        </div>
        {headerExtra}
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <CmsSortableSection
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={() => onSelect(item.id)}
                onToggleEnabled={onToggleEnabled ? () => onToggleEnabled(item.id) : undefined}
                onMoveUp={onMove ? () => onMove(item.id, -1) : undefined}
                onMoveDown={onMove ? () => onMove(item.id, 1) : undefined}
                disableDrag={disableDrag || !onReorder}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      {footer ? <div className="border-t border-[#E8EBF0] p-2">{footer}</div> : null}
    </div>
  );
}
