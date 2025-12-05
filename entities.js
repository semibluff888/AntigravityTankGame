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

class Projectile extends Entity {
    constructor(x, y, angle, speed, color, owner) {
        super(x, y, 4, color);
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.owner = owner; // 'player' or 'enemy'
        this.damage = 10;
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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
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
