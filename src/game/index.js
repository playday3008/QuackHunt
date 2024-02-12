// ##################### CORE #####################
class GameCore {
  shots = 0;
  hits = 0;
  objects = {};

  constructor(data) {
    this.data = data;
  }

  tick() {
    fill(config.dark ? 255 : 0);
    text('Accuracy: ' + (this.shots ? Math.round(this.hits / this.shots * 100) : 100) + '%', 10, windowHeight - 10);

    let shot = this.data.shot;
    if (shot !== null) {
      this.shots++;
      assets.shots[randomInt(assets.shots.length)].play();
      if (shot == '000' || !(shot in this.objects)) {
        // miss
      } else {
        this.objects[shot].hit = true;
        assets.hits[randomInt(assets.hits.length)].play();
        this.hits++;
      }
      this.data.shot = null;
    }
  }
};

// ##################### OBJECTS #####################
class BirdsObj {
  hit = false;
  constructor(r, w, h, s) {
    this.escaped = false;
    this.w = w;
    this.h = h;
    this.size = w * Difficulties[config.difficulty].size;
    this.col = '#' + Colors.codes[r];
    this.x = random(windowWidth * (0.5 + 0.3), windowWidth * (0.5 - 0.3));
    this.y = windowHeight / 2 + h / 2 - this.size;
    this.speed = Math.floor(random(1, 6)) * 5 * Difficulties[config.difficulty].speed / 100;
    this.speedm = Math.floor(6) * 5 * Difficulties[config.difficulty].speed / 100;

    this.v = createVector(1, 1);
    this.v.setHeading(random(-(0.5 + 0.1) * PI, -(0.5 - 0.1) * PI));
    this.v.setMag(this.speed);

    this.seed = random();
    this.frame = 0;
    this.sprites = s;
  }
  draw() {
    if (frameCount % (this.speedm - this.speed) == 0) {
      if (++this.frame > 3) this.frame = 0;
    }

    let sprite = this.sprites[this.frame].get();
    sprite.resize(this.size, 0);
    imageMode(CENTER);

    if (this.v.x < 0) {
      push();
      scale(-1, 1);
      image(sprite, -this.x, this.y);
      pop();
    } else {
      image(sprite, this.x, this.y);
    }

    this.x += this.v.x;
    this.y += this.v.y;

    if (!this.escaped) {
      if (this.y + this.size / 2 < windowHeight / 2 + this.h / 2 - this.h / 6) this.escaped = true;
      return;
    }

    this.seed += 0.06;
    this.v.rotate((noise(this.seed) - 0.5) * PI / 10);

    if (this.x + this.size / 2 > (windowWidth + this.w) / 2 || this.x - this.size / 2 < (windowWidth - this.w) / 2) {
      this.x -= this.v.x;
      this.v.x = -this.v.x;
    }
    if (this.y + this.size / 2 > windowHeight / 2 + this.h / 2 - this.h / 6 || this.y - this.size / 2 < (windowHeight - this.h) / 2) {
      this.y -= this.v.y;
      this.v.y = -this.v.y;
    }
  }
};

class BirdsFeather {
  constructor(bird) {
    this.pos = createVector(bird.x, bird.y);
    this.size = bird.size / 4;
    this.bv = bird.v.copy();
    this.v = createVector(1, 1);
    this.v.setHeading(random() * TWO_PI);
    this.v.setMag(random(0.5, 1.0) * this.size / 10);
    this.pos.add(this.v);
    this.angle = random() * TWO_PI;
    this.av = random() * PI / 20;
    this.sprites = bird.sprites;
    this.max = 30;
    this.count = this.max;
  }
  draw() {
    this.v.add(0, 0.05);
    this.bv.setMag(this.bv.mag() * 0.95);
    this.v.setMag(this.v.mag() * 0.97);
    let V = p5.Vector.add(this.bv, this.v);
    this.pos.add(V);

    push();
    translate(this.pos.x, this.pos.y);
    this.angle += this.av;
    rotate(this.angle);
    tint(255, this.count * 255 / this.max);
    let sprite = this.sprites[4].get();
    sprite.resize(this.size, 0);
    imageMode(CENTER);
    image(sprite, 0, 0);
    pop();
    this.count--;
  }
  end() {
    return this.count <= 0;
  }
};

