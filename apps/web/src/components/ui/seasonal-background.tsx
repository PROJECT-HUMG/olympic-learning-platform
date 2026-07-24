import { useEffect, useRef } from "react";
import { useSeasonStore, type Season } from "@/stores/use-season-store";
import { useThemeStore } from "@/stores/use-theme-store";

class Particle {
  x: number = 0;
  y: number = 0;
  size: number = 0;
  speedX: number = 0;
  speedY: number = 0;
  color: string = "";
  angle: number = 0;
  spin: number = 0;
  season: Season;
  isDark: boolean;

  constructor(canvasWidth: number, canvasHeight: number, season: Season, isDark: boolean) {
    this.season = season;
    this.isDark = isDark;
    this.reset(canvasWidth, canvasHeight, true);
  }

  reset(canvasWidth: number, canvasHeight: number, initial = false) {
    this.x = Math.random() * canvasWidth;
    this.y = initial ? Math.random() * canvasHeight : -10;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.05;

    if (this.season === "winter") {
      this.size = Math.random() * 2.5 + 1;
      this.speedX = (Math.random() - 0.5) * 1;
      this.speedY = Math.random() * 1.5 + 0.5;
      this.color = this.isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(148, 163, 184, 0.5)";
    } else { // Autumn
      this.size = Math.random() * 4 + 3; // Leaf size
      this.speedX = (Math.random() - 0.5) * 2;
      this.speedY = Math.random() * 1.5 + 0.8;
      const hue = Math.floor(Math.random() * 35) + 15; // 15-50 (orange-ish)
      this.color = this.isDark ? `hsla(${hue}, 90%, 65%, 0.6)` : `hsla(${hue}, 80%, 45%, 0.5)`;
    }
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.speedX;
    this.y += this.speedY;
    this.angle += this.spin;

    // Add some swaying motion for petals and leaves
    if (this.season === "autumn") {
      this.x += Math.sin(this.angle) * 0.5;
    } else if (this.season === "winter") {
      this.x += Math.sin(this.angle * 0.5) * 0.2;
    }

    // Reset if out of bounds
    if (this.y > canvasHeight + 20 || this.y < -20 || this.x > canvasWidth + 20 || this.x < -20) {
      this.reset(canvasWidth, canvasHeight, false);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;

    ctx.beginPath();
    if (this.season === "autumn") {
      // Draw leaf shape
      ctx.moveTo(0, -this.size);
      ctx.quadraticCurveTo(this.size, 0, 0, this.size);
      ctx.quadraticCurveTo(-this.size, 0, 0, -this.size);
    } else {
      // Circle for snow
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
}

export function SeasonalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentSeason } = useSeasonStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (currentSeason === "off") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const density = window.innerWidth < 768 ? 30 : 70; // Fewer particles on mobile
      for (let i = 0; i < density; i++) {
        particles.push(new Particle(canvas.width, canvas.height, currentSeason, isDark));
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentSeason, theme]);

  if (currentSeason === "off") {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      aria-hidden="true"
    />
  );
}
