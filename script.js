document.addEventListener('DOMContentLoaded', () => {
    initSpaceshipGame();
});

function initSpaceshipGame() {
    const canvas = document.getElementById('spaceship-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    
    // Remove high score related variables
    let score = 0;

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

    // Add these variables at the top of initSpaceshipGame
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const difficultyInfo = document.getElementById('difficulty-info');
    const difficultyOverlay = document.querySelector('.difficulty-overlay');
    const mainMenuOverlay = document.querySelector('.main-menu-overlay');
    const gameOverOverlay = document.querySelector('.game-over-overlay');
    const menuBtn = document.querySelector('.menu-btn');
    const playBtn = document.querySelector('.play-btn');
    const hyperspaceEffect = document.querySelector('.hyperspace-effect');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

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
        if (currentState === GAME_STATE.PLAYING) {
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
        
        // Retro triangle spaceship
        ctx.beginPath();
        ctx.moveTo(0, -20);  // Top point
        ctx.lineTo(-15, 15); // Bottom left
        ctx.lineTo(15, 15);  // Bottom right
        ctx.closePath();
        ctx.fillStyle = player.color;
        ctx.fill();
        
        // Simple engine glow
        ctx.fillStyle = '#ff0';
        ctx.fillRect(-8, 15, 16, 5);
        
        ctx.restore();
    }

    function createEnemy() {
        const types = [
            {
                width: 30,
                height: 30,
                speed: 1,
                health: 1,
                color: '#ff0',
                points: 100,
                shootRate: 0.02,
                draw: function(ctx, x, y) {
                    ctx.save();
                    ctx.translate(x, y);
                    
                    // Simple invader-style enemy
                    ctx.beginPath();
                    ctx.moveTo(-15, -15);
                    ctx.lineTo(15, -15);
                    ctx.lineTo(15, 15);
                    ctx.lineTo(-15, 15);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    ctx.restore();
                }
            },
            // ... add more simple enemy types if desired
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            ...type,
            x: Math.random() * (canvas.width - type.width) + type.width/2,
            y: -type.height,
            targetY: Math.random() * (canvas.height/3)
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
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (currentState === GAME_STATE.PLAYING) {
            // Spawn enemies
            if (Math.random() < gameState.enemySpawnRate) {
                gameState.enemies.push(createEnemy());
            }

            // Auto-shoot
            if (player.autoShootCooldown <= 0) {
                gameState.bullets.push({
                    x: player.x,
                    y: player.y - 20,
                    width: 4,
                    height: 12,
                    color: '#0f0'
                });
                player.autoShootCooldown = player.shootDelay;
            }
            player.autoShootCooldown--;

            // Update player position
            if (gameState.keys['ArrowLeft']) {
                player.x = Math.max(player.width/2, player.x - player.speed);
            }
            if (gameState.keys['ArrowRight']) {
                player.x = Math.min(canvas.width - player.width/2, player.x + player.speed);
            }

            // Update and draw everything
            updateBullets();
            updateEnemies();
            drawPlayer();
            drawUI();
        }

        requestAnimationFrame(update);
    }

    // Create star background for menu
    const starsContainer = document.querySelector('.stars-container');
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        starsContainer.appendChild(star);
    }

    function createHyperspaceEffect() {
        const hyperspaceEffect = document.querySelector('.hyperspace-effect');
        hyperspaceEffect.innerHTML = ''; // Clear previous effect
        
        // Create star field
        const starField = document.createElement('div');
        starField.className = 'star-field';
        
        // Create 3D star field
        for (let i = 0; i < 200; i++) {
            const star = document.createElement('div');
            star.className = 'hyperspace-star';
            
            // Random 3D position
            const z = Math.random() * 1000;
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            
            star.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
            starField.appendChild(star);
        }
        
        // Create tunnel effect
        const tunnel = document.createElement('div');
        tunnel.className = 'hyperspace-tunnel';
        
        hyperspaceEffect.appendChild(starField);
        hyperspaceEffect.appendChild(tunnel);
    }

    playBtn.addEventListener('click', () => {
        createHyperspaceEffect();
        hyperspaceEffect.classList.remove('hidden');
        hyperspaceEffect.classList.add('active');
        
        setTimeout(() => {
            mainMenuOverlay.classList.add('hidden');
            difficultyOverlay.classList.remove('hidden');
            hyperspaceEffect.classList.remove('active');
            hyperspaceEffect.classList.add('hidden');
            // Reset difficulty selection
            difficultyBtns.forEach(btn => btn.classList.remove('selected'));
            difficultyInfo.textContent = 'Choose your challenge level';
        }, 2000);
    });

    // Modify menu button to return to main menu
    menuBtn.addEventListener('click', () => {
        // Reset game state
        score = 0;
        scoreElement.textContent = score;
        gameState.gameOver = false;
        gameState.enemies = [];
        gameState.bullets = [];
        gameState.enemyBullets = [];
        gameState.particles = [];
        player.x = canvas.width / 2;
        player.lives = 3;
        player.shield = 100;
        player.autoShootCooldown = 0;
        
        // Hide all overlays
        gameOverOverlay.classList.add('hidden');
        difficultyOverlay.classList.add('hidden');
        
        // Show main menu
        mainMenuOverlay.classList.remove('hidden');
        currentState = GAME_STATE.MENU;
        selectedDifficulty = null;
    });

    // Initial menu show
    showMenu();

    // Add difficulty button click handlers
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const difficultyKey = btn.dataset.difficulty;
            const difficulty = DIFFICULTY[difficultyKey];
            selectedDifficulty = difficultyKey;
            
            // Apply settings and reset game state
            applyDifficultySettings(difficulty);
            resetGameState();
            
            // Start game immediately after hyperspace effect
            createHyperspaceEffect();
            hyperspaceEffect.classList.remove('hidden');
            hyperspaceEffect.classList.add('active');
            
            setTimeout(() => {
                difficultyOverlay.classList.add('hidden');
                hyperspaceEffect.classList.remove('active');
                hyperspaceEffect.classList.add('hidden');
                currentState = GAME_STATE.PLAYING;
            }, 2000);
        });

        // Add hover effect for difficulty descriptions
        btn.addEventListener('mouseenter', () => {
            const difficulty = DIFFICULTY[btn.dataset.difficulty];
            difficultyInfo.textContent = difficulty.description;
        });
    });

    // Start the game loop
    update();
} 