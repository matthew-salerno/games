/*
  Matthew Salerno
  ECE 4525
  Project 2
  Untitled Bee Game
  
  The goal of this game is to collect the flowers while avoiding enemies.
  I also added buttons with doors to make the game a little more puzzling.
  Movement of the character is restricted to a grid to help aid in control.
  
  The hardest, and most fun, part of making this game was setting up a node
  system where new entities could be added to the game easily. I originally
  wanted to use ECS as that was an interest of mine over the summer, but
  found that it would be too cumbersome to code in javascript. I also had
  fun making a system to cache entity positions so collisions wouldn't
  have to iterate over every collidable entity on the whole map.
  
  There's still some mess in here. In particular it's still all just one
  monolithic file. However, given the scope of the game, it's probably better
  to leave it how it is and refine the system more in my next project. 
  
  As a Hokie, I will conduct myself with honor and integrity at all times.
  I will not lie, cheat, or steal, nor will I accept the actions of those who do.
  - Matthew Salerno
*/

// image locations
const FLOWER_IMG      = [0,0];
const BEE_UP_IMG      = [1,0];
const BEE_RIGHT_IMG   = [2,0];
const BEE_DOWN_IMG    = [3,0];
const BEE_LEFT_IMG    = [4,0];
const DRONE_IMG       = [5,0];
const PLANE_LEFT_IMG  = [6,0];
const PLANE_RIGHT_IMG = [7,0];

// movement constants
const LEFT_RIGHT = 0;
const UP_DOWN    = 1;
const KEY_W      = 87;
const KEY_A      = 65;
const KEY_S      = 83;
const KEY_D      = 68;

// game state
const MENU    = 0;
const RUNNING = 1;
const LOST    = 2;
const WON     = 3;

// globals to handle input and macro-game-state
// outside of game world because keyPresses are
// global and may happen when game world doesn't exist
var DIR_INPUT = [0,0]; // Directional keys being pressed. Opposite keys add to zero
var PREFERRED_AXIS = 0 // Because there's no diagonal movement in my game, we favor the most recent key press
var MOUSE_WAS_PRESSED = false; // we don't want if the mouse is pressed, just if it was since the last time this var was cleared.
function mousePressed() {
  MOUSE_WAS_PRESSED = true;
}
function keyPressed() {
  switch(keyCode) {
    case UP_ARROW:
    case KEY_W:
      PREFERRED_AXIS = UP_DOWN;
      DIR_INPUT[1] -= 1;
      break;
    case DOWN_ARROW:
    case KEY_S:
      PREFERRED_AXIS = UP_DOWN;
      DIR_INPUT[1] += 1;
      break;
    case LEFT_ARROW:
    case KEY_A:
      PREFERRED_AXIS = LEFT_RIGHT;
      DIR_INPUT[0] -= 1;
      break;
    case RIGHT_ARROW:
    case KEY_D:
      PREFERRED_AXIS = LEFT_RIGHT;
      DIR_INPUT[0] += 1;
      break;
  }
}
function keyReleased() {
  switch(keyCode) {
        case UP_ARROW:
    case KEY_W:
      DIR_INPUT[1] += 1;
      break;
    case DOWN_ARROW:
    case KEY_S:
      DIR_INPUT[1] -= 1;
      break;
    case LEFT_ARROW:
    case KEY_A:
      DIR_INPUT[0] += 1;
      break;
    case RIGHT_ARROW:
    case KEY_D:
      DIR_INPUT[0] -= 1;
      break;
  }
}

/*
  These are classes I hope to be able to reuse in future games.
*/

class node {
  constructor(parent) {
    // register as child
    this.children = new Set();
    this.parent = parent;
    this.world = this.getWorld();
    if (this.parent instanceof node) {
      this.parent.addChild(this);
    }
    // setup hooks
    if (typeof this.__process == "function") {
      //print(typeof this.__process);
      this.world.processCalls.add(this);
    }
    if (typeof this.__draw == "function") {
      //print(typeof this.__draw);
      this.world.drawCalls.add(this);
    }
  }

