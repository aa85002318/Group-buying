"use client";

import { useCallback, useReducer, useRef } from "react";
import type { CmsBlock, CmsDevice, CmsPage, CmsSaveStatus } from "@/types/cms";
import { cloneBlock, createEmptyBlock, reorderBlocks } from "@/lib/cms/cms-defaults";

const HISTORY_LIMIT = 50;

type EditorState = {
  page: CmsPage | null;
  selectedBlockId: string | null;
  activeDevice: CmsDevice;
  showBlockBounds: boolean;
  saveStatus: CmsSaveStatus;
  isDirty: boolean;
  undoStack: CmsPage[];
  redoStack: CmsPage[];
};

type Action =
  | { type: "load"; page: CmsPage }
  | { type: "select"; blockId: string | null }
  | { type: "device"; device: CmsDevice }
  | { type: "bounds"; show: boolean }
  | { type: "status"; status: CmsSaveStatus }
  | { type: "patch_page"; page: CmsPage; recordHistory?: boolean }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "mark_clean" };

function clonePage(page: CmsPage): CmsPage {
  return {
    ...page,
    blocks: page.blocks.map((b) => ({
      ...b,
      settings: { ...b.settings },
      responsiveSettings: b.responsiveSettings
        ? structuredClone(b.responsiveSettings)
        : undefined,
    })),
    settings: { ...page.settings },
  };
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "load":
      return {
        ...state,
        page: clonePage(action.page),
        selectedBlockId: null,
        isDirty: false,
        saveStatus: "idle",
        undoStack: [],
        redoStack: [],
      };
    case "select":
      return { ...state, selectedBlockId: action.blockId };
    case "device":
      return { ...state, activeDevice: action.device };
    case "bounds":
      return { ...state, showBlockBounds: action.show };
    case "status":
      return { ...state, saveStatus: action.status };
    case "mark_clean":
      return { ...state, isDirty: false, saveStatus: "saved" };
    case "patch_page": {
      const undoStack = action.recordHistory !== false && state.page
        ? [...state.undoStack, clonePage(state.page)].slice(-HISTORY_LIMIT)
        : state.undoStack;
      return {
        ...state,
        page: action.page,
        isDirty: true,
        saveStatus: "dirty",
        undoStack,
        redoStack: action.recordHistory !== false ? [] : state.redoStack,
      };
    }
    case "undo": {
      if (!state.page || state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        page: prev,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, clonePage(state.page)].slice(-HISTORY_LIMIT),
        isDirty: true,
        saveStatus: "dirty",
      };
    }
    case "redo": {
      if (!state.page || state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        page: next,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, clonePage(state.page)].slice(-HISTORY_LIMIT),
        isDirty: true,
        saveStatus: "dirty",
      };
    }
    default:
      return state;
  }
}

const initial: EditorState = {
  page: null,
  selectedBlockId: null,
  activeDevice: "mobile",
  showBlockBounds: true,
  saveStatus: "idle",
  isDirty: false,
  undoStack: [],
  redoStack: [],
};

export function useCmsEditor(initialPage?: CmsPage | null) {
  const [state, dispatch] = useReducer(reducer, {
    ...initial,
    page: initialPage ? clonePage(initialPage) : null,
  });
  const pageRef = useRef(state.page);
  pageRef.current = state.page;

  const loadPage = useCallback((page: CmsPage) => {
    dispatch({ type: "load", page });
  }, []);

  const selectBlock = useCallback((blockId: string | null) => {
    dispatch({ type: "select", blockId });
  }, []);

  const setDevice = useCallback((device: CmsDevice) => {
    dispatch({ type: "device", device });
  }, []);

  const setShowBounds = useCallback((show: boolean) => {
    dispatch({ type: "bounds", show });
  }, []);

  const updateBlocks = useCallback((blocks: CmsBlock[], recordHistory = true) => {
    const page = pageRef.current;
    if (!page) return;
    dispatch({
      type: "patch_page",
      recordHistory,
      page: {
        ...page,
        blocks: blocks.map((b, i) => ({ ...b, order: i })),
        blockCount: blocks.length,
      },
    });
  }, []);

  const updateSelectedBlock = useCallback(
    (patch: Partial<CmsBlock>) => {
      const page = pageRef.current;
      if (!page || !state.selectedBlockId) return;
      const blocks = page.blocks.map((b) =>
        b.id === state.selectedBlockId
          ? {
              ...b,
              ...patch,
              settings: patch.settings
                ? { ...b.settings, ...patch.settings }
                : b.settings,
            }
          : b
      );
      updateBlocks(blocks);
    },
    [state.selectedBlockId, updateBlocks]
  );

  const addBlock = useCallback(
    (type: string, atEnd = true) => {
      const page = pageRef.current;
      if (!page) return;
      const block = createEmptyBlock(type, page.blocks.length);
      const blocks = atEnd ? [...page.blocks, block] : [block, ...page.blocks];
      updateBlocks(blocks);
      dispatch({ type: "select", blockId: block.id });
    },
    [updateBlocks]
  );

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const page = pageRef.current;
      if (!page) return;
      const idx = page.blocks.findIndex((b) => b.id === blockId);
      if (idx < 0) return;
      const copy = cloneBlock(page.blocks[idx], idx + 1);
      const blocks = [...page.blocks];
      blocks.splice(idx + 1, 0, copy);
      updateBlocks(blocks);
      dispatch({ type: "select", blockId: copy.id });
    },
    [updateBlocks]
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      const page = pageRef.current;
      if (!page) return;
      updateBlocks(page.blocks.filter((b) => b.id !== blockId));
      if (state.selectedBlockId === blockId) {
        dispatch({ type: "select", blockId: null });
      }
    },
    [state.selectedBlockId, updateBlocks]
  );

  const moveBlock = useCallback(
    (from: number, to: number) => {
      const page = pageRef.current;
      if (!page) return;
      updateBlocks(reorderBlocks(page.blocks, from, to));
    },
    [updateBlocks]
  );

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const markClean = useCallback(() => dispatch({ type: "mark_clean" }), []);
  const setSaveStatus = useCallback(
    (status: CmsSaveStatus) => dispatch({ type: "status", status }),
    []
  );

  const selectedBlock =
    state.page?.blocks.find((b) => b.id === state.selectedBlockId) ?? null;

  return {
    ...state,
    selectedBlock,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    loadPage,
    selectBlock,
    setDevice,
    setShowBounds,
    updateBlocks,
    updateSelectedBlock,
    addBlock,
    duplicateBlock,
    removeBlock,
    moveBlock,
    undo,
    redo,
    markClean,
    setSaveStatus,
  };
}

export type UseCmsEditorReturn = ReturnType<typeof useCmsEditor>;
