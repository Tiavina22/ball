const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');
const mainMenu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const settingsBtn = document.getElementById('settings-btn');
const howToPlayScreen = document.getElementById('how-to-play');
const settingsScreen = document.getElementById('settings');
const backBtns = document.querySelectorAll('.back-btn');
const musicVolume = document.getElementById('music-volume');
const sfxVolume = document.getElementById('sfx-volume');

// Gestion du menu
let gameStarted = false;

playBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    gameStarted = true;
    resetGame();
    audioManager.startBackground();
});

howToPlayBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    howToPlayScreen.style.display = 'block';
});

settingsBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    settingsScreen.style.display = 'block';
});

backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        howToPlayScreen.style.display = 'none';
        settingsScreen.style.display = 'none';
        mainMenu.style.display = 'block';
    });
});

// Gestion du volume
musicVolume.addEventListener('input', (e) => {
    audioManager.sounds.background.volume = e.target.value / 100;
});

sfxVolume.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    Object.values(audioManager.sounds).forEach(sound => {
        if (sound !== audioManager.sounds.background) {
            sound.volume = volume;
        }
    });
});

class Ball {
    constructor(x, y, radius, dx, dy, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.glowColor = color;
        this.trail = [];
        this.maxTrailLength = 10;
    }

    draw(ctx) {
        // Dessiner la traînée
        this.trail.forEach((pos, index) => {
            const alpha = (index / this.trail.length) * 0.3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius * (0.5 + index/this.trail.length/2), 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('1)', `${alpha})`);
            ctx.fill();
        });

        // Effet de lueur externe
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, this.glowColor.replace('1)', '0.3)'));
        gradient.addColorStop(1, this.glowColor.replace('1)', '0)'));
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Boule principale avec effet métallique
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const ballGradient = ctx.createRadialGradient(
            this.x - this.radius/2,
            this.y - this.radius/2,
            0,
            this.x,
            this.y,
            this.radius
        );
        ballGradient.addColorStop(0, '#fff');
        ballGradient.addColorStop(0.5, this.color);
        ballGradient.addColorStop(1, this.color.replace('1)', '0.8)'));
        ctx.fillStyle = ballGradient;
        ctx.fill();

        // Reflet
        ctx.beginPath();
        ctx.arc(this.x - this.radius/3, this.y - this.radius/3, this.radius/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }

    update(canvas) {
        // Ajouter la position actuelle à la traînée
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Mise à jour de la position
        this.x += this.dx;
        this.y += this.dy;

        // Rebond sur les bords avec effet de particules
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.dx = -this.dx;
            createExplosion(this.x, this.y, this.color, 5); // Petit effet lors du rebond
            audioManager.play('bounce');
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.dy = -this.dy;
            createExplosion(this.x, this.y, this.color, 5);
        }

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        audioManager.play('bounce');
    }

    setDirection(angle) {
        const speed = 5;
        this.angle = angle;
        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
    }

    rotate(deltaAngle) {
        this.setDirection(this.angle + deltaAngle);
    }
}

class AudioManager {

    constructor() {

        this.sounds = {

            collision: new Audio('sounds/collision.mp3'),

            powerUp: new Audio('sounds/powerup.mp3'),

            bounce: new Audio('sounds/bounce.mp3'),

            gameOver: new Audio('sounds/gameover.mp3'),

            background: new Audio('sounds/background.mp3')

        };

        

        // Configurer la musique de fond

        this.sounds.background.loop = true;

        this.sounds.background.volume = 0.3;

        

        // Configurer les effets sonores

        Object.values(this.sounds).forEach(sound => {

            if (sound !== this.sounds.background) {

                sound.volume = 0.5;

            }

        });

    }



    play(soundName) {

        const sound = this.sounds[soundName];

        if (sound) {

            sound.currentTime = 0; // Permet de rejouer le son même s'il est déjà en cours

            sound.play().catch(e => console.log("Erreur audio:", e));

        }

    }



    startBackground() {

        this.sounds.background.play().catch(e => console.log("Erreur audio background:", e));

    }



    stopBackground() {

        this.sounds.background.pause();

        this.sounds.background.currentTime = 0;

    }

}



// Créer l'instance d'AudioManager

const audioManager = new AudioManager();

