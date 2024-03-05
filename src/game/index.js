'use strict';

import p5 from 'p5';
//console.log(p5);
import { sound } from '@pixi/sound';
//console.log(sound);
import * as Tweakpane from 'tweakpane';
//console.log(Tweakpane);

// #####################################################
// ##################### CONSTANTS #####################
// #####################################################

/**
 * @typedef {Object} Difficulty
 * @property {number} speed - The speed associated with the difficulty level.
 * @property {number} size - The size associated with the difficulty level.
 */

/**
 * @typedef {Object} AssetsCounts
 * @property {number} shots - The count of shots.
 * @property {number} hits - The count of hits.
 * @property {number} birds - The count of birds.
 */

/**
 * @typedef {{
 *   [key: string]: string
 * }} Colors
 */

/**
 * @typedef {Object} GameConstants
 * @property {string} CONFIG_NAME - The name of the configuration.
 * @property {number} APP_VERSION - The version of the application.
 * @property {string[]} BIRDS_VARIETY - Array of bird varieties.
 * @property {AssetsCounts} ASSETS_COUNTS - Object representing the counts of different assets.
 * @property {Difficulty[]} DIFFICULTIES - Difficulty levels for the game.
 * @property {Colors} COLORS - Object representing different colors.
 */

/** @type {GameConstants} */
const GAME_CONSTANTS = {
  CONFIG_NAME: 'QuackHunt_config',
  APP_VERSION: 2,
  BIRDS_VARIETY: ['Red', 'Yellow', 'Blue', 'Magenta'],
  ASSETS_COUNTS: {
    shots: 3,
    hits: 4,
    birds: 5,
  },
  DIFFICULTIES: [
    { speed: 20, size: 0.15 }, // CAN I PLAY, DADDY?
    { speed: 20, size: 0.1 },  // DON'T HURT ME.
    { speed: 40, size: 0.1 },  // BRING 'EM ON!
    { speed: 70, size: 0.1 },  // I AM DEATH INCARNATE!
    { speed: 100, size: 0.1 }, // ÜBER
    { speed: 110, size: 0.07 } // MEIN LEBEN
  ],
  COLORS: {
    Red: 'f00',
    Green: '0f0',
    Blue: '00f',
    Yellow: 'ff0',
    Cyan: '0ff',
    Magenta: 'f0f',
    None: '000'
  }
};

// #####################################################
// ###################### HELPERS ######################
// #####################################################

// ################## Config handling ##################

/**
 * Save the current config to local storage
 */
function saveConfig() {
  let temp_config = game.config;

  // Save the config to local storage as a string
  localStorage.setItem(GAME_CONSTANTS.CONFIG_NAME, JSON.stringify(temp_config));
}

/**
 * Load the config from local storage
 */
function loadConfig() {
  // If the config exists in local storage, load it
  if (localStorage.hasOwnProperty(GAME_CONSTANTS.CONFIG_NAME)) {
    let raw_config = localStorage.getItem(GAME_CONSTANTS.CONFIG_NAME);
    if (raw_config === null) {
      return;
    }

    let temp_config = JSON.parse(raw_config);
    // If the version is the same, load the config
    if (temp_config.version == game.config.version) {
      game.config = temp_config;
      // Set all players to 'Not Connected'
      for (let p of game.config.players) {
        p.status = 'Not Connected';
        // Set data and devices to use player names
        let order = game.config.players.indexOf(p);
        if (!game.device[p.name]) {
          game.data.shots[p.name] = game.data.shots[Object.keys(game.data.shots)[order]];
          delete game.data.shots[Object.keys(game.data.shots)[order]];
        }
        if (game.data.shots[p.name] === undefined) {
          game.data.shots[p.name] = game.data.shots[Object.keys(game.data.shots)[order]];
          delete game.data.shots[Object.keys(game.data.shots)[order]];
        }
      }
    }
    else {
      // If the version is different, reset the config
      localStorage.removeItem(GAME_CONSTANTS.CONFIG_NAME);
    }
  }
}

// ######################## UI #########################

