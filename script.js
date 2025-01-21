document.addEventListener('DOMContentLoaded', () => {
    initSpaceshipGame();
});

function initSpaceshipGame() {
    const canvas = document.getElementById('spaceship-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Game state
    let score = 0;
    let highScore = localStorage.getItem('highScore') || 0;
    highScoreElement.textContent = highScore;

    // Game objects
    const player = {
        x: canvas.width / 2,
        y: canvas.height - 50,
        width: 60,
        height: 60,
        speed: 6,
        color: '#ff2d55',
        shield: 100,
        lives: 3,
        powerups: [],
        autoShootCooldown: 0
    };

    const gameState = {
        bullets: [],
        enemyBullets: [],
        enemies: [],
        particles: [],
        stars: [],
        keys: {},
        gameOver: false,
        bulletCooldown: 0,
        level: 1,
        enemySpawnRate: 0.005,
        enemyShootRate: 0.02
    };

    // Create initial stars
    for (let i = 0; i < 100; i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 0.5 + Math.random() * 2,
            size: Math.random() * 2
        });
    }

    // Event listeners
    window.addEventListener('keydown', (e) => gameState.keys[e.key] = true);
    window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

    function drawPlayer() {
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Draw shield if active
        if (player.shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, player.width/2 + 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${player.shield/100})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Improved player spaceship design
        ctx.beginPath();
        // Main body
        ctx.moveTo(0, -30);
        ctx.lineTo(-20, 10);
        ctx.lineTo(-25, 20);
        ctx.lineTo(-10, 15);
        ctx.lineTo(-8, 30);
        ctx.lineTo(8, 30);
        ctx.lineTo(10, 15);
        ctx.lineTo(25, 20);
        ctx.lineTo(20, 10);
        ctx.closePath();
        ctx.fillStyle = player.color;
        ctx.fill();

        // Wing details
        ctx.beginPath();
        ctx.moveTo(-20, 10);
        ctx.lineTo(-35, 0);
        ctx.lineTo(-20, -10);
        ctx.moveTo(20, 10);
        ctx.lineTo(35, 0);
        ctx.lineTo(20, -10);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Cockpit
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0ff';
        ctx.fill();
        
        // Engine glow
        const engineGlow = ctx.createRadialGradient(0, 25, 0, 0, 25, 20);
        engineGlow.addColorStop(0, '#0ff');
        engineGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = engineGlow;
        ctx.fillRect(-15, 25, 30, 20);
        
        ctx.restore();
    }

    function createEnemy() {
        const types = [
            {
                width: 50,
                height: 50,
                speed: 1,
                health: 2,
                color: '#b026ff',
                points: 100,
                shootRate: 0.02,
                draw: function(ctx, x, y) {
                    ctx.save();
                    ctx.translate(x, y);
                    
                    // UFO-style enemy
                    ctx.beginPath();
                    // Draw dome
                    ctx.ellipse(0, -10, 25, 15, 0, Math.PI, 0);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Draw base
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff0066';
                    ctx.fill();
                    
                    // Draw lights
                    const lightPositions = [-20, -10, 0, 10, 20];
                    lightPositions.forEach(pos => {
                        ctx.beginPath();
                        ctx.arc(pos, 0, 3, 0, Math.PI * 2);
                        ctx.fillStyle = '#0ff';
                        ctx.fill();
                    });
                    
                    ctx.restore();
                }
            },
            {
                width: 70,
                height: 70,
                speed: 0.8,
                health: 3,
                color: '#ff0066',
                points: 200,
                shootRate: 0.03,
                draw: function(ctx, x, y) {
                    ctx.save();
                    ctx.translate(x, y);
                    
                    // Triangle Warship
                    ctx.beginPath();
                    ctx.moveTo(0, -35);
                    ctx.lineTo(-30, 15);
                    ctx.lineTo(30, 15);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Energy shield effect
                    ctx.beginPath();
                    ctx.arc(0, 0, 35, 0, Math.PI * 2);
                    ctx.strokeStyle = '#0ff';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    
                    // Core
                    ctx.beginPath();
                    ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    ctx.fillStyle = '#b026ff';
                    ctx.fill();
                    
                    ctx.restore();
                }
            },
            {
                width: 60,
                height: 60,
                speed: 1.2,
                health: 2,
                color: '#9400D3',
                points: 150,
                shootRate: 0.02,
                draw: function(ctx, x, y) {
                    ctx.save();
                    ctx.translate(x, y);
                    
                    // Hexagonal Cruiser
                    ctx.beginPath();
                    for(let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI * 2) / 6;
                        const x = Math.cos(angle) * 25;
                        const y = Math.sin(angle) * 25;
                        if(i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Inner details
                    ctx.beginPath();
                    ctx.arc(0, 0, 15, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ff0066';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    // Energy points
                    for(let i = 0; i < 3; i++) {
                        const angle = (i * Math.PI * 2) / 3;
                        const x = Math.cos(angle) * 10;
                        const y = Math.sin(angle) * 10;
                        ctx.beginPath();
                        ctx.arc(x, y, 3, 0, Math.PI * 2);
                        ctx.fillStyle = '#0ff';
                        ctx.fill();
                    }
                    
                    ctx.restore();
                }
            }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            x: Math.random() * (canvas.width - type.width) + type.width/2,
            y: -type.height,
            targetY: Math.random() * (canvas.height/4),
            ...type
        };
    }

    function drawStars() {
        ctx.fillStyle = '#fff';
        gameState.stars.forEach(star => {
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    function createParticle(x, y, color) {
        return {
            x,
            y,
            color,
            speed: Math.random() * 3 + 1,
            angle: Math.random() * Math.PI * 2,
            life: 1
        };
    }

    function drawParticle(particle) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.life * 3, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
    }

    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    function enemyShoot(enemy) {
        if (Math.random() < enemy.shootRate) {
            gameState.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height/2,
                width: 4,
                height: 12,
                speed: 5,
                color: enemy.color
            });
        }
    }

    function update() {
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw stars
        gameState.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
        drawStars();

        if (!gameState.gameOver) {
            // Update player position
            if (gameState.keys['ArrowLeft']) {
                player.x = Math.max(player.width / 2, player.x - player.speed);
            }
            if (gameState.keys['ArrowRight']) {
                player.x = Math.min(canvas.width - player.width / 2, player.x + player.speed);
            }

            // Automatic shooting
            player.autoShootCooldown--;
            if (player.autoShootCooldown <= 0) {
                gameState.bullets.push(
                    {
                        x: player.x - 15,
                        y: player.y - 20,
                        width: 4,
                        height: 15,
                        color: '#0ff'
                    },
                    {
                        x: player.x + 15,
                        y: player.y - 20,
                        width: 4,
                        height: 15,
                        color: '#0ff'
                    }
                );
                player.autoShootCooldown = 15;
            }
            
            // Spawn enemies based on level
            if (Math.random() < gameState.enemySpawnRate) {
                gameState.enemies.push(createEnemy());
            }

            // Update bullets
            gameState.bullets.forEach((bullet, bulletIndex) => {
                bullet.y -= 7;
                
                // Check enemy collisions
                gameState.enemies.forEach((enemy, enemyIndex) => {
                    if (checkCollision(bullet, enemy)) {
                        // Create explosion particles
                        for (let i = 0; i < 10; i++) {
                            gameState.particles.push(createParticle(enemy.x, enemy.y, enemy.color));
                        }
                        
                        gameState.bullets.splice(bulletIndex, 1);
                        gameState.enemies.splice(enemyIndex, 1);
                        score += 100;
                        scoreElement.textContent = score;
                        
                        if (score > highScore) {
                            highScore = score;
                            highScoreElement.textContent = highScore;
                            localStorage.setItem('highScore', highScore);
                        }
                    }
                });

                // Remove off-screen bullets
                if (bullet.y < 0) {
                    gameState.bullets.splice(bulletIndex, 1);
                }
            });

            // Update enemy bullets
            gameState.enemyBullets.forEach((bullet, index) => {
                bullet.y += bullet.speed;
                
                // Check player collision with enemy bullets
                if (checkCollision(bullet, player)) {
                    gameState.enemyBullets.splice(index, 1);
                    if (player.shield > 0) {
                        player.shield -= 25;
                    } else {
                        player.lives--;
                        player.shield = 100;
                        
                        if (player.lives <= 0) {
                            gameState.gameOver = true;
                            for (let i = 0; i < 20; i++) {
                                gameState.particles.push(createParticle(player.x, player.y, player.color));
                            }
                        }
                    }
                }
                
                if (bullet.y > canvas.height) {
                    gameState.enemyBullets.splice(index, 1);
                }
            });

            // Update enemies with new movement
            gameState.enemies.forEach((enemy, index) => {
                // Move towards target Y position only
                if (enemy.y < enemy.targetY) {
                    enemy.y += enemy.speed;
                }
                
                // Enemy shooting
                enemyShoot(enemy);
                
                if (checkCollision(enemy, player)) {
                    if (player.shield > 0) {
                        player.shield -= 25;
                        gameState.enemies.splice(index, 1);
                    } else {
                        gameState.gameOver = true;
                        for (let i = 0; i < 20; i++) {
                            gameState.particles.push(createParticle(player.x, player.y, player.color));
                        }
                    }
                }
                
                if (enemy.y > canvas.height) {
                    gameState.enemies.splice(index, 1);
                }
            });

            // Update particles
            gameState.particles.forEach((particle, index) => {
                particle.x += Math.cos(particle.angle) * particle.speed;
                particle.y += Math.sin(particle.angle) * particle.speed;
                particle.life -= 0.02;
                if (particle.life <= 0) {
                    gameState.particles.splice(index, 1);
                }
            });

            // Draw lives
            for (let i = 0; i < player.lives; i++) {
                ctx.save();
                ctx.translate(30 + i * 30, canvas.height - 30);
                ctx.scale(0.4, 0.4);
                drawPlayer();
                ctx.restore();
            }

            // Draw enemy bullets
            gameState.enemyBullets.forEach(bullet => {
                ctx.fillStyle = bullet.color;
                ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height);
            });

            // Level progression
            if (score > gameState.level * 1000) {
                gameState.level++;
                gameState.enemySpawnRate += 0.005;
            }
        }

        // Draw everything
        gameState.particles.forEach(drawParticle);
        gameState.bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        });
        gameState.enemies.forEach(enemy => enemy.draw(ctx, enemy.x, enemy.y));
        
        if (!gameState.gameOver) {
            drawPlayer();
            
            // Draw shield bar
            ctx.fillStyle = '#0ff';
            ctx.fillRect(10, 10, player.shield * 2, 10);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(10, 10, 200, 10);
        } else {
            ctx.fillStyle = '#ff2d55';
            ctx.font = '30px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
            ctx.font = '20px "Courier New"';
            ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 40);
            
            if (gameState.keys[' ']) {
                // Reset game
                score = 0;
                scoreElement.textContent = score;
                gameState.gameOver = false;
                gameState.enemies = [];
                gameState.bullets = [];
                gameState.particles = [];
                player.x = canvas.width / 2;
            }
        }

        requestAnimationFrame(update);
    }

    update();
} 