class Particle {
    constructor(x, y, color, speed = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3;
        this.dx = (Math.random() - 0.5) * 5 * speed;
        this.dy = (Math.random() - 0.5) * 5 * speed;
        this.alpha = 1;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.alpha -= this.decay;
        this.dx *= 0.99;
        this.dy *= 0.99;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
let score = 0;
let particles = [];

// Créer le joueur (boule bleue)
const player = new Ball(
    0, // commence à gauche
    0, // commence en haut
    20, 
    5,
    0,
    'rgba(0, 200, 255, 1)'
);
player.angle = 0;

// Créer des boules ennemies
const enemies = [];
function createEnemies(count) {
    for (let i = 0; i < count; i++) {
        // La vitesse de base augmente légèrement avec le score
        const baseSpeed = 3 + (score / 100);
        const speed = (Math.random() - 0.5) * baseSpeed;
        
        enemies.push(new Ball(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            15,
            speed,
            speed,
            'rgba(255, 50, 50, 1)'
        ));
    }
}
createEnemies(3);

// Gestion des contrôles
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Ajouter les nouvelles variables pour le contrôle tactile
let touchX = null;
let touchY = null;
let isTouching = false;

// Ajouter les événements tactiles sur le canvas
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchX = touch.clientX - canvas.offsetLeft;
    touchY = touch.clientY - canvas.offsetTop;
    isTouching = true;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isTouching) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - canvas.offsetLeft;
    const newY = touch.clientY - canvas.offsetTop;
    
    // Calculer l'angle vers le point touché
    const dx = newX - player.x;
    const dy = newY - player.y;
    const angle = Math.atan2(dy, dx);
    
    // Mettre à jour la direction du joueur
    player.setDirection(angle);
    
    touchX = newX;
    touchY = newY;
}

function handleTouchEnd(e) {
    e.preventDefault();
    isTouching = false;
}

// Modifier la fonction controlPlayer pour inclure le contrôle tactile
function controlPlayer() {
    const rotationSpeed = 0.08;

    if (!isTouching) {
        // Contrôles clavier pour desktop
        if (keys['ArrowLeft'] || keys['left']) {
            player.rotate(-rotationSpeed);
        }
        if (keys['ArrowRight'] || keys['right']) {
            player.rotate(rotationSpeed);
        }
    }
}

function createExplosion(x, y, color, count = 30) {
    for (let i = 0; i < count; i++) {
        const speed = 1 + Math.random() * 2;
        const particle = new Particle(x, y, color, speed);
        particle.radius = Math.random() * 5;
        particles.push(particle);
    }
}

function checkCollision(ball1, ball2) {
    const dx = ball1.x - ball2.x;
    const dy = ball1.y - ball2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball1.radius + ball2.radius;
}

// Ajouter des constantes pour les couleurs et effets
const COLORS = {
    player: 'rgba(0, 200, 255, 1)',
    enemy: 'rgba(255, 50, 50, 1)',
    powerUp: 'rgba(50, 255, 50, 1)',
    background: 'rgba(26, 26, 46, 0.1)',
    grid: 'rgba(255, 255, 255, 0.03)',
    score: '#fff'
};

// Ajouter une classe PowerUp
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.color = COLORS.powerUp;
        this.collected = false;
        this.angle = 0;
    }

    draw(ctx) {
        this.angle += 0.05;
        
        // Effet de rotation
        const x = this.x + Math.cos(this.angle) * 5;
        const y = this.y + Math.sin(this.angle) * 5;

        // Lueur
        ctx.beginPath();
        ctx.arc(x, y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('1)', '0.3)');
        ctx.fill();

        // Corps principal
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Ajouter des variables pour les power-ups et le score
let powerUps = [];
let highScore = localStorage.getItem('highScore') || 0;
let isInvincible = false;
let slowMotion = false;

// Modifier la fonction updateScore pour inclure les power-ups
function updateScore() {
    score++;
    scoreElement.textContent = `Score: ${score} | High Score: ${highScore}`;
    
    // Spawn power-up tous les 30 points
    if (score % 30 === 0) {
        spawnPowerUp();
    }

    // Ajouter des ennemis en fonction du score
    if (score <= 50) {
        // Phase 1 : jusqu'à 50 points
        if (score % 15 === 0 && enemies.length < 5) {
            createEnemies(1);
        }
    } else if (score <= 100) {
        // Phase 2 : de 50 à 100 points
        if (score % 20 === 0 && enemies.length < 7) {
            createEnemies(1);
        }
    } else if (score <= 200) {
        // Phase 3 : de 100 à 200 points
        if (score % 25 === 0 && enemies.length < 9) {
            createEnemies(1);
        }
    } else {
        // Phase finale : après 200 points
        if (score % 30 === 0 && enemies.length < 12) {
            createEnemies(1);
        }
    }

    // Augmenter progressivement la vitesse des ennemis
    if (score % 50 === 0) {
        enemies.forEach(enemy => {
            enemy.dx *= 1.1;
            enemy.dy *= 1.1;
        });
    }
}

// Ajouter la fonction spawnPowerUp
function spawnPowerUp() {
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    powerUps.push(new PowerUp(x, y));
}

function handleCollision() {
    createExplosion(player.x, player.y, player.color, 40);

    audioManager.play('collision');

    audioManager.play('gameOver');

    audioManager.stopBackground();
    
    // Effet de ralenti
    const originalSpeed = enemies.map(enemy => ({ dx: enemy.dx, dy: enemy.dy }));
    enemies.forEach(enemy => {
        enemy.dx *= 0.2;
        enemy.dy *= 0.2;
    });

    setTimeout(() => {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        
        gameOverScreen.style.display = 'block';
        gameStarted = false;
    }, 1000);
}

// Ajouter un gestionnaire d'événements pour le bouton restart
restartBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    resetGame();
});