/**
 * Add player to tweakpane.
 * @param {{
 *   name: string,
 *   ip: string,
 *   treshold: number,
 *   status: string,
 *   calibration: {
 *     r: number,
 *     g: number,
 *     b: number,
 *   }
 * }} player
 * @param {Tweakpane.FolderApi} players_pane
 * @returns {Tweakpane.FolderApi}
 */
function addPlayerToPane(player, players_pane) {
  /**
   * @type {Tweakpane.FolderApi}
   */
  let pane_player = players_pane.addFolder({ title: player.name, expanded: true });

  pane_player.addBinding(player, 'name', { label: 'Name' })
    .on('change', () => {
      let order = game.config.players.indexOf(player);
      game.device[player.name] = game.device[Object.keys(game.device)[order]];
      delete game.device[Object.keys(game.device)[order]];
      game.data.shots[player.name] = game.data.shots[Object.keys(game.data.shots)[order]];
      delete game.data.shots[Object.keys(game.data.shots)[order]];
      const pane_player = /** @type {Tweakpane.FolderApi} */ (players_pane.children[order]);
      pane_player.title = player.name;
      saveConfig();
    });
  pane_player.addBinding(player, 'ip', { label: 'IP' })
    .on('change', () => {
      saveConfig();
    });
  pane_player.addBinding(player, 'treshold', { label: 'Treshold', min: 0, max: 255, step: 1 })
    .on('change', () => {
      saveConfig();
    });
  pane_player.addBlade({ view: 'separator' });
  pane_player.addBinding(player, 'status', { label: 'Status', readonly: true });
  pane_player.addBlade({ view: 'separator' });
  pane_player.addButton({ title: 'Calibration', })
    .on('click', () => { calibration(player); });
  pane_player.addButton({ title: 'Connect', })
    .on('click', () => { connect(player); });

  return pane_player;
}

// #####################################################
// ##################### WebSocket #####################
// #####################################################

/**
 * Connect to WebSocket server.
 * @param {{
 *   name: string,
 *   ip: string,
 *   treshold: number,
 *   status: string,
 *   calibration: {
 *     r: number,
 *     g: number,
 *     b: number,
 *   }
 * }} player
 */
