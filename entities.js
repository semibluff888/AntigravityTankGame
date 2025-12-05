// Bullet Type Configuration
const BULLET_TYPES = {
    default: { speed: 10, width: 4, color: '#00f3ff', shape: 'circle', damage: 10 },
    star: { speed: 15, width: 12, color: '#ffff00', shape: 'star', damage: 15 },
    heart: { speed: 8, width: 16, color: '#ff69b4', shape: 'heart', damage: 20 },
    laser: { speed: 25, width: 8, color: '#00ff00', shape: 'line', damage: 8 }
};

class Entity {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        // Base update
    }
}

// Bullet Package - collectable power-up
class BulletPackage extends Entity {
    constructor(x, y, bulletType) {
        const config = BULLET_TYPES[bulletType];
        super(x, y, 25, config.color);
        this.bulletType = bulletType;
        this.ammoCount = Math.floor(Math.random() * 31) + 20; // 20-50
        this.lifespan = 15000; // 15 seconds
        this.spawnTime = Date.now();
        this.floatOffset = 0;
    }

    update() {
        // Floating animation
        this.floatOffset += 0.05;

        // Check lifespan
        if (Date.now() - this.spawnTime > this.lifespan) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        const floatY = this.y + Math.sin(this.floatOffset) * 5;

        ctx.save();
        ctx.translate(this.x, floatY);

        // Pulsing glow effect
        const pulse = 0.5 + Math.sin(this.floatOffset * 2) * 0.3;
        ctx.shadowBlur = 20 + pulse * 10;
        ctx.shadowColor = this.color;

        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner fill
        ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
        ctx.fill();

        // Draw bullet type icon
        this.drawIcon(ctx);

        // Ammo count text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x${this.ammoCount}`, 0, this.radius + 15);

        ctx.restore();
    }

    drawIcon(ctx) {
        ctx.fillStyle = this.color;

        switch (this.bulletType) {
            case 'star':
                this.drawStar(ctx, 0, 0, 5, 12, 6);
                break;
            case 'heart':
                this.drawHeart(ctx, 0, 0, 12);
                break;
            case 'laser':
                ctx.fillRect(-10, -3, 20, 6);
                break;
        }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawHeart(ctx, cx, cy, size) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + size / 4);
        ctx.bezierCurveTo(cx, cy - size / 2, cx - size, cy - size / 2, cx - size, cy + size / 8);
        ctx.bezierCurveTo(cx - size, cy + size / 2, cx, cy + size, cx, cy + size);
        ctx.bezierCurveTo(cx, cy + size, cx + size, cy + size / 2, cx + size, cy + size / 8);
        ctx.bezierCurveTo(cx + size, cy - size / 2, cx, cy - size / 2, cx, cy + size / 4);
        ctx.closePath();
        ctx.fill();
    }
}

class Projectile extends Entity {
    constructor(x, y, angle, speed, color, owner, bulletType = 'default') {
        const config = BULLET_TYPES[bulletType];
        super(x, y, config.width, color);
        this.velocity = {
            x: Math.cos(angle) * config.speed,
            y: Math.sin(angle) * config.speed
        };
        this.angle = angle;
        this.owner = owner; // 'player' or 'enemy'
        this.damage = config.damage;
        this.bulletType = bulletType;
        this.shape = config.shape;
    }

    update(canvasWidth, canvasHeight) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Remove if off screen
        if (this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        switch (this.shape) {
            case 'star':
                this.drawStar(ctx);
                break;
            case 'heart':
                this.drawHeart(ctx);
                break;
            case 'line':
                this.drawLaser(ctx);
                break;
            default:
                this.drawCircle(ctx);
        }

        ctx.restore();
    }