function gameLoop() {
    // Effet de fond avec dégradé dynamique
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0.1)');
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0.2)');
        ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille dynamique
    drawDynamicGrid();

    // Gérer les power-ups
    powerUps = powerUps.filter(powerUp => {
        if (!powerUp.collected) {
            powerUp.draw(ctx);
            // Vérifier la collision avec le joueur
            if (checkCollision(player, powerUp)) {
                activatePowerUp();
                powerUp.collected = true;
                return false;
            }
            return true;
        }
        return false;
    });

    controlPlayer();
    player.update(canvas);
    player.draw(ctx);

    // Mettre à jour et dessiner les particules
    particles = particles.filter(particle => {
        particle.update();
        particle.draw(ctx);
        return particle.alpha > 0;
    });

    // Mettre à jour et dessiner les ennemis
    for (const enemy of enemies) {
        enemy.update(canvas);
        enemy.draw(ctx);

        if (checkCollision(player, enemy) && !isInvincible) {
            handleCollision();
            return;
        }
    }

    updateScore();
    requestAnimationFrame(gameLoop);

    // Ajouter un effet de pulsation pour le joueur
    const pulseSize = Math.sin(Date.now() / 500) * 2;
        ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 150, 255, 0.1)';
        ctx.fill();
}

function resetGame() {
    if (!gameStarted) {
        mainMenu.style.display = 'block';
        return;
    }
    
    gameOverScreen.style.display = 'none';
    audioManager.startBackground();
    score = 0;
    scoreElement.textContent = 'Score: 0';

   
    
    startEntrance();
    
    enemies.length = 0;
    createEnemies(2); // Commencer avec seulement 2 ennemis
    
    enemies.forEach(enemy => {
        while (enemy.x < canvas.width * 0.3 && enemy.y < canvas.height * 0.3) {
            enemy.x = Math.random() * canvas.width;
            enemy.y = Math.random() * canvas.height;
        }
    });
    
    particles = [];
    gameLoop();
}

// Ajouter une fonction pour l'entrée en scène
function startEntrance() {
    // Position de départ dans le coin supérieur gauche
    player.x = -player.radius;
    player.y = -player.radius;
    
    // Angle initial (45 degrés) pour aller vers le centre
    player.angle = Math.PI / 4; // 45 degrés en radians
    player.setDirection(player.angle);
}

// Appeler startEntrance au lieu de gameLoop directement
startEntrance();
gameLoop();

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    if (window.innerWidth <= 800) {
        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight * 0.6;
    }
});

// Ajouter la fonction drawDynamicGrid
function drawDynamicGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const time = Date.now() / 1000;
    const gridSize = 30;

    for(let i = 0; i < canvas.width; i += gridSize) {
        const offset = Math.sin(time + i * 0.01) * 5;
        ctx.beginPath();
        ctx.moveTo(i, offset);
        ctx.lineTo(i, canvas.height + offset);
        ctx.stroke();
    }

    for(let i = 0; i < canvas.height; i += gridSize) {
        const offset = Math.sin(time + i * 0.01) * 5;
        ctx.beginPath();
        ctx.moveTo(offset, i);
        ctx.lineTo(canvas.width + offset, i);
        ctx.stroke();
    }
}

// Ajouter la fonction activatePowerUp
function activatePowerUp() {
    const effect = Math.random();

    audioManager.play('powerUp')
    
    if (effect < 0.33) {
        // Invincibilité temporaire
        isInvincible = true;
        player.color = 'rgba(255, 215, 0, 1)'; // Couleur dorée
        setTimeout(() => {
            isInvincible = false;
            player.color = COLORS.player;
        }, 5000);
    } else if (effect < 0.66) {
        // Ralentissement des ennemis
        slowMotion = true;
        enemies.forEach(enemy => {
            enemy.dx *= 0.5;
            enemy.dy *= 0.5;
        });
        setTimeout(() => {
            slowMotion = false;
            enemies.forEach(enemy => {
                enemy.dx *= 2;
                enemy.dy *= 2;
            });
        }, 5000);
    } else {
        // Explosion qui repousse les ennemis
        const explosionForce = 10;
        enemies.forEach(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = explosionForce / (distance || 1);
            enemy.dx += (dx / distance) * force;
            enemy.dy += (dy / distance) * force;
        });
    }

    createExplosion(player.x, player.y, COLORS.powerUp, 30);
} 

// Au démarrage, afficher le menu principal et cacher le jeu
gameOverScreen.style.display = 'none';
mainMenu.style.display = 'block'; 