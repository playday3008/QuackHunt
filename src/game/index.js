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

let assets = {
  shots: [],
  hits: [],
  sprites: { birds: {} },
};

let calibration = [
  { r: 1000, g: 1000, b: 1000 }
];

let config = {
  dark: false,
  difficulty: 0,
  name: 'Player 1',
  ip: '192.168.1.101',
  treshold: 50,
};

let packet = null;

let pane;
let pane_player = null;

// ##################### p5.js #####################
function preload() {
  // Delete default loading screen (we have our own)
  document.getElementById('p5_loading').remove();
/*
  // Load audio assets
  for (let i = 0; i < 3; i++) {
      assets.shots.push(loadSound(`./assets/sound/shot${i}.mp3`));
  }
  for (let i = 0; i < 2; i++) {
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
  }*/
}

function setup() {
  // Delete our loading screen
  document.getElementById('loading').remove();

  // Load calibration and config from local storage
  if (localStorage.hasOwnProperty("calibration")) {
      calibration = JSON.parse(localStorage.getItem("calibration"));
  }
  if (localStorage.hasOwnProperty("config")) {
      config = JSON.parse(localStorage.getItem("config"));
  }

  // Create canvas
  createCanvas(windowWidth, windowHeight);

  // Create Pane
  pane = new Tweakpane.Pane({
      title: 'QuackHunt',
      expanded: true,
  });
  pane.addInput(config, 'dark', { label: 'Dark' });
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
  });

  pane_player = pane.addFolder({ title: config.name, expanded: true });
  pane_player.addInput(config, 'name', { label: 'Name' });
  pane_player.addInput(config, 'ip', { label: 'IP' });
  pane_player.addInput(config, 'treshold', { label: 'Treshold', min: 0, max: 255, step: 1 });
}

function draw() {

}

// ##################### MISC #####################
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}