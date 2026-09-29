"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createUuid } from "@/lib/uuid";
import { operationBranches, operationsNodes, type CanvasNode } from "@/lib/operations-tree";
import { downloadOperationsPdf, printOperations } from "@/lib/operations-export";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Icon } from "./icon";

type DragState = {
  id: string;
  startX: number;
  startY: number;
  nodeX: number;
  nodeY: number;
};

type PanState = {
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

const STORAGE_KEY = "operations-playground-canvas-v4";
const PAN_STORAGE_KEY = "operations-playground-pan-v2";
const NODE_WIDTH = 320;
const NODE_HEIGHT = 224;
const VERTICAL_GAP = 70;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

function isCanvasNode(value: unknown): value is CanvasNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<CanvasNode>;
  return (
    typeof node.id === "string" &&
    typeof node.title === "string" &&
    typeof node.description === "string" &&
    (node.parentId === null || typeof node.parentId === "string") &&
    typeof node.x === "number" &&
    typeof node.y === "number"
  );
}

function descendantsOf(nodes: CanvasNode[], id: string): Set<string> {
  const ids = new Set([id]);
  let foundMore = true;
  while (foundMore) {
    foundMore = false;
    for (const node of nodes) {
      if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id);
        foundMore = true;
      }
    }
  }
  return ids;
}

function connectorPath(parent: CanvasNode, child: CanvasNode): string {
  const startX = parent.x + NODE_WIDTH / 2;
  const startY = parent.y + NODE_HEIGHT;
  const endX = child.x + NODE_WIDTH / 2;
  const endY = child.y;
  const midpointY = startY + (endY - startY) / 2;
  return `M ${startX} ${startY} C ${startX} ${midpointY}, ${endX} ${midpointY}, ${endX} ${endY}`;
}

