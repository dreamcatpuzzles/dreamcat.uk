"use client";

import * as d3 from "d3";
import { useEffect, useId, useRef, useState } from "react";
import type { Connection, Delivery, Package, Player } from "@/app/admin/types";

export interface GraphDelivery {
  package: Pick<Package, "id" | "name">;
  owner: Pick<Player, "id">;
  nextTarget?: Pick<Player, "id"> | null;
  journey: string[];
  route?: Delivery["route"];
  status: Delivery["status"];
}

interface NetworkGraphProps {
  players: Player[];
  connections: Connection[];
  deliveries: GraphDelivery[];
  onCreateConnection?: (playerOneId: string, playerTwoId: string) => void;
  onUpdateConnection?: (
    connection: Connection,
    status: Connection["status"],
  ) => void;
  onDeleteConnection?: (connection: Connection) => void;
  centerOnPlayerId?: string;
  isPublicView?: boolean;
  focusRequest?: { playerId: string; seq: number } | null;
  glowRequest?: { playerId: string; seq: number } | null;
}

interface GraphNode extends d3.SimulationNodeDatum, Player {
  x: number;
  y: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  connection: Connection;
}

const width = 800;
const height = 600;
const nodeRadius = 40;
const centeredScale = 1.5;

export function getCentralLayout(
  players: Pick<Player, "id">[],
  connections: Pick<Connection, "playerOne" | "playerTwo">[],
  selectedPlayerId: string,
) {
  const neighbors = new Map(players.map((player) => [player.id, new Set<string>()]));
  if (!neighbors.has(selectedPlayerId)) return null;
  for (const connection of connections) {
    const first = neighbors.get(connection.playerOne.id);
    const second = neighbors.get(connection.playerTwo.id);
    if (!first || !second) continue;
    first.add(connection.playerTwo.id);
    second.add(connection.playerOne.id);
  }
  const distances = new Map([[selectedPlayerId, 0]]);
  const queue = [selectedPlayerId];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const neighbor of neighbors.get(current)!) {
      if (distances.has(neighbor)) continue;
      distances.set(neighbor, distances.get(current)! + 1);
      queue.push(neighbor);
    }
  }
  const groups = new Map<number, string[]>();
  for (const player of players) {
    if (player.id === selectedPlayerId) continue;
    const distance = distances.get(player.id) ?? Infinity;
    if (!groups.has(distance)) groups.set(distance, []);
    groups.get(distance)!.push(player.id);
  }
  const positions = new Map([[selectedPlayerId, { x: width / 2, y: height / 2 }]]);
  const rings: { radius: number; distance: number | null }[] = [];
  let radius = 0;
  for (const [distance, ids] of [...groups].sort(([first], [second]) => first - second)) {
    ids.sort();
    radius = Math.max(radius + 150, ids.length > 1 ? (nodeRadius * 2 + 50) / (2 * Math.sin(Math.PI / ids.length)) : 0);
    rings.push({ radius, distance: Number.isFinite(distance) ? distance : null });
    ids.forEach((id, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / ids.length;
      positions.set(id, {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      });
    });
  }
  return { positions, rings };
}

function nodeFill(node: GraphNode, selectedPlayerId: string | null): string {
  const selected = node.id === selectedPlayerId;
  return node.paused ? (selected ? "#9ca3af" : "#e5e7eb") : selected ? "#f43f5e" : "#ffffff";
}

function findConnection(
  connections: Connection[],
  firstId: string,
  secondId: string,
) {
  return connections.find(
    (connection) =>
      (connection.playerOne.id === firstId &&
        connection.playerTwo.id === secondId) ||
      (connection.playerOne.id === secondId &&
        connection.playerTwo.id === firstId),
  );
}