  addChild(child) {
    this.children.add(child);
  }
  
  remove() {
    this.children.forEach(function(child, index) {
      child.remove();
    });
    console.assert(this.children.size == 0, "FAILED TO DELETE CHILDREN WHEN REMOVING");
    if (this.world.drawCalls.has(this)) {
      this.world.drawCalls.delete(this);
    }
    if (this.world.processCalls.has(this)) {
      this.world.processCalls.delete(this);
    }
    this.parent.children.delete(this);
  }
  
  getWorld() {
    console.assert(this.parent instanceof node, "Root is not a node!");
    return this.parent.getWorld();
  }
}

class world extends node {
  constructor() {
    super(null);
    this.drawCalls = new Set();
    this.processCalls = new Set();
    this.collision_array = [];
    this.collision_division = createVector(10,10);
    this.world_size = createVector(400,400);
    this.chunk_size = createVector(this.world_size.x/this.collision_division.x, 
                                   this.world_size.y/this.collision_division.y);
    for (let i = 0; i < this.collision_division.x; i++) {
      this.collision_array[i] = [];
      for (let j = 0; j < this.collision_division.y; j++) {
        this.collision_array[i][j] = new Set();
      }
    }
  }
  
  getWorld() {
    return this;
  }
  
  process() {
    this.processCalls.forEach(function(caller, index) {
      caller.__process();
    });
  }
  
  draw() {
    this.drawCalls.forEach(function(caller, index) {
      caller.__draw();
    });
  }
  
  registerCollider(id, pos) {
    this.collision_array[floor(pos.x/this.chunk_size.x)][floor(pos.y/this.chunk_size.y)].add(id);
  }
  unregisterCollider(id, pos) {
    this.collision_array[floor(pos.x/this.chunk_size.x)][floor(pos.y/this.chunk_size.y)].delete(id);
  }
}

class entity_2d extends node {
  constructor(parent, posistion, direction) {
    super(parent);
    this.position = posistion;
    this.direction = direction;
  }
}

class static_collider_2d extends node {
  constructor(parent, radius) {
    super(parent);
    console.assert(parent instanceof entity_2d, "Collider attached to non positional node!");
    this.radius = radius;
    this.world.registerCollider(this, this.parent.position);
    this.last_pos = createVector(this.parent.position.x, this.parent.position.y);
    this.last_array_pos = createVector(floor(this.last_pos.x/this.world.chunk_size.x),
                                       floor(this.last_pos.y/this.world.chunk_size.y));
    this.collisions = new Set();
  }
}

// Note for future me on next project. Make this into two classes. One that checks for collisions and one that doesn't.
// Also add more collision shapes. I can get away with only circles here but that won't always be the case.
class collider_2d extends static_collider_2d {
  __process() {
    let array_pos = createVector(floor(this.parent.position.x/this.world.chunk_size.x),
                                 floor(this.parent.position.y/this.world.chunk_size.y));
    // check if moved
    
    if (!this.last_array_pos.equals(array_pos)) {
      this.world.unregisterCollider(this, this.last_pos);
      this.world.registerCollider(this, this.parent.position);
    }
    
    // check collision
    
    let maxi = Math.min(this.world.collision_division.x-1,array_pos.x+1);
    let maxj = Math.min(this.world.collision_division.y-1,array_pos.y+1);
    let mini = Math.max(0, array_pos.x-1);
    let minj = Math.max(0,array_pos.y-1);
    let this_scoped = this; // hacky workaround
    for (let i = mini; i <= maxi; i++) {
      for (let j = minj; j <= maxj; j++) {
        this.world.collision_array[i][j].forEach(function(item) {
          if (item != this_scoped) {
            if (item.parent.position.copy().sub(this_scoped.parent.position).magSq() < (this_scoped.radius+item.radius)*(this_scoped.radius+item.radius)) {
              this_scoped.collisions.add(item); // note, collisions must be removed by the function that handles collisions
            }
          }
        });
      }
    }
  }
}

/*
  These are classes specific to the current game
*/

