const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const playerSize = 30;
const projectileSize = 8;
const enemySize = 30;
const speed = 5;
const projectileSpeed = 10;
const enemySpeed = 2;

let player, projectiles, enemies, keys, score, enemyCount, gameOver, paused;
let lastMasskill = 0;

function init() {
  player = { x: canvas.width/2, y: canvas.height/2 };
  projectiles = [];
  enemies = [];
  keys = {};
  score = 0;
  enemyCount = 12; // initial enemies
  gameOver = false;
  paused = false;

  for (let i = 0; i < enemyCount; i++) spawnEnemy();

  if (window.enemySpawner) clearInterval(window.enemySpawner);
  window.enemySpawner = setInterval(() => {
    if (!gameOver && !paused) {
      spawnEnemy();
      enemyCount++;
    }
  }, 3000);
}

function spawnEnemy() {
  const sides = ["top", "bottom", "left", "right"];
  const side = sides[Math.floor(Math.random()*sides.length)];
  let x, y;

  if (side === "top") {
    x = Math.random() * canvas.width;
    y = -enemySize;
  } else if (side === "bottom") {
    x = Math.random() * canvas.width;
    y = canvas.height + enemySize;
  } else if (side === "left") {
    x = -enemySize;
    y = Math.random() * canvas.height;
  } else {
    x = canvas.width + enemySize;
    y = Math.random() * canvas.height;
  }

  enemies.push({x, y});
}

function update() {
  if (gameOver) { clearInterval(window.enemySpawner); return; }
  if (paused) return;

  if (keys['w']) player.y -= speed;
  if (keys['s']) player.y += speed;
  if (keys['a']) player.x -= speed;
  if (keys['d']) player.x += speed;

  player.x = Math.max(0, Math.min(canvas.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height, player.y));

  projectiles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) projectiles.splice(i,1);
  });

  enemies.forEach((e, ei) => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    e.x += enemySpeed * dx/dist;
    e.y += enemySpeed * dy/dist;

    if (Math.abs(e.x - player.x) < (playerSize/2 + enemySize/2) && Math.abs(e.y - player.y) < (playerSize/2 + enemySize/2)) {
      gameOver = true;
    }
  });

  projectiles.forEach((p, pi) => {
    enemies.forEach((e, ei) => {
      if (Math.abs(p.x - e.x) < (projectileSize/2 + enemySize/2) && Math.abs(p.y - e.y) < (projectileSize/2 + enemySize/2)) {
        projectiles.splice(pi,1);
        enemies.splice(ei,1);
        score++;
      }
    });
  });
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#0f0";
  ctx.fillRect(player.x-playerSize/2, player.y-playerSize/2, playerSize, playerSize);

  ctx.fillStyle = "#ff0";
  projectiles.forEach(p => {
    ctx.fillRect(p.x-projectileSize/2, p.y-projectileSize/2, projectileSize, projectileSize);
  });

  ctx.fillStyle = "#f00";
  enemies.forEach(e => {
    ctx.fillRect(e.x-enemySize/2, e.y-enemySize/2, enemySize, enemySize);
  });

  ctx.fillStyle = "#fff";
  ctx.font = "24px sans-serif";
  ctx.fillText(`Enemies: ${enemies.length}`, 20, 40);
  ctx.fillText(`Score: ${score}`, canvas.width-160, 40);

  const now = Date.now();
  const cooldownLeft = Math.max(0, 30 - Math.floor((now - lastMasskill)/1000));
  ctx.fillText(`Masskill CD: ${cooldownLeft}s`, canvas.width/2-80, 40);

  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Paused", canvas.width/2, canvas.height/2);
    ctx.textAlign = "start";
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width/2, canvas.height/2-20);
    ctx.font = "32px sans-serif";
    ctx.fillText("Press R to Restart", canvas.width/2, canvas.height/2+40);
    ctx.textAlign = "start";
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (["arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()) && !gameOver && !paused) {
    let vx=0, vy=0;
    if (e.key==="ArrowUp") vy=-projectileSpeed;
    if (e.key==="ArrowDown") vy=projectileSpeed;
    if (e.key==="ArrowLeft") vx=-projectileSpeed;
    if (e.key==="ArrowRight") vx=projectileSpeed;
    projectiles.push({x: player.x, y: player.y, vx, vy});
  }

  if (e.key.toLowerCase()==='r' && gameOver) init();

  if (e.key==="Escape" && !gameOver) paused = !paused;

  if (e.key===" " && !gameOver && !paused) {
    const now = Date.now();
    if (now - lastMasskill >= 30000) {
      enemies = [];
      lastMasskill = now;
    }
  }
});

window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

init();
loop();