export default function NetworkGraph({
  players,
  connections,
  deliveries,
  onCreateConnection,
  onUpdateConnection,
  onDeleteConnection,
  centerOnPlayerId,
  isPublicView = false,
  focusRequest = null,
  glowRequest = null,
}: NetworkGraphProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pausedFilterId = `paused-profile-${useId().replaceAll(":", "")}`;
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const positionsRef = useRef(new Map<string, { x: number; y: number }>());
  const normalPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const normalTransformRef = useRef<d3.ZoomTransform | null>(null);
  const panTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const centralViewRef = useRef<{ playerId: string; radius: number } | null>(null);
  const [layout, setLayout] = useState<"normal" | "central">("normal");
  const previewTargetRef = useRef<{
    x: number;
    y: number;
    hoveredId: string | null;
  } | null>(null);
  const shiftHeldRef = useRef(false);
  const refreshPreviewRef = useRef<() => void>(() => {});
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    null,
  );
  const centralPlayerId = !isPublicView && layout === "central" ? selectedPlayerId : null;
  const selectedPlayerIdRef = useRef(selectedPlayerId);
  const connectionsRef = useRef(connections);
  const callbacksRef = useRef({
    onCreateConnection,
    onUpdateConnection,
    onDeleteConnection,
  });

  useEffect(() => {
    selectedPlayerIdRef.current = selectedPlayerId;
    connectionsRef.current = connections;
    callbacksRef.current = {
      onCreateConnection,
      onUpdateConnection,
      onDeleteConnection,
    };
  });

  // Set up zoom/pan once. Gestures that start on a node are ignored so that
  // clicking (or click-dragging) a player only selects it.
  useEffect(() => {
    if (isPublicView || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .filter(
        (event: Event) =>
          event.type === "wheel" ||
          (!(event.target as Element).closest(".graph-node") &&
            !(event as MouseEvent).button),
      )
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        panTransformRef.current = event.transform;
        svg.select(".graph-root").attr("transform", event.transform.toString());
      });
    svg.call(zoom).on("dblclick.zoom", null);
    const graphNode = graphRef.current;

    // Yes, this is hacky AF.
    // If it causes any problems just rip it out and replace it with some buttons.
    const preventPageScroll = (event: WheelEvent) => event.preventDefault();
    graphNode?.addEventListener("wheel", preventPageScroll, {
      capture: true,
      passive: false,
    });
    let previousOverflow: string | null = null;
    const lockPageScroll = () => {
      if (previousOverflow !== null) return;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    };
    const unlockPageScroll = () => {
      if (previousOverflow === null) return;
      document.documentElement.style.overflow = previousOverflow;
      previousOverflow = null;
    };
    graphNode?.addEventListener("pointerenter", lockPageScroll);
    graphNode?.addEventListener("pointerleave", unlockPageScroll);
    zoomRef.current = zoom;
    return () => {
      graphNode?.removeEventListener("wheel", preventPageScroll, true);
      graphNode?.removeEventListener("pointerenter", lockPageScroll);
      graphNode?.removeEventListener("pointerleave", unlockPageScroll);
      unlockPageScroll();
    };
  }, [isPublicView]);

  // Draw the graph. Only redraws when players or connections change, and
  // keeps existing node positions so the layout doesn't jump.
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.select(".graph-root").remove();
    const root = svg
      .append("g")
      .attr("class", "graph-root")
      .attr("transform", panTransformRef.current.toString());
    root.append("defs")
      .append("filter")
      .attr("id", pausedFilterId)
      .attr("color-interpolation-filters", "sRGB")
      .append("feColorMatrix")
      .attr("type", "saturate")
      .attr("values", 0);

    const positions = positionsRef.current;
    const normalPositions = normalPositionsRef.current;
    const centralLayout = centralPlayerId ? getCentralLayout(players, connections, centralPlayerId) : null;
    const layoutPositions = centralLayout?.positions ?? normalPositions;
    const hasExistingLayout = players.some((player) => normalPositions.has(player.id));
    const nodes: GraphNode[] = players.map((player) => {
      const position = layoutPositions.get(player.id) ?? {
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 + (Math.random() - 0.5) * 200,
      };
      return { ...player, ...position };
    });
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    if (centralLayout) {
      root.append("g")
        .attr("pointer-events", "none")
        .selectAll("circle")
        .data(centralLayout.rings)
        .join("circle")
        .attr("class", "distance-ring")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", (ring) => ring.radius)
        .attr("fill", "none")
        .attr("stroke", "#9ca3af")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-dasharray", (ring) => ring.distance === null ? "4 8" : null)
        .append("title")
        .text((ring) => ring.distance === null ? "Disconnected players" : `${ring.distance} connections away`);
    }
    const links: GraphLink[] = connections.flatMap((connection) => {
      const source = nodesById.get(connection.playerOne.id);
      const target = nodesById.get(connection.playerTwo.id);
      return source && target ? [{ source, target, connection }] : [];
    });
    const packageSlots = new Map<string, number>();
    const packages = deliveries.flatMap((delivery) => {
      if (delivery.status === "confirmed") return [];
      const current = nodesById.get(delivery.owner.id);
      if (!current) return [];
      const slot = packageSlots.get(current.id) ?? 0;
      packageSlots.set(current.id, slot + 1);
      return [{
        delivery,
        current,
        slot,
        route: delivery.journey
          .map((id) => nodesById.get(id))
          .filter((node): node is GraphNode => Boolean(node)),
      }];
    });

    // A duck rides the edge the package is currently travelling: from the
    // last visited player (journey tail) to the next target.
    const duckItems = packages.flatMap(({ delivery }) => {
      const holder = nodesById.get(delivery.journey.at(-1) ?? delivery.owner.id);
      if (!holder) return [];
      const nextId = delivery.nextTarget?.id ?? delivery.route?.[delivery.journey.length];
      const next = nextId ? nodesById.get(nextId) : undefined;
      return [{ delivery, holder, next: next === holder ? undefined : next }];
    });

    const routeSteps = isPublicView ? [] : packages.flatMap(({ delivery }) => {
      const route = delivery.route?.length ? delivery.route : delivery.journey;
      return route.slice(1).flatMap((id, index) => {
        const source = nodesById.get(route[index]);
        const target = nodesById.get(id);
        return source && target ? [{
          delivery,
          source,
          target,
          completed: index < delivery.journey.length - 1,
        }] : [];
      });
    });

    const linkGroups = root
      .append("g")
      .selectAll<SVGGElement, GraphLink>("g")
      .data(links)
      .join("g")
      .style("cursor", isPublicView ? "default" : "pointer")
      .on("click", (event: MouseEvent, link) => {
        if (isPublicView || !event.shiftKey) return;
        const { playerOne, playerTwo } = link.connection;
        if (
          window.confirm(
            `Delete the connection ${playerOne.name} ↔ ${playerTwo.name}?`,
          )
        ) {
          callbacksRef.current.onDeleteConnection?.(link.connection);
        }
      });
    const visibleLines = linkGroups
      .append("line")
      .attr("stroke", "#be123c")
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .attr("stroke-dasharray", (link) =>
        link.connection.status === "planned" ? "6 10" : null,
      );
    const hitLines = linkGroups
      .append("line")
      .attr("stroke", "transparent")
      .attr("stroke-width", 16);

    const packageTrails = root
      .append("g")
      .attr("pointer-events", "none")
      .selectAll<SVGPathElement, (typeof packages)[number]>("path")
      .data(packages)
      .join("path")
      .attr("class", "package-trail")
      .attr("fill", "none")
      .attr("stroke", (_package, index) => d3.schemeTableau10[index % 10])
      .attr("stroke-width", 6)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("stroke-opacity", 0.8);

    const routeLines = root
      .append("g")
      .attr("pointer-events", "none")
      .selectAll<SVGLineElement, (typeof routeSteps)[number]>("line")
      .data(routeSteps)
      .join("line")
      .attr("class", "package-route-step")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 6)
      .attr("stroke-linecap", "round")
      .attr("stroke-dasharray", (step) => step.completed ? null : "1 12")
      .attr("opacity", 0);

    root
      .append("line")
      .attr("class", "connection-preview")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("pointer-events", "none")
      .attr("display", "none");

    const nodeSelection = root
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", "graph-node")
      .style("cursor", isPublicView ? "default" : "pointer")
      .on("click", (event: MouseEvent, node) => {
        if (isPublicView) return;
        const selectedId = selectedPlayerIdRef.current;
        if (!event.shiftKey || !selectedId) {
          setSelectedPlayerId(node.id);
          return;
        }
        if (selectedId === node.id) return;

        const { onCreateConnection, onUpdateConnection, onDeleteConnection } =
          callbacksRef.current;
        const existing = findConnection(
          connectionsRef.current,
          selectedId,
          node.id,
        );
        if (!existing) onCreateConnection?.(selectedId, node.id);
        else if (existing.status === "planned") {
          onUpdateConnection?.(existing, "confirmed");
        } else onDeleteConnection?.(existing);
      });

    nodeSelection
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", nodeRadius + 4)
      .attr("fill", (node) => nodeFill(node, selectedPlayerIdRef.current))
      .attr("stroke", (node) => node.paused ? "#6b7280" : "#be123c")
      .attr("stroke-width", 3);

    nodeSelection
      .append("clipPath")
      .attr("id", (node) => `admin-profile-${node.id}`)
      .append("circle")
      .attr("r", nodeRadius);

    nodeSelection
      .append("image")
      .attr("href", (node) => node.profilePictureUrl)
      .attr("filter", (node) => node.paused ? `url(#${pausedFilterId})` : null)
      .attr("x", -nodeRadius)
      .attr("y", -nodeRadius)
      .attr("width", nodeRadius * 2)
      .attr("height", nodeRadius * 2)
      .attr("preserveAspectRatio", "xMidYMid slice")
      .attr("clip-path", (node) => `url(#admin-profile-${node.id})`);

    if (!isPublicView) {
      nodeSelection
        .on("mouseenter", (_event, node) => {
          linkGroups.attr("opacity", (link) =>
            link.source.id === node.id || link.target.id === node.id ? 1 : 0.0);
        })
        .on("mouseleave", () => linkGroups.attr("opacity", 1))
        .append("text")
        .attr("y", nodeRadius + 25)
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("font-weight", 700)
        .attr("fill", (node) => node.paused ? "#6b7280" : "#facc15")
        .text((node) => node.name);
    }

    const packageMarkers = root
      .append("g")
      .selectAll<SVGGElement, (typeof packages)[number]>("g")
      .data(packages)
      .join("g")
      .attr("class", "package-marker");
    packageMarkers
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("rx", 3)
      .attr("fill", (_package, index) => d3.schemeTableau10[index % 10])
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);
    packageMarkers
      .append("title")
      .text(({ delivery }) => isPublicView ? "Package" : `${delivery.package.name} (${delivery.package.id})`);

    const duckMarkers = root
      .append("g")
      .attr("pointer-events", "none")
      .selectAll<SVGGElement, (typeof duckItems)[number]>("g")
      .data(duckItems)
      .join("g")
      .attr("class", "duck-marker");
    duckMarkers
      .append("image")
      .attr("href", "/duck_icon.svg")
      .attr("x", -16)
      .attr("y", -16)
      .attr("width", 32)
      .attr("height", 32);

    function highlightPackage(delivery: GraphDelivery | null) {
      const route = new Set(delivery?.route?.length ? delivery.route : delivery?.journey ?? []);
      packageTrails.attr("stroke-opacity", delivery ? 0.08 : 0.8);
      routeLines.attr("opacity", ({ delivery: item }) =>
        item.package.id === delivery?.package.id ? 1 : 0);
      linkGroups.attr("opacity", delivery ? 0.12 : 1);
      packageMarkers.attr("opacity", ({ delivery: item }) =>
        !delivery || item.package.id === delivery.package.id ? 1 : 0.3);
      duckMarkers.attr("opacity", ({ delivery: item }) =>
        !delivery || item.package.id === delivery.package.id ? 1 : 0.15);
      nodeSelection.selectAll<SVGElement, GraphNode>("image, text")
        .attr("opacity", (node) => !delivery || route.has(node.id) ? 1 : 0.15);
      nodeSelection.select<SVGCircleElement>(".node-circle")
        .attr("stroke-opacity", (node) => !delivery || route.has(node.id) ? 1 : 0.15)
        .attr("stroke", (node) => route.has(node.id) ? "#2563eb" : node.paused ? "#6b7280" : "#be123c")
        .attr("stroke-width", (node) =>
          node.id === delivery?.owner.id ? 8 : route.has(node.id) ? 5 : 3);
    }
    if (!isPublicView) {
      packageMarkers
        .style("cursor", "help")
        .on("mouseenter", (_event, item) => highlightPackage(item.delivery))
        .on("mouseleave", () => highlightPackage(null));
    }

    function render() {
      for (const lines of [visibleLines, hitLines]) {
        lines
          .attr("x1", (link) => link.source.x)
          .attr("y1", (link) => link.source.y)
          .attr("x2", (link) => link.target.x)
          .attr("y2", (link) => link.target.y);
      }
      routeLines
        .attr("x1", (step) => step.source.x)
        .attr("y1", (step) => step.source.y)
        .attr("x2", (step) => step.target.x)
        .attr("y2", (step) => step.target.y);
      nodeSelection.attr(
        "transform",
        (node) => `translate(${node.x},${node.y})`,
      );
      packageTrails.attr("d", ({ route }) => d3.line<GraphNode>()
        .x((node) => node.x)
        .y((node) => node.y)(route));
      packageMarkers.attr("transform", ({ current, slot }) =>
        `translate(${current.x + nodeRadius + 10 + (slot % 3) * 21},${current.y - nodeRadius + Math.floor(slot / 3) * 21})`);
      for (const node of nodes) {
        const position = { x: node.x, y: node.y };
        positions.set(node.id, position);
        if (!centralLayout) normalPositions.set(node.id, position);
      }
      refreshPreviewRef.current();
    }

    if (centralLayout && centralPlayerId && zoomRef.current) {
      normalTransformRef.current ??= d3.zoomTransform(svgRef.current);
      const radius = centralLayout.rings.at(-1)?.radius ?? 0;
      if (centralViewRef.current?.playerId !== centralPlayerId || centralViewRef.current.radius !== radius) {
        const scale = Math.min(1, (Math.min(width, height) - 80) / (2 * (radius + nodeRadius + 30)));
        zoomRef.current.scaleExtent([Math.min(0.3, scale), 3]);
        svg.interrupt().call(
          zoomRef.current.transform,
          d3.zoomIdentity
            .translate(width / 2 * (1 - scale), height / 2 * (1 - scale))
            .scale(scale),
        );
      }
      centralViewRef.current = { playerId: centralPlayerId, radius };
    } else if (normalTransformRef.current && zoomRef.current) {
      zoomRef.current.scaleExtent([0.3, 3]);
      svg.interrupt().call(zoomRef.current.transform, normalTransformRef.current);
      normalTransformRef.current = null;
      centralViewRef.current = null;
    }

    const simulation = centralLayout ? null : d3
      .forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).distance(220))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius + 25))
      .alpha(hasExistingLayout ? 0.1 : 1)
      .on("tick", render);
    render();

    const duckTimer = d3.timer((elapsed) => {
      duckMarkers.attr("transform", ({ holder, next }, index) => {
        const x = next ? (holder.x + next.x) / 2 : holder.x;
        const y = next ? (holder.y + next.y) / 2 : holder.y;
        return `translate(${x},${y + Math.sin(elapsed / 400 + index * 1.3) * 4})`;
      });
    });

    return () => {
      simulation?.stop();
      duckTimer.stop();
    };
  }, [players, connections, deliveries, isPublicView, pausedFilterId, centralPlayerId]);

  // Pan the view to centre a player over five seconds when requested.
  useEffect(() => {
    const svgNode = svgRef.current;
    if (!focusRequest || !svgNode) return;
    const position = positionsRef.current.get(focusRequest.playerId);
    if (!position) return;
    const scale = panTransformRef.current.k;
    const target = d3.zoomIdentity
      .translate(width / 2 - position.x * scale, height / 2 - position.y * scale)
      .scale(scale);
    const svg = d3.select(svgNode);
    if (zoomRef.current) {
      svg
        .transition()
        .duration(5000)
        .ease(d3.easeCubicInOut)
        .call(zoomRef.current.transform, target);
      panTransformRef.current = target;
    } else {
      const from = panTransformRef.current;
      const x = d3.interpolateNumber(from.x, target.x);
      const y = d3.interpolateNumber(from.y, target.y);
      svg
        .select<SVGGElement>(".graph-root")
        .transition()
        .duration(5000)
        .ease(d3.easeCubicInOut)
        .attrTween("transform", () => (t) => {
          panTransformRef.current = d3.zoomIdentity
            .translate(x(t), y(t))
            .scale(scale);
          return panTransformRef.current.toString();
        });
    }
  }, [focusRequest]);

  // Flash a yellow glow around a node for two seconds when requested
  // (e.g. its proof of delivery was accepted).
  useEffect(() => {
    const svgNode = svgRef.current;
    if (!glowRequest || !svgNode) return;
    const node = d3
      .select(svgNode)
      .selectAll<SVGGElement, GraphNode>(".graph-node")
      .filter((item) => item.id === glowRequest.playerId);
    if (node.empty()) return;
    const glow = node
      .insert("g", ":first-child")
      .attr("pointer-events", "none");
    glow
      .append("circle")
      .attr("r", nodeRadius + 16)
      .attr("fill", "none")
      .attr("stroke", "#facc15")
      .attr("stroke-width", 5)
      .attr("stroke-opacity", 0.35);
    glow
      .append("circle")
      .attr("r", nodeRadius + 8)
      .attr("fill", "none")
      .attr("stroke", "#facc15")
      .attr("stroke-width", 10);
    glow
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .attr("opacity", 1)
      .transition()
      .delay(1000)
      .duration(500)
      .attr("opacity", 0)
      .remove();
  }, [glowRequest]);

  useEffect(() => {
    if (isPublicView || !svgRef.current) return;
    const svgNode = svgRef.current;
    const line = () =>
      d3.select(svgNode).select<SVGLineElement>(".connection-preview");
    const refreshPreview = () => {
      const target = previewTargetRef.current;
      const source =
        selectedPlayerId && positionsRef.current.get(selectedPlayerId);
      if (!shiftHeldRef.current || !source || !target) {
        line().attr("display", "none");
        return;
      }
      const end = target.hoveredId
        ? positionsRef.current.get(target.hoveredId) ?? target
        : target;
      line()
        .attr("x1", source.x)
        .attr("y1", source.y)
        .attr("x2", end.x)
        .attr("y2", end.y)
        .attr("display", null);
    };
    refreshPreviewRef.current = refreshPreview;
    const onMove = (event: MouseEvent) => {
      const [x, y] = d3.zoomTransform(svgNode).invert(d3.pointer(event, svgNode));
      const hovered = (event.target as Element).closest(".graph-node");
      const hoveredId = hovered
        ? (d3.select(hovered).datum() as GraphNode).id
        : null;
      previewTargetRef.current = { x, y, hoveredId };
      shiftHeldRef.current = event.shiftKey;
      refreshPreview();
    };
    const onLeave = () => {
      previewTargetRef.current = null;
      refreshPreview();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey) return;
      shiftHeldRef.current = true;
      refreshPreview();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Shift") return;
      shiftHeldRef.current = false;
      refreshPreview();
    };
    const onBlur = () => {
      shiftHeldRef.current = false;
      refreshPreview();
    };
    svgNode.addEventListener("mousemove", onMove);
    svgNode.addEventListener("mouseleave", onLeave);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    refreshPreview();
    return () => {
      svgNode.removeEventListener("mousemove", onMove);
      svgNode.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      refreshPreviewRef.current = () => {};
    };
  }, [selectedPlayerId, isPublicView]);

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGCircleElement, GraphNode>(".node-circle")
      .attr("fill", (node) => nodeFill(node, selectedPlayerId));
  }, [selectedPlayerId]);

  useEffect(() => {
    if (isPublicView || !centerOnPlayerId || !svgRef.current || !zoomRef.current) return;
    const position = positionsRef.current.get(centerOnPlayerId);
    if (!position) return;
    setSelectedPlayerId(centerOnPlayerId);
    if (layout === "central") return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity
          .translate(
            width / 2 - position.x * centeredScale,
            height / 2 - position.y * centeredScale,
          )
          .scale(centeredScale),
      );
  }, [centerOnPlayerId, isPublicView, layout]);

  const selectedPlayer = players.find(
    (player) => player.id === selectedPlayerId,
  );
  const selectedConnections = selectedPlayer
    ? connections.filter(
        (connection) =>
          connection.playerOne.id === selectedPlayer.id ||
          connection.playerTwo.id === selectedPlayer.id,
      )
    : [];

  return (
    <div className={isPublicView ? "h-full" : "space-y-4"}>
      {!isPublicView && (
        <div className="flex items-center gap-2">
          Layout
          <button
            type="button"
            onClick={() => setLayout(layout === "normal" ? "central" : "normal")}
            className="rounded bg-gray-700 px-3 py-2 capitalize text-gray-100"
          >
            {layout}
          </button>
        </div>
      )}
      {!isPublicView && <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
        <p>
          <span className="font-semibold">Click</span> a player to select them
        </p>
        <p>
          <span className="font-semibold">Shift+click</span> another player to
          cycle planned → confirmed → removed
        </p>
        <p>
          <span className="font-semibold">Shift+click</span> a connection to
          delete it
        </p>
        <p>
          <span className="font-semibold">Drag</span> the background to pan,
          scroll to zoom
        </p>
      </div>}
      <div ref={graphRef} className={isPublicView ? "h-full min-h-0" : "overscroll-contain touch-none"}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Player connection network"
          className={`block w-full select-none bg-gray-700 ${isPublicView ? "pointer-events-none h-full min-h-0" : "h-auto max-h-[70vh] rounded-3xl shadow-inner"}`}
        />
      </div>
      {!isPublicView && selectedPlayer && (
        <div className="rounded-xl bg-gray-800 p-5 shadow">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPlayer.profilePictureUrl}
              alt={`${selectedPlayer.name}'s profile`}
              className="h-40 w-40 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="mb-2 text-2xl font-bold">{selectedPlayer.name}</h3>
              <p className="mb-3">ID: {selectedPlayer.id}</p>
              <p className="font-semibold">Connections:</p>
              {selectedConnections.length === 0 ? (
                <p>None</p>
              ) : (
                <ul className="list-inside list-disc">
                  {selectedConnections.map((connection) => {
                    const other =
                      connection.playerOne.id === selectedPlayer.id
                        ? connection.playerTwo
                        : connection.playerOne;
                    return (
                      <li key={connection.id}>
                        {other.name} ({other.id}) –{" "}
                        <span className="capitalize">{connection.status}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPlayerId(null)}
            className="mt-3 rounded bg-rose-500 px-4 py-2 text-white"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
