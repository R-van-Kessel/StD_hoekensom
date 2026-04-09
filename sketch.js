/* ======================
   GLOBAL STYLE
====================== */
/* ===== DEVICE DETECT & SCALE (ADD AT TOP) ===== */

let IS_MOBILE = true; // Forceer mobiel voor test
let SCALE_FACTOR = 1;

/* ===== SAFE CURSOR (NO p5 dependency) ===== */
let showHandCursor = false;

const style = document.createElement('style');
style.textContent = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: #0e1621;
  font-family: Arial, sans-serif;
  padding: 10px 10px 50px;
}

button {
  height: 38px;
  cursor: pointer;
  transition: transform .2s ease, opacity .2s ease;
}

button:hover { transform: scale(1.15); }
button:active { transform: scale(0.95); }

.nav {
  display: flex;
  gap: 5px;
  padding: 5px;
  flex-wrap: nowrap;
  justify-content: center;
  position: relative;
  z-index: 1000;
  width: 100%;
  overflow-x: auto;
}

.nav a {
  color: white;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,.15);
  font-weight: bold;
  font-size: 17px;      
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 40px;
  text-align: center;
}
.nav a:hover { background: rgba(255,255,255,.5); }

@media (max-width: 768px) {
  body {
    padding: 2px 2px 20px;
  }
  
  .nav {
    gap: 3px;
    padding: 3px;
    margin-bottom: 5px;
  }
  
  .nav a {
    padding: 4px 6px;
    font-size: 10px;
  }
}
`;
document.head.appendChild(style);

/* viewport */
let meta = document.querySelector('meta[name="viewport"]');
if (!meta) {
  meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  document.head.appendChild(meta);
} else {
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
}
function setCursor(type) {
  document.body.style.cursor = type;
}

/* =====================================
   NAVIGATIEBALK INSTELLEN
===================================== */

// Voeg navigatiebalk toe aan de pagina

function createNavigation() {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/" ontouchstart="">🏠 Home</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/rekenen.html" ontouchstart="">➗ Rekenen</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas1.html" ontouchstart="">📘 Klas 1</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas2.html" ontouchstart="">📗 Klas 2</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas3.html" ontouchstart="">📙 Klas 3</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/overig.html" ontouchstart="">🎓 Overig</a>
  `;
  document.body.prepend(nav);
  
  // Extra fix voor mobiele clicks
  setTimeout(() => {
    nav.querySelectorAll('a').forEach(link => {
      link.style.pointerEvents = 'auto';
      link.style.touchAction = 'manipulation';
      link.addEventListener('touchend', (e) => {
        e.stopPropagation();
        window.location.href = link.href;
      }, { passive: false });
    });
  }, 100);
}

// VERVANG DE OUDE SPATIE BLOKKERING DOOR DEZE:
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.keyCode === 32) {
        // Alleen toestaan als we in de dino game zitten EN niet game over
        if (showDinoGame && dinoGame && !dinoGame.gameOver) {
            e.preventDefault();
            e.stopPropagation();
            dinoGame.dino.jump();
        } else if (showDinoGame && dinoGame && dinoGame.gameOver) {
            // Tijdens game over: blokkeer spatie volledig
            e.preventDefault();
            e.stopPropagation();
        } else {
            // Buiten game: blokkeer spatie ook
            e.preventDefault();
            e.stopPropagation();
        }
    }
}, true);


/* =====================================
   GRID & LAYOUT INSTELLINGEN
===================================== */


// Grid
const COLS = 5;
const ROWS = 5; //extra rij voor buttons
const CELL_SIZE = 140;
const MARGIN = 200;

// Verticale ruimte boven grid
const TITLE_SPACE = -200;      // ← hoogte grid
const BUTTON_HEIGHT = 40;   // Hoogte van knoppenrij


// TITEL INSTELLINGEN
const TITLE_TEXT = 'Summon the Dragon';
const TITLE_LINK = 'https://r-van-kessel.github.io/Summon_the_Dragon/index.html';
const TITLE_SIZE = 30;
const TITLE_COLOR = [255, 200, 100];
const TITLE_Y = 30;   // titel hoger/lager

// ONDERTITEL INSTELLINGEN
const SUBTITLE_TEXT = 'Los alle sommen op om de draak op te roepen!';
const SUBTITLE_SIZE = 14;
const SUBTITLE_COLOR = [255, 200, 100];
const SUBTITLE_Y = 70;   // subtitle afstand

// DRAAK ACHTERGROND INSTELLINGEN - HIER KUN JE AANPASSEN!
const DRAGON_SCALE_X = 0.9;    // ← Horizontale schaal: 1.0=normaal, 1.5=breder, 0.5=smaller
const DRAGON_SCALE_Y = 0.9;    // ← Verticale schaal: 1.0=normaal, 1.5=hoger, 0.5=korter
const DRAGON_X_OFFSET = 50;     // ← Horizontaal: negatief=links, positief=rechts (bijv. -100 of 150)
const DRAGON_Y_OFFSET = -80;     // ← Verticaal: negatief=omhoog, positief=omlaag (bijv. -50 of 100)
const DRAGON_OPACITY = 250;    // ← Transparantie: 0=onzichtbaar, 255=volledig zichtbaar, 150=half
const DRAGON_BLUR = true;     // ← true = achtergrond wazig, false = scherp

// ============================================

let blocks = [];
let draggingBlock = null;
let offsetX = 0;
let offsetY = 0;

// Canvas buttons (geen HTML buttons meer)
let canvasButtons = [];

let isChecked = false;
let correctCount = 0;
let isFlashing = false;
let flashCounter = 0;

let dinoGame = null;
let showDinoGame = false;
let totalGamesPlayed = 0;
let dinoGameCount = 0;
let dinoImage = null;
let backgroundImage = null;
let bgLoaded = false;

class CanvasButton {
  constructor(x, y, w, h, label, color, action) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.color = color;
    this.action = action;
    this.hovered = false;
    this.hoverProgress = 0;  // ← NIEUW
  }
  
  draw() {
    push();
    
    // Hover effect met scale en lift
  if (this.hoverProgress > 0) {
    let lift = -4 * this.hoverProgress;  // Kleinere lift dan blokjes
    let scaleAmount = 1 + 0.10 * this.hoverProgress;  // 10% groter
    
    translate(this.x + this.w / 2, this.y + this.h / 2 + lift);
    scale(scaleAmount);
    translate(-this.w / 2, -this.h / 2);
    
    // Schaduw effect
    drawingContext.shadowBlur = 15 * this.hoverProgress;
    drawingContext.shadowColor = 'rgba(0,0,0,0.4)';
    drawingContext.shadowOffsetY = 3 * this.hoverProgress;
  }
  
  // Button kleur met hover brightening
  if (this.hoverProgress > 0) {
    let brighten = 30 * this.hoverProgress;
    fill(
      red(this.color) + brighten, 
      green(this.color) + brighten, 
      blue(this.color) + brighten
    );
  } else {
    fill(this.color);
  }
  
  noStroke();
  
  // Teken button (relatieve positie als getransformeerd)
  if (this.hoverProgress > 0) {
    rect(0, 0, this.w, this.h, 8);
  } else {
    rect(this.x, this.y, this.w, this.h, 8);
  }
  
  // Reset schaduw
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
  
  // Tekst
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(IS_MOBILE ? 12 : 16);
  textStyle(BOLD);
  
  if (this.hoverProgress > 0) {
    text(this.label, this.w / 2, this.h / 2);
  } else {
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }
  
  pop();
}
  
  isClicked(mx, my) {
    return mx > this.x && mx < this.x + this.w && 
           my > this.y && my < this.y + this.h;
  }
  
  checkHover(mx, my) {
  this.hovered = this.isClicked(mx, my);
  
  // Smooth hover animatie
  const target = this.hovered ? 1 : 0;
  this.hoverProgress = lerp(this.hoverProgress, target, 0.15);
  }
}


  
class Dino {
  constructor() {
    this.x = MARGIN + (COLS * CELL_SIZE) / 4;
    this.y = 0;
    this.width = 50;
    this.height = 53;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpPower = -15;
    this.onGround = true;
    this.onPlatform = false;
    this.legFrame = 0;

    // ===== INVINCIBLE STATUS =====
    this.invincible = false;
    this.invincibleUntil = 0;

    // ===== INSTELBAAR =====
    this.invincibleDuration = 3000; //aanpassen invisible tijd van 3 sec
    this.invincibleFlickerSpeed = 100;
  }

  activateInvincible() {
    this.invincible = true;
    this.invincibleUntil = millis() + this.invincibleDuration;
  }

  update() {
    // fps-safe timer
    if (this.invincible && millis() > this.invincibleUntil) {
      this.invincible = false;
    }

    this.vy += this.gravity;
    this.y += this.vy;

    // Check of op de grond (en niet op een platform)
    if (this.y >= 0 && !this.onPlatform) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
    }
    
    // Bij vallen voorbij grondlevel, reset platform status
    if (this.y > 0) {
      this.onPlatform = false;
    }
    
    if (this.onGround && frameCount % 6 === 0) {
      this.legFrame = (this.legFrame + 1) % 2;
    }
  }

  jump() {
    if (this.onGround) {
      if (this.onPlatform) {
        this.vy = this.jumpPower * 1.2;
        this.onPlatform = false;
      } else {
        this.vy = this.jumpPower;
      }
      this.onGround = false;
    }
  }

  draw(gameY) {
    push();

    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    let drawY = groundY + this.y;

    // Schaduw onder voeten//
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(this.x + this.width / 2, drawY + this.height + 2, this.width * 0.6, 10); 

    // Knipperen dragon logica
    let flickerOn = true;
    if (this.invincible) {
      flickerOn = (millis() % (this.invincibleFlickerSpeed * 2)) < this.invincibleFlickerSpeed;
    }

    if (flickerOn) {
      if (dinoImage) {
        imageMode(CORNER);
        image(dinoImage, this.x, drawY, this.width, this.height);
      } else {
        textAlign(CENTER, CENTER);
        textSize(this.height);
        text('🦖', this.x + this.width / 2, drawY + this.height / 2);
      }
    }

    pop();
  }

  getBottom(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y + this.height;
  }

  getTop(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y;
  }
}