class block extends entity_2d { 
  constructor(parent, posistion, direction) {
    super(parent, posistion, direction);
    this.flower_x = random(-7,7);
    this.flower_y = random(-7, 7);
    this.flower_c = random(['red', 'yellow', 'pink', 'white']);
    this.collision = new static_collider_2d(this, 10)
  }
  __draw() {
    fill('darkGreen');
    strokeWeight(2);
    noStroke();
    rect(this.position.x-10, this.position.y-10, 20, 20);
    stroke(this.flower_c);
    fill('black');
    circle(this.position.x + this.flower_x, this.position.y + this.flower_y, 3);
  }
  __process() {
    this.collision.collisions.clear();
  }
}
class border extends entity_2d { 
  __draw() {
    fill('green');
    noStroke();
    rect(this.position.x-10, this.position.y-10, 20, 20);
  }
}

class explosion extends entity_2d {
  constructor(parent, posistion, direction, frame) {
    super(parent, posistion, direction);
    this.frame = frame
  }
  __draw() {
    noStroke();
    fill('red');
    let size = lerp(20, 0, (frameCount-this.frame)/(this.frame+120));
    if (size > 0)
    {
      translate(this.position.x, this.position.y);
      rotate((frameCount)/10);
      rect(-size/2, -size/2, size, size);
      rotate(QUARTER_PI);
      rect(-size/2, -size/2, size, size);
      resetMatrix();
    }
  }
}

class player extends entity_2d {
  constructor(parent, posistion, direction) {
    super(parent, posistion, direction);
    this.collision = new collider_2d(this, 8);
    this.target_to = this.position.copy();
    this.target_from = this.position.copy();
    this.sprite_index = BEE_DOWN_IMG;
  }
  __draw() {
    this.world.sprites.draw_sprite(this.sprite_index, this.position);
  }
  __process() {
    // Handle movement
    if (this.target_to.equals(this.target_from) && this.world.state == RUNNING) {
      this.target_from = this.position.copy();
      if (DIR_INPUT[0] == 0 || DIR_INPUT[1] == 0) {
        this.target_to   = this.position.copy().add(createVector(DIR_INPUT[0], DIR_INPUT[1]).mult(20));
      }
      else {
        if (PREFERRED_AXIS == UP_DOWN) {
          this.target_to   = this.position.copy().add(createVector(0,DIR_INPUT[1]).mult(20));
        }
        else {
          this.target_to   = this.position.copy().add(createVector(DIR_INPUT[0],0).mult(20));
        }
      }
    }
    else {
      let direction = this.target_to.copy().sub(this.target_from).normalize().mult(2);
      this.position.add(direction);
      if (direction.x > 0) {
        this.sprite_index = BEE_RIGHT_IMG;
      }
      else if (direction.x < 0) {
        this.sprite_index = BEE_LEFT_IMG;
      }
      else if (direction.y > 0) {
        this.sprite_index = BEE_DOWN_IMG;
      }
      else if (direction.y < 0) {
        this.sprite_index = BEE_UP_IMG;
      }
      if (this.target_to.copy().sub(this.position).magSq() < 9) {
        this.target_from = this.target_to.copy();
        this.position = this.target_to.copy();
      }
    }
    
    // Handle collisions
    if (this.world.state == RUNNING) {
      let this_scoped = this
      this.collision.collisions.forEach(function(coll) {
        if (coll.parent instanceof block) {
          this_scoped.position = this_scoped.target_from.copy();
          this_scoped.target_to = this_scoped.target_from.copy();
        }
        else if (coll.parent instanceof door && coll.parent.closed) {
          if (this_scoped.position.equals(coll.parent.position)) {
            this_scoped.blow_up(this_scoped.position);
          }
          this_scoped.position = this_scoped.target_from.copy();
          this_scoped.target_to = this_scoped.target_from.copy();
        }
        else if (coll.parent instanceof trophy) {
          this_scoped.world.score++;
          coll.world.unregisterCollider(coll, coll.parent.position);
          coll.parent.remove();
          if (gameWorld.score == 20) {
            gameWorld.state = 3;
            gameWorld.endFrame = frameCount;
            this_scoped.world.unregisterCollider(this_scoped.collision, this_scoped.position);
            this_scoped.collision.remove();
            this_scoped.target_to = createVector(-40,-40); // fly off screen
          }
        }
        else if (coll.parent instanceof enemy) {
          this_scoped.blow_up(this_scoped.position.copy().add(coll.parent.position).mult(0.5), createVector(0,0));
          coll.world.unregisterCollider(coll, coll.parent.position);
          coll.parent.remove();
        }
      });
      this.collision.collisions.clear();
    }
  }
  blow_up(pos) {
    this.world.state = LOST;
    new explosion(this.world, pos, createVector(0,0), frameCount);
    this.world.unregisterCollider(this.collider, this.position);
    this.remove();
  }
}

