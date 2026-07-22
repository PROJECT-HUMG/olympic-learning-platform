import { useEffect, useRef } from "react";

interface NodePoint {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
}

export function MagneticPhysicsGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let nodes: NodePoint[] = [];

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 160,
    };

    const spacing = 40; // Spacing between grid nodes

    function initGrid() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      nodes = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          nodes.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
          });
        }
      }
    }

    function handleMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function handleMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    function handleResize() {
      initGrid();
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    initGrid();

    // Check dark mode
    const isDark = document.documentElement.classList.contains("dark");
    const nodeColor = isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(100, 116, 139, 0.2)";
    const activeLineColor = isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(37, 99, 235, 0.35)";

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Calculate distance to mouse
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnetic displacement effect
        if (dist < mouse.radius) {
          const angle = Math.atan2(dy, dx);
          const force = (mouse.radius - dist) / mouse.radius;
          const targetX = node.originX - Math.cos(angle) * force * 45;
          const targetY = node.originY - Math.sin(angle) * force * 45;

          node.vx += (targetX - node.x) * 0.2;
          node.vy += (targetY - node.y) * 0.2;
        }

        // Elastic spring physics back to origin
        node.vx += (node.originX - node.x) * 0.08;
        node.vy += (node.originY - node.y) * 0.08;

        // Friction damping
        node.vx *= 0.82;
        node.vy *= 0.82;

        node.x += node.vx;
        node.y += node.vy;

        // Draw node dot
        const distToMouse = Math.sqrt(
          (mouse.x - node.x) ** 2 + (mouse.y - node.y) ** 2
        );
        const isActive = distToMouse < mouse.radius;

        ctx.beginPath();
        ctx.arc(node.x, node.y, isActive ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? activeLineColor : nodeColor;
        ctx.fill();

        // Draw magnetic connection lines near mouse
        if (isActive && distToMouse < 100) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${
            (1 - distToMouse / 100) * 0.25
          })`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
    />
  );
}