//Diamant parameters//
class Orb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.collected = false;
  }

  update() {
    this.y += sin(frameCount * 0.1) * 0.5;
  }

  draw() {
    if (!this.collected) {
      push();
      translate(this.x, this.y);
      
      // Rotatie voor sparkle effect
      rotate(frameCount * 0.02);
      
      // Buitenste diamant (glow)
      fill(34, 2, 97, 100);
      noStroke();
      beginShape();
      vertex(0, -this.radius * 1.3);
      vertex(this.radius * 0.8, 0);
      vertex(0, this.radius * 1.3);
      vertex(-this.radius * 0.8, 0);
      endShape(CLOSE);
      
      // Binnenste diamant (helder)
      fill(7, 165, 255);
      stroke(0);
      strokeWeight(2);
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.6, 0);
      vertex(0, this.radius);
      vertex(-this.radius * 0.6, 0);
      endShape(CLOSE);
      
      // Glans facetten
      fill(255, 255, 255, 180);
      noStroke();
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.3, -this.radius * 0.3);
      vertex(0, 0);
      vertex(-this.radius * 0.3, -this.radius * 0.3);
      endShape(CLOSE);
      
      // Kleine sparkles
      fill(255, 255, 255, 200);
      ellipse(this.radius * 0.4, -this.radius * 0.4, 3);
      ellipse(-this.radius * 0.3, this.radius * 0.3, 2);
      
      pop();
    }
  }

  hits(dino, gameY) {
    let dinoBottom = dino.getBottom(gameY);
    let dinoTop = dino.getTop(gameY);
    let dinoRight = dino.x + dino.width;
    let dinoLeft = dino.x;

    let closestX = constrain(this.x, dinoLeft, dinoRight);
    let closestY = constrain(this.y, dinoTop, dinoBottom);
    let dx = this.x - closestX;
    let dy = this.y - closestY;

    return dx * dx + dy * dy < this.radius * this.radius;
  }
}

class Obstacle {
  constructor(type, xPos) {
    this.type = type;
    this.x = xPos;
    this.scored = false;

    if (type === 'low') {
      this.width = 100;
      this.height = 40;
      this.isPlatform = false;
    } else if (type === 'high') {
      this.width = 25;
      this.height = 80;
      this.isPlatform = false;
    } else {
      this.width = 150;
      this.height = 15;
      this.isPlatform = true;

      this.hasOrb = random() < 0.3; //verhouding diamantjes binnen 30% platforms//

      if (this.hasOrb) {
        let platformY = CELL_SIZE + 25;
        this.orb = new Orb(
          this.x + this.width * 1.5, //aanpassen x waarde diamant//
          platformY - 80
        );
      } else {
        this.orb = null;
      }
    }
  }

  update(speed) {
    this.x -= speed;
    if (this.orb) this.orb.x -= speed;
  }

  draw(gameY) {
    push();
    if (this.isPlatform) {
      fill(229, 244, 58);
      stroke(139, 69, 19);
      strokeWeight(2);
      let platformY = gameY + (CELL_SIZE + 25);
      rect(this.x, platformY, this.width, this.height, 4);

      if (this.orb && !this.orb.collected) {
        this.orb.y = platformY - 80;
        this.orb.draw();
      }
    } else {
      fill(231, 76, 60);
      noStroke();
      let obsY = gameY + (CELL_SIZE * 2) - this.height;
      rect(this.x, obsY, this.width, this.height);
    }
    pop();
  }

  hits(dino, gameY) {
    if (this.isPlatform) {
      let platformTop = gameY + CELL_SIZE + 25;
      let platformBottom = platformTop + this.height;
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      
      let horizontalOverlap = dino.x + dino.width > this.x && dino.x < this.x + this.width;
      
      // Landen op platform (vanaf boven)
      if (dino.vy >= 0 && 
          dinoBottom >= platformTop - 5 && 
          dinoBottom <= platformTop + 5 &&
          horizontalOverlap) {
        
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformTop - groundY;
        dino.vy = 0;
        dino.onGround = true;
        dino.onPlatform = true;
      }
      
      // Raken platform van onderen
      if (dino.vy < 0 && 
          dinoTop <= platformBottom + 5 && 
          dinoTop >= platformTop &&
          horizontalOverlap) {
        
        dino.vy = 0;
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformBottom - groundY;
      }

      // Orb collection
      if (this.hasOrb && !this.orb.collected) {
        if (this.orb.hits(dino, gameY)) {
          this.orb.collected = true;
          dino.activateInvincible();
        }
      }
      
      return false;
    } else {
      // Raken normale obstakels
      let obsTop = gameY + (CELL_SIZE * 2) - this.height;
      let obsBottom = gameY + (CELL_SIZE * 2);
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);

      if (dino.x + dino.width > this.x &&
          dino.x < this.x + this.width &&
          dinoBottom > obsTop &&
          dinoTop < obsBottom) {
        return true;
      }
    }
    return false;
  }

  isOffScreen() {
    return this.x + this.width < MARGIN;
  }
}

class DinoGame {
  constructor() {
    this.dino = new Dino();
    this.obstacles = [];
    this.gameOver = false;
    this.score = 0;
    this.gameSpeed = 6;
    this.spawnTimer = 0;
    this.gamesPlayed = 0;
    this.maxGames = 3;
    this.gameOverTimer = 0;
  }

  reset() {
    this.dino = new Dino();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.gameOver = false;
    this.gameOverTimer = 0;

    if (this.gamesPlayed >= this.maxGames) {
      this.score = 0;
      this.gameSpeed = 6;
      this.gamesPlayed = 0;
    }
  }

  spawnObstacles() {
    let rand = random();
    if (rand < 0.4) {
      this.obstacles.push(new Obstacle('low', MARGIN + COLS * CELL_SIZE));
    } else if (rand < 0.7) {
      this.obstacles.push(new Obstacle('high', MARGIN + COLS * CELL_SIZE));
    } else {
      let platform = new Obstacle('platform', MARGIN + COLS * CELL_SIZE);
      this.obstacles.push(platform);
      let followUp = new Obstacle(random() < 0.5 ? 'low' : 'high', MARGIN + COLS * CELL_SIZE + 250);
      this.obstacles.push(followUp);
    }
  }

  update(gameY) {
    if (this.gameOver) {
      this.gameOverTimer++;
      if (this.gameOverTimer >= 120) {
        if (this.gamesPlayed < this.maxGames) {
          this.reset();
        }
      }
      return;
    }

    this.dino.update();

    this.spawnTimer++;
    let spawnInterval = max(40, 80 - floor(this.score / 5) * 5);
    if (this.spawnTimer > spawnInterval) {
      this.spawnObstacles();
      this.spawnTimer = 0;
    }

    // Eerst check platforms, dan obstakels
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.update(this.gameSpeed);

      // Platform raken (eindigt game niet)
      if (obs.isPlatform) {
        obs.hits(this.dino, gameY);
      }

      // Obstakel raken (beeindigd game tenzij je invincible bent)
      if (!obs.isPlatform && obs.hits(this.dino, gameY)) {
        if (!this.dino.invincible) {
          this.gameOver = true;
          this.gamesPlayed++;
          this.gameOverTimer = 0;
        }
      }

      if (!obs.scored && !obs.isPlatform && obs.x + obs.width < this.dino.x) {
        obs.scored = true;
        this.score++;
      }

      if (obs.isOffScreen()) {
        this.obstacles.splice(i, 1);
      }
    }

    if (frameCount % 180 === 0) {
      this.gameSpeed = min(this.gameSpeed + 0.5, 15);
    }
  }

  draw(gameY) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
    drawingContext.clip();

    fill(135, 206, 235);
    noStroke();
    rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);

    fill(139, 69, 19);
    rect(MARGIN, gameY + (CELL_SIZE * 2) - 10, COLS * CELL_SIZE, 10);

    for (let obs of this.obstacles) {
      obs.draw(gameY);
    }

    this.dino.draw(gameY);
    drawingContext.restore();

    fill(51);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Score: ' + this.score, MARGIN + 10, gameY + 10);

    textSize(14);
    textStyle(NORMAL);
    fill(85);
    text('Games: ' + this.gamesPlayed + '/' + this.maxGames, MARGIN + 10, gameY + 30);
    text('Speed: ' + nf(this.gameSpeed, 1, 1), MARGIN + 10, gameY + 50);

    if (this.gameOver) {
      fill(0, 0, 0, 180);
      rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);

      fill(255);
      textAlign(CENTER, CENTER);
      textSize(28);
      textStyle(BOLD);
      text('GAME OVER!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE - 20);

      textSize(18);
      textStyle(NORMAL);
      text('Score: ' + this.score, MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 10);
      text('Komt er nog een dragon?', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 35);

      if (this.gamesPlayed >= this.maxGames) {
        fill(243, 156, 18);
        textSize(18);
        textStyle(BOLD);
        text('Nee, klik nu op rode reset knop!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 65);
      }
    }
    pop();
  }
}

  
// Voorkom dat spatie de pagina scrollt
document.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.keyCode === 32) {
        if (showDinoGame && dinoGame) {
            e.preventDefault();
        }
    }
}, false);

