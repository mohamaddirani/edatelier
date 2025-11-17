import { useEffect, useRef } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get computed CSS variables
    const getColor = (variable: string, alpha: number = 1) => {
      const root = document.documentElement;
      const value = getComputedStyle(root).getPropertyValue(variable).trim();
      // value will be like "222.2 47.4% 11.2%" (HSL values)
      const [h, s, l] = value.split(' ');
      return `hsla(${h}, ${s}, ${l}, ${alpha})`;
    };

    const primaryColor = getColor('--primary', 0.15);
    const accentColor = getColor('--accent', 0.08);
    const secondaryColor = getColor('--secondary', 0.03);
    const accentColor2 = getColor('--accent', 0.1);
    const primaryColor2 = getColor('--primary', 0.05);

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      // Smooth follow effect
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.1;

      // Clear canvas
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create gradient that follows cursor
      const gradient = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        Math.max(canvas.width, canvas.height) * 0.6
      );

      // Use theme colors for gradient
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(0.3, accentColor);
      gradient.addColorStop(0.6, secondaryColor);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add secondary gradient for depth
      const gradient2 = ctx.createRadialGradient(
        canvas.width - mouseRef.current.x,
        canvas.height - mouseRef.current.y,
        0,
        canvas.width - mouseRef.current.x,
        canvas.height - mouseRef.current.y,
        Math.max(canvas.width, canvas.height) * 0.5
      );

      gradient2.addColorStop(0, accentColor2);
      gradient2.addColorStop(0.5, primaryColor2);
      gradient2.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
