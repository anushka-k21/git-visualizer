import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphNodeData, GraphResponse } from '../types';

interface CommitGraphProps {
  graph: GraphResponse;
  selectedCommitHash: string | null;
  focusCommitHash: string | null;
  onSelectCommit: (hash: string | null) => void;
  skipFitView?: boolean;
}

type CommitFlowNode = Node<GraphNodeData, 'commit'>;

const CommitNode = memo(function CommitNode({ data, selected }: NodeProps<CommitFlowNode>) {
  const shortHash = data.hash.slice(0, 7);
  const message =
    data.message.length > 40 ? `${data.message.slice(0, 40)}…` : data.message;
  const isMerge = data.isMergeCommit ?? data.isMerge;

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />

      {data.isBranchHead && data.branchNames.length > 0 && (
        <div className="absolute -top-5 left-0 right-0 flex flex-wrap gap-0.5 justify-center pointer-events-none">
          {data.branchNames.slice(0, 2).map((name) => (
            <span
              key={name}
              className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-emerald-300/90 truncate max-w-[100px]"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <div
        className={[
          'px-3 py-2 rounded-lg border min-w-[160px] max-w-[220px] bg-[var(--bg-secondary)] transition-shadow',
          selected
            ? 'border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.45)]'
            : 'border-[var(--border)]',
          isMerge ? 'border-amber-500/50 border-2' : '',
          data.isBranchHead ? 'ring-1 ring-emerald-500/30' : '',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-xs text-blue-400/90">{shortHash}</span>
          {isMerge && (
            <span className="text-[9px] uppercase tracking-wide px-1 rounded bg-amber-950/60 text-amber-300/90 border border-amber-700/30">
              merge
            </span>
          )}
          {data.isBranchHead && !isMerge && (
            <span className="text-[9px] text-emerald-400/80">●</span>
          )}
        </div>
        <div className="text-xs text-[var(--text-primary)] truncate mt-0.5">{data.author}</div>
        <div className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-snug">{message}</div>
      </div>
    </div>
  );
});

const nodeTypes = {
  commit: CommitNode,
};

function CommitGraphInner({
  graph,
  selectedCommitHash,
  focusCommitHash,
  onSelectCommit,
  skipFitView = false,
}: CommitGraphProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const hasInitialFit = useRef(false);

  const nodes: CommitFlowNode[] = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: 'commit',
        position: node.position,
        data: node.data,
        draggable: false,
        selectable: true,
        selected: node.id === selectedCommitHash,
      })),
    [graph.nodes, selectedCommitHash]
  );

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        style: { stroke: 'rgba(96, 165, 250, 0.45)', strokeWidth: 1.5 },
      })),
    [graph.edges]
  );

  useEffect(() => {
    if (skipFitView || nodes.length === 0) return;
    if (!hasInitialFit.current) {
      hasInitialFit.current = true;
      const timer = window.setTimeout(() => {
        fitView({ padding: 0.15, duration: 200 });
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [nodes.length, fitView, skipFitView]);

  useEffect(() => {
    if (!focusCommitHash) return;
    const timer = window.setTimeout(() => {
      const node = getNode(focusCommitHash);
      if (node) {
        setCenter(node.position.x + 80, node.position.y + 40, {
          zoom: 1,
          duration: 400,
        });
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [focusCommitHash, getNode, setCenter]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelectCommit(node.id === selectedCommitHash ? null : node.id);
    },
    [onSelectCommit, selectedCommitHash]
  );

  const onPaneClick = useCallback(() => {
    onSelectCommit(null);
  }, [onSelectCommit]);

  return (
    <div className="w-full h-full min-h-[480px] rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-primary)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onlyRenderVisibleElements
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} color="rgba(59,130,246,0.06)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export const CommitGraph: React.FC<CommitGraphProps> = (props) => (
  <ReactFlowProvider>
    <CommitGraphInner {...props} />
  </ReactFlowProvider>
);
