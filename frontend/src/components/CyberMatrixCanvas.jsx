import React, { useEffect, useRef } from 'react';

/**
 * 3D Interactive Cyber Risk Neural Matrix Canvas
 * Pure mathematical 3D particle cloud projection with interactive mouse orbit
 */
export default function CyberMatrixCanvas({ height = 260, nodeCount = 45 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let h = (canvas.height = height);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Generate 3D spherical nodes
    const particles = [];
    const colors = ['#72f1b8', '#00f0ff', '#4cb7ff', '#ffb84d', '#ff6b6b'];

    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 90 + Math.random() * 40;

      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        baseRadius: 2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 0.006,
        speedY: (Math.random() - 0.5) * 0.008
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - h / 2;
      targetRotY = (x / width) * 0.8;
      targetRotX = -(y / h) * 0.8;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, h);

      // Smooth mouse rotation easing
      rotX += (targetRotX - rotX) * 0.05 + 0.003;
      rotY += (targetRotY - rotY) * 0.05 + 0.004;

      const fov = 280;
      const cx = width / 2;
      const cy = h / 2;

      // Project 3D to 2D
      const projected = particles.map((p) => {
        // Rotate around Y
        let x1 = p.x * Math.cos(rotY) + p.z * Math.sin(rotY);
        let z1 = -p.x * Math.sin(rotY) + p.z * Math.cos(rotY);

        // Rotate around X
        let y2 = p.y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = p.y * Math.sin(rotX) + z1 * Math.cos(rotX);

        const scale = fov / (fov + z2 + 180);
        const px = x1 * scale + cx;
        const py = y2 * scale + cy;

        return { px, py, scale, z: z2, color: p.color, radius: p.baseRadius * scale };
      });

      // Sort by Z depth for proper rendering order
      projected.sort((a, b) => b.z - a.z);

      // Draw connection lines between nearby nodes
      ctx.lineWidth = 0.7;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 65) {
            const alpha = (1 - dist / 65) * 0.22 * Math.min(projected[i].scale, projected[j].scale);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes with neon halos
      projected.forEach((p) => {
        if (p.scale <= 0) return;
        ctx.save();
        ctx.shadowBlur = 10 * p.scale;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(0.5, p.radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [height, nodeCount]);

  return (
    <div className="cyber-canvas-container" style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'grab'
        }}
      />
      <div className="cyber-canvas-badge">
        <span className="live-dot" /> 3D NEURAL RISK MATRIX
      </div>
    </div>
  );
}
