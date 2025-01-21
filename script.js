document.addEventListener('DOMContentLoaded', () => {
    initPuzzleGame();
    initShooterGame();
});

function initPuzzleGame() {
    const canvas = document.getElementById('puzzle-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Simple puzzle game setup
    const tiles = [];
    const gridSize = 3;
    
    for (let i = 0; i < gridSize * gridSize - 1; i++) {
        tiles.push(i + 1);
    }
    tiles.push(null); // Empty tile
    
    function drawPuzzle() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const tileWidth = canvas.width / gridSize;
        const tileHeight = canvas.height / gridSize;
        
        tiles.forEach((tile, index) => {
            if (tile) {
                const x = (index % gridSize) * tileWidth;
                const y = Math.floor(index / gridSize) * tileHeight;
                
                ctx.fillStyle = '#0ff';
                ctx.strokeStyle = '#ff2d55';
                ctx.lineWidth = 2;
                ctx.fillRect(x + 2, y + 2, tileWidth - 4, tileHeight - 4);
                ctx.strokeRect(x + 2, y + 2, tileWidth - 4, tileHeight - 4);
                
                ctx.fillStyle = '#000';
                ctx.font = '20px "Courier New"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tile.toString(), x + tileWidth / 2, y + tileHeight / 2);
            }
        });
    }
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const tileWidth = canvas.width / gridSize;
        const tileHeight = canvas.height / gridSize;
        
        const clickedIndex = Math.floor(y / tileHeight) * gridSize + Math.floor(x / tileWidth);
        const emptyIndex = tiles.indexOf(null);
        
        if (isAdjacent(clickedIndex, emptyIndex)) {
            [tiles[clickedIndex], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[clickedIndex]];
            drawPuzzle();
        }
    });
    
    function isAdjacent(index1, index2) {
        const row1 = Math.floor(index1 / gridSize);
        const col1 = index1 % gridSize;
        const row2 = Math.floor(index2 / gridSize);
        const col2 = index2 % gridSize;
        
        return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
    }
    
    drawPuzzle();
}

function initShooterGame() {
    const canvas = document.getElementById('shooter-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const player = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        width: 20,
        height: 20,
        speed: 5
    };
    
    const bullets = [];
    const enemies = [];
    let gameLoop;
    
    function drawPlayer() {
        ctx.fillStyle = '#ff2d55';
        ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, 
                    player.width, player.height);
    }
    
    function drawBullets() {
        ctx.fillStyle = '#0ff';
        bullets.forEach(bullet => {
            ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 8);
        });
    }
    
    function drawEnemies() {
        ctx.fillStyle = '#b026ff';
        enemies.forEach(enemy => {
            ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 30);
        });
    }
    
    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update bullets
        bullets.forEach((bullet, index) => {
            bullet.y -= 7;
            if (bullet.y < 0) bullets.splice(index, 1);
        });
        
        // Update enemies
        if (Math.random() < 0.02) {
            enemies.push({
                x: Math.random() * canvas.width,
                y: -20,
                speed: 2
            });
        }
        
        enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed;
            if (enemy.y > canvas.height) enemies.splice(index, 1);
        });
        
        // Draw everything
        drawPlayer();
        drawBullets();
        drawEnemies();
    }
    
    // Controls
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') player.x = Math.max(player.width / 2, player.x - player.speed);
        if (e.key === 'ArrowRight') player.x = Math.min(canvas.width - player.width / 2, player.x + player.speed);
        if (e.key === ' ') bullets.push({ x: player.x, y: player.y });
    });
    
    gameLoop = setInterval(update, 1000 / 60);
} 