function styleButton(btn, bgColor, padding) {
    btn.style('padding', padding);
    btn.style('font-size', '16px');
    btn.style('cursor', 'pointer');
    btn.style('background-color', bgColor);
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '8px');
    btn.style('position', 'absolute');  
}

function resetGame() {
    showDinoGame = false;
    dinoGame = null;
    generateQuestions();
}

function showInfo() {
    let overlay = document.createElement('div');
    overlay.id = 'infoOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'infoPopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid #333;
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="color: #fb0427; margin-top: 0;">
        Summon the Dragon
        </h2><br>
        <p style="color: #0E0E0E; line-height: 1.2;">
            <strong>Doel:<br></strong> Los alle 10 sommen correct op en speel de Dragon game!</ol><br><br>
            <strong>Hoe speel je:</strong>
            <ol style="color: #0909B4; margin: 5px 0;">
                <li>Sleep blauwe somblokjes naar de juiste oranje antwoorden.</li>
                <li>Klik "Nakijken" om je antwoorden te controleren.</li>
                <li>Klik op "Score" om de feedback op je resultaten te bekijken.</li>
                <li>Bij een score van 10/10 start de Dragon game automatisch! </li>
            </ol><br> 
            <strong>Dragon Game:</strong><li> Spring met spatie of muisklik.</li>
<li>Spring op de hoge gele trampolines en kom er met een grote boog uit door een snelle dubbelklik!</li>
<li>Pak de draaiende diamantjes om 3 seconden lang dwars door de hindernissen te kunnen lopen</li>
            <li>Na 3 game-overs komt er een volledige reset.</li>
            <ol style="color: #F44336; margin: 5px 0;">
            </ol><br>
            <strong>Reset:<br></strong> Klik "Reset" voor nieuwe sommen.
            </ol>
        </p>
        <button id="closeBtn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            popup.remove();
            overlay.remove();
        }
    });
}

function showScoreFeedback() {
    if (!isChecked) {
        return;
    }
    
    let feedbackTitle = '';
    let feedbackText = '';
    let feedbackColor = '';
    
    if (correctCount === 0) {
        feedbackTitle = '😢 Oeps! 0/10';
        feedbackText = 'Nog geen enkele som goed! Kijk of je uitleg kunt krijgen voor deze sommen en reken ze dan eerst op papier uit!';
        feedbackColor = '#e74c3c';
    } else if (correctCount <= 3) {
        feedbackTitle = '😕 Begin is er! ' + correctCount + '/10';
        feedbackText = 'Je hebt er al één,twee of drie goed! Reken de sommen uit op papier en controleer je antwoord, dan gaat het vast beter!';
        feedbackColor = '#e67e22';
    } else if (correctCount <= 5) {
        feedbackTitle = '🙂 Halfway! ' + correctCount + '/10';
        feedbackText = 'Je bent al (bijna) halverwege! Goed gedaan, maar je kunt beter! Blijf geconcentreerd en blijf oefenen totdat je het foutloos kunt!';
        feedbackColor = '#f39c12';
    } else if (correctCount <= 7) {
        feedbackTitle = '😊 Goed bezig! ' + correctCount + '/10';
        feedbackText = 'Wow, meer dan de helft goed! Jij kunt dit! Let op slordigheidsfoutjes dan mag jij straks ook de Dragon game spelen!';
        feedbackColor = '#3498db';
    } else if (correctCount <= 9) {
        feedbackTitle = '🤩 Bijna perfect! ' + correctCount + '/10';
        feedbackText = 'Fantastisch! Je hebt ze bijna allemaal goed. Nog even opletten bij de laatste sommen en dan roep je de draak op!';
        feedbackColor = '#2ecc71';
    } else if (correctCount <= 10) {
        feedbackTitle = '🤩 Perfect! ' + correctCount + '/10';
        feedbackText = 'Dragon Master! De sommen maak je foutloos maar wat is je highscore bij de Dragon game?';
        feedbackColor = '#FFC107';
    }
    
    let overlay = document.createElement('div');
    overlay.id = 'scoreOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'scorePopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid ${feedbackColor};
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="margin-top: 0; color: ${feedbackColor};">
            ${feedbackTitle}
        </h2>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
            ${feedbackText}
        </p>
        <button id="closeFeedbackBtn" style="
            background-color: ${feedbackColor};
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeFeedbackBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            popup.remove();
            overlay.remove();
        }
    });
}

function keyPressed(event) {
    // Laat de window event listener het afhandelen
    return false;
}

// =============================================
// AANPASBARE INSTELLINGEN
// =============================================
const FIG = {
  scale:       0.90,   // ← zo groot mogelijk binnen het blokje
  lineWeight:  2.0,
  angleSize:   10,     // ← iets groter want meer ruimte
  labelOffset: 13,
  colTriangle:  [50, 250, 11],
  colQuad:      [200, 230, 255],
  colParallel:  [255, 230, 0],
  colKite:      [250, 255, 0],
  colAngleLine: [210, 235, 255],
  colArcMark:   [0, 0, 0],
  colUnknown:   [0, 0, 0],
};

// =============================================
// GENERATE QUESTIONS
// =============================================

