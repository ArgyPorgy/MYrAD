import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            time += 0.006;

            // Deep ocean gradient background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#000510');
            bgGrad.addColorStop(0.5, '#001020');
            bgGrad.addColorStop(1, '#000000');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const dotSpacing = 28;
            const rows = 50;
            const cols = Math.ceil(canvas.width / dotSpacing) + 1;
            const perspective = 500;
            const baseY = canvas.height * 0.30;

            interface LayerConfig {
                offset: number;
                timeOffset: number;
                hueShift: number;
                opacity: number;
                waveAmp: number;
            }

            const layers: LayerConfig[] = [
                { offset: 280, timeOffset: 0, hueShift: -20, opacity: 0.25, waveAmp: 0.7 },
                { offset: 150, timeOffset: 0.8, hueShift: 0, opacity: 0.45, waveAmp: 0.85 },
                { offset: 0, timeOffset: 1.6, hueShift: 15, opacity: 0.7, waveAmp: 1.0 },
            ];

            const drawDot = (
                x: number, y: number, z: number,
                isBackground: boolean,
                layer: LayerConfig
            ) => {
                const scale = perspective / (perspective + z);
                const x3d = (x - canvas.width / 2) * scale + canvas.width / 2;
                const y3d = (y - baseY) * scale + baseY + layer.offset;

                const t = time + layer.timeOffset;
                const wave1 = Math.sin(x * 0.003 + t + z * 0.002) * 60 * layer.waveAmp;
                const wave2 = Math.cos(x * 0.01 - t * 0.5 + z * 0.005) * 20 * layer.waveAmp;
                const wave3 = Math.sin(x * 0.007 + t * 0.3 + z * 0.003) * 15 * layer.waveAmp;
                const waveHeight = (wave1 + wave2 + wave3) * scale;

                const finalY = y3d + waveHeight;

                if (finalY > canvas.height || finalY < 0) return;

                const size = isBackground ? Math.max(1.2, 4.5 * scale) : Math.max(0.6, 3 * scale);
                const depthFade = Math.pow(scale, isBackground ? 1.5 : 1);

                const heightFactor = (waveHeight / scale + 80) / 160;

                // Color with hue variation per layer
                const g = Math.floor(Math.max(0, Math.min(255, 70 + heightFactor * 130 + layer.hueShift)));
                const b = Math.floor(Math.max(0, Math.min(255, 170 + heightFactor * 85 - layer.hueShift * 0.5)));
                const r = Math.floor(Math.max(0, Math.min(255, layer.hueShift > 0 ? heightFactor * 30 : 0)));

                const baseOpacity = isBackground ? 0.12 : 0.4;
                const opacity = baseOpacity * depthFade * layer.opacity;

                // Glow effect for top layer foreground
                if (!isBackground && layer.offset === 0 && scale > 0.6) {
                    ctx.shadowBlur = 8 * scale;
                    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.beginPath();
                ctx.arc(x3d, finalY, size, 0, Math.PI * 2);
                ctx.fill();
            };

            // Render all three layers (back to front)
            for (const layer of layers) {
                // Background dots
                for (let row = rows; row >= 25; row--) {
                    const z = row * 35;
                    const y = row * 15;
                    for (let col = -1; col <= cols; col++) {
                        const x = col * dotSpacing;
                        drawDot(x, y, z, true, layer);
                    }
                }

                // Foreground dots
                for (let row = 24; row >= 0; row--) {
                    const z = row * 25;
                    const y = row * 12;
                    for (let col = -1; col <= cols; col++) {
                        const x = col * dotSpacing;
                        drawDot(x, y, z, false, layer);
                    }
                }
            }

            ctx.shadowBlur = 0;

            // Enhanced vignette
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height * 0.4, 0,
                canvas.width / 2, canvas.height * 0.4, canvas.width * 0.85
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.6, 'rgba(0,0,0,0.3)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle top fade
            const topFade = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.25);
            topFade.addColorStop(0, 'rgba(0,5,15,0.7)');
            topFade.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = topFade;
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.25);

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                background: '#000510'
            }}
        />
    );
}