// ##################### GAME #####################
class GameBirds extends GameCore {
  feathers = [];
  constructor(data) {
    super(data);
  }
  tick() {
    background(config.dark ? 10 : 255);
    imageMode(CENTER);
    let img = assets.sprites.field.get();
    img.resize(windowWidth, 0);
    if (img.height > windowHeight) img.resize(img.width * windowHeight / img.height, 0);

    if (Math.random() < 0.02) {
      let bird = BirdsVariety[randomInt(BirdsVariety.length)];
      let r = Colors[bird];
      if (!(Colors.codes[r] in this.objects)) {
        this.objects[Colors.codes[r]] = new BirdsObj(r, img.width, img.height, assets.sprites.birds[bird]);
      }
    }
    for (let obj in this.objects) {
      if (this.objects[obj].hit) {
        let feather_am = randomInt(5, 8);
        for (let i = 0; i < feather_am; i++) this.feathers.push(new BirdsFeather(this.objects[obj]));
        delete this.objects[obj];
      }
      else this.objects[obj].draw();
    }
    for (let f in this.feathers) {
      if (this.feathers[f].end()) this.feathers.splice(f, 1);
      else this.feathers[f].draw();
    }

    image(img, windowWidth / 2, windowHeight / 2);

    super.tick();
  }
};

// ##################### CONSTANTS #####################
const Difficulties = [
  { speed: 20, size: 0.15 }, // CAN I PLAY, DADDY?
  { speed: 20, size: 0.1 },  // DON'T HURT ME.
  { speed: 40, size: 0.1 },  // BRING 'EM ON!
  { speed: 70, size: 0.1 },  // I AM DEATH INCARNATE!
  { speed: 100, size: 0.1 }, // ÜBER
  { speed: 110, size: 0.07 } // MEIN LEBEN
];

const Colors = {
  Red: 0,
  Green: 1,
  Blue: 2,
  Yellow: 3,
  Cyan: 4,
  Magenta: 5,
  None: 6,
  // Only 6 colors are supported, RGB and their combinations
  codes: ['f00', '0f0', '00f', 'ff0', '0ff', 'f0f', '000']
};

const BirdsVariety = ['Red', 'Yellow', 'Blue', 'Magenta'];

// ##################### GLOBALS #####################
let data = {
  shot: null,
};

let assets = {
  shots: [],
  hits: [],
  sprites: { birds: {} },
};

let calibration = { r: 1000, g: 1000, b: 1000 };

let config = {
  dark: false,
  difficulty: 0,
  name: 'Player 1',
  ip: '192.168.1.101',
  treshold: 50,
  status: 'Not connected',
};

let game = null;

let packet = null;

let pane;
let pane_player = null;

let ws = null;

// ##################### p5.js #####################
function preload() {
  // Delete default loading screen (we have our own)
  document.getElementById('p5_loading').remove();

  // Load audio assets
  for (let i = 0; i < 3; i++) {
    assets.shots.push(loadSound(`./assets/sound/shot${i}.mp3`));
  }
  for (let i = 0; i < 4; i++) {
    assets.hits.push(loadSound(`./assets/sound/hit${i}.mp3`));
  }

  // Load background
  assets.sprites['field'] = loadImage('./assets/images/field.png');

  // Load birds
  for (let c of BirdsVariety) {
    assets.sprites.birds[c] = new Array();
    // Each bird has 4 frames + 1 feather
    for (let i = 0; i < 5; i++) {
      assets.sprites.birds[c].push(loadImage(`./assets/images/birds/${c}${i}.png`));
    }
  }
}