function connect(player) {
  if (game.wss[player.name]) return;
  /**
   * WebSocket object.
   * @type {?WebSocket}
   */
  let ws = new WebSocket(`ws://${player.ip}:81`, "QuackHuntGun");
  ws.onopen = () => {
    player.status = 'Connected';
    // Send stats every 250ms to the connected players
    setInterval(() => {
      if (game.logic && Object.keys(game.wss).length > 0) {
        for (let player of game.config.players) {
          let ws = game.wss[player.name];
          if (ws && ws.readyState == 1) {
            let acc = game ? game.logic.accuracy[player.name] : 100;
            let hits = game ? game.logic.hits[player.name] : 0;
            let shots = game ? game.logic.shots[player.name] : 0;
            let msg = `Accuracy: ${acc}%\nH|S: ${hits}|${shots}`;
            ws.send(msg);
            // Also send as binary
            ws.send(new TextEncoder().encode(msg));
          }
        }
      }
    }, 250);
  };
  ws.onclose = () => {
    ws = null;
    player.status = 'Not Connected';
    delete game.wss[player.name];
    setTimeout(() => {
      connect(player);
    }, 1000);
  };
  ws.onmessage = (msg) => {
    // Store the received packet data
    game.device[player.name].last_packet = msg.data;

    // If the received data is a Blob (binary data), handle it differently
    if (msg.data instanceof Blob) {
      msg.data.text().then((text) => {
        // Format: "Accuracy: 100$\nH|S: 0|0"
        let [acc, hs] = text.split('\n');
        let [hits, shots] = hs.split(': ')[1].split('|').map(v => Number(v));
        if (game.logic) {
          game.logic.hits[player.name] = hits;
          game.logic.shots[player.name] = shots;
          game.logic.accuracy[player.name] = Number(acc.split(': ')[1].split('%')[0]);
        }
      });
      // No use for the status packet, so clear it
      game.device[player.name].last_packet = '';
      return;
    }

    // If the received data is not a Blob, handle it as a string
    // If starts with "VERSION", it's a status packet
    // else it's a color packet
    if (game.device[player.name].last_packet.startsWith("VERSION")) {
      // Format: "VERSION:0.0.0;AP:SSID:PASS;OLED:128,64;"
      let data = game.device[player.name].last_packet.split(';');
      for (let d of data) {
        let [key, value] = d.split(':');
        switch (key) {
          case 'VERSION':
            game.device[player.name].version = value;
            break;
          case 'WIFI':
            let [wifi_ssid, wifi_pass] = value.split(':');
            game.device[player.name].wifi.ssid = wifi_ssid;
            game.device[player.name].wifi.pass = wifi_pass;
            break;
          case 'AP':
            let [ap_ssid, ap_pass] = value.split(':');
            game.device[player.name].ap.ssid = ap_ssid;
            game.device[player.name].ap.pass = ap_pass;
            break;
          case 'OLED':
            let [width, height] = value.split(',').map(v => Number(v));
            game.device[player.name].oled.width = width;
            game.device[player.name].oled.height = height;
            break;
          default:
            break;
        }
      }
      // No use for the status packet, so clear it
      game.device[player.name].last_packet = '';
    } else {
      let [r, g, b, shot] = game.device[player.name].last_packet.split(',').map(v => Number(v));

      let C = new Array(3);
      C[0] = Math.round(255 * r / player.calibration.r);
      C[1] = Math.round(255 * g / player.calibration.g);
      C[2] = Math.round(255 * b / player.calibration.b);
      console.log(player.name, C);

      let M = [
        [0, 1, 0, 2, 1, 2],
        [1, 0, 1, 2, 0, 2],
        [2, 0, 2, 1, 0, 1],
        [0, 2, 1, 2, 0, 1],
        [1, 0, 2, 0, 1, 2],
        [0, 1, 2, 1, 0, 2],
      ];

      let t = player.treshold;
      let res = GAME_CONSTANTS.COLORS.None;
      for (let i = 0; i < 6; i++) {
        if (C[M[i][0]] - C[M[i][1]] >= t && C[M[i][2]] - C[M[i][3]] >= t && Math.abs(C[M[i][4]] - C[M[i][5]]) <= t) {
          res = Object.values(GAME_CONSTANTS.COLORS)[i];
          break;
        }
      }

      if (shot) game.data.shots[player.name] = res;
    }
  };

  game.wss[player.name] = ws;
}

/**
 * Calibrates the player's device based on the last received packet.
 * Updates the player's calibration values (r, g, b) and saves the config.
 * @param {{
 *   name: string,
 *   calibration: {
 *     r: number,
 *     g: number,
 *     b: number,
 *   }
 * }} player
 */
function calibration(player) {
  if (!areWebSocketsConnected()) return;
  if (!game.device[player.name]) return;
  if (game.device[player.name].last_packet == '') return;
  let [r, g, b, _] = game.device[player.name].last_packet.split(',').map(v => Number(v));
  player.calibration.r = r;
  player.calibration.g = g;
  player.calibration.b = b;
  saveConfig();
  alert('Calibration for "' + player.name + '" done!');
}

/**
 * Check if all WebSocket connections are open.
 * @returns {boolean}
 */
function areWebSocketsConnected() {
  if (Object.keys(game.wss).length == 0) return false;
  if (Object.keys(game.wss).length != game.config.players.length) return false;
  return Object.values(game.wss).every((ws) => ws.readyState == 1);
}

// #####################################################
// #################### Geme Logic #####################
// #####################################################

/**
 * Represents the core game logic.
 */
class GameCore {
  /**
   * Object representing the shots in the game.
   * @type {{
   *   [key: string]: number
   * }}
   */
  shots = {};

  /**
   * Object representing the hits in the game.
   * @type {{
   *   [key: string]: number
   * }}
   */
  hits = {};

