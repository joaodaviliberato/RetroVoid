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
        powerups: []
    };

    const gameState = {
        bullets: [],
        enemies: [],
        particles: [],
        stars: [],
        keys: {},
        gameOver: false,
        bulletCooldown: 0,
        level: 1,
        enemySpawnRate: 0.02
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
        
        // Draw spaceship body
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(-25, 20);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-10, 30);
        ctx.lineTo(10, 30);
        ctx.lineTo(15, 15);
        ctx.lineTo(25, 20);
        ctx.closePath();
        ctx.fillStyle = player.color;
        ctx.fill();
        
        // Draw cockpit
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0ff';
        ctx.fill();
        
        // Draw engine glow
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
                width: 40,
                height: 40,
                speed: 2 + Math.random() * 2,
                health: 1,
                color: '#b026ff',
                points: 100,
                draw: function(ctx, x, y) {
                    ctx.save();
                    ctx.translate(x, y);
                    
                    // Draw enemy ship body
                    ctx.beginPath();
                    ctx.moveTo(0, -20);
                    ctx.lineTo(-20, 10);
                    ctx.lineTo(-10, 15);
                    ctx.lineTo(10, 15);
                    ctx.lineTo(20, 10);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Draw enemy cockpit
                    ctx.beginPath();
                    ctx.arc(0, 0, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff0066';
                    ctx.fill();
                    
                    ctx.restore();
                }
            },
            {
                width: 60,
                height: 60,
                speed: 1.5 + Math.random() * 1.5,
                health: 2,
                color: '#ff0066',
                points: 200,
                draw: function(ctx, x, y) {
                    ctx.save();
                    ctx.translate(x, y);
                    
                    // Draw boss-type enemy
                    ctx.beginPath();
                    ctx.moveTo(0, -25);
                    ctx.lineTo(-30, 0);
                    ctx.lineTo(-20, 20);
                    ctx.lineTo(20, 20);
                    ctx.lineTo(30, 0);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Draw enemy details
                    ctx.beginPath();
                    ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    ctx.fillStyle = '#b026ff';
                    ctx.fill();
                    
                    ctx.restore();
                }
            }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            x: Math.random() * (canvas.width - type.width) + type.width/2,
            y: -type.height,
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

            // Shooting mechanics
            if (gameState.keys[' '] && gameState.bulletCooldown <= 0) {
                // Double bullets
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
                gameState.bulletCooldown = 8;
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

            // Update enemies with new drawing method
            gameState.enemies.forEach((enemy, index) => {
                enemy.y += enemy.speed;
                
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