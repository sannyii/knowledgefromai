"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface MeteorAnimationProps {
  startRef: React.RefObject<HTMLElement | HTMLButtonElement | null>;
  endRef: React.RefObject<HTMLAnchorElement | null>;
  onComplete?: () => void;
}

// Particle interface for the animation
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Calculate bezier curve point
function getBezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

export function MeteorAnimation({
  startRef,
  endRef,
  onComplete,
}: MeteorAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Positions
  const startPosRef = useRef({ x: 0, y: 0 });
  const endPosRef = useRef({ x: 0, y: 0 });
  const controlPointRef = useRef({ x: 0, y: 0 });
  const buttonSizeRef = useRef({ width: 0, height: 0 });

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Animation phases
  const phaseRef = useRef<'burst' | 'converge' | 'fly' | 'arrive' | 'glow' | 'done'>('burst');

  // Colors for the gradient effect (blue to purple - representing knowledge)
  const colors = [
    'rgba(59, 130, 246, 1)',   // Blue
    'rgba(99, 102, 241, 1)',   // Indigo
    'rgba(139, 92, 246, 1)',   // Purple
    'rgba(168, 85, 247, 1)',   // Violet
  ];

  useEffect(() => {
    if (startRef.current && endRef.current) {
      const startRect = startRef.current.getBoundingClientRect();
      const endRect = endRef.current.getBoundingClientRect();

      const startX = startRect.left + startRect.width / 2;
      const startY = startRect.top + startRect.height / 2;
      const endX = endRect.left + endRect.width / 2;
      const endY = endRect.top + endRect.height / 2;

      startPosRef.current = { x: startX, y: startY };
      endPosRef.current = { x: endX, y: endY };
      buttonSizeRef.current = { width: startRect.width, height: startRect.height };

      // Control point for the arc - higher arc for more dramatic effect
      const midX = (startX + endX) / 2;
      const arcHeight = Math.abs(endX - startX) * 0.5 + 100;
      const midY = Math.min(startY, endY) - arcHeight;
      controlPointRef.current = { x: midX, y: midY };

      // Initialize particles (representing scattered information)
      const numParticles = 20;
      const particles: Particle[] = [];
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        particles.push({
          id: i,
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 3,
          opacity: 1,
          color: colors[i % colors.length],
          trail: [],
        });
      }
      particlesRef.current = particles;

      setIsReady(true);
      startTimeRef.current = Date.now();
    }
  }, [startRef, endRef]);

  useEffect(() => {
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const BURST_DURATION = 600;      // Particles burst outward (slower)
    const CONVERGE_DURATION = 700;   // Particles converge back
    const FLY_DURATION = 1200;       // Fly along the arc (slower)
    const ARRIVE_DURATION = 500;     // Arrive and orbit
    const GLOW_DURATION = 600;       // Final glow effect (slower)

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startPos = startPosRef.current;
      const endPos = endPosRef.current;
      const controlPoint = controlPointRef.current;
      const particles = particlesRef.current;

      // Phase 1: Burst - particles explode outward (scattered information)
      if (elapsed < BURST_DURATION) {
        phaseRef.current = 'burst';
        const progress = elapsed / BURST_DURATION;

        particles.forEach((p, i) => {
          // Move outward
          const burstRadius = 60 * easeOutCubic(progress);
          const angle = (i / particles.length) * Math.PI * 2;

          p.x = startPos.x + Math.cos(angle) * burstRadius;
          p.y = startPos.y + Math.sin(angle) * burstRadius;
          p.opacity = 1;

          // Add trail
          if (p.trail.length > 5) p.trail.shift();
          p.trail.push({ x: p.x, y: p.y, opacity: 0.6 });
        });

        // Draw particles with glow
        particles.forEach(p => {
          // Draw trail
          p.trail.forEach((t, i) => {
            const trailOpacity = (i / p.trail.length) * 0.5 * p.opacity;
            ctx.beginPath();
            ctx.arc(t.x, t.y, p.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace('1)', `${trailOpacity})`);
            ctx.fill();
          });

          // Draw particle with glow
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace('1)', `${p.opacity})`);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }
      // Phase 2: Converge - particles come back together (organizing information)
      else if (elapsed < BURST_DURATION + CONVERGE_DURATION) {
        phaseRef.current = 'converge';
        const progress = (elapsed - BURST_DURATION) / CONVERGE_DURATION;
        const eased = easeInOutQuad(progress);

        particles.forEach((p, i) => {
          // Move back toward center
          const angle = (i / particles.length) * Math.PI * 2;
          const startRadius = 60;
          const currentRadius = startRadius * (1 - eased);

          p.x = startPos.x + Math.cos(angle) * currentRadius;
          p.y = startPos.y + Math.sin(angle) * currentRadius;

          // Shrink trail
          if (p.trail.length > 3) p.trail.shift();
          p.trail.push({ x: p.x, y: p.y, opacity: 0.4 });
        });

        // Draw converging particles
        particles.forEach(p => {
          p.trail.forEach((t, i) => {
            const trailOpacity = (i / p.trail.length) * 0.3;
            ctx.beginPath();
            ctx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace('1)', `${trailOpacity})`);
            ctx.fill();
          });

          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - progress * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw central glow as particles converge
        if (progress > 0.5) {
          const glowSize = 20 * (progress - 0.5) * 2;
          const gradient = ctx.createRadialGradient(
            startPos.x, startPos.y, 0,
            startPos.x, startPos.y, glowSize
          );
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }
      // Phase 3: Fly - consolidated energy flies along arc (knowledge in transit)
      else if (elapsed < BURST_DURATION + CONVERGE_DURATION + FLY_DURATION) {
        phaseRef.current = 'fly';
        const progress = (elapsed - BURST_DURATION - CONVERGE_DURATION) / FLY_DURATION;
        const eased = easeInOutQuad(progress);

        // Calculate position along bezier curve
        const pos = getBezierPoint(eased, startPos, controlPoint, endPos);

        // Create comet effect with multiple layers
        const numTrailPoints = 15;

        // Draw comet trail
        for (let i = numTrailPoints; i >= 0; i--) {
          const trailProgress = Math.max(0, eased - (i * 0.02));
          const trailPos = getBezierPoint(trailProgress, startPos, controlPoint, endPos);
          const trailOpacity = ((numTrailPoints - i) / numTrailPoints) * 0.8;
          const trailSize = 8 + (numTrailPoints - i) * 0.5;

          const gradient = ctx.createRadialGradient(
            trailPos.x, trailPos.y, 0,
            trailPos.x, trailPos.y, trailSize
          );
          gradient.addColorStop(0, `rgba(139, 92, 246, ${trailOpacity})`);
          gradient.addColorStop(0.5, `rgba(99, 102, 241, ${trailOpacity * 0.5})`);
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

          ctx.beginPath();
          ctx.arc(trailPos.x, trailPos.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Draw main comet head
        ctx.shadowColor = 'rgba(139, 92, 246, 1)';
        ctx.shadowBlur = 25;

        const headGradient = ctx.createRadialGradient(
          pos.x, pos.y, 0,
          pos.x, pos.y, 12
        );
        headGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        headGradient.addColorStop(0.3, 'rgba(168, 85, 247, 1)');
        headGradient.addColorStop(0.7, 'rgba(99, 102, 241, 0.8)');
        headGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = headGradient;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sparkle particles around the comet
        const time = elapsed * 0.01;
        for (let i = 0; i < 6; i++) {
          const sparkleAngle = time + (i * Math.PI / 3);
          const sparkleRadius = 15 + Math.sin(time * 2 + i) * 5;
          const sparkleX = pos.x + Math.cos(sparkleAngle) * sparkleRadius;
          const sparkleY = pos.y + Math.sin(sparkleAngle) * sparkleRadius;
          const sparkleOpacity = 0.5 + Math.sin(time * 3 + i) * 0.3;

          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${sparkleOpacity})`;
          ctx.fill();
        }
      }
      // Phase 4: Arrive - orbit around destination (knowledge settling)
      else if (elapsed < BURST_DURATION + CONVERGE_DURATION + FLY_DURATION + ARRIVE_DURATION) {
        phaseRef.current = 'arrive';
        const progress = (elapsed - BURST_DURATION - CONVERGE_DURATION - FLY_DURATION) / ARRIVE_DURATION;

        // Orbiting particles
        const numOrbit = 8;
        const orbitRadius = 25 * (1 - progress * 0.5);

        for (let i = 0; i < numOrbit; i++) {
          const angle = (i / numOrbit) * Math.PI * 2 + progress * Math.PI * 2;
          const x = endPos.x + Math.cos(angle) * orbitRadius;
          const y = endPos.y + Math.sin(angle) * orbitRadius;
          const size = 4 * (1 - progress * 0.5);

          ctx.shadowColor = colors[i % colors.length];
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = colors[i % colors.length];
          ctx.fill();
        }

        // Central glow growing
        const glowSize = 30 * (1 - progress * 0.3);
        const gradient = ctx.createRadialGradient(
          endPos.x, endPos.y, 0,
          endPos.x, endPos.y, glowSize
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.7)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        ctx.arc(endPos.x, endPos.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // Phase 5: Glow - final pulse effect (knowledge crystallized)
      else if (elapsed < BURST_DURATION + CONVERGE_DURATION + FLY_DURATION + ARRIVE_DURATION + GLOW_DURATION) {
        phaseRef.current = 'glow';
        const progress = (elapsed - BURST_DURATION - CONVERGE_DURATION - FLY_DURATION - ARRIVE_DURATION) / GLOW_DURATION;

        // Expanding ring
        const ringRadius = 20 + progress * 40;
        const ringOpacity = 1 - progress;

        ctx.strokeStyle = `rgba(139, 92, 246, ${ringOpacity * 0.8})`;
        ctx.lineWidth = 3 * (1 - progress);
        ctx.beginPath();
        ctx.arc(endPos.x, endPos.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Central glow fading
        const glowSize = 25 * (1 - progress * 0.5);
        const glowOpacity = 1 - progress;

        const gradient = ctx.createRadialGradient(
          endPos.x, endPos.y, 0,
          endPos.x, endPos.y, glowSize
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${glowOpacity})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${glowOpacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        ctx.arc(endPos.x, endPos.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      // Done
      else {
        phaseRef.current = 'done';
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (onComplete) {
          onComplete();
        }
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isReady, onComplete]);

  // Handle mounting for Portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isReady || !isMounted) return null;

  const canvasElement = (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 2147483647,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  );

  return createPortal(canvasElement, document.body);
}