  /**
   * Object representing the accuracy in the game.
   * @type {{
   *   [key: string]: number
   * }}
   */
  accuracy = {};

  /**
   * @type {{
   *   [key: string]: {
   *     hit: boolean,
   *   }
   * }}
   */
  objects = {};

  /**
   * @type {{
   *   shots: {
   *     [key: string]: string | null,
   *   },
   * }}
   */
  data = {
    shots: {}
  };

  /**
   * @param {{
   *   shots: {
   *     [key: string]: string | null,
   *   },
   * }} data 
   */
  constructor(data) {
    this.data = data;

    // Initialize shots, hits and accuracy
    for (const [player, _] of Object.entries(this.data.shots)) {
      this.shots[player] = 0;
      this.hits[player] = 0;
      this.accuracy[player] = 100;
    }
  }

  /**
   * Updates the game state for the current frame.
   */
  tick() {
    // Set the background color for 
    game.p.fill(game.config.dark ? 255 : 0);

    // For each player, check if they have shot and if they have hit
    const shotEntries = Object.entries(this.data.shots);
    for (let i = 0; i < shotEntries.length; i++) {
      const [player, shot] = shotEntries[i];
      if (shot !== null) {
        // Increment the shots for the player
        this.shots[player]++;
        // Play a random shot sound
        sound.play(`shot${Math.floor(Math.random() * GAME_CONSTANTS.ASSETS_COUNTS.shots)}`);

        // If the shot is not '000' and the object exists
        if (shot !== '000' && (shot in this.objects)) {
          // Set the object as hit
          this.objects[shot].hit = true;
          // Play a random hit sound
          sound.play(`hit${Math.floor(Math.random() * GAME_CONSTANTS.ASSETS_COUNTS.hits)}`);
          // Increment the hits for the player
          this.hits[player]++;
        }
        // Reset the shot for the player
        this.data.shots[player] = null;
      }

      // Calculate the accuracy for the player
      this.accuracy[player] = this.shots[player] ? Math.round(this.hits[player] / this.shots[player] * 100) : 100;
    }
  }
};

/**
 * Represents a bird object in the game.
 */
class BirdsObj {
  hit = false;

  /**
   * @param {number} width 
   * @param {number} height 
   * @param {p5.Image[]} sprites 
   */
  constructor(width, height, sprites) {
    this.escaped = false;
    this.w = width;
    this.h = height;
    this.size = width * GAME_CONSTANTS.DIFFICULTIES[game.config.difficulty].size;
    this.x = game.p.random(game.p.windowWidth * (0.5 + 0.3), game.p.windowWidth * (0.5 - 0.3));
    this.y = game.p.windowHeight / 2 + height / 2 - this.size;
    this.speed = Math.floor(game.p.random(1, 6)) * 5 * GAME_CONSTANTS.DIFFICULTIES[game.config.difficulty].speed / 100;
    this.speedm = Math.floor(6) * 5 * GAME_CONSTANTS.DIFFICULTIES[GAME_CONSTANTS.DIFFICULTIES.length - game.config.difficulty - 1].speed / 100;

    this.v = game.p.createVector(1, 1);
    this.v.setHeading(game.p.random(-(0.5 + 0.1) * game.p.PI, -(0.5 - 0.1) * game.p.PI));
    this.v.setMag(this.speed);

    this.seed = game.p.random();
    this.frame = 0;
    this.sprites = sprites;
  }

