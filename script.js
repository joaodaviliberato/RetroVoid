document.addEventListener('DOMContentLoaded', () => {
    initSpaceshipGame();
});

function initSpaceshipGame() {
    const canvas = document.getElementById('spaceship-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');

    // Game states
    const GAME_STATE = {
        MENU: 'menu',
        PLAYING: 'playing',
        GAME_OVER: 'gameover'
    };

    let currentState = GAME_STATE.MENU;
    let selectedDifficulty = null;

    const DIFFICULTY = {
        EASY: {
            name: 'EASY',
            description: 'Perfect for beginners. Slower enemies, more shields.',
            enemySpawnRate: 0.003,
            enemyShootRate: 0.01,
            playerShootDelay: 30,
            enemySpeed: 0.8,
            playerShield: 150,
            enemyBulletSpeed: 3,
            bulletDamage: 15
        },
        NORMAL: {
            name: 'NORMAL',
            description: 'The classic experience. Balanced challenge.',
            enemySpawnRate: 0.005,
            enemyShootRate: 0.02,
            playerShootDelay: 40,
            enemySpeed: 1,
            playerShield: 100,
            enemyBulletSpeed: 5,
            bulletDamage: 25
        },
        HARD: {
            name: 'HARD',
            description: 'For veteran pilots. Fast enemies, deadly shots.',
            enemySpawnRate: 0.007,
            enemyShootRate: 0.03,
            playerShootDelay: 50,
            enemySpeed: 1.2,
            playerShield: 75,
            enemyBulletSpeed: 7,
            bulletDamage: 35
        }
    };

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
        autoShootCooldown: 0,
        shootDelay: 40
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
        enemyShootRate: 0.02,
        bulletDamage: 25
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
    window.addEventListener('keydown', (e) => {
        if (currentState === GAME_STATE.MENU) {
            const difficulties = Object.values(DIFFICULTY);
            const currentIndex = difficulties.findIndex(d => d.name === selectedDifficulty);
            
            switch (e.key) {
                case 'ArrowUp':
                    if (selectedDifficulty === null) {
                        selectedDifficulty = difficulties[0].name;
                    } else {
                        const newIndex = (currentIndex - 1 + difficulties.length) % difficulties.length;
                        selectedDifficulty = difficulties[newIndex].name;
                    }
                    break;
                case 'ArrowDown':
                    if (selectedDifficulty === null) {
                        selectedDifficulty = difficulties[0].name;
                    } else {
                        const newIndex = (currentIndex + 1) % difficulties.length;
                        selectedDifficulty = difficulties[newIndex].name;
                    }
                    break;
                case ' ':
                    if (selectedDifficulty) {
                        // Apply difficulty settings
                        const difficulty = DIFFICULTY[selectedDifficulty];
                        gameState.enemySpawnRate = difficulty.enemySpawnRate;
                        gameState.enemyShootRate = difficulty.enemyShootRate;
                        player.shootDelay = difficulty.playerShootDelay;
                        player.shield = difficulty.playerShield;
                        gameState.bulletDamage = difficulty.bulletDamage;
                        
                        // Start the game
                        currentState = GAME_STATE.PLAYING;
                    }
                    break;
            }
        } else {
            // Your existing keydown handling for the game
            gameState.keys[e.key] = true;
        }
    });

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
                    
                    // Scout Ship
                    // Main body
                    ctx.beginPath();
                    ctx.moveTo(0, -25);
                    ctx.lineTo(-15, -10);
                    ctx.lineTo(-20, 10);
                    ctx.lineTo(-10, 20);
                    ctx.lineTo(10, 20);
                    ctx.lineTo(20, 10);
                    ctx.lineTo(15, -10);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Wings
                    ctx.beginPath();
                    ctx.moveTo(-20, 10);
                    ctx.lineTo(-35, 0);
                    ctx.lineTo(-20, -5);
                    ctx.moveTo(20, 10);
                    ctx.lineTo(35, 0);
                    ctx.lineTo(20, -5);
                    ctx.strokeStyle = '#ff0066';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Engine glow
                    const engineGlow = ctx.createRadialGradient(0, 15, 0, 0, 15, 10);
                    engineGlow.addColorStop(0, '#0ff');
                    engineGlow.addColorStop(1, 'transparent');
                    ctx.fillStyle = engineGlow;
                    ctx.fillRect(-10, 15, 20, 10);
                    
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
                    
                    // Heavy Battleship
                    // Main hull
                    ctx.beginPath();
                    ctx.moveTo(0, -35);
                    ctx.lineTo(-15, -25);
                    ctx.lineTo(-25, -10);
                    ctx.lineTo(-30, 10);
                    ctx.lineTo(-20, 25);
                    ctx.lineTo(0, 30);
                    ctx.lineTo(20, 25);
                    ctx.lineTo(30, 10);
                    ctx.lineTo(25, -10);
                    ctx.lineTo(15, -25);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Side cannons
                    ctx.fillStyle = '#b026ff';
                    ctx.fillRect(-35, -5, 10, 20);
                    ctx.fillRect(25, -5, 10, 20);
                    
                    // Bridge
                    ctx.beginPath();
                    ctx.ellipse(0, -10, 8, 15, 0, 0, Math.PI * 2);
                    ctx.fillStyle = '#0ff';
                    ctx.fill();
                    
                    // Engine trails
                    const gradient = ctx.createLinearGradient(0, 25, 0, 40);
                    gradient.addColorStop(0, '#ff0066');
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(-15, 25, 8, 15);
                    ctx.fillRect(7, 25, 8, 15);
                    
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
                    
                    // Stealth Fighter
                    // Main body
                    ctx.beginPath();
                    ctx.moveTo(0, -30);
                    ctx.lineTo(-30, 10);
                    ctx.lineTo(-15, 15);
                    ctx.lineTo(0, 20);
                    ctx.lineTo(15, 15);
                    ctx.lineTo(30, 10);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Cockpit
                    ctx.beginPath();
                    ctx.moveTo(0, -15);
                    ctx.lineTo(-8, 0);
                    ctx.lineTo(8, 0);
                    ctx.closePath();
                    ctx.fillStyle = '#0ff';
                    ctx.fill();
                    
                    // Energy lines
                    ctx.beginPath();
                    ctx.moveTo(-30, 10);
                    ctx.lineTo(-20, 10);
                    ctx.moveTo(-15, 15);
                    ctx.lineTo(-5, 15);
                    ctx.moveTo(5, 15);
                    ctx.lineTo(15, 15);
                    ctx.moveTo(20, 10);
                    ctx.lineTo(30, 10);
                    ctx.strokeStyle = '#ff0066';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Engine glow
                    const engineGlow = ctx.createRadialGradient(0, 15, 0, 0, 15, 15);
                    engineGlow.addColorStop(0, '#0ff');
                    engineGlow.addColorStop(1, 'transparent');
                    ctx.fillStyle = engineGlow;
                    ctx.beginPath();
                    ctx.arc(0, 15, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
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
                speed: enemy.enemyBulletSpeed,
                color: enemy.color
            });
        }
    }

    function drawMenu() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw stars for background effect
        gameState.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
        drawStars();

        // Draw title
        ctx.fillStyle = '#ff2d55';
        ctx.font = 'bold 40px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL VOID', canvas.width / 2, canvas.height / 3);
        
        // Draw subtitle
        ctx.fillStyle = '#0ff';
        ctx.font = '20px "Courier New"';
        ctx.fillText('SELECT DIFFICULTY', canvas.width / 2, canvas.height / 3 + 40);

        // Draw difficulty options
        const difficulties = Object.values(DIFFICULTY);
        difficulties.forEach((diff, index) => {
            const y = canvas.height / 2 + index * 50;
            const isSelected = selectedDifficulty === diff.name;
            
            // Draw selection indicator
            if (isSelected) {
                ctx.fillStyle = '#ff2d55';
                ctx.fillText('>', canvas.width / 2 - 100, y);
                ctx.fillText('<', canvas.width / 2 + 100, y);
            }

            // Draw difficulty text
            ctx.fillStyle = isSelected ? '#0ff' : '#fff';
            ctx.fillText(diff.name, canvas.width / 2, y);
        });

        // Draw instructions
        ctx.fillStyle = '#ff2d55';
        ctx.font = '16px "Courier New"';
        ctx.fillText('↑↓ to select, SPACE to start', canvas.width / 2, canvas.height * 0.8);
    }

    function update() {
        if (currentState === GAME_STATE.MENU) {
            drawMenu();
        } else if (currentState === GAME_STATE.PLAYING) {
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

                // Automatic shooting (slower)
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
                    player.autoShootCooldown = player.shootDelay;
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
                            player.shield -= gameState.bulletDamage;
                            if (player.shield < 0) player.shield = 0;
                        } else {
                            player.lives--;
                            if (player.lives > 0) {
                                player.shield = DIFFICULTY[selectedDifficulty].playerShield;
                            } else {
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
                            player.shield -= gameState.bulletDamage * 2;
                            if (player.shield < 0) player.shield = 0;
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
                ctx.fillText('Press SPACE to return to menu', canvas.width / 2, canvas.height / 2 + 40);
                
                if (gameState.keys[' ']) {
                    // Reset game
                    score = 0;
                    scoreElement.textContent = score;
                    gameState.gameOver = false;
                    gameState.enemies = [];
                    gameState.bullets = [];
                    gameState.particles = [];
                    player.x = canvas.width / 2;
                    player.lives = 3;
                    player.shield = DIFFICULTY[selectedDifficulty].playerShield;
                    currentState = GAME_STATE.MENU;
                    selectedDifficulty = null;
                }
            }
        }
        requestAnimationFrame(update);
    }

    const menuOverlay = document.querySelector('.menu-overlay');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const difficultyInfo = document.getElementById('difficulty-info');

    // Add click handlers for difficulty buttons
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = DIFFICULTY[btn.dataset.difficulty];
            
            // Update button styles
            difficultyBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            // Show difficulty description
            difficultyInfo.textContent = difficulty.description;
            
            // Apply difficulty settings
            gameState.enemySpawnRate = difficulty.enemySpawnRate;
            gameState.enemyShootRate = difficulty.enemyShootRate;
            player.shootDelay = difficulty.playerShootDelay;
            player.shield = difficulty.playerShield;
            gameState.bulletDamage = difficulty.bulletDamage;
            
            // Start game after short delay
            setTimeout(() => {
                menuOverlay.classList.add('hidden');
                currentState = GAME_STATE.PLAYING;
            }, 500);
        });

        // Show difficulty info on hover
        btn.addEventListener('mouseenter', () => {
            difficultyInfo.textContent = DIFFICULTY[btn.dataset.difficulty].description;
        });
    });

    // Show menu when returning from game over
    function showMenu() {
        menuOverlay.classList.remove('hidden');
        difficultyBtns.forEach(btn => btn.classList.remove('selected'));
        difficultyInfo.textContent = 'Choose your challenge level';
    }

    // Initial menu show
    showMenu();

    update();
} 