class trophy extends entity_2d {
  constructor(parent, position, direction) {
    super(parent,position,direction);
    this.collision = new static_collider_2d(this, 5);
  }
  __draw() { // TODO: replace with proper method
    this.world.sprites.draw_sprite(FLOWER_IMG, this.position)
  }
}

class enemy extends entity_2d {
  constructor(parent, posistion, direction) {
    super(parent, posistion, direction);
    this.collision = new collider_2d(this, 8);
    this.speed = 1;
  }
  __process() {
    let this_scoped = this
    this.collision.collisions.forEach(function(coll) {
      if (coll.parent instanceof block || (coll.parent instanceof door && coll.parent.closed)) {
        this_scoped.speed*=-1;
        this_scoped.position.add(this_scoped.position.copy().sub(coll.parent.position).normalize())
      }
    });
    this.collision.collisions.clear();
  }
}

class enemy_ud extends enemy {
  __draw() {
    this.world.sprites.draw_sprite(DRONE_IMG, this.position)
  }
  __process() {
    super.__process();
    this.position.y+=this.speed;
  }
}

class enemy_lr extends enemy {
  constructor(parent, posistion, direction) {
    super(parent, posistion, direction);
    this.sprite_index = PLANE_LEFT_IMG;
  }
  __draw() {
    this.world.sprites.draw_sprite(this.sprite_index, this.position);
  }
  __process() {
    super.__process();
    this.position.x+=this.speed;
    if (this.speed > 0) {
      this.sprite_index = PLANE_RIGHT_IMG;
    }
    else {
      this.sprite_index = PLANE_LEFT_IMG;
    }
  }
}

class door extends entity_2d {
  constructor(parent, posistion, direction, closed, link_color) {
    super(parent, posistion, direction);
    this.start_closed = closed;
    this.closed = closed;
    this.link_color = link_color;
    this.collision = new static_collider_2d(this, 10);
  }
  __draw() {
    if (this.closed) {
      strokeWeight(4)
      stroke(this.link_color);
      fill('green');
      rect(this.position.x-8, this.position.y-8, 16, 16);
    }
    else {
      noStroke();
      fill(this.link_color);
      rect(this.position.x-10, this.position.y-10, 5, 5);
      rect(this.position.x-10, this.position.y+ 5, 5, 5);
      rect(this.position.x+ 5, this.position.y-10, 5, 5);
      rect(this.position.x+ 5, this.position.y+ 5, 5, 5);
    }
  }
  __process() {
    if (this.world.doors.has(this.link_color)) {
      this.closed = !this.start_closed;
    }
    else {
      this.closed =  this.start_closed;
    }
  }
}


class button extends entity_2d {
  constructor(parent, posistion, direction, link_color) {
    super(parent, posistion, direction);
    this.link_color = link_color;
    this.collision = new collider_2d(this, 8);
    this.was_pressed = false;
  }
  __process() {
    if (this.collision.collisions.size > 0 && !this.was_pressed) {
      if (this.world.doors.has(this.link_color)) {
        this.world.doors.delete(this.link_color);
      }
      else {
        this.world.doors.add(this.link_color);
      }
      this.was_pressed = true;
    }
    else if (this.collision.collisions.size == 0 && this.was_pressed){
      this.was_pressed = false;
    }
    this.collision.collisions.clear();
}
  __draw() {
    strokeWeight(2);
    stroke('grey');
    fill(this.link_color);
    circle(this.position.x, this.position.y, 8);
  }
}