  /**
   * Draws the bird object on the canvas.
   */
  draw() {
    if (game.p.frameCount % (this.speedm - this.speed) == 0) {
      if (++this.frame >= GAME_CONSTANTS.ASSETS_COUNTS.birds - 1) this.frame = 0;
    }

    let sprite = this.sprites[this.frame].get();
    sprite.resize(this.size, 0);
    game.p.imageMode(game.p.CENTER);

    if (this.v.x < 0) {
      game.p.push();
      game.p.scale(-1, 1);
      game.p.image(sprite, -this.x, this.y);
      game.p.pop();
    }
    else {
      game.p.image(sprite, this.x, this.y);
    }

    this.x += this.v.x;
    this.y += this.v.y;

    if (!this.escaped) {
      if (this.y + this.size / 2 < game.p.windowHeight / 2 + this.h / 2 - this.h / 6) this.escaped = true;
      return;
    }

    this.seed += 0.06;
    this.v.rotate((game.p.noise(this.seed) - 0.5) * game.p.PI / 10);

    if (this.x + this.size / 2 > (game.p.windowWidth + this.w) / 2 || this.x - this.size / 2 < (game.p.windowWidth - this.w) / 2) {
      this.x -= this.v.x;
      this.v.x = -this.v.x;
    }
    if (this.y + this.size / 2 > game.p.windowHeight / 2 + this.h / 2 - this.h / 6 || this.y - this.size / 2 < (game.p.windowHeight - this.h) / 2) {
      this.y -= this.v.y;
      this.v.y = -this.v.y;
    }
  }
};

/**
 * Represents a feather object in the game.
 */
class BirdsFeather {
  /**
   * @param {BirdsObj} bird 
   */
  constructor(bird) {
    this.pos = game.p.createVector(bird.x, bird.y);
    this.size = bird.size / 4;
    this.bv = bird.v.copy();
    this.v = game.p.createVector(1, 1);
    this.v.setHeading(game.p.random() * game.p.TWO_PI);
    this.v.setMag(game.p.random(0.5, 1.0) * this.size / 10);
    this.pos.add(this.v);
    this.angle = game.p.random() * game.p.TWO_PI;
    this.av = game.p.random() * game.p.PI / 20;
    this.sprites = bird.sprites;
    this.max = 30;
    this.count = this.max;
  }

  /**
   * Draws the feather object on the canvas.
   */
  draw() {
    this.v.add(0, 0.05);
    this.bv.setMag(this.bv.mag() * 0.95);
    this.v.setMag(this.v.mag() * 0.97);
    let V = p5.Vector.add(this.bv, this.v);
    this.pos.add(V);

    game.p.push();
    game.p.translate(this.pos.x, this.pos.y);
    this.angle += this.av;
    game.p.rotate(this.angle);
    game.p.tint(255, this.count * 255 / this.max);
    let sprite = this.sprites[4].get();
    sprite.resize(this.size, 0);
    game.p.imageMode(game.p.CENTER);
    game.p.image(sprite, 0, 0);
    game.p.pop();
    this.count--;
  }

  /**
   * Checks if the feather has ended.
   * @returns {boolean}
   */
  end() {
    return this.count <= 0;
  }
};

/**
 * Represents the game logic for the birds game.
 * @extends {GameCore}
 */
class GameBirds extends GameCore {
  /**
   * @type {BirdsFeather[]}
   */
  feathers = [];

  /**
   * @type {{
   *   [key: string]: BirdsObj
   * }}
   */
  objects = {};

  /**
   * @param {{
   *   shots: {
   *     [key: string]: string | null,
   *   },
   * }} data 
   */
  constructor(data) {
    super(data);
  }

  /**
   * Updates the game state for the current frame.
   */
  tick() {
    game.p.background(game.config.dark ? 10 : 255);
    game.p.imageMode(game.p.CENTER);
    let img = game.assets.sprites.field?.get();
    if (!img) {
      console.error('Field image not loaded');
      return;
    }
    img.resize(game.p.windowWidth, 0);
    if (img.height > game.p.windowHeight) img.resize(img.width * game.p.windowHeight / img.height, 0);

    if (Math.random() < 0.02) {
      let bird = GAME_CONSTANTS.BIRDS_VARIETY[Math.floor(game.p.random(GAME_CONSTANTS.BIRDS_VARIETY.length))];
      let r = GAME_CONSTANTS.COLORS[bird];
      if (!(r in this.objects)) {
        this.objects[r] = new BirdsObj(img.width, img.height, game.assets.sprites.birds[bird]);
      }
    }
    for (let obj in this.objects) {
      if (this.objects[obj].hit) {
        let feather_am = Math.floor(game.p.random(5, 8));
        for (let i = 0; i < feather_am; i++) this.feathers.push(new BirdsFeather(this.objects[obj]));
        delete this.objects[obj];
      }
      else this.objects[obj].draw();
    }
    for (let f in this.feathers) {
      if (this.feathers[f].end()) this.feathers.splice(Number(f), 1);
      else this.feathers[f].draw();
    }

    game.p.image(img, game.p.windowWidth / 2, game.p.windowHeight / 2);

    super.tick();
  }
};

