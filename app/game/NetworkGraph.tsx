"use client";

import * as d3 from "d3";
import { useEffect, useId, useRef } from "react";
import type {
  NetworkConnection,
  NetworkPlayer,
} from "@/app/game/types";

interface NetworkGraphProps {
  connections: NetworkConnection[];
  peerConnections: { from: string; to: string }[];
  player: NetworkPlayer;
  onSelect: (player: NetworkPlayer) => void;
}

interface GraphNode extends NetworkPlayer {
  central: boolean;
  status?: NetworkConnection["status"];
  ring: number;
  x: number;
  y: number;
}

const nodeRadius = 36;
const firstRingRadius = 150;
const ringSpacing = 115;

// Connections arrive oldest first. Ring capacities double each time —
// 5 in the innermost ring, then 10, then 20, and so on.
function ringLayout(connections: NetworkConnection[], centerX: number, centerY: number): GraphNode[] {
  const nodes: GraphNode[] = [];
  let index = 0;
  let ring = 0;
  let capacity = 5;
  while (index < connections.length) {
    const count = Math.min(capacity, connections.length - index);
    const radius = firstRingRadius + ring * ringSpacing;
    for (let i = 0; i < count; i++) {
      const connection = connections[index + i]!;
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / count
        + (ring % 2 === 1 ? Math.PI / count : 0);
      nodes.push({
        ...connection.player,
        central: false,
        status: connection.status,
        ring,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }
    index += count;
    ring += 1;
    capacity *= 2;
  }
  return nodes;
}

export default function NetworkGraph({
  connections,
  peerConnections,
  player,
  onSelect,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedFilterId = `paused-profile-${useId().replaceAll(":", "")}`;

  const rings = Math.ceil(
    Math.log2(Math.max(connections.length, 1) / 5 + 1),
  );
  const outerRadius = rings <= 1
    ? Math.max(firstRingRadius, connections.length ? firstRingRadius : 0)
    : firstRingRadius + (rings - 1) * ringSpacing;
  const extent = outerRadius + nodeRadius + 60;
  const width = Math.max(360, extent * 2);
  const height = Math.max(360, extent * 2);
  const centerX = width / 2;
  const centerY = height / 2;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.append("defs")
      .append("filter")
      .attr("id", pausedFilterId)
      .attr("color-interpolation-filters", "sRGB")
      .append("feColorMatrix")
      .attr("type", "saturate")
      .attr("values", 0);

    const nodes: GraphNode[] = [
      { ...player, central: true, ring: -1, x: centerX, y: centerY },
      ...ringLayout(connections, centerX, centerY),
    ];
    const positionById = new Map(nodes.map((node) => [node.id, node]));

    // Faint grey edges between other players, behind the player's own edges.
    // Their endpoints are re-computed every frame as the rings rotate.
    const peerLines = svg
      .append("g")
      .attr("aria-hidden", "true")
      .selectAll("line")
      .data(peerConnections
        .map((link) => ({
          a: positionById.get(link.from),
          b: positionById.get(link.to),
        }))
        .filter((link): link is { a: GraphNode; b: GraphNode } =>
          Boolean(link.a && link.b)))
      .join("line")
      .attr("stroke", "#9ca3af")
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round");

    // Each ring gets its own group so it can rotate independently.
    const ringGroups: d3.Selection<SVGGElement, unknown, null, undefined>[] = [];
    const ringAngles: number[] = [];
    const ringCount = Math.max(...nodes.map((node) => node.ring), -1) + 1;
    for (let ring = 0; ring < ringCount; ring++) {
      ringGroups.push(svg.append("g"));
      ringAngles.push(0);
    }

    for (const [ring, ringGroup] of ringGroups.entries()) {
      const ringNodes = nodes.filter((node) => node.ring === ring);
      ringGroup
        .append("g")
        .attr("aria-hidden", "true")
        .selectAll("line")
        .data(ringNodes)
        .join("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", (node) => node.x)
        .attr("y2", (node) => node.y)
        .attr("stroke", "#be123c")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", (node) =>
          node.status === "planned" ? "6 10" : null,
        );
    }

    // Nodes live outside the rotating ring groups so only their positions
    // move — portraits and names stay upright.
    const nodeSelection = svg
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("transform", (node) => `translate(${node.x},${node.y})`)
      .attr("role", "button")
      .attr("tabindex", 0)
      .style("cursor", "pointer")
      .on("click", (_event, node) => onSelect(node));

    nodeSelection
      .append("circle")
      .attr("r", nodeRadius + 4)
      .attr("fill", (node) => node.paused ? (node.central ? "#9ca3af" : "#e5e7eb") : node.central ? "#f43f5e" : "#ffffff")
      .attr("stroke", (node) => node.paused ? "#6b7280" : "#be123c")
      .attr("stroke-width", 3);

    nodeSelection
      .append("clipPath")
      .attr("id", (node) => `network-profile-${node.id}`)
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
      .attr("clip-path", (node) => `url(#network-profile-${node.id})`);

    nodeSelection
      .filter((node) => node.central || node.status === "confirmed")
      .append("text")
      .attr("y", nodeRadius + 25)
      .attr("text-anchor", "middle")
      .attr("font-size", 22)
      .attr("font-weight", 700)
      .attr("fill", (node) => node.paused ? "#6b7280" : "#220055")
      .attr("pointer-events", "none")
      .text((node) => (node.central ? "You" : (node.name ?? "")));

    // Each ring slowly rocks between -10° and +10° in a sine wave, alternating
    // direction — innermost clockwise first. Peer-edge endpoints follow their
    // nodes' current rotated positions.
    const rotated = (node: GraphNode) => {
      const degrees = ringAngles[node.ring] ?? 0;
      if (degrees === 0) return node;
      const radians = (degrees * Math.PI) / 180;
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      return {
        x: centerX + dx * Math.cos(radians) - dy * Math.sin(radians),
        y: centerY + dx * Math.sin(radians) + dy * Math.cos(radians),
      };
    };
    let frame = 0;
    const animate = (time: number) => {
      const phase = ((time % 16000) / 16000) * Math.PI * 2;
      ringGroups.forEach((ringGroup, ring) => {
        const degrees = (ring % 2 === 0 ? 1 : -1) * 10 * Math.sin(phase);
        ringAngles[ring] = degrees;
        ringGroup.attr("transform", `rotate(${degrees} ${centerX} ${centerY})`);
      });
      peerLines
        .attr("x1", (link) => rotated(link.a).x)
        .attr("y1", (link) => rotated(link.a).y)
        .attr("x2", (link) => rotated(link.b).x)
        .attr("y2", (link) => rotated(link.b).y);
      nodeSelection.attr("transform", (node) => {
        const position = rotated(node);
        return `translate(${position.x},${position.y})`;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [connections, peerConnections, player, pausedFilterId, centerX, centerY, onSelect]);

  // Start scrolled so the player's own node sits in the middle of the view.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
  }, [width, height]);

  return (
    <div
      ref={scrollRef}
      className="max-h-[65vh] w-full overflow-auto rounded-3xl bg-white/60 shadow-inner"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label="Your connection network"
      />
    </div>
  );
}