function generateQuestions() {
    blocks = [];
    isChecked = false;
    correctCount = 0;
    isFlashing = false;
    flashCounter = 0;

    let questions = [];
    let answers = [];

    function rnd(min, max) { return floor(random(min, max + 1)); }

    const generators = [

         // 1. GESTREKT
        () => {
            let a = rnd(20, 160);
            let b = 180 - a;
            let askA = random() < 0.5;
            return { text: ``, answer: askA ? a : b,
                     figureType: 'gestrekt',
                     figureData: { a, b, askA } };
        },

        // 2. OVERSTAAND
        () => {
            let a = rnd(50, 160);
            let askA = random() < 0.5;
            return { text: ``, answer: a,
                     figureType: 'overstaand',
                     figureData: { a, askA } };
        },

        () => {
            let a = rnd(50, 80);
            let b = rnd(40, 180 - a - 40);
            let c = 180 - a - b;
            let unknownIdx = rnd(0, 2);
            let unkKey = ['a','b','c'][unknownIdx];
            return { text: ``, answer: unkKey==='a' ? a : unkKey==='b' ? b : c,
                     figureType: 'driehoek',
                     figureData: { a, b, c, unknown: unkKey } };
        },
        () => {
            let top = rnd(20, 100);
            let base = round((180 - top) / 2);
            // Drie hoeken: 0=top, 1=linksbasis, 2=rechtsbasis
            let labelIdx   = rnd(0, 2);  // welke hoek toont de waarde
            let unknownIdx = rnd(0, 2);  // welke hoek is vraagteken
            while (unknownIdx === labelIdx) unknownIdx = rnd(0, 2);
            // Antwoord = de hoekwaarde van unknownIdx
            let vals = [top, base, base];
            return { text: ``, answer: vals[unknownIdx],
                     figureType: 'gelijkbenig',
                     figureData: { top, base, labelIdx, unknownIdx } };
        },
() => {
            let labelIdx = rnd(0, 2);   // welke hoek toont 60°
            let unknownIdx = rnd(0, 2); // welke hoek is het vraagteken
            // zorg dat ze niet hetzelfde zijn
            while (unknownIdx === labelIdx) unknownIdx = rnd(0, 2);
            return { text: ``, answer: 60, figureType: 'gelijkzijdig',
                     figureData: { labelIdx, unknownIdx } };
        },

        // 6. // F-HOEK 1: corresponderende hoeken (gelijk aan elkaar)
        () => {
            let a = rnd(30, 150);
            let askTop = random() < 0.5;  // random welke gegeven/gevraagd
            // corresponderende positie: beide links of beide rechts van dwarslijn
            let posTop = random() < 0.5 ? 'left' : 'right';
            let posBot = posTop;  // zelfde kant = corresponderend
            return { text: ``, answer: a,
                     figureType: 'fhoek',
                     figureData: { a, askTop, posTop, posBot, corresponding: true } };
        },

        // 7. F-HOEK tweede
        // F-HOEK 2: niet-corresponderende hoeken (supplementair: a + b = 180)
        () => {
            let a = rnd(30, 150);
            let b = 180 - a;  // supplementaire hoek
            let askTop = random() < 0.5;
            // niet-corresponderende positie: links boven, rechts onder (of andersom)
            let posTop = random() < 0.5 ? 'left' : 'right';
            let posBot = posTop === 'left' ? 'right' : 'left';
            return { text: ``, answer: askTop ? a : b,
                     figureType: 'fhoek2',
                     figureData: { a, b, askTop, posTop, posBot, corresponding: false } };
        },

        // Z-HOEK
        () => {
            let a = rnd(30, 150);
            let askA = random() < 0.5;
            return { text: ``, answer: a,
                     figureType: 'zhoek',
                     figureData: { a, askA } };
        },

        () => {
            // Bouw de vierhoek op met hoeken die kloppen met de schets
            // p1=linksboven, p2=rechtsboven, p3=rechtsonder, p4=linksonder
            // Maak twee scherpe en twee stompe hoeken die optellen tot 360
            let a = rnd(60, 89);    // linksboven: scherp
            let b = rnd(91, 130);   // rechtsboven: stomp
            let c = rnd(60, 89);    // rechtsonder: scherp
            let d = 360 - a - b - c; // linksonder: wat overblijft
            // Veiligheidscheck: d moet ook realistisch zijn
            if (d < 60 || d > 160) { a=75; b=110; c=70; d=105; }
            return { text: ``, answer: d,
                     figureType: 'vierhoek',
                     figureData: { a, b, c, d } };
        },

        () => {
            // Parallellogram: tegenoverliggende hoeken zijn gelijk
            // naastliggende hoeken zijn supplementair (samen 180°)
            // a = scherpe hoek (linksboven), b = stompe hoek (rechtsboven)
            let a = rnd(40, 89);   // scherp
            let b = 180 - a;       // stomp (naastliggend)
            // Vier hoeken: p1=a, p2=b, p3=a, p4=b
            // Vraag random één van de vier
            let askIdx = rnd(0, 3);
            let vals = [b, a, b, a];
            // Geef één andere hoek als hint
            let hintIdx = rnd(0, 3);
            while (hintIdx === askIdx) hintIdx = rnd(0, 3);
            return { text: ``, answer: vals[askIdx],
                     figureType: 'parallellogram',
                     figureData: { a, b, askIdx, hintIdx, vals } };
        },

        () => {
            // Vlieger: top en bot zijn scherp (<90), zij zijn stomp (>90)
            // of top is stomp en zij zijn scherp — maar ze moeten kloppen met de schets
            // Schets: top = scherpe punt boven, zij = brede hoeken links/rechts, bot = scherpe punt onder
            let top  = rnd(20, 80);           // ← scherp, want smalle bovenpunt
            let bot  = rnd(20, 80);           // ← scherp, want smalle onderpunt  
            let side = (360 - top - bot) / 2; // ← de twee zijhoeken (altijd stomp als top+bot < 180)
            if (side < 90 || side > 170) {    // veiligheidscheck
                top = 40; bot = 50; side = 135;
            }
            let askWhich = ['side','top','bot'][rnd(0,2)];
            return { text: ``, 
                     answer: askWhich==='side' ? round(side) : askWhich==='top' ? top : bot,
                     figureType: 'vlieger',
                     figureData: { side, top, bot, askWhich } };
        },
    ];
    // Kies 10 vragen met spreiding
    let pool = generators.slice().sort(() => random() - 0.5);
    pool = pool.slice(0, 10);

    for (let gen of pool) {
        let q = gen();
        q.answer = round(q.answer);
        questions.push(q);
        answers.push(q.answer);
    }

    answers = shuffle([...answers]);

    // Rijen 1-2: vragen
    let qi = 0;
    for (let row = 1; row < 3; row++) {
        for (let col = 0; col < COLS; col++) {
            let q = questions[qi];
            blocks.push({
                col, row,
                startCol: col, startRow: row,
                x: MARGIN + col * CELL_SIZE,
                y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
                isDragging: false, isPlaced: false,
                text: q.text,
                answer: q.answer,
                isQuestion: true,
                isCorrect: null,
                isHovered: false, hoverProgress: 0,
                figureType: q.figureType,
                figureData: q.figureData,
            });
            qi++;
        }
    }

    // Rijen 3-4: antwoorden
    let ai = 0;
    for (let row = 3; row < 5; row++) {
        for (let col = 0; col < COLS; col++) {
            blocks.push({
                col, row,
                startCol: col, startRow: row,
                x: MARGIN + col * CELL_SIZE,
                y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
                isDragging: false, isPlaced: true,
                text: "" + answers[ai] + "°",
                answer: answers[ai],
                isQuestion: false,
                isCorrect: null,
                isHovered: false, hoverProgress: 0,
                figureType: null, figureData: null,
            });
            ai++;
        }
    }
}
function setup() {
    // EERST navigatie maken
    createNavigation();
    
    // Bereken optimale schaalfactor voor mobiel
    IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Bereken optimale schaalfactor voor mobiel
    if (IS_MOBILE) {
        let baseCanvasWidth = COLS * CELL_SIZE + MARGIN * 2;
        let baseCanvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;
        
        let availableWidth = window.innerWidth - 20; // 10px marge links en rechts
        let availableHeight = window.innerHeight - 150; // Ruimte voor navigatie en marges
        
        let scaleByWidth = availableWidth / baseCanvasWidth;
        let scaleByHeight = availableHeight / baseCanvasHeight;
        
        // Gebruik de kleinste schaal zodat alles past
        SCALE_FACTOR = Math.min(scaleByWidth, scaleByHeight);
        SCALE_FACTOR = constrain(SCALE_FACTOR, 0.3, 1.2); // Minimum 30%, maximum 120%
    } else {
        SCALE_FACTOR = 1;
    }
    
        
    // Maak een wrapper voor ALLES
    let wrapper = createDiv();
    wrapper.style('display', 'flex');
    wrapper.style('flex-direction', 'column');
    wrapper.style('align-items', 'center');
    wrapper.style('width', '100%');
        
    // Canvas container
    let container = createDiv();
    container.parent(wrapper);
    container.style('position', 'relative');
    container.style('display', 'inline-block');
    
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;

    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(container);

    // voorkom mobiel scrollen/zoomen
    cnv.elt.style.touchAction = 'none';  
    cnv.elt.style.userSelect = 'none';
  
    // Voor mobiel: maak canvas responsive met CSS
    if (IS_MOBILE) {
        cnv.elt.style.maxWidth = '100vw';
        cnv.elt.style.height = 'auto';
        cnv.elt.style.width = '100%';
        container.elt.style.width = '100%';
        container.elt.style.padding = '0';
        container.elt.style.margin = '0';
    }
    
    // Laad achtergrond
    loadImage('background_dragon.png', 
      (img) => { backgroundImage = img; bgLoaded = true; },
      () => {
        loadImage('background_dragon.png', 
          (img) => { backgroundImage = img; bgLoaded = true; }
        );
      }
    );
 
    // Laad dino
    loadImage('dino.png', (img) => { dinoImage = img; });
    
    generateQuestions();
    
    // Maak canvas buttons in rij 0
let btnW = IS_MOBILE ? 75 : 90;  // Buttons breder op mobiel
let btnH = IS_MOBILE ? 35 : 38;  // Buttons hoger op mobiel
let btnY = MARGIN + TITLE_SPACE + BUTTON_HEIGHT + 80;
let btnGap = IS_MOBILE ? 15 : 50;  // Meer gap op mobiel voor betere verdeling

// Bereken totale breedte van alle buttons
let totalWidth = btnW * 3 + (btnW + 20) + btnGap * 3;

// Op mobiel: als ze niet passen, maak ze smaller
if (IS_MOBILE && totalWidth > width - 40) {
    let availableWidth = width - 40; // 20px marge aan beide kanten
    btnGap = 10;
    btnW = (availableWidth - (btnGap * 3) - 20) / 4; // 4 buttons, 1 is breder
}
    let startX = (width - totalWidth) / 2; 
  
    canvasButtons = [
      new CanvasButton(
        startX, 
        btnY, 
        btnW, 
        btnH, 
        'Nakijken', 
        color(76, 175, 80), 
        checkAnswers
      ),
      new CanvasButton(
        startX + btnW + btnGap, 
        btnY, 
        btnW + 20, 
        btnH, 
        'Score: 0/10', 
        color(156, 39, 176), 
        showScoreFeedback
      ),
      new CanvasButton(
        startX + (btnW + btnGap) * 2 + 20, 
        btnY, 
        btnW, 
        btnH, 
        'Reset', 
        color(244, 67, 54), 
        resetGame
      ),
      new CanvasButton(
        startX + (btnW + btnGap) * 3 + 20, 
        btnY, 
        btnW, 
        btnH, 
        'ℹ Info', 
        color(3, 169, 244), 
        showInfo
      )
    ];
    
    // Achtergrondkleur
    document.body.style.backgroundColor = '#0e1621';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
}
 
  function draw() {
   
    // ====== ACHTERGROND TEKENEN ======
    // ALTIJD eerst de donkere achtergrond
    background(14, 22, 33);  
    
    if (bgLoaded && backgroundImage) {
        push();
        
        // Bereken geschaalde dimensies met aparte X en Y schaal
        let scaledW = width * DRAGON_SCALE_X;
        let scaledH = height * DRAGON_SCALE_Y;
        
        // Bereken positie (center + offset)
        let imgX = (width - scaledW) / 2 + DRAGON_X_OFFSET;
        let imgY = (height - scaledH) / 2 + DRAGON_Y_OFFSET;
        
        // Pas transparantie toe
        tint(255, DRAGON_OPACITY);
        
        // Teken de draak
        imageMode(CORNER);
        image(backgroundImage, imgX, imgY, scaledW, scaledH);
        
        noTint();
        
        // Optionele blur overlay
        if (DRAGON_BLUR) {
            fill(14, 22, 33, 100);
            noStroke();
            rect(0, 0, width, height);
        }
        
        pop();
    }
    
   
    // ====== TITEL EN ONDERTITEL TEKENEN ======
    push();
    // TITEL (klikbaar)
    fill(TITLE_COLOR[0], TITLE_COLOR[1], TITLE_COLOR[2]);
    textAlign(CENTER, TOP);
    textSize(TITLE_SIZE);
    textStyle(BOLD);

    // Bereken titleWidth NA textSize
    let titleWidth = textWidth(TITLE_TEXT);
    let titleX = width / 2;
    let isHoveringTitle = mouseX > titleX - titleWidth/2 && 
                          mouseX < titleX + titleWidth/2 && 
                          mouseY > TITLE_Y && 
                          mouseY < TITLE_Y + TITLE_SIZE;

    text(TITLE_TEXT, width / 2, TITLE_Y);

    // SUBTITLE
    fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
    textSize(SUBTITLE_SIZE);
    textStyle(NORMAL);
    text(SUBTITLE_TEXT, width / 2, SUBTITLE_Y);
    pop();
    
    // ====== GRID TEKENEN ======
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = MARGIN + col * CELL_SIZE;
            const y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            if (showDinoGame && (row === 1 || row === 2)) continue;
            if (row >= 3) {
                fill(200, 220, 200, 0);  // Groen vakje (antwoorden)
            } else {
                fill(220, 220, 200, 0);  // ← TRANSPARANT!
            }
            stroke(100, 100, 100, 0);
            strokeWeight(2);
            rect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }   
    
    // ====== HOVER DETECTIE VOOR BLOKKEN ======
    for (let block of blocks) {
        block.isHovered = false;

        if (
            !IS_MOBILE &&
            !showDinoGame &&
            block.isQuestion &&
            block.row >= 1 && block.row < 3 &&
            !draggingBlock &&
            mouseX >= block.x &&
            mouseX <= block.x + CELL_SIZE &&
            mouseY >= block.y &&
            mouseY <= block.y + CELL_SIZE
        ) {
            block.isHovered = true;
        }

        const target = block.isHovered ? 1 : 0;
        block.hoverProgress = lerp(block.hoverProgress, target, 0.15);
    }

    // ====== BLOKKEN TEKENEN ======
    for (let block of blocks) {
        if (!block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }

    for (let block of blocks) {
        if (block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }
  
    // ====== FLASHING EFFECT ======
    if (isFlashing) {
        flashCounter++;
        if (flashCounter % 20 < 10) {
            fill(255, 255, 0, 150);
            noStroke();
            rect(0, 0, width, height);
        }
        if (flashCounter > 100) {
            isFlashing = false;
            flashCounter = 0;
            
            // Check of er al games gespeeld zijn OF een game actief is
            if (totalGamesPlayed >= 1 || dinoGame !== null) {
                // Doe niets, de game is al actief
                // Zorg dat de game weer zichtbaar wordt
                showDinoGame = true;
            } else {
                // Start alleen de game als er nog geen games gespeeld zijn
                showDinoGame = true;
                dinoGame = new DinoGame();
            }
        }
    }
    
    // ====== DINO GAME TEKENEN ======
    
    if (showDinoGame && dinoGame) {
        const gameY = MARGIN + CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE; // +CELL_SIZE voor rij 0 buttons
        dinoGame.update(gameY);
        dinoGame.draw(gameY);
    }


    // ====== DRAGGING BLOCK ======
    if (draggingBlock) {
        drawBlock(draggingBlock);
    }
    
    // ====== CANVAS BUTTONS TEKENEN ======
    for (let btn of canvasButtons) {
        if (!IS_MOBILE && !draggingBlock) {
            btn.checkHover(mouseX, mouseY);
        }
        btn.draw();
    }
    
    // Update score button label
    if (canvasButtons.length > 1) {
        canvasButtons[1].label = 'Score: ' + correctCount + '/10';
    }
  
    // ====== CURSOR LOGICA (ALTIJD ALS LAATSTE) ======
    showHandCursor = false;
    
    // Hover over canvas buttons
    if (!showDinoGame && !draggingBlock) {
        for (let btn of canvasButtons) {
            if (btn.isClicked(mouseX, mouseY)) {
                showHandCursor = true;
                break;
            }
        }
    }

    // Hover over blauwe vraagblokken
    if (!showDinoGame && !showHandCursor) {
        for (let block of blocks) {
            if (
                block.isQuestion &&
                block.row >= 1 && block.row < 3 &&
                mouseX >= block.x &&
                mouseX <= block.x + CELL_SIZE &&
                mouseY >= block.y &&
                mouseY <= block.y + CELL_SIZE
            ) {
                showHandCursor = true;
                break;
            }
        }
    }
    
    // ====== CURSOR (ALTIJD LAATSTE) ======
    if (draggingBlock) {
        showHandCursor = true;
    }

    if (!IS_MOBILE) {
        setCursor(showHandCursor ? 'pointer' : 'default');
    } else {
        setCursor('default');
    }
}

function drawBlock(block) {
    push();

    if (block.isQuestion && block.hoverProgress > 0) {
        let lift = -6 * block.hoverProgress;
        let sc   = 1 + 0.15 * block.hoverProgress;
        translate(block.x + CELL_SIZE / 2, block.y + CELL_SIZE / 2 + lift);
        scale(sc);
        translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
        drawingContext.shadowBlur = 20 * block.hoverProgress;
        drawingContext.shadowColor = 'rgba(0,0,0,0.5)';
        drawingContext.shadowOffsetY = 4 * block.hoverProgress;
    }

    let bx = (block.isQuestion && block.hoverProgress > 0) ? 0 : block.x;
    let by = (block.isQuestion && block.hoverProgress > 0) ? 0 : block.y;
    let cx = bx + CELL_SIZE / 2;
    let cy = by + CELL_SIZE / 2;

    if (isChecked && block.isCorrect !== null) {
        fill(block.isCorrect ? color(100,200,100) : color(250,100,100));
    } else if (block.isQuestion) {
        fill(100, 150, 250);
    } else {
        fill(255, 200, 100);
    }
    stroke(50, 100, 200);
    strokeWeight(3);
    rect(bx + 5, by + 5, CELL_SIZE - 10, CELL_SIZE - 10, 5);

    drawingContext.shadowBlur = 0;
    drawingContext.shadowOffsetY = 0;

    fill(0);
    noStroke();
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    textSize(11);
    textLeading(14);

    if (block.isQuestion && block.figureType) {
        // Naam van de figuur bovenaan
        const figuurNamen = {
            'gestrekt':      'Gestrekte hoek',
            'overstaand':    'Overstaande hoeken',
            'driehoek':      'Driehoek',
            'gelijkbenig':   'Gelijkbenige △',
            'gelijkzijdig':  'Gelijkzijdige △',
            'fhoek':         'F-hoek',
            'fhoek2':        'Buiten hoeken', 
            'zhoek':         'Z-hoek',
            'vierhoek':      'Vierhoek',
            'parallellogram':'Parallellogram',
            'vlieger':       'Vlieger',
        };
        fill(0);
        noStroke();
        textAlign(CENTER, TOP);
        textStyle(BOLD);
        textSize(10);
        text(figuurNamen[block.figureType] || block.figureType, cx, by + 8);

        // Figuur iets lager zodat naam past
        drawFigure(block.figureType, block.figureData, cx, by + CELL_SIZE * 0.55, CELL_SIZE * 0.45);
    } else {
      
        textSize(18);
        textAlign(CENTER, CENTER);
        text(block.text, cx, cy);
    }

    pop();
}

// =============================================
// DRAWFIGURE
// =============================================
function drawFigure(type, data, cx, cy, size) {
    push();
    let s = size * FIG.scale;

    stroke(0);
    strokeWeight(FIG.lineWeight);

    function angleFill(r, g, b) { fill(r, g, b, 200); }

    function drawArc(px, py, v1, v2, radius) {
        let a1 = atan2(v1[1], v1[0]);
        let a2 = atan2(v2[1], v2[0]);
        let diff = a2 - a1;
        while (diff >  PI) diff -= TWO_PI;
        while (diff < -PI) diff += TWO_PI;
        noFill();
        stroke(...FIG.colArcMark);
        strokeWeight(1.2);
        if (diff >= 0) {
            arc(px, py, radius * 2, radius * 2, a1, a1 + diff);
        } else {
            arc(px, py, radius * 2, radius * 2, a1 + diff, a1);
        }
        stroke(0);
        strokeWeight(FIG.lineWeight);
    }

    function degLabel(txt, x, y, isUnknown) {
        if (txt === '') return;
        noStroke();
        fill(...(isUnknown ? FIG.colUnknown : FIG.colArcMark));
        textSize(FIG.angleSize);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(txt, x, y);
        textStyle(NORMAL);
    }

    function labelToward(px, py, midX, midY, offset) {
        let dx = midX - px, dy = midY - py;
        let len = sqrt(dx*dx + dy*dy);
        return [px + dx/len * offset, py + dy/len * offset];
    }

    // ─────────────────────────────────────────────────────────────
    // 1. GESTREKTE HOEK
    // ─────────────────────────────────────────────────────────────
    if (type === 'gestrekt') {
        let a = radians(data.a);
        let b = 180 - data.a;
        let askA = data.askA;
        let lx = cx - s, rx = cx + s;
        let tipX = cx + cos(-a) * s * 0.85;
        let tipY = cy + sin(-a) * s * 0.85;

        stroke(0); strokeWeight(FIG.lineWeight);
        line(lx, cy, rx, cy);
        line(cx, cy, tipX, tipY);

        let r = s * 0.26;
        
        let midB = (-PI + (-a)) / 2;
        let midA = (-a + 0) / 2;
        let lxA = cx + cos(midA) * s * 0.54;
        let lyA = cy + sin(midA) * s * 0.34;
        let lxB = cx + cos(midB) * s * 0.54;
        let lyB = cy + sin(midB) * s * 0.34;

        degLabel(askA ? '?'        : data.a + '°', lxA, lyA, askA);
        degLabel(askA ? b + '°'    : '?',           lxB, lyB, !askA);

    // ─────────────────────────────────────────────────────────────
    // 2. OVERSTAANDE HOEKEN
    // ─────────────────────────────────────────────────────────────
    } else if (type === 'overstaand') {
        let askA = data.askA;
        let a = radians(data.a);  // de gegeven hoek bepaalt de schuinte van de lijnen

        // Lijn 1 loopt onder hoek a, lijn 2 loodrecht daarop
        let ang1 = a / 2;         // ← lijn 1 schuinte (helft van a zodat a tussen de lijnen past)
        let ang2 = ang1 + a;      // ← lijn 2 loopt zo dat hoek A = data.a graden

        stroke(0); strokeWeight(FIG.lineWeight);
        line(cx - cos(ang1)*s, cy - sin(ang1)*s, cx + cos(ang1)*s, cy + sin(ang1)*s);
        line(cx - cos(ang2)*s, cy - sin(ang2)*s, cx + cos(ang2)*s, cy + sin(ang2)*s);

        // Bissectrice van hoek A (tussen ang1 en ang2, de gevraagde/gegeven hoek)
        let bisA = (ang1 + ang2) / 2;
        // Overstaande hoek B = zelfde waarde, aan andere kant
        let bisB = bisA + PI;

        let dist = s * 0.32;

        let lxA = cx + cos(bisA) * dist, lyA = cy + sin(bisA) * dist;
        let lxB = cx + cos(bisB) * dist, lyB = cy + sin(bisB) * dist;

        degLabel(askA ? '?'          : data.a + '°', lxA, lyA, askA);
        degLabel(askA ? data.a + '°' : '?',           lxB, lyB, !askA);
    // ─────────────────────────────────────────────────────────────
    // 3. DRIEHOEK
    // ─────────────────────────────────────────────────────────────
    } else if (type === 'driehoek') {
        // Bouw driehoek op vanuit de werkelijke hoekwaarden
        // Hoek a = linksboven, b = rechtsonder, c = linksonder
        let angA = radians(data.a);
        let angB = radians(data.b);
        let angC = radians(data.c);  // = 180 - a - b, maar expliciet voor duidelijkheid

        // Zijlengte vast, bouw vanuit punt linksboven
        let sideLen = s * 1.60;

        // p1 = top (hoek a), p2 = rechtsonder (hoek b), p3 = linksonder (hoek c)
        // Laat driehoek beginnen met basis horizontaal onderaan
        // Basis van links naar rechts, hoek b links, hoek c rechts
        let bx2 = cx - sideLen * 0.5;
        let by2 = cy + s * 0.50;
        let cx2 = cx + sideLen * 0.5;
        let cy2 = cy + s * 0.50;

        // Top berekenen vanuit hoek b (links) en hoek c (rechts)
        // Lijn vanuit bx2 onder hoek b, lijn vanuit cx2 onder hoek c
        // Snijpunt = top
        // tan(b) = hoogte / afstand_van_links
        // tan(c) = hoogte / afstand_van_rechts
        // basis = cx2 - bx2
        let basis = cx2 - bx2;
        let hoogte = basis / (1/tan(angB) + 1/tan(angC));
        let ax = bx2 + hoogte / tan(angB);
        let ay = by2 - hoogte;

        // Centreer het geheel
        let allX = [ax, bx2, cx2];
        let allY = [ay, by2, cy2];
        let minX = min(allX), maxX = max(allX);
        let minY = min(allY), maxY = max(allY);
        let offX = cx - (minX+maxX)/2;
        let offY = cy - (minY+maxY)/2;
        let sc = (s * 1.65) / max(maxX-minX, maxY-minY);

        ax  = cx + (ax  - cx + offX)*sc;
        ay  = cy + (ay  - cy + offY)*sc;
        bx2 = cx + (bx2 - cx + offX)*sc;
        by2 = cy + (by2 - cy + offY)*sc;
        cx2 = cx + (cx2 - cx + offX)*sc;
        cy2 = cy + (cy2 - cy + offY)*sc;

        let midX = (ax + bx2 + cx2) / 3;
        let midY = (ay + by2 + cy2) / 3;

        angleFill(...FIG.colTriangle);
        stroke(0); strokeWeight(FIG.lineWeight);
        triangle(ax, ay, bx2, by2, cx2, cy2);

        let r = s * 0.22;
        drawArc(ax,  ay,  [bx2-ax,  by2-ay],  [cx2-ax,  cy2-ay],  r);
        drawArc(bx2, by2, [ax-bx2,  ay-by2],  [cx2-bx2, cy2-by2], r);
        drawArc(cx2, cy2, [ax-cx2,  ay-cy2],  [bx2-cx2, by2-cy2], r);

        let unk = data.unknown;
        let off = FIG.labelOffset + 10;
        let la = labelToward(ax,  ay,  midX, midY, off);
        let lb = labelToward(bx2, by2, midX, midY, off);
        let lc = labelToward(cx2, cy2, midX, midY, off);

        // a = top, b = linksonder, c = rechtsonder
        degLabel(unk==='a' ? '?' : data.a+'°', la[0], la[1], unk==='a');
        degLabel(unk==='b' ? '?' : data.b+'°', lb[0], lb[1], unk==='b');
        degLabel(unk==='c' ? '?' : data.c+'°', lc[0], lc[1], unk==='c');
    // ─────────────────────────────────────────────────────────────
    // 4. GELIJKBENIGE DRIEHOEK
    // ─────────────────────────────────────────────────────────────
      
    } else if (type === 'gelijkbenig') {
        let ax  = cx,     ay  = cy - s * 0.85;
        let bx2 = cx - s, by2 = cy + s * 0.55;
        let cx2 = cx + s, cy2 = cy + s * 0.55;
        let midX = (ax + bx2 + cx2) / 3;
        let midY = (ay + by2 + cy2) / 3;

        angleFill(...FIG.colTriangle);
        stroke(0); strokeWeight(FIG.lineWeight);
        triangle(ax, ay, bx2, by2, cx2, cy2);

        stroke(80, 80, 80); strokeWeight(2);
        for (let [px, py, qx, qy] of [[ax, ay, bx2, by2], [ax, ay, cx2, cy2]]) {
            let mx = (px+qx)/2, my = (py+qy)/2;
            let nx = -(qy-py)*0.08, ny = (qx-px)*0.08;
            line(mx-nx, my-ny, mx+nx, my+ny);
        }
        stroke(0); strokeWeight(FIG.lineWeight);

        let r = s * 0.22;
        drawArc(ax,  ay,  [bx2-ax,  by2-ay], [cx2-ax,  cy2-ay], r);
        drawArc(bx2, by2, [ax-bx2,  ay-by2], [cx2-bx2, cy2-by2], r);
        drawArc(cx2, cy2, [ax-cx2,  ay-cy2], [bx2-cx2, by2-cy2], r);

        let off = FIG.labelOffset + 10;
        let la = labelToward(ax,  ay,  midX, midY, off);
        let lb = labelToward(bx2, by2, midX, midY, off);
        let lc = labelToward(cx2, cy2, midX, midY, off);

        let vals = [data.top, data.base, data.base];
        let lps  = [la, lb, lc];

        for (let i = 0; i < 3; i++) {
            if (i === data.unknownIdx) {
                degLabel('?', lps[i][0], lps[i][1], true);
            } else if (i === data.labelIdx) {
                degLabel(round(vals[i]) + '°', lps[i][0], lps[i][1], false);
            }
            // derde hoek: geen label
        }

    // ─────────────────────────────────────────────────────────────
    // 5. GELIJKZIJDIGE DRIEHOEK
    // ─────────────────────────────────────────────────────────────
      
    } else if (type === 'gelijkzijdig') {
        let pts = [];
        for (let i = 0; i < 3; i++) {
            pts.push([cx + s * cos(radians(-90 + i*120)),
                      cy + s * sin(radians(-90 + i*120))]);
        }
        let midX = (pts[0][0]+pts[1][0]+pts[2][0]) / 3;
        let midY = (pts[0][1]+pts[1][1]+pts[2][1]) / 3;

        angleFill(...FIG.colTriangle);
        stroke(0); strokeWeight(FIG.lineWeight);
        triangle(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1]);

        stroke(80, 80, 80); strokeWeight(2);
        for (let i = 0; i < 3; i++) {
            let j = (i+1)%3;
            let mx = (pts[i][0]+pts[j][0])/2, my = (pts[i][1]+pts[j][1])/2;
            let nx = -(pts[j][1]-pts[i][1])*0.08, ny = (pts[j][0]-pts[i][0])*0.08;
            line(mx-nx, my-ny, mx+nx, my+ny);
        }
        stroke(0); strokeWeight(FIG.lineWeight);

        let r = s * 0.22;
        for (let i = 0; i < 3; i++) {
            let prev = pts[(i+2)%3], next = pts[(i+1)%3];
            drawArc(pts[i][0], pts[i][1],
                [prev[0]-pts[i][0], prev[1]-pts[i][1]],
                [next[0]-pts[i][0], next[1]-pts[i][1]], r);
        }

        let off = FIG.labelOffset + 10;
        for (let i = 0; i < 3; i++) {
            let lp = labelToward(pts[i][0], pts[i][1], midX, midY, off);
            if (i === data.unknownIdx) {
                degLabel('?',   lp[0], lp[1], true);
            } else if (i === data.labelIdx) {
                degLabel('60°', lp[0], lp[1], false);
            }
            // derde hoek: geen label
        }

    // ─────────────────────────────────────────────────────────────
    // 6. F-HOEK
    // ─────────────────────────────────────────────────────────────
      
    } else if (type === 'fhoek' || type === 'fhoek2') {
        let askTop = data.askTop;
        let posTop = data.posTop;  // 'left' of 'right' van dwarslijn
        let posBot = data.posBot;

        let yTop = cy - s * 0.42;
        let yBot = cy + s * 0.42;

        stroke(0); strokeWeight(FIG.lineWeight);
        line(cx - s, yTop, cx + s, yTop);
        line(cx - s, yBot, cx + s, yBot);

        // Open pijltjes parallelliteit
        let aw = s * 0.10;
        line(cx + s,      yTop, cx + s - aw, yTop - aw*0.6);
        line(cx + s,      yTop, cx + s - aw, yTop + aw*0.6);
        line(cx + s,      yBot, cx + s - aw, yBot - aw*0.6);
        line(cx + s,      yBot, cx + s - aw, yBot + aw*0.6);

        // Schuine lijn van rand tot rand
        let sx1 = cx + s*0.30, sy1 = cy - s*0.90;
        let sx2 = cx - s*0.30, sy2 = cy + s*0.90;
        line(sx1, sy1, sx2, sy2);

        // Snijpunten
        let t1 = (yTop - sy1) / (sy2 - sy1);
        let ix1 = sx1 + t1*(sx2 - sx1);
        let t2 = (yBot - sy1) / (sy2 - sy1);
        let ix2 = sx1 + t2*(sx2 - sx1);

        // Richtingsvector dwarslijn (naar beneden)
        let ddx = sx2-sx1, ddy = sy2-sy1;
        let dlen = sqrt(ddx*ddx + ddy*ddy);
        let dirX = ddx/dlen, dirY = ddy/dlen;

        let r = s * 0.20;
        let labelDist = s * 0.28;

        // Hoekboogje en label boven
        // 'left' = links van dwarslijn = hoek tussen (-dir) en (-1,0)
        // 'right' = rechts van dwarslijn = hoek tussen (dir) en (1,0)
        if (posTop === 'left') {
            
            let lxT = ix1 - labelDist, lyT = yTop + labelDist * 0.75;
            degLabel(askTop ? '?' : data.a + '°', lxT, lyT, askTop);
        } else {
            
            let lxT = ix1 + labelDist, lyT = yTop + labelDist * 0.75;
            degLabel(askTop ? '?' : data.a + '°', lxT, lyT, askTop);
        }

        // Hoekboogje en label onder
        let valBot = data.corresponding ? data.a : data.b;
        if (posBot === 'left') {
            
            let lxB = ix2 - labelDist, lyB = yBot + labelDist * 0.75;
            degLabel(askTop ? valBot + '°' : '?', lxB, lyB, !askTop);
        } else {
            
            let lxB = ix2 + labelDist, lyB = yBot + labelDist * 0.75;
            degLabel(askTop ? valBot + '°' : '?', lxB, lyB, !askTop);
        }

    // ─────────────────────────────────────────────────────────────
    // 7. Z-HOEK
    // ─────────────────────────────────────────────────────────────
      
    } else if (type === 'zhoek') {
        let askA = data.askA;
        let yTop = cy - s * 0.42;
        let yBot = cy + s * 0.42;

        stroke(0); strokeWeight(FIG.lineWeight);
        line(cx - s, yTop, cx + s, yTop);
        line(cx - s, yBot, cx + s, yBot);

        // Open pijltjes parallelliteit
        let aw = s * 0.10;
        line(cx + s,      yTop, cx + s - aw, yTop - aw*0.6);
        line(cx + s,      yTop, cx + s - aw, yTop + aw*0.6);
        line(cx + s,      yBot, cx + s - aw, yBot - aw*0.6);
        line(cx + s,      yBot, cx + s - aw, yBot + aw*0.6);

        // Schuine lijn van rand tot rand
        let sx1 = cx + s*0.65, sy1 = cy - s*0.90;
        let sx2 = cx - s*0.65, sy2 = cy + s*0.90;
        line(sx1, sy1, sx2, sy2);

        // Snijpunten berekenen
        let t1 = (yTop - sy1) / (sy2 - sy1);
        let ix1 = sx1 + t1*(sx2 - sx1);
        let t2 = (yBot - sy1) / (sy2 - sy1);
        let ix2 = sx1 + t2*(sx2 - sx1);

        let ddx = sx2-sx1, ddy = sy2-sy1;
        let dlen = sqrt(ddx*ddx + ddy*ddy);
        let dirX = ddx/dlen, dirY = ddy/dlen;

        let r = s * 0.20;
        // Z-hoeken: tegengestelde kanten
        
        // Labels 
        let lx1 = ix1 - s*0.35, ly1 = yTop + s*0.14;
        let lx2 = ix2 + s*0.35, ly2 = yBot - s*0.14;

        degLabel(askA ? '?'          : data.a + '°', lx1, ly1, askA);
        degLabel(askA ? data.a + '°' : '?',           lx2, ly2, !askA);

    // ─────────────────────────────────────────────────────────────
    // 8. VIERHOEK
    // ─────────────────────────────────────────────────────────────
      
    } else if (type === 'vierhoek') {
        // Bouw vierhoek op vanuit alle vier hoekwaarden
        // Startrichting = naar rechts, ga rechtsom: p1 → p2 → p3 → p4
        let sideLen = s * 1.10;
        let angA = radians(data.a);
        let angB = radians(data.b);
        let angC = radians(data.c);

        let dir = 0;  // begin naar rechts
        let p1 = [cx - s*0.4, cy - s*0.3];
        let p2 = [p1[0] + cos(dir)*sideLen,   p1[1] + sin(dir)*sideLen];
        dir += PI - angB;
        let p3 = [p2[0] + cos(dir)*sideLen,   p2[1] + sin(dir)*sideLen];
        dir += PI - angC;
        let p4 = [p3[0] + cos(dir)*sideLen,   p3[1] + sin(dir)*sideLen];

        // Centreer en schaal
        let allX = [p1[0],p2[0],p3[0],p4[0]];
        let allY = [p1[1],p2[1],p3[1],p4[1]];
        let minX = min(allX), maxX = max(allX);
        let minY = min(allY), maxY = max(allY);
        let offX = cx - (minX+maxX)/2;
        let offY = cy - (minY+maxY)/2;
        let sc = (s * 1.55) / max(maxX-minX, maxY-minY);

        let pts = [p1,p2,p3,p4].map(p => [
            cx + (p[0] - cx + offX)*sc,
            cy + (p[1] - cy + offY)*sc
        ]);

        let midX = (pts[0][0]+pts[1][0]+pts[2][0]+pts[3][0]) / 4;
        let midY = (pts[0][1]+pts[1][1]+pts[2][1]+pts[3][1]) / 4;

        angleFill(...FIG.colQuad);
        stroke(0); strokeWeight(FIG.lineWeight);
        quad(pts[0][0],pts[0][1], pts[1][0],pts[1][1],
             pts[2][0],pts[2][1], pts[3][0],pts[3][1]);

        // Hoekboogjes
        let r = s * 0.18;
        drawArc(pts[0][0],pts[0][1],
            [pts[3][0]-pts[0][0],pts[3][1]-pts[0][1]],
            [pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]], r);
        drawArc(pts[1][0],pts[1][1],
            [pts[0][0]-pts[1][0],pts[0][1]-pts[1][1]],
            [pts[2][0]-pts[1][0],pts[2][1]-pts[1][1]], r);
        drawArc(pts[2][0],pts[2][1],
            [pts[1][0]-pts[2][0],pts[1][1]-pts[2][1]],
            [pts[3][0]-pts[2][0],pts[3][1]-pts[2][1]], r);
        drawArc(pts[3][0],pts[3][1],
            [pts[2][0]-pts[3][0],pts[2][1]-pts[3][1]],
            [pts[0][0]-pts[3][0],pts[0][1]-pts[3][1]], r);

        // Labels richting midden
        let off = FIG.labelOffset + 7;
        let lp = [pts[0],pts[1],pts[2],pts[3]].map(p =>
            labelToward(p[0],p[1], midX,midY, off));

        degLabel(data.a + '°', lp[0][0], lp[0][1], false);
        degLabel(data.b + '°', lp[1][0], lp[1][1], false);
        degLabel(data.c + '°', lp[2][0], lp[2][1], false);
        degLabel('?',           lp[3][0], lp[3][1], true);
    // ─────────────────────────────────────────────────────────────
    // 9. PARALLELLOGRAM
    // ─────────────────────────────────────────────────────────────
    } else if (type === 'parallellogram') {
        let angA = radians(data.a);

        // Vaste breedte en hoogte, schuinte puur uit hoekwaarde
        let h = s * 0.55;
        let sk = h / tan(angA);
        sk = constrain(sk, s * 0.15, s * 0.70);
        let w = s * 0.75;

        // Punten zonder centrering eerst
        let p1r = [-w + sk, -h];  // linksboven  → hoek a (scherp)
        let p2r = [ w + sk, -h];  // rechtsboven → hoek b (stomp)
        let p3r = [ w - sk,  h];  // rechtsonder → hoek a (scherp)
        let p4r = [-w - sk,  h];  // linksonder  → hoek b (stomp)

        // Centreer op cx,cy en schaal zodat het figuur de volledige ruimte vult
        let allX = [p1r[0],p2r[0],p3r[0],p4r[0]];
        let allY = [p1r[1],p2r[1],p3r[1],p4r[1]];
        let minX = min(allX), maxX = max(allX);
        let minY = min(allY), maxY = max(allY);
        // Schaal zodat de langste kant = s * 1.80 (groter dan voorheen)
        let sc = (s * 1.80) / max(maxX - minX, maxY - minY);

        let pts = [p1r,p2r,p3r,p4r].map(p => [
            cx + p[0] * sc,
            cy + p[1] * sc
        ]);

        let midX = (pts[0][0]+pts[1][0]+pts[2][0]+pts[3][0]) / 4;
        let midY = (pts[0][1]+pts[1][1]+pts[2][1]+pts[3][1]) / 4;

        angleFill(...FIG.colParallel);
        stroke(0); strokeWeight(FIG.lineWeight);
        quad(pts[0][0],pts[0][1], pts[1][0],pts[1][1],
             pts[2][0],pts[2][1], pts[3][0],pts[3][1]);

        // Dubbele streepjes op parallelle zijden
        stroke(80,80,80); strokeWeight(1.5);
        for (let [ia, ib] of [[0,1],[2,3]]) {
            let mx = (pts[ia][0]+pts[ib][0])/2, my = (pts[ia][1]+pts[ib][1])/2;
            let dx = pts[ib][0]-pts[ia][0], dy = pts[ib][1]-pts[ia][1];
            let len = sqrt(dx*dx+dy*dy);
            let nx = -dy/len * s*0.06, ny = dx/len * s*0.06;
            line(mx-dx*0.04-nx, my-dy*0.04-ny, mx-dx*0.04+nx, my-dy*0.04+ny);
            line(mx+dx*0.04-nx, my+dy*0.04-ny, mx+dx*0.04+nx, my+dy*0.04+ny);
        }
        for (let [ia, ib] of [[1,2],[3,0]]) {
            let mx = (pts[ia][0]+pts[ib][0])/2, my = (pts[ia][1]+pts[ib][1])/2;
            let dx = pts[ib][0]-pts[ia][0], dy = pts[ib][1]-pts[ia][1];
            let len = sqrt(dx*dx+dy*dy);
            let nx = -dy/len * s*0.06, ny = dx/len * s*0.06;
            line(mx-nx, my-ny, mx+nx, my+ny);
        }

        stroke(0); strokeWeight(FIG.lineWeight);

        let r = s * 0.20;
        drawArc(pts[0][0],pts[0][1],
            [pts[3][0]-pts[0][0],pts[3][1]-pts[0][1]],
            [pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]], r);
        drawArc(pts[1][0],pts[1][1],
            [pts[0][0]-pts[1][0],pts[0][1]-pts[1][1]],
            [pts[2][0]-pts[1][0],pts[2][1]-pts[1][1]], r);
        drawArc(pts[2][0],pts[2][1],
            [pts[1][0]-pts[2][0],pts[1][1]-pts[2][1]],
            [pts[3][0]-pts[2][0],pts[3][1]-pts[2][1]], r);
        drawArc(pts[3][0],pts[3][1],
            [pts[2][0]-pts[3][0],pts[2][1]-pts[3][1]],
            [pts[0][0]-pts[3][0],pts[0][1]-pts[3][1]], r);

        let off = FIG.labelOffset + 7;
        let lp = [pts[0],pts[1],pts[2],pts[3]].map(p =>
            labelToward(p[0],p[1], midX,midY, off));

        for (let i = 0; i < 4; i++) {
            if (i === data.askIdx) {
                degLabel('?', lp[i][0], lp[i][1], true);
            } else if (i === data.hintIdx) {
                degLabel(data.vals[i] + '°', lp[i][0], lp[i][1], false);
            }
        }
    // ─────────────────────────────────────────────────────────────
    // 10. VLIEGER
    // ─────────────────────────────────────────────────────────────
    } else if (type === 'vlieger') {
        let topPt = [cx,          cy - s*0.95];
        let rgtPt = [cx + s*0.65, cy + s*0.10];
        let botPt = [cx,          cy + s*0.78];
        let lftPt = [cx - s*0.65, cy + s*0.10];
        let midX  = (topPt[0]+rgtPt[0]+botPt[0]+lftPt[0]) / 4;
        let midY  = (topPt[1]+rgtPt[1]+botPt[1]+lftPt[1]) / 4;

        angleFill(...FIG.colKite);
        stroke(0); strokeWeight(FIG.lineWeight);
        quad(topPt[0],topPt[1], rgtPt[0],rgtPt[1], botPt[0],botPt[1], lftPt[0],lftPt[1]);

        stroke(120); strokeWeight(1);
        drawingContext.setLineDash([4,4]);
        line(topPt[0],topPt[1], botPt[0],botPt[1]);
        drawingContext.setLineDash([]);
        stroke(0); strokeWeight(FIG.lineWeight);

        let r = s * 0.18;
        drawArc(topPt[0],topPt[1], [lftPt[0]-topPt[0],lftPt[1]-topPt[1]], [rgtPt[0]-topPt[0],rgtPt[1]-topPt[1]], r);
        drawArc(rgtPt[0],rgtPt[1], [topPt[0]-rgtPt[0],topPt[1]-rgtPt[1]], [botPt[0]-rgtPt[0],botPt[1]-rgtPt[1]], r);
        drawArc(botPt[0],botPt[1], [rgtPt[0]-botPt[0],rgtPt[1]-botPt[1]], [lftPt[0]-botPt[0],lftPt[1]-botPt[1]], r);
        drawArc(lftPt[0],lftPt[1], [botPt[0]-lftPt[0],botPt[1]-lftPt[1]], [topPt[0]-lftPt[0],topPt[1]-lftPt[1]], r);

        let off = FIG.labelOffset + 10;
        let aw = data.askWhich;
        let lt = labelToward(topPt[0],topPt[1], midX,midY, off);
        let lr = labelToward(rgtPt[0],rgtPt[1], midX,midY, off);
        let lb = labelToward(botPt[0],botPt[1], midX,midY, off);
        let ll = labelToward(lftPt[0],lftPt[1], midX,midY, off);

        degLabel(aw==='top'  ? '?' : round(data.top)+'°',  lt[0],lt[1], aw==='top');
        degLabel(aw==='side' ? '?' : round(data.side)+'°', lr[0],lr[1], aw==='side');
        degLabel(aw==='bot'  ? '?' : round(data.bot)+'°',  lb[0],lb[1], aw==='bot');
        //degLabel(aw==='side' ? '' : round(data.side)+'°',  ll[0],ll[1], false);
    }

    pop();
}
  
