"use client";

import React, { useState, useEffect, useRef } from "react";

interface MeteorAnimationProps {
  startRef: React.RefObject<HTMLElement | HTMLButtonElement | null>;
  endRef: React.RefObject<HTMLAnchorElement | null>;
}

// 计算二次贝塞尔曲线上的点（抛物线）
function getQuadraticBezierPoint(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  
  return {
    x: mt2 * x1 + 2 * mt * t * x2 + t2 * x3,
    y: mt2 * y1 + 2 * mt * t * y2 + t2 * y3,
  };
}

export function MeteorAnimation({
  startRef,
  endRef,
}: MeteorAnimationProps) {
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState({ x: 0, y: 0 });
  const [controlPoint, setControlPoint] = useState({ x: 0, y: 0 });
  const [buttonSize, setButtonSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'rotating' | 'flying' | 'arriving' | 'done'>('rotating');
  
  // 第一阶段：按钮周围的小圆点（带螺旋扩散）
  const [rotatingDots, setRotatingDots] = useState<Array<{ angle: number; opacity: number; radius: number }>>([]);
  
  // 第二阶段：飞行的队列
  const [flyingDots, setFlyingDots] = useState<Array<{
    id: number;
    progress: number;
    x: number;
    y: number;
    opacity: number;
  }>>([]);
  
  // 第三阶段：到达目标后的旋转
  const [arrivingDots, setArrivingDots] = useState<Array<{
    id: number;
    angle: number;
    radius: number;
    opacity: number;
  }>>([]);
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const totalDots = 12; // 队列中的点数
  const arrivalRadius = 25; // 到达目标后的旋转半径

  useEffect(() => {
    if (startRef.current && endRef.current) {
      const startRect = startRef.current.getBoundingClientRect();
      const endRect = endRef.current.getBoundingClientRect();

      const startX = startRect.left + startRect.width / 2;
      const startY = startRect.top + startRect.height / 2;
      const endX = endRect.left + endRect.width / 2;
      const endY = endRect.top + endRect.height / 2;

      setStartPos({ x: startX, y: startY });
      setEndPos({ x: endX, y: endY });
      setButtonSize({ width: startRect.width, height: startRect.height });

      // 计算控制点，创建向上的美丽弧形
      const midX = (startX + endX) / 2;
      const midY = Math.min(startY, endY) - Math.abs(endX - startX) * 0.4;

      setControlPoint({ x: midX, y: midY });
      setIsReady(true);
      startTimeRef.current = Date.now();
      
      // 初始化旋转的小圆点（初始半径较小）
      const initialRadius = Math.max(buttonSize.width, buttonSize.height) * 0.2;
      const dots = Array.from({ length: 12 }, (_, i) => ({
        angle: (i * 360) / 12,
        opacity: 1,
        radius: initialRadius,
      }));
      setRotatingDots(dots);
      
      // 初始化飞行队列
      setFlyingDots(Array.from({ length: totalDots }, (_, i) => ({
        id: i,
        progress: 0,
        x: startX,
        y: startY,
        opacity: 0,
      })));
    }
  }, [startRef, endRef]);

  useEffect(() => {
    if (!isReady) return;

    const ROTATION_DURATION = 800; // 第一阶段：旋转一圈的时间（毫秒）
    const FLY_DURATION = 1500; // 第二阶段：飞行时间（毫秒）
    const ARRIVAL_ROTATION_DURATION = 600; // 第三阶段：到达后旋转时间（毫秒）
    const FADE_OUT_DURATION = 400; // 渐隐时间
    const DOT_DELAY = 80; // 每个点的延迟（毫秒）

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      // 第一阶段：按钮周围的小圆点旋转并螺旋扩散（斐波那契螺旋效果）
      if (elapsed < ROTATION_DURATION) {
        setAnimationPhase('rotating');
        const rotationProgress = elapsed / ROTATION_DURATION;
        const currentAngle = rotationProgress * 360;
        
        // 计算初始和最终半径（形成螺旋扩散效果）
        const initialRadius = Math.max(buttonSize.width, buttonSize.height) * 0.15;
        const finalRadius = Math.max(buttonSize.width, buttonSize.height) * 0.7;
        
        // 斐波那契螺旋参数：使用对数螺旋公式 r = a * e^(b * θ)
        // 简化版本：半径随总角度和进度增长
        const spiralGrowthRate = 0.15; // 螺旋增长率（黄金比例相关）
        
        setRotatingDots(prev => prev.map((dot, i) => {
          // 每个点的起始角度不同
          const baseAngle = (i * 360) / 12;
          const totalAngle = baseAngle + currentAngle;
          
          // 计算总旋转圈数（角度转圈数）
          const totalRotations = totalAngle / 360;
          
          // 使用对数螺旋公式：r = r0 * e^(k * θ)
          // 简化版本：r = r0 * (1 + k * rotations)
          // 让半径随旋转圈数指数增长，形成螺旋扩散
          const spiralMultiplier = 1 + spiralGrowthRate * totalRotations * (1 + rotationProgress);
          
          // 基础半径随进度线性增长，同时受螺旋因子影响
          const baseRadius = initialRadius + (finalRadius - initialRadius) * rotationProgress;
          const currentRadius = baseRadius * spiralMultiplier;
          
          return {
            ...dot,
            angle: totalAngle,
            radius: Math.min(currentRadius, finalRadius * 1.2), // 限制最大半径
          };
        }));
      }
      // 第二阶段：队列飞入
      else if (elapsed < ROTATION_DURATION + FLY_DURATION + totalDots * DOT_DELAY) {
        setAnimationPhase('flying');
        const flyStartTime = ROTATION_DURATION;
        const flyElapsed = elapsed - flyStartTime;
        
        const updatedFlyingDots = Array.from({ length: totalDots }, (_, i) => {
          const dotStartTime = i * DOT_DELAY;
          const dotElapsed = flyElapsed - dotStartTime;
          
          if (dotElapsed < 0) {
            // 还没开始
            return {
              id: i,
              x: startPos.x,
              y: startPos.y,
              opacity: 0,
              progress: 0,
            };
          } else if (dotElapsed > FLY_DURATION) {
            // 已经到达，保持可见以便过渡到第三阶段
            return {
              id: i,
              x: endPos.x,
              y: endPos.y,
              opacity: 1,
              progress: 1,
            };
          } else {
            // 飞行中
            const progress = dotElapsed / FLY_DURATION;
            const point = getQuadraticBezierPoint(
              progress,
              startPos.x,
              startPos.y,
              controlPoint.x,
              controlPoint.y,
              endPos.x,
              endPos.y
            );
            
            // 计算透明度：开始和结束时渐隐
            let opacity = 1;
            if (progress < 0.1) {
              opacity = progress / 0.1;
            } else if (progress > 0.9) {
              opacity = (1 - progress) / 0.1;
            }
            
            return {
              id: i,
              x: point.x,
              y: point.y,
              opacity,
              progress,
            };
          }
        });
        
        setFlyingDots(updatedFlyingDots);
      }
      // 第三阶段：到达后旋转一圈并渐隐
      else if (elapsed < ROTATION_DURATION + FLY_DURATION + totalDots * DOT_DELAY + ARRIVAL_ROTATION_DURATION + FADE_OUT_DURATION) {
        setAnimationPhase('arriving');
        const arrivalStartTime = ROTATION_DURATION + FLY_DURATION + totalDots * DOT_DELAY;
        const arrivalElapsed = elapsed - arrivalStartTime;
        
        if (arrivalElapsed < ARRIVAL_ROTATION_DURATION) {
          // 旋转阶段
          const rotationProgress = arrivalElapsed / ARRIVAL_ROTATION_DURATION;
          const currentAngle = rotationProgress * 360;
          
          setArrivingDots(Array.from({ length: totalDots }, (_, i) => ({
            id: i,
            angle: (i * 360) / totalDots + currentAngle,
            radius: arrivalRadius + (i % 3) * 3,
            opacity: 1,
          })));
        } else {
          // 渐隐阶段
          const fadeProgress = (arrivalElapsed - ARRIVAL_ROTATION_DURATION) / FADE_OUT_DURATION;
          setArrivingDots(prev => {
            if (prev.length === 0) {
              // 如果还没有初始化，先初始化
              return Array.from({ length: totalDots }, (_, i) => ({
                id: i,
                angle: (i * 360) / totalDots + 360,
                radius: arrivalRadius + (i % 3) * 3,
                opacity: 1 - fadeProgress,
              }));
            }
            return prev.map(dot => ({
              ...dot,
              opacity: 1 - fadeProgress,
            }));
          });
        }
      } else {
        setAnimationPhase('done');
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
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
  }, [isReady, startPos, endPos, controlPoint, totalDots, buttonSize]);

  if (!isReady || startPos.x === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
        @keyframes pulse-shadow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.9), 0 0 50px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>

      {/* 起始位置（按钮）闪烁效果 */}
      {isReady && startPos.x !== 0 && (
        <>
          {/* 外层光晕 */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${startPos.x}px`,
              top: `${startPos.y}px`,
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)',
              animation: 'pulse-glow 1s ease-in-out infinite, pulse-shadow 1s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          {/* 内层核心 */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${startPos.x}px`,
              top: `${startPos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '20px',
              height: '20px',
              background: 'rgba(59, 130, 246, 0.8)',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.9)',
              animation: 'pulse-glow 1s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* 目标位置（知识链接）闪烁效果 */}
      {isReady && endPos.x !== 0 && (
        <>
          {/* 外层光晕 */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${endPos.x}px`,
              top: `${endPos.y}px`,
              width: '70px',
              height: '70px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)',
              animation: 'pulse-glow 1s ease-in-out infinite, pulse-shadow 1s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          {/* 内层核心 */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${endPos.x}px`,
              top: `${endPos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '18px',
              height: '18px',
              background: 'rgba(59, 130, 246, 0.8)',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.9)',
              animation: 'pulse-glow 1s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* 第一阶段：按钮周围旋转的小圆点（螺旋扩散） */}
      {animationPhase === 'rotating' && rotatingDots.map((dot, i) => {
        const radian = (dot.angle * Math.PI) / 180;
        const x = startPos.x + Math.cos(radian) * dot.radius;
        const y = startPos.y + Math.sin(radian) * dot.radius;
        
        return (
          <div
            key={`rotating-${i}`}
            className="absolute rounded-full"
            style={{
              width: '4px',
              height: '4px',
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              background: 'rgba(59, 130, 246, 1)',
              boxShadow: `0 0 4px rgba(96,165,250,0.8)`,
              opacity: dot.opacity,
            }}
          />
        );
      })}

      {/* 第二阶段：飞行的队列 */}
      {animationPhase === 'flying' && flyingDots.map((dot) => {
        if (dot.opacity === 0) return null;
        
        return (
          <div
            key={`flying-${dot.id}`}
            className="absolute rounded-full"
            style={{
              width: '4px',
              height: '4px',
              left: `${dot.x}px`,
              top: `${dot.y}px`,
              transform: 'translate(-50%, -50%)',
              background: 'rgba(59, 130, 246, 1)',
              boxShadow: `0 0 4px rgba(96,165,250,0.8)`,
              opacity: dot.opacity,
            }}
          />
        );
      })}

      {/* 第三阶段：到达目标后旋转一圈并渐隐 */}
      {animationPhase === 'arriving' && arrivingDots.map((dot) => {
        const radian = (dot.angle * Math.PI) / 180;
        const x = endPos.x + Math.cos(radian) * dot.radius;
        const y = endPos.y + Math.sin(radian) * dot.radius;
        
        return (
          <div
            key={`arriving-${dot.id}`}
            className="absolute rounded-full"
            style={{
              width: '4px',
              height: '4px',
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              background: 'rgba(59, 130, 246, 1)',
              boxShadow: `0 0 4px rgba(96,165,250,0.8)`,
              opacity: dot.opacity,
            }}
          />
        );
      })}
    </div>
  );
}