// ################################################
// ##################### INIT #####################
// ################################################

/**
 * p5.js sketch object.
 * @param {p5} p 
 */
const sketch = p => {
  // ################### Miscellaneous ###################

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  // #################### Load assets ####################

  p.preload = function () {
    // Delete default loading screen (we have our own)
    const p5LoadingElement = document.getElementById('p5_loading');
    if (p5LoadingElement !== null) {
      p5LoadingElement.remove();
    }

    // Load audio assets
    for (let i = 0; i < GAME_CONSTANTS.ASSETS_COUNTS.shots; i++) {
      sound.add(`shot${i}`, {
        url: `./assets/sound/shot${i}.mp3`,
        preload: true,
      });
    }
    for (let i = 0; i < GAME_CONSTANTS.ASSETS_COUNTS.hits; i++) {
      sound.add(`hit${i}`, {
        url: `./assets/sound/hit${i}.mp3`,
        preload: true,
      });
    }

    // Load background
    game.assets.sprites.field = p.loadImage('./assets/images/field.png');

    // Load birds
    for (let bird of GAME_CONSTANTS.BIRDS_VARIETY) {
      game.assets.sprites.birds[bird] = new Array();
      // Each bird has 4 frames + 1 feather
      for (let i = 0; i < GAME_CONSTANTS.ASSETS_COUNTS.birds; i++) {
        game.assets.sprites.birds[bird].push(p.loadImage(`./assets/images/birds/${bird}${i}.png`));
      }
    }
  };

  // ##################### Game setup #####################

  p.setup = function () {
    // Delete our loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.remove();
    }

    // Load calibration and config from local storage
    loadConfig();
    document.body.style.backgroundColor = game.config.dark ? '#000' : '#fff';

    // Create canvas
    p.createCanvas(p.windowWidth, p.windowHeight);

    // Create Pane
    let pane = new Tweakpane.Pane({
      title: 'QuackHunt',
      expanded: true,
    });
    if (pane) {
      pane.addBinding(game.config, 'dark', { label: 'Dark' })
        .on('change', () => {
          // Set canvas background color to black or white
          document.body.style.backgroundColor = game.config.dark ? '#000' : '#fff';
          saveConfig();
        });
      pane.addBinding(game.config, 'difficulty', {
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
        if (game.logic) {
          game.logic = new GameBirds(game.data);
        };
      }).on('change', () => {
        saveConfig();
      });

      let players_pane = pane.addFolder({ title: "Players", expanded: true });
      let pane_players = [];
      for (let p of game.config.players) {
        pane_players.push(addPlayerToPane(p, players_pane));
      }

      pane.addButton({
        title: '+ Add Player',
      }).on('click', () => {
        if (game.config.players.length >= 3) {
          alert('You can only have 3 players');
          return;
        }
        let player_name = 'Player ' + (game.config.players.length + 1);
        let elm = game.config.players.push({
          name: player_name,
          ip: '192.168.1.' + (game.config.players.length + 2),
          treshold: 50,
          status: 'Not Connected',
          calibration: {
            r: 1000,
            g: 1000,
            b: 1000
          }
        });
        game.device[player_name] = {
          version: '0.0.0',
          wifi: {
            ssid: '',
            pass: '',
          },
          ap: {
            ssid: '',
            pass: '',
          },
          oled: {
            width: 0,
            height: 0,
          },
          last_packet: '',
        };
        pane_players.push(
          addPlayerToPane(game.config.players[elm - 1], players_pane)
        );
        saveConfig();
      });
      pane.addButton({
        title: '- Remove Player',
      }).on('click', () => {
        if (game.config.players.length > 1) {
          pane_players.pop()?.dispose();
          const removedPlayer = game.config.players.pop();
          if (removedPlayer) {
            delete game.device[removedPlayer.name];
          }
          saveConfig();
        }
      });

      pane.addButton({
        title: 'Reset Config',
      }).on('click', () => {
        if (confirm('Are you sure you want to reset the config?')) {
          localStorage.removeItem(GAME_CONSTANTS.CONFIG_NAME);
          location.reload();
        }
      });

      pane.addButton({
        title: 'Start',
      }).on('click', (ev) => {
        if (!areWebSocketsConnected()) {
          if (!confirm('Not all players are connected. Do you want to start the game anyway?')) {
            return;
          }
        }
        game.logic = new GameBirds(game.data);

        // Disable all folders
        for (let folder of /** @type {Tweakpane.FolderApi[]} */ (players_pane.children)) {
          for (let child of folder.children) {
            if (!(child instanceof Tweakpane.ButtonApi) && // Not a button
              !(child instanceof Tweakpane.SliderBladeApi) && // Not a slider
              !(child instanceof Tweakpane.SeparatorBladeApi)) { // Not a separator
              if (child.element.lastChild?.firstChild?.firstChild instanceof HTMLInputElement && !child.element.lastChild?.firstChild?.firstChild?.readOnly) {
                // Not readonly input
                child.disabled = true;
              }
            }
          }
        }

        // Disable the start button
        ev.target.disabled = true;
      });
    }
  };

  p.draw = function () {
    if (game.logic) game.logic.tick();
    else {
      p.textSize(32);
      p.textAlign(p.CENTER, p.CENTER);
      if (game.config.dark) p.fill(255);
      else p.fill(0);
      p.text(
        '1. Connect to the gun\n' +
        '2. Shot at the screen\n' +
        '3. Click calibrate\n' +
        '4. Press Start', p.windowWidth / 2, p.windowHeight / 2);
    }
  };
};