function checkAnswers() {
    isChecked = true;
    correctCount = 0;
    
    for (let block of blocks) block.isCorrect = null;
    
    for (let questionBlock of blocks) {
        if (questionBlock.isQuestion) {
            let answerBlock = null;
            for (let block of blocks) {
                if (!block.isQuestion && block.col === questionBlock.col && block.row === questionBlock.row) {
                    answerBlock = block;
                    break;
                }
            }
            if (answerBlock && questionBlock.answer === answerBlock.answer) {
                questionBlock.isCorrect = true;
                answerBlock.isCorrect = true;
                correctCount++;
            } else {
                questionBlock.isCorrect = false;
                if (answerBlock) answerBlock.isCorrect = false;
            }
        }
    }
    
    // Score button update gebeurt automatisch in draw()
    
    if (correctCount === 10) {
        isFlashing = true;
        flashCounter = 0;
        
        // Verander score button kleur naar goud
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(255, 215, 0); // Goud
        }
    } else {
        // Reset naar paars als niet alle correct
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(156, 39, 176); // Paars
        }
    }
}


function mousePressed() {
  
  pointerDown(mouseX, mouseY);
  return false;
}

function mouseDragged() {
  pointerMove(mouseX, mouseY);
  return false;
}

function mouseReleased() {
  pointerUp();
  return false;
}

