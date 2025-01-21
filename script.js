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
        width: 40,
        height: 40,
        speed: 5,
        color: '#ff2d55'
    };

    const gameState = {
        bullets: [],
        enemies: [],
        particles: [],
        keys: {},
        gameOver: false,
        bulletCooldown: 0
    };

    // Event listeners
    window.addEventListener('keydown', (e) => gameState.keys[e.key] = true);
    window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

    function drawPlayer() {
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Draw spaceship body
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(15, 20);
        ctx.closePath();
        ctx.fillStyle = player.color;
        ctx.fill();
        
        // Draw engine glow
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(-8, 20);
        ctx.lineTo(8, 20);
        ctx.lineTo(0, 30);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    function createEnemy() {
        return {
            x: Math.random() * (canvas.width - 30) + 15,
            y: -20,
            width: 30,
            height: 30,
            speed: 2 + Math.random() * 2,
            color: '#b026ff'
        };
    }

    function drawEnemy(enemy) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        // Draw enemy ship
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-15, 15);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fillStyle = enemy.color;
        ctx.fill();
        
        ctx.restore();
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!gameState.gameOver) {
            // Update player position
            if (gameState.keys['ArrowLeft']) {
                player.x = Math.max(player.width / 2, player.x - player.speed);
            }
            if (gameState.keys['ArrowRight']) {
                player.x = Math.min(canvas.width - player.width / 2, player.x + player.speed);
            }

            // Shooting
            if (gameState.keys[' '] && gameState.bulletCooldown <= 0) {
                gameState.bullets.push({
                    x: player.x,
                    y: player.y - 20,
                    width: 4,
                    height: 15,
                    color: '#0ff'
                });
                gameState.bulletCooldown = 10;
            }
            gameState.bulletCooldown--;

            // Spawn enemies
            if (Math.random() < 0.02) {
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

            // Update enemies
            gameState.enemies.forEach((enemy, index) => {
                enemy.y += enemy.speed;
                
                // Check player collision
                if (checkCollision(enemy, player)) {
                    gameState.gameOver = true;
                    for (let i = 0; i < 20; i++) {
                        gameState.particles.push(createParticle(player.x, player.y, player.color));
                    }
                }
                
                // Remove off-screen enemies
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
        }

        // Draw everything
        gameState.particles.forEach(drawParticle);
        gameState.bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        });
        gameState.enemies.forEach(drawEnemy);
        
        if (!gameState.gameOver) {
            drawPlayer();
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