/*
  This part is for making sprites
*/

class spriteSheet {
  constructor(canvas) {
    canvas.clear();
    // trophy
    noStroke();
    fill('yellow')
    for (let i = 0; i < TWO_PI; i += PI/3) {
      circle(10+cos(i)*4,10+sin(i)*4,8);
    }
    stroke(0);
    noFill();
    for (let i = 0; i < TWO_PI; i += PI/3) {
      circle(10+cos(i)*4,10+sin(i)*4,8);

    }
    noStroke();
    fill('black');
    circle(10,10,7);

    // player
    stroke(0);
    fill(0);
    line(30,8,39,1)
    line(30,8,21,1)
    circle(22,2,2);
    circle(38,2,2);
    fill(255,255,255,128);
    ellipse(30,8,18,5)
    fill('yellow')
    ellipse(30,10,10,18)
    fill('black')
    ellipse(30, 9,10,17)
    fill('yellow')
    ellipse(30, 8,10,13)
    fill('black')
    ellipse(30, 7,10,10)
    fill('yellow')
    ellipse(30, 6,10,5)
    noStroke();

    // Enemy left right
    stroke(0);
    noFill();
    strokeWeight(1);
    rect(101, 1, 5,5);
    rect(114, 1, 5,5);
    rect(114,14, 5,5);
    rect(101,14, 5,5);
    line(106,6,114,14);
    line(114,6,106,14);
    fill('orange');
    circle(110,10,5)

    // Enemy up down
    fill(255);
    triangle(121,10,139,1,139,19);
    line(121,10,135,7);
    line(121,10,135,13);
    line(135,7,139,1);
    line(135,13,139,19);
    line(121,10,139,10);

    // repeat for other orientations,
    // I realized the necessity to work around pixel density from
    // https://stackoverflow.com/questions/69171227/p5-image-from-get-is-drawn-blurry-due-to-pixeldensity-issue-p5js
    // BUT the code is still my own creation.
    this.subpixel_scale = pixelDensity();
    let tiles = createImage(400*this.subpixel_scale,400*this.subpixel_scale);
    tiles.copy(canvas,0,0,400,400,0,0, 400*this.subpixel_scale, 400*this.subpixel_scale);
    translate(60,0);
    rotate(HALF_PI);
    image(tiles, 0, 0, 20,20, 20*this.subpixel_scale, 0*this.subpixel_scale, 20*this.subpixel_scale, 20*this.subpixel_scale);
    translate(20,-20);
    rotate(HALF_PI);
    image(tiles, 0, 0, 20,20, 20*this.subpixel_scale, 0*this.subpixel_scale, 20*this.subpixel_scale, 20*this.subpixel_scale);
    rotate(HALF_PI);
    image(tiles, 0, 0, 20,20, 20*this.subpixel_scale, 0*this.subpixel_scale, 20*this.subpixel_scale, 20*this.subpixel_scale);
    resetMatrix();
    translate(160,20)
    rotate(PI);
    image(tiles, 0, 0, 20,20, 120*this.subpixel_scale, 0*this.subpixel_scale, 20*this.subpixel_scale, 20*this.subpixel_scale);
    resetMatrix();
    this.sprites = createImage(400*this.subpixel_scale,400*this.subpixel_scale);
    this.sprites.copy(canvas,0,0,400,400,0,0, 400*this.subpixel_scale, 400*this.subpixel_scale);
    canvas.clear();
  }
  draw_sprite(index, position) {
    image(this.sprites, position.x-10, position.y-10, 20, 20,
          index[0]*20*this.subpixel_scale, index[1]*20*this.subpixel_scale, 20*this.subpixel_scale, 20*this.subpixel_scale);
  }
}

/*
  Parts for drawing game screens
*/