function CanvasCard({
  node,
  index,
  editing,
  dragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  onAddChild,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
}: {
  node: CanvasNode;
  index: number;
  editing: boolean;
  dragging: boolean;
  onDragStart: (event: ReactPointerEvent<HTMLDivElement>, node: CanvasNode) => void;
  onDragMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onAddChild: (id: string) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, title: string, description: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const [draftTitle, setDraftTitle] = useState(node.title);
  const [draftDescription, setDraftDescription] = useState(node.description);

  function startEditing() {
    setDraftTitle(node.title);
    setDraftDescription(node.description);
    onEdit(node.id);
  }

  function save() {
    const title = draftTitle.trim();
    if (!title) return;
    onSave(node.id, title, draftDescription.trim());
  }

  return (
    <article
      className={`absolute flex h-56 w-80 select-none flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-[box-shadow,border-color] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30 ${
        dragging
          ? "z-20 border-foreground/25 shadow-xl"
          : "z-10 hover:border-foreground/20 hover:shadow-md"
      }`}
      style={{ left: node.x, top: node.y }}
      aria-label={`${node.title} node`}
    >
      <div
        className={`flex h-11 touch-none items-center gap-2 border-b bg-muted/45 px-3 dark:border-neutral-700 dark:bg-neutral-800/80 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={(event) => onDragStart(event, node)}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        title="Drag to move"
      >
        <span
          className={`size-2 shrink-0 rounded-full ${
            index % 3 === 0
              ? "bg-blue-500"
              : index % 3 === 1
                ? "bg-violet-500"
                : "bg-emerald-500"
          }`}
        />
        {editing ? (
          <Input
            autoFocus
            size="sm"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") save();
              if (event.key === "Escape") onCancelEdit();
            }}
            aria-label="Node title"
          />
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 cursor-text truncate text-left font-medium outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
            onDoubleClick={startEditing}
            title="Double-click to edit"
          >
            {node.title}
          </button>
        )}
        {!editing && (
          <span className="ml-auto grid grid-cols-3 gap-0.5 opacity-40" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, dot) => (
              <span key={dot} className="size-0.5 rounded-full bg-foreground" />
            ))}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        {editing ? (
          <Textarea
            size="sm"
            className="min-h-0 flex-1"
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") save();
              if (event.key === "Escape") onCancelEdit();
            }}
            placeholder="Add a description…"
            aria-label="Node description"
          />
        ) : (
          <button
            type="button"
            className="min-h-0 flex-1 cursor-text overflow-y-auto text-left text-sm leading-5 text-muted-foreground outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
            onDoubleClick={startEditing}
            title="Double-click to edit"
          >
            {node.description || "Add a description…"}
          </button>
        )}

        <div className="mt-2 flex items-center justify-end gap-0.5">
          {editing ? (
            <>
              <Button size="xs" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
              <Button size="xs" onClick={save} disabled={!draftTitle.trim()}>Save</Button>
            </>
          ) : (
            <>
              <Button size="icon-xs" variant="ghost" aria-label={`Add node below ${node.title}`} title="Add node below" onClick={() => onAddChild(node.id)}>
                <Icon name="plus" size={14} />
              </Button>
              <Button size="icon-xs" variant="ghost" aria-label={`Edit ${node.title}`} title="Edit title and description" onClick={startEditing}>
                <Icon name="edit" size={14} />
              </Button>
              <Button size="icon-xs" variant="ghost" className="text-destructive-foreground" aria-label={`Delete ${node.title}`} title="Delete node and its children" onClick={() => onDelete(node.id)}>
                <Icon name="delete" size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function PlaygroundTree() {
  const [nodes, setNodes] = useState<CanvasNode[]>(operationsNodes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [panning, setPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const panRef = useRef<PanState | null>(null);
  const nodesRef = useRef(nodes);
  const canvasRef = useRef<HTMLElement>(null);
  const zoomRef = useRef(1);

  const zoomAt = useCallback((requestedZoom: number, clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, requestedZoom));
    const previousZoom = zoomRef.current;
    if (Math.abs(nextZoom - previousZoom) < 0.001) return;
    const rect = canvas.getBoundingClientRect();
    const anchorX = clientX - rect.left;
    const anchorY = clientY - rect.top;
    setPanOffset((previous) => ({
      x: anchorX - (anchorX - previous.x) * nextZoom / previousZoom,
      y: anchorY - (anchorY - previous.y) * nextZoom / previousZoom,
    }));
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  }, []);

  function zoomFromCenter(factor: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(zoomRef.current * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(current) && current.every(isCanvasNode)) {
        setNodes(current);
      }
      const savedPan = JSON.parse(localStorage.getItem(PAN_STORAGE_KEY) || "null");
      if (
        savedPan &&
        typeof savedPan.x === "number" &&
        typeof savedPan.y === "number"
      ) {
        setPanOffset({ x: savedPan.x, y: savedPan.y });
        if (typeof savedPan.scale === "number" && Number.isFinite(savedPan.scale)) {
          const savedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, savedPan.scale));
          zoomRef.current = savedZoom;
          setZoom(savedZoom);
        }
      } else {
        const root = operationsNodes[0];
        const width = canvasRef.current?.clientWidth ?? window.innerWidth;
        setPanOffset({ x: width / 2 - root.x - NODE_WIDTH / 2, y: 40 });
      }
    } catch {
      // Keep the starter canvas when locally saved data cannot be read.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  }, [loaded, nodes]);

  useEffect(() => {
    if (loaded) localStorage.setItem(PAN_STORAGE_KEY, JSON.stringify({ ...panOffset, scale: zoom }));
  }, [loaded, panOffset, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function panWithTouchpad(event: WheelEvent) {
      event.preventDefault();
      const unit = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? (canvas?.clientHeight ?? window.innerHeight)
          : 1;
      if (event.ctrlKey) {
        zoomAt(zoomRef.current * Math.exp(-event.deltaY * unit * 0.004), event.clientX, event.clientY);
        return;
      }
      const horizontal = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
      const vertical = event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY;
      setPanOffset((previous) => ({
        x: previous.x - horizontal * unit,
        y: previous.y - vertical * unit,
      }));
    }

    canvas.addEventListener("wheel", panWithTouchpad, { passive: false, capture: true });
    return () => canvas.removeEventListener("wheel", panWithTouchpad, { capture: true });
  }, [zoomAt]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, [contenteditable='true']") ||
          Boolean(target.closest("input, textarea, [contenteditable='true']")))
      );
    }

    function keyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "0") {
        const firstNode = nodesRef.current[0];
        if (!firstNode) return;
        event.preventDefault();
        zoomRef.current = 1;
        setZoom(1);
        const canvas = canvasRef.current;
        setPanOffset({
          x: (canvas?.clientWidth ?? window.innerWidth) / 2 - firstNode.x - NODE_WIDTH / 2,
          y: (canvas?.clientHeight ?? window.innerHeight) / 2 - firstNode.y - NODE_HEIGHT / 2,
        });
        return;
      }
      if (event.code !== "Space" || isTypingTarget(event.target)) return;
      event.preventDefault();
      setSpacePressed(true);
    }

    function keyUp(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      setSpacePressed(false);
      panRef.current = null;
      setPanning(false);
    }

    function windowBlur() {
      setSpacePressed(false);
      panRef.current = null;
      setPanning(false);
    }

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", windowBlur);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", windowBlur);
    };
  }, []);

  const connections = useMemo(
    () =>
      nodes.flatMap((child) => {
        if (!child.parentId) return [];
        const parent = nodes.find((item) => item.id === child.parentId);
        return parent ? [{ parent, child }] : [];
      }),
    [nodes],
  );

  function focusNode(id: string) {
    const node = nodes.find((item) => item.id === id);
    if (!node) return;
    const width = canvasRef.current?.clientWidth ?? window.innerWidth;
    const scale = zoomRef.current;
    setPanOffset({ x: width / 2 - (node.x + NODE_WIDTH / 2) * scale, y: 170 - node.y * scale });
  }

  function addRoot() {
    const id = createUuid();
    setNodes((items) => [
      ...items,
      {
        id,
        title: "New operation",
        description: "",
        parentId: null,
        x: ((canvasRef.current?.clientWidth ?? window.innerWidth) / 2 - panOffset.x) / zoomRef.current - NODE_WIDTH / 2,
        y: ((canvasRef.current?.clientHeight ?? window.innerHeight) / 2 - panOffset.y) / zoomRef.current - NODE_HEIGHT / 2,
      },
    ]);
    setEditingId(id);
  }

  function addChild(parentId: string) {
    const parent = nodes.find((node) => node.id === parentId);
    if (!parent) return;
    const siblingCount = nodes.filter((node) => node.parentId === parentId).length;
    const id = createUuid();
    setNodes((items) => [
      ...items,
      {
        id,
        title: "New operation",
        description: "",
        parentId,
        x: parent.x + siblingCount * (NODE_WIDTH + 40),
        y: parent.y + NODE_HEIGHT + VERTICAL_GAP,
      },
    ]);
    setEditingId(id);
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>, node: CanvasNode) {
    if (spacePressed) return;
    if ((event.target as HTMLElement).closest("button, input, textarea")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
    setDraggingId(node.id);
    setEditingId(null);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const nextX = drag.nodeX + (event.clientX - drag.startX) / zoomRef.current;
    const nextY = drag.nodeY + (event.clientY - drag.startY) / zoomRef.current;
    setNodes((items) =>
      items.map((node) =>
        node.id === drag.id ? { ...node, x: nextX, y: nextY } : node,
      ),
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDraggingId(null);
  }

  function startPan(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("article, button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: panOffset.x,
      offsetY: panOffset.y,
    };
    setPanning(true);
  }

  function movePan(event: ReactPointerEvent<HTMLElement>) {
    const pan = panRef.current;
    if (!pan) return;
    setPanOffset({
      x: pan.offsetX + event.clientX - pan.startX,
      y: pan.offsetY + event.clientY - pan.startY,
    });
  }

  function endPan(event: ReactPointerEvent<HTMLElement>) {
    if (!panRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panRef.current = null;
    setPanning(false);
  }

  return (
    <section
      ref={canvasRef}
      aria-label="Operations playground"
      className={`relative h-svh overflow-hidden bg-muted/15 select-none ${
        panning ? "cursor-grabbing" : spacePressed ? "cursor-grab" : ""
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle, color-mix(in srgb, var(--foreground) 13%, transparent) 1px, transparent 1px)",
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
      }}
      onPointerDown={startPan}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      <nav aria-label="Operations workflows" className="absolute left-3 right-3 top-3 z-30 flex items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          <Button size="xs" variant="secondary" className="shrink-0" onClick={() => focusNode("operations-root")}>Operations</Button>
          {operationBranches.map((branch) => (
            <Button key={branch.id} size="xs" variant="ghost" className="shrink-0" onClick={() => focusNode(branch.id)}>{branch.title}</Button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 border-l pl-2">
          <Button size="xs" variant="ghost" onClick={() => printOperations(nodes)}>Print</Button>
          <Button size="xs" variant="secondary" onClick={() => downloadOperationsPdf(nodes)}>Export PDF</Button>
        </div>
      </nav>
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width="1"
          height="1"
        >
          {connections.map(({ parent, child }) => (
            <g key={`${parent.id}-${child.id}`}>
              <path
                d={connectorPath(parent, child)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-foreground/25 dark:text-foreground/35"
              />
              <circle
                cx={parent.x + NODE_WIDTH / 2}
                cy={parent.y + NODE_HEIGHT}
                r="3"
                fill="currentColor"
                className="text-foreground/30 dark:text-foreground/40"
              />
              <circle
                cx={child.x + NODE_WIDTH / 2}
                cy={child.y}
                r="3"
                fill="currentColor"
                className="text-foreground/30 dark:text-foreground/40"
              />
            </g>
          ))}
        </svg>

        {nodes.map((node, index) => (
          <CanvasCard
            key={node.id}
            node={node}
            index={index}
            editing={editingId === node.id}
            dragging={draggingId === node.id}
            onDragStart={startDrag}
            onDragMove={moveDrag}
            onDragEnd={endDrag}
            onAddChild={addChild}
            onEdit={setEditingId}
            onSave={(id, title, description) => {
              setNodes((items) =>
                items.map((item) =>
                  item.id === id ? { ...item, title, description } : item,
                ),
              );
              setEditingId(null);
            }}
            onCancelEdit={() => setEditingId(null)}
            onDelete={(id) => {
              setNodes((items) => {
                const removed = descendantsOf(items, id);
                return items.filter((item) => !removed.has(item.id));
              });
              setEditingId(null);
            }}
          />
        ))}

      </div>

      {!nodes.length && (
        <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 text-sm text-muted-foreground">
          Add a node to start your playground.
        </p>
      )}

      <p className="pointer-events-none absolute bottom-5 left-4 z-30 rounded-lg bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">Two-finger swipe to move · Pinch to zoom · Drag a card header to move a node</p>

      <div className="absolute bottom-20 right-5 z-30 flex items-center gap-1 rounded-xl border bg-background/95 p-1 shadow-lg" role="group" aria-label="Canvas zoom controls">
        <Button size="icon-xs" variant="ghost" aria-label="Zoom out" title="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => zoomFromCenter(1 / 1.2)}>−</Button>
        <Button size="xs" variant="ghost" className="min-w-12 tabular-nums" aria-label={`Reset zoom, currently ${Math.round(zoom * 100)} percent`} title="Reset zoom to 100%" onClick={() => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) zoomAt(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }}>{Math.round(zoom * 100)}%</Button>
        <Button size="icon-xs" variant="ghost" aria-label="Zoom in" title="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => zoomFromCenter(1.2)}>+</Button>
      </div>

      <Button
        size="icon-xl"
        className="fixed bottom-5 right-5 z-30 rounded-full shadow-lg"
        aria-label="Add operation"
        title="Add operation"
        onClick={addRoot}
      >
        <Icon name="plus" size={18} />
      </Button>
    </section>
  );
}