function setup() {
  // Delete our loading screen
  document.getElementById('loading').remove();

  // Load calibration and config from local storage
  if (localStorage.hasOwnProperty("QuackHunt_calibration")) {
    calibration = JSON.parse(localStorage.getItem("QuackHunt_calibration"));
  }
  if (localStorage.hasOwnProperty("QuackHunt_config")) {
    config = JSON.parse(localStorage.getItem("QuackHunt_config"));
  }

  // Create canvas
  createCanvas(windowWidth, windowHeight);

  // Create Pane
  pane = new Tweakpane.Pane({
    title: 'QuackHunt',
    expanded: true,
  });
  pane.addInput(config, 'dark', { label: 'Dark' })
    .on('change', () => {
      localStorage.setItem("QuackHunt_config", JSON.stringify(config));
    });
  pane.addInput(config, 'difficulty', {
    label: 'Difficulty',
    options: {
      'Can I play, Daddy?': 0,
      'Don\'t hurt me.': 1,
      'Bring \'em on!': 2,
      'I am Death incarnate!': 3,
      'Über': 4,
      'Mein Leben': 5,
    },
  }).on('change', () => {
    if (!ws_state()) return;
    if (game) {
      game = new GameBirds(data);
    };
  }).on('change', () => {
    localStorage.setItem("QuackHunt_config", JSON.stringify(config));
  });

  pane.addButton({
    title: 'Start',
  }).on('click', () => {
    if (!ws_state()) return;
    game = new GameBirds(data);
  });

  pane_player = pane.addFolder({ title: config.name, expanded: true });
  pane_player.addInput(config, 'name', { label: 'Name' })
    .on('change', () => {
      localStorage.setItem("QuackHunt_config", JSON.stringify(config));
    });
  pane_player.addInput(config, 'ip', { label: 'IP' })
    .on('change', () => {
      localStorage.setItem("QuackHunt_config", JSON.stringify(config));
    });
  pane_player.addInput(config, 'treshold', { label: 'Treshold', min: 0, max: 255, step: 1 })
    .on('change', () => {
      localStorage.setItem("QuackHunt_config", JSON.stringify(config));
    });
  pane_player.addSeparator();
  pane_player.addMonitor(config, 'status', { label: 'Status' });
  pane_player.addButton({ title: 'Connect', })
    .on('click', () => { connect_h(); });
  pane_player.addButton({ title: 'Calibration', })
    .on('click', () => { calibration_h(); });
}

function draw() {
  if (game) game.tick();
}

// ##################### MISC #####################
function randomInt(max, mmax = null) {
  if (mmax === null) return Math.floor(Math.random() * max);
  else return Math.random() * (mmax - max) + max;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function connect_h() {
  ws = new WebSocket(`ws://${config.ip}:81/`, ['QuackHuntGun']);
  ws.onopen = () => {
    config.status = 'Connected';
  };
  ws.onclose = () => {
    ws = null;
    config.status = 'Not Connected';
    setTimeout(connect_h, 1000);
  };
  ws.onmessage = (e) => {
    packet = e.data.split(',').map(v => Number(v));
    let shot = packet[3];
    let C = new Array(3);
    C[0] = Math.round(255 * packet[0] / calibration.r);
    C[1] = Math.round(255 * packet[1] / calibration.g);
    C[2] = Math.round(255 * packet[2] / calibration.b);
    console.log(C);

    let M = [
      [0, 1, 0, 2, 1, 2],
      [1, 0, 1, 2, 0, 2],
      [2, 0, 2, 1, 0, 1],
      [0, 2, 1, 2, 0, 1],
      [1, 0, 2, 0, 1, 2],
      [0, 1, 2, 1, 0, 2],
    ];

    let t = config.treshold;
    let res = Colors.None;
    for (let i = 0; i < 6; i++) {
      if (C[M[i][0]] - C[M[i][1]] >= t && C[M[i][2]] - C[M[i][3]] >= t && Math.abs(C[M[i][4]] - C[M[i][5]]) <= t) {
        res = i;
        break;
      }
    }

    if (shot) data.shot = Colors.codes[res];

    try {
      document.getElementById('debug_raw').style.background = `rgb(${C[0]},${C[1]},${C[2]})`;
      document.getElementById('debug_col').style.background = '#' + Colors.codes[res];
    } catch (e) { }
  };
}
function ws_state() {
  return (ws && ws.readyState == 1);
}

function calibration_h() {
  calibration.r = packet[0];
  calibration.g = packet[1];
  calibration.b = packet[2];
  localStorage.setItem("QuackHunt_calibration", JSON.stringify(calibration));
}

