const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const healthFill = document.getElementById('health-fill');
const bulletTypeEl = document.getElementById('bullet-type');
const ammoCountEl = document.getElementById('ammo-count');

// Game State
let gameActive = false;
let score = 0;
let animationId;
let lastTime = 0;
let enemySpawnTimer = 0;
let bulletPackageSpawnTimer = 0;
const PACKAGE_SPAWN_INTERVAL = 8000; // 8 seconds

// Entities
let player;
let projectiles = [];
let enemies = [];
let particles = [];
let bulletPackages = [];

// Resize Canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
const mouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => {
    if (gameActive && player) {
        player.shoot(projectiles);
    }
});

window.addEventListener('keydown', (e) => {
    if (!player) return;
    switch (e.key.toLowerCase()) {
        case 'w': player.keys.w = true; break;
        case 'a': player.keys.a = true; break;
        case 's': player.keys.s = true; break;
        case 'd': player.keys.d = true; break;
    }
});

window.addEventListener('keyup', (e) => {
    if (!player) return;
    switch (e.key.toLowerCase()) {
        case 'w': player.keys.w = false; break;
        case 'a': player.keys.a = false; break;
        case 's': player.keys.s = false; break;
        case 'd': player.keys.d = false; break;
    }
});

// Game Functions
function initGame() {
    player = new Player(canvas.width / 2, canvas.height / 2);
    projectiles = [];
    enemies = [];
    particles = [];
    bulletPackages = [];
    bulletPackageSpawnTimer = 0;
    score = 0;
    scoreEl.innerText = score;
    healthFill.style.width = '100%';
    updateBulletHUD();
    gameActive = true;

    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('active');
    hud.classList.remove('hidden');

    animate(0);
}

function updateBulletHUD() {
    bulletTypeEl.innerText = player.currentBulletType.toUpperCase();
    bulletTypeEl.style.color = BULLET_TYPES[player.currentBulletType].color;
    ammoCountEl.innerText = player.currentBulletType === 'default' ? '∞' : player.specialAmmo;
}

function spawnEnemy() {
    const radius = 20;
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }
    enemies.push(new Enemy(x, y, player));
}

function spawnBulletPackage() {
    const margin = 100;
    const x = Utils.randomRange(margin, canvas.width - margin);
    const y = Utils.randomRange(margin, canvas.height - margin);
    const types = ['star', 'heart', 'laser'];
    const type = types[Math.floor(Math.random() * types.length)];
    bulletPackages.push(new BulletPackage(x, y, type));
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(
            x, y,
            Math.random() * 3,
            color,
            {
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5
            }
        ));
    }
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    finalScoreEl.innerText = score;
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');
}

function animate(timeStamp) {
    if (!gameActive) return;

    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    animationId = requestAnimationFrame(animate);

    // Clear
    ctx.fillStyle = 'rgba(10, 10, 10, 0.3)'; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    player.turretAngle = angle;
    player.update(canvas.width, canvas.height);
    player.draw(ctx);

    // Projectiles
    projectiles.forEach((p, index) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
        if (p.markedForDeletion) projectiles.splice(index, 1);
    });

    // Enemies
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer > 2000) { // Spawn every 2 seconds
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    // Bullet Package Spawning
    bulletPackageSpawnTimer += deltaTime;
    if (bulletPackageSpawnTimer > PACKAGE_SPAWN_INTERVAL) {
        spawnBulletPackage();
        bulletPackageSpawnTimer = 0;
    }

    // Bullet Packages - update, draw, and check pickup
    bulletPackages.forEach((pkg, index) => {
        pkg.update();
        pkg.draw(ctx);

        if (pkg.markedForDeletion) {
            bulletPackages.splice(index, 1);
        } else if (Utils.circleCollision(player, pkg)) {
            player.pickupBullet(pkg);
            bulletPackages.splice(index, 1);
            updateBulletHUD();
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.update();
        enemy.draw(ctx);

        // Enemy shooting
        enemy.shoot(projectiles);

        // Collision with Player
        if (Utils.circleCollision(player, enemy)) {
            player.health -= 1; // Contact damage
            healthFill.style.width = `${player.health}%`;
            if (player.health <= 0) gameOver();
        }

        // Hit by projectile
        projectiles.forEach((p, pIndex) => {
            if (p.owner === 'player' && Utils.circleCollision(p, enemy)) {
                createExplosion(enemy.x, enemy.y, enemy.color);
                enemies.splice(index, 1);
                projectiles.splice(pIndex, 1);
                score += 100;
                scoreEl.innerText = score;
            }
        });
    });

    // Player hit by projectile
    projectiles.forEach((p, pIndex) => {
        if (p.owner === 'enemy' && Utils.circleCollision(p, player)) {
            createExplosion(player.x, player.y, '#ff0000'); // Hit effect
            projectiles.splice(pIndex, 1);
            player.health -= p.damage;
            healthFill.style.width = `${player.health}%`;
            if (player.health <= 0) {
                createExplosion(player.x, player.y, player.color);
                gameOver();
            }
        }
    });

    // Particles
    particles.forEach((p, index) => {
        p.update();
        p.draw(ctx);
        if (p.markedForDeletion) particles.splice(index, 1);
    });

    // Update bullet HUD after shooting
    updateBulletHUD();
}

// Event Listeners
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