    drawCircle(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStar(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const spikes = 5;
        const outerRadius = this.radius;
        const innerRadius = this.radius / 2;
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(0, -outerRadius);
        for (let i = 0; i < spikes; i++) {
            let x = Math.cos(rot) * outerRadius;
            let y = Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = Math.cos(rot) * innerRadius;
            y = Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(0, -outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawHeart(ctx) {
        const size = this.radius * 0.8;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(0, size / 4);
        ctx.bezierCurveTo(0, -size / 2, -size, -size / 2, -size, size / 8);
        ctx.bezierCurveTo(-size, size / 2, 0, size, 0, size);
        ctx.bezierCurveTo(0, size, size, size / 2, size, size / 8);
        ctx.bezierCurveTo(size, -size / 2, 0, -size / 2, 0, size / 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawLaser(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Main beam
        ctx.fillRect(-this.radius * 2, -this.radius / 2, this.radius * 4, this.radius);

        // Glow core
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.radius * 2, -this.radius / 4, this.radius * 4, this.radius / 2);

        ctx.restore();
    }
}

class Particle extends Entity {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color);
        this.velocity = velocity;
        this.alpha = 1;
        this.friction = 0.95;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
        if (this.alpha <= 0) {
            this.markedForDeletion = true;
        }
    }
}

class Tank extends Entity {
    constructor(x, y, radius, color, speed) {
        super(x, y, radius, color);
        this.speed = speed;
        this.angle = 0;
        this.turretAngle = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.lastShot = 0;
        this.fireRate = 500; // ms
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#000';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

        // Turret
        ctx.rotate(this.turretAngle - this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -5, this.radius * 1.5, 10);
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    shoot(projectiles) {
        const now = Date.now();
        if (now - this.lastShot > this.fireRate) {
            const tipX = this.x + Math.cos(this.turretAngle) * (this.radius * 1.5);
            const tipY = this.y + Math.sin(this.turretAngle) * (this.radius * 1.5);

            projectiles.push(new Projectile(
                tipX,
                tipY,
                this.turretAngle,
                10,
                this.color,
                this instanceof Player ? 'player' : 'enemy'
            ));
            this.lastShot = now;
            return true;
        }
        return false;
    }
}

class Player extends Tank {
    constructor(x, y) {
        super(x, y, 20, '#00f3ff', 3); // Neon Blue
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        // Bullet system
        this.currentBulletType = 'default';
        this.specialAmmo = 0;
    }

    update(canvasWidth, canvasHeight) {
        if (this.keys.w) this.y -= this.speed;
        if (this.keys.s) this.y += this.speed;
        if (this.keys.a) this.x -= this.speed;
        if (this.keys.d) this.x += this.speed;

        // Constrain to screen
        this.x = Utils.clamp(this.x, this.radius, canvasWidth - this.radius);
        this.y = Utils.clamp(this.y, this.radius, canvasHeight - this.radius);

        // Body rotation follows movement (simplified)
        if (this.keys.w || this.keys.s || this.keys.a || this.keys.d) {
            // Could add body rotation logic here, but for now fixed or simple is fine
        }
    }

    pickupBullet(bulletPackage) {
        this.currentBulletType = bulletPackage.bulletType;
        this.specialAmmo = bulletPackage.ammoCount;
    }

    shoot(projectiles) {
        const now = Date.now();
        if (now - this.lastShot > this.fireRate) {
            const tipX = this.x + Math.cos(this.turretAngle) * (this.radius * 1.5);
            const tipY = this.y + Math.sin(this.turretAngle) * (this.radius * 1.5);

            const config = BULLET_TYPES[this.currentBulletType];
            projectiles.push(new Projectile(
                tipX,
                tipY,
                this.turretAngle,
                config.speed,
                config.color,
                'player',
                this.currentBulletType
            ));

            // Decrement ammo for special bullets
            if (this.currentBulletType !== 'default') {
                this.specialAmmo--;
                if (this.specialAmmo <= 0) {
                    this.currentBulletType = 'default';
                    this.specialAmmo = 0;
                }
            }

            this.lastShot = now;
            return true;
        }
        return false;
    }
}

class Enemy extends Tank {
    constructor(x, y, player) {
        super(x, y, 20, '#ff0000', 1.5); // Neon Red
        this.player = player;
        this.fireRate = 2000;
    }

    update() {
        // Move towards player
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const angle = Math.atan2(dy, dx);

        this.turretAngle = angle;
        this.angle = angle; // Face player

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 150) {
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }
}