function draw_menu(world) {
  textAlign(LEFT);
  textSize(15);
  noStroke();
  fill('black');
  text("You are a bee     .\n\nMove with the arrow keys or WASD\n\nCollect all 20 flowers     to win\n\nAvoid paper airplanes     \
and drones     .\n\nObserve the environment to learn more rules.\n\nClick anywhere to start.\n\n\nHave fun!", 20,50);
  world.sprites.draw_sprite(BEE_UP_IMG, createVector(140, 40));
  world.sprites.draw_sprite(FLOWER_IMG, createVector(190, 120));
  world.sprites.draw_sprite(PLANE_RIGHT_IMG, createVector(195, 160));
  world.sprites.draw_sprite(DRONE_IMG, createVector(310, 160));

}

/*
  This is the part that loads the world and starts the game.
*/

var gameWorld;
function setup() {
  gameWorld = new world();
  gameWorld.map = [
    "....................",
    ".##################.",
    ".#@ ****   # *****#.",
    ".#  ****   #   3  #.",
    ".#         b   2 >#.",
    ".#CCC##############.",
    ".#        *     ^#..",
    ".#        *      #..",
    ".###########     #..",
    ".#           **  #..",
    ".#               #..",
    ".#^############# #..",
    ".#             # #..",
    ".#             # #..",
    ".#             # ##.",
    ".#####>  *  *  # *#.",
    ".....#         #a##.",
    ".....#        1#^#..",
    ".....#############..",
    "....................",
    
  ];
  gameWorld.doors = new Set();
  gameWorld.score = 0;
  //* = token
  //> = horizontal monster
  //^ = vertical monster
  //a = gate (starts off)
  //A = gate (starts on)
  //1 = button toggle
  //...
  
  // background layer (layer 0)
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      switch(gameWorld.map[row][col]) {
        case '.':
          new border(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0));
          break
      }
    }
  }
  
  // floor layer (layer 1)
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      switch(gameWorld.map[row][col]) {
        case '#':
          new block(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0));
          break;
        case '*':
          new trophy(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0));
          break
        case 'a':
          new door(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), false, 'red');
          break
        case 'A':
          new door(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), true, 'red');
          break
        case 'b':
          new door(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), false, 'blue');
          break
        case 'B':
          new door(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), true, 'blue');
          break
        case 'c':
          new door(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), false, 'yellow');
          break
        case 'C':
          new door(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), true, 'yellow');
          break
        case '1':
          new button(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), 'red');
          break
        case '2':
          new button(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), 'blue');
          break
        case '3':
          new button(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0), 'yellow');
          break
          
      }
    }
  }
  
  // foreground layer (layer 2)
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      switch(gameWorld.map[row][col]) {
        case '@':
          new player(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0));
          break
        case '>':
          new enemy_lr(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0));
          break
        case '^':
          new enemy_ud(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0));
          break    
      }
    }
  }
  gameWorld.canvas = createCanvas(400, 400);
  gameWorld.sprites = new spriteSheet(gameWorld.canvas);
  gameWorld.state = 0;
  gameWorld.endFrame = 0;
}

function draw() {
  background("lightGreen");
  switch(gameWorld.state) {
    case MENU: // main menu
      draw_menu(gameWorld);
      if (MOUSE_WAS_PRESSED) {
        MOUSE_WAS_PRESSED = false;
        gameWorld.state++;
      }
      break;
    case RUNNING: // game running
    case LOST: //game over
    case WON: // game won
      gameWorld.process();
      gameWorld.draw();
      textAlign(LEFT);
      textSize(11);
      stroke('black');
      fill('white');
      text("Score: " + gameWorld.score.toString() + "/20", 22,350);
      switch (gameWorld.state) {
        case RUNNING:
          break;
        case LOST:
          textAlign(CENTER);
          textSize(30);
          stroke('black');
          fill('red')
          text("YOU LOSE!", 200,210);
          break;
        case WON:
          textAlign(CENTER);
          textSize(30);
          stroke('black');
          fill('white')
          text("YOU WIN!", 200,210);
          break;
      }
      break;
  }
}