function touchStarted() {
  if (touches.length > 0) {
    pointerDown(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    pointerMove(touches[0].x, touches[0].y);
  }
  return false;
}

function touchEnded() {
  pointerUp();
  return false;
}

    
function pointerDown(px, py) {
  showHandCursor = false;
  
  // Check canvas button clicks EERST
  for (let btn of canvasButtons) {
    if (btn.isClicked(px, py)) {
      btn.action();
      return false;
    }
  }

  // Dino jump
  if (showDinoGame && dinoGame && !dinoGame.gameOver) {
    dinoGame.dino.jump();
    return false;
  }
  // Block drag
  if (!showDinoGame) {
    for (let i = blocks.length - 1; i >= 0; i--) {
      let block = blocks[i];
      if (
        block.isQuestion &&
        block.row < 3 &&
        px > block.x && px < block.x + CELL_SIZE &&
        py > block.y && py < block.y + CELL_SIZE
      ) {
        draggingBlock = block;
        offsetX = px - block.x;
        offsetY = py - block.y;
        block.isDragging = true;
        isChecked = false;
        showHandCursor = true;
        break;
      }
    }
  }
}

function pointerMove(px, py) {
  
    
  if (draggingBlock) {
    draggingBlock.x = px - offsetX;
    draggingBlock.y = py - offsetY;
    showHandCursor = true;
  }
}

function pointerUp() {
  if (!draggingBlock) return;

  draggingBlock.isDragging = false;
  snapBlock(draggingBlock);
  draggingBlock = null;
    }
function snapBlock(block) { 

  // Middelpunt van het gesleepte blokje 

  let centerX = block.x + CELL_SIZE / 2; 

  let centerY = block.y + CELL_SIZE / 2; 

  

  // Zoek een antwoordblokje waar het middelpunt overheen hangt 

  let targetAnswer = null; 

  for (let other of blocks) { 

    if (!other.isQuestion) { 

      if (centerX > other.x && centerX < other.x + CELL_SIZE && 

          centerY > other.y && centerY < other.y + CELL_SIZE) { 

        targetAnswer = other; 

        break; 

      } 

    } 

  } 

  

  if (targetAnswer) { 

    // Check of er al een ander vraagblok op dit antwoordblok staat 

    let bezet = false; 

    for (let other of blocks) { 

      if (other !== block && other.isQuestion && 

          other.col === targetAnswer.col && other.row === targetAnswer.row) { 

        bezet = true; 

        break; 

      } 

    } 

  

    if (!bezet) { 

      block.col = targetAnswer.col; 

      block.row = targetAnswer.row; 

      block.x = targetAnswer.x; 

      block.y = targetAnswer.y; 

      return; 

    } 

  } 

  

  // Geen geldig antwoordblokje gevonden → terug naar start 

  block.col = block.startCol; 

  block.row = block.startRow; 

  block.x = MARGIN + block.startCol * CELL_SIZE; 

  block.y = MARGIN + block.startRow * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE; 

} 