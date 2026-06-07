/**
 * ParticleSystem.js
 * Gère les effets de particules Canvas (poussière d'or / reflets vitraux)
 */
export class ParticleSystem {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numParticles = options.num || 90;
        this.colors = options.colors || [
            [212, 168, 83], // Gold
            [83, 130, 212], // Sapphire
            [212, 83, 83],  // Ruby
            [83, 180, 130]  // Emerald
        ];
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.6 + 0.3,
                speedX: (Math.random() - 0.5) * 0.22,
                speedY: Math.random() * -0.35 - 0.08,
                opacity: Math.random() * 0.45 + 0.08,
                twinkle: Math.random() * Math.PI * 2,
                color: color
            });
        }
    }

    animate() {
        const draw = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const time = performance.now() * 0.001;

            this.particles.forEach(p => {
                const alpha = p.opacity * (0.4 + 0.6 * Math.sin(time * 0.7 + p.twinkle));
                const [r, g, b] = p.color;

                if (p.size > 1.2) {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.12})`;
                    this.ctx.fill();
                }

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                this.ctx.fill();

                p.x += p.speedX;
                p.y += p.speedY;

                if (p.y < -5) {
                    p.y = this.canvas.height + 5;
                    p.x = Math.random() * this.canvas.width;
                }
                if (p.x < -5) p.x = this.canvas.width + 5;
                if (p.x > this.canvas.width + 5) p.x = -5;
            });

            requestAnimationFrame(draw);
        };
        draw();
    }
}