/**
 * @type {{
 *   assets: {
 *     sprites: {
 *       field: ?p5.Image,
 *       birds: {
 *         [key: string]: p5.Image[],
 *       },
 *     }
 *   },
 *   p: p5,
 *   logic: ?GameCore,
 *   config: {
 *     version: number,
 *     dark: boolean,
 *     difficulty: number,
 *     players: {
 *       name: string,
 *       ip: string,
 *       treshold: number,
 *       status: string,
 *       calibration: {
 *         r: number,
 *         g: number,
 *         b: number,
 *       }
 *     }[]
 *   },
 *   data: {
 *     shots: {
 *       [key: string]: string | null,
 *     },
 *   },
 *   device: {
 *     [key: string]: {
 *       version: string,
 *       wifi: {
 *         ssid: string,
 *         pass: string,
 *       },
 *       ap: {
 *         ssid: string,
 *         pass: string,
 *       },
 *       oled: {
 *         width: number,
 *         height: number,
 *       },
 *       last_packet: string,
 *     }
 *   },
 *   wss: {
 *     [key: string]: WebSocket
 *   }
 * }}
 */
let game = {
  assets: {
    sprites: {
      field: null,
      birds: {},
    },
  },
  p: new p5(sketch),
  logic: null,
  config: {
    version: GAME_CONSTANTS.APP_VERSION,
    dark: false,
    difficulty: 0,
    players: [
      {
        name: 'Player 1',
        ip: '192.168.1.2',
        treshold: 50,
        status: 'Not Connected',
        calibration: {
          r: 1000,
          g: 1000,
          b: 1000
        }
      },
    ]
  },
  data: {
    shots: {
      'Player 1': null,
    }
  },
  device: {
    'Player 1': {
      version: '0.0.0',
      wifi: {
        ssid: '',
        pass: '',
      },
      ap: {
        ssid: '',
        pass: '',
      },
      oled: {
        width: 0,
        height: 0,
      },
      last_packet: '',
    }
  },
  wss: {},
};
