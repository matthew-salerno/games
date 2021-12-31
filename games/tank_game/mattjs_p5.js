/*
  Matthew Salerno
  ECE 4525
  Project 3
  Untitled Tank Game
  
  This is a simple game which builds off of my "game engine" from untitled bee game. Normally this would be broken into many files, but the format of the course didn't allow me to do that easily at the time. Code is rushed due to the course deadlines
  
  As a Hokie, I will conduct myself with honor and integrity at all times.
  I will not lie, cheat, or steal, nor will I accept the actions of those who do.
  - Matthew Salerno
*/
// image locations
const PLAYER               = [0,0];
const ENEMY                = [0,1];
const DEAD                 = [0,2];
const WALL_CORNER_CONVEX   = [2,1];
const WALL_CORNER_CONCAVE  = [1,1];
const WALL_SIDE_HORIZONTAL = [1,0];
const WALL_SIDE_VERTICAL   = [2,0];
const EMPTY                = [1,2];

const TOP_LEFT     = 0;
const TOP_RIGHT    = 1;
const BOTTOM_LEFT  = 2;
const BOTTOM_RIGHT = 3;

// movement constants
const LEFT_RIGHT = 0;
const UP_DOWN    = 1;
const KEY_W      = 87;
const KEY_A      = 65;
const KEY_S      = 83;
const KEY_D      = 68;
const KEY_H      = 72;
const KEY_M      = 77;
const KEY_SPACE  = 32;

// collision constants
const MAX_COLLISION_LOOPS = 16;

// game state
const SPRITES = 0;
const MENU    = 1;
const RUNNING = 2;
const LOST    = 3;
const WON     = 4;

const IN_AIR    = 0;
const ON_GROUND = 1;

// debug
var VISUALIZE_COLLISIONS  = false;
const PAUSE_FOR_SPRITESHEET = false;
var DRAW_HITBOX           = false;

// globals to handle input and macro-game-state
// outside of game world because keyPresses are
// global and may happen when game world doesn't exist
var DIR_INPUT = [0,0]; // Directional keys being pressed. Opposite keys add to zero
var PREFERRED_AXIS = 0 // In case of no diagonal movement in game, we favor the most recent key press
var MOUSE_WAS_PRESSED = false; // we don't want if the mouse is pressed, just if it was since the last time this var was cleared.
var SPACE_WAS_PRESSED = false; // same as above
function mousePressed() {
  MOUSE_WAS_PRESSED = true;
}

function vec_array(points) {
  arr = [];
  for (let i = 0; i < points.length; i+=2){
    arr.push(createVector(points[i], points[i+1]))
  }
  return arr;
}

function clamp(_min, _mid, _max) {
  let ret = _mid;
  if (ret < _min) {
    return _min;
  }
  else if (ret > _max) {
    return _max;
  }
  else {
    return _mid;
  }
}

function towards_number(amount, target, step) {
  let delta = 0;
  if (amount < target) {
    delta = min(target-amount, step);
  }
  else if (amount > target){
    delta = max(target-amount, -step);
  }
  return amount+delta;
}

function keyPressed() {
  switch(keyCode) {
    case UP_ARROW:
    case KEY_W:
      PREFERRED_AXIS = UP_DOWN;
      DIR_INPUT[1] += 1;
      break;
    case DOWN_ARROW:
    case KEY_S:
      PREFERRED_AXIS = UP_DOWN;
      DIR_INPUT[1] -= 1;
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
    case KEY_SPACE:
      SPACE_WAS_PRESSED = true;
      break;
    case KEY_H:
      DRAW_HITBOX = !DRAW_HITBOX;
      break;
    case KEY_M:
      VISUALIZE_COLLISIONS = !VISUALIZE_COLLISIONS;
      break;
  }
}
function keyReleased() {
  switch(keyCode) {
        case UP_ARROW:
    case KEY_W:
      DIR_INPUT[1] -= 1;
      break;
    case DOWN_ARROW:
    case KEY_S:
      DIR_INPUT[1] += 1;
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
  
  hasInstance(instance) {
    for (let child of this.children) {
      if (child instanceof instance) {
        return child;
      }
    }
    return false;
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
    this.collision_division = createVector(8,8);
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
    if (VISUALIZE_COLLISIONS) {
      for (let i = 0; i < this.collision_division.x; i++) {
        for (let j = 0; j < this.collision_division.y; j++) {
          if (this.collision_array[i][j].size > 0) {
            noStroke();
            fill(255,0,0, 128);
            rect(i*this.chunk_size.x, j*this.chunk_size.y, this.chunk_size.x, this.chunk_size.y);
            stroke(0,0,0,128);
            fill(256,256,256,128);
            textSize(32);
            textAlign(CENTER, CENTER);
            text(this.collision_array[i][j].size, (i+0.5)*this.chunk_size.x, (j+0.5)*this.chunk_size.y);
          }

        }
      }
    }
  }
  
  registerCollider(id, pos) {
    this.collision_array[pos.x][pos.y].add(id);
  }
  unregisterCollider(id, pos) {
    if(this.collision_array[pos.x][pos.y].delete(id)) {
      //print("Couldn't find collider!");
    }
  }
  get_collider_array_pos(pos) {
    return createVector(floor(pos.x/this.world.chunk_size.x),
      floor(pos.y/this.world.chunk_size.y)
    );
  }
  
  // calls a function func(object_id: ent) on all objects within square radius "radius" of array_pos. "this" can be passed in at the end as well.
  forNearby(array_pos, func, radius=1, thisArg = null) {
    let maxi = Math.min(this.collision_division.x-radius,array_pos.x+radius);
    let maxj = Math.min(this.collision_division.y-radius,array_pos.y+radius);
    let mini = Math.max(0, array_pos.x-radius);
    let minj = Math.max(0,array_pos.y-radius);
    for (let i = mini; i <= maxi; i++) {
      for (let j = minj; j <= maxj; j++) {
        for (const ent of this.collision_array[i][j]) {
          func.call(thisArg, ent);
        }
      }
    }
  }
  forLine(array_pos1, array_pos2, func, width=0, thisArg = null) {
    let cells = new Set();
    let diff = p5.Vector.sub(array_pos1, array_pos2);
    let length = diff.mag();
    let step = 1/length;
    for (let i = 0; i <= 1; i+=step) {
      let cell = p5.Vector.lerp(array_pos1, array_pos2, i);
      cell.x = round(cell.x);
      cell.y = round(cell.y);
      this.forNearby(cell, function(item) {
        cells.add(item);
      }, width, thisArg);
    }
    cells.forEach(func, thisArg);
  }
}

class entity_2d extends node {
  constructor(parent, position, direction) {
    super(parent);
    this.position = position;
    this.direction = direction;
  }
}

class emitter extends node {
  // oneshot becomes should be the number of particles to emit if not false
  constructor(parent, particle, vel, vel_dev, life_max, life_min, emit_max, emit_min, emit_delta, oneshot=false, offset=createVector(0,0)) {
    super(parent);
    this.enabled = true;
    this.oneshot = oneshot;
    this.num_particles = 0;
    this.particle = particle;
    this.vel = vel;
    this.vel_dev = vel_dev;
    this.life_max = life_max;
    this.life_min = life_min;

    this.emit_max = emit_max;
    this.emit_min = emit_min;
    this.emit_delta = emit_delta;
    this.offset = offset;
    this.counter = 0;
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  toggle() {
    this.enabled = !this.enabled;
  }
  get position(){
    let pos = createVector(0,0);
    if (this.parent instanceof entity_2d) {
      pos = this.parent.position.copy().add(this.offset.copy().rotate(this.parent.direction));
    }
    else {
      pos = this.offset.copy();
    }
    return pos;
  }
  __process() {
    if (this.enabled && this.position.x > 0 && this.position.y > 0 && this.position.x < this.world.level_width && this.position.y < this.world.level_height){
      if (this.counter == 0) {
        let num = round(random(this.emit_min, this.emit_max));

        for (let _ = 0; _ < num; _++) {
          new this.particle(this.world, 
                            this.position, 
                            this.vel.copy().add(p5.Vector.fromAngle(random(0, TWO_PI), random(0, this.vel_dev))), 
                            random(this.life_min, this.life_max));
        }
        if (this.oneshot > 0) {
          this.num_particles+=num;
          if (this.num_particles > this.oneshot) {
            this.remove();
          }
        }
      }
      this.counter = (this.counter+1)%this.emit_delta;
    }
  }
}

class particle_2d extends node {
  constructor(parent, position, velocity, life) {
    super(parent);
    this.position = position;
    this.velocity = velocity;
    this.life = life;
  }
  __process() {
    this.position.add(this.velocity);
    if (this.life <= 0) {
      this.remove();
    }
    this.life--;
  }
}

class bullet_trail_blue extends particle_2d {
  __draw(){
    fill(128,128,255);
    strokeWeight(2);
    stroke(128,128,255,128)
    circle(this.position.x, this.position.y, 3);
  }
}

class bullet_trail_red extends particle_2d {
  __draw(){
    fill(255,128,128);
    strokeWeight(2);
    stroke(255,128,128,128)
    circle(this.position.x, this.position.y, 3);
  }
}


class intersection {
  // Note, assumes only one point intersects
  constructor(shape, pln, pnt) {
    this.shape=shape;
    this.plane=pln.copy();
    this.point=pnt.copy(); 
  }
}
// must be defined clockwise
class convex_shape {
  constructor(points) {
    this.points = points;
    this.normals = [];
    for (let i = 0; i < points.length; i++) {
      let i_next = (i+1)%points.length;
      let orig = p5.Vector.lerp(points[i], points[i_next], 0.5);
      let norm = p5.Vector.sub(points[i_next], points[i]).rotate(-HALF_PI).normalize();
      this.normals.push(new plane_2d(orig, norm));
    }
    console.assert(this.points.length > 0, "convex shape with no points!");
    console.assert(this.normals.length > 0, "convex shape with no normals!");
  }
  translate(vec) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].add(vec);
    }
    for (let i = 0; i < this.normals.length; i++) {
      this.normals[i].origin.add(vec);
    }
  }
  rotate(rad) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].rotate(rad);
    }
    for (let i = 0; i < this.normals.length; i++) {
      this.normals[i].origin.rotate(rad);
      this.normals[i].normal.rotate(rad);
    }
  }
  intersect_shape(shape) {
    for (let pnt of shape.points) {
      if (this.intersect_vector(pnt)) {
        return new intersection(this, this.get_closest_plane(pnt), pnt);
      }
    }
    for (let pnt of this.points) {
      if (shape.intersect_vector(pnt)) {
        return new intersection(shape, shape.get_closest_plane(pnt), pnt);
      }
    }
    return false;
  }
  
  intersect_vector(vec) {
    let allInside = true;
    for (let pln of this.normals) {
      if (pln.dist(vec) > 0) {
        return false;
      }
    }
    return true;
  }
  
  // returns 0 for intersection, otherwise returns distance closest to plane
  crosses_plane(pln) {
    let sign = null;
    let dist = Infinity;
    for (let pnt of this.points) {
      let new_dist = pln.dist(pnt);
      dist = min(dist, abs(new_dist));
      switch (sign) {
        case null:
          if (new_dist > 0) {
            sign = 1;
          }
          else {
            sign = -1;
          }
          break;
        case 1:
          if (new_dist < 0) {
            return 0;
          }
          break;
        case -1:
          if (new_dist > 0) {
            return 0;
          }
          break;
      }
    }
    return sign*dist;
  }
  
  get_closest_point(pln) {
    let min = Infinity;
    let closest = null;
    for (let vec of this.points) {
      let newDist = abs(pln.dist(vec));
      if (newDist < min) {
        min=newDist;
        closest = vec;
      }
    }
    return closest;
  }
  
  get_closest_plane(vec) {
    let min = Infinity;
    let closest = null;
    for (let pln of this.normals) {
      let newDist = abs(pln.dist(vec));
      if (newDist < min) {
        min=newDist;
        closest = pln;
      }
    }
    return closest;
  }
  
  get_min_point(pln) {
    let min = Infinity;
    let closest = null;
    for (let vec of this.points) {
      let newDist = pln.dist(vec);
      if (newDist < min) {
        min=newDist;
        closest = vec;
      }
    }
    return closest;
  }
  
  draw() {
    beginShape();
    for (let i of this.points) {
      vertex(i.x, i.y);
    }
    if (this.intersect_vector(createVector(mouseX, mouseY))) {
      stroke('blue');
    }
    for (let i of this.normals) {
      line(i.origin.x, i.origin.y, i.origin.x+i.normal.copy().mult(10).x, i.origin.y+i.normal.copy().mult(10).y);
      circle(i.origin.x, i.origin.y, 5);
    }
    endShape(CLOSE);
  }
}

class plane_2d {
  constructor(origin, normal) {
    this.origin = origin;
    this.normal = normal.normalize();
  }
  dist(vec) {
    return p5.Vector.dot(this.normal, p5.Vector.sub(vec, this.origin));
  }
  copy() {
    return new plane_2d(this.origin.copy(), this.normal.copy())
  }
}

class collision_2d extends node {
  constructor(parent, vertices) {
    super(parent);
    this.old_dir = this.parent.direction;
    this.old_pos = this.parent.position.copy();
    this.shape = new convex_shape(vertices);
    this.shape.rotate(this.old_dir);
    this.shape.translate(this.old_pos);
    console.assert(this.parent instanceof entity_2d, "collision must be child of entity_2d!");
  }
  check(other){
    // defining collisions
    console.assert(other instanceof collision_2d, "collisions can only be checked with other collision objects!");
    return this.shape.intersect_shape(other.shape);
  }
  __process() {
    if (this.old_dir != this.parent.direction || !this.old_pos.equals(this.parent.postion)) {
      this.shape.translate(this.old_pos.mult(-1));
      this.shape.rotate(-this.old_dir);
      this.shape.rotate(this.parent.direction);
      this.shape.translate(this.parent.position);

      this.old_dir = this.parent.direction;
      this.old_pos = this.parent.position.copy();
    }
  }
  __draw() {
    if(DRAW_HITBOX) {
      strokeWeight(1);
      noFill();
      stroke('red');
      this.shape.draw();
    }
  }
}

class static_pos_hash_2d extends node {
  constructor(parent) {
    super(parent);
    console.assert(parent instanceof entity_2d, "Collider attached to non positional node!");
    let array_pos = this.world.get_collider_array_pos(this.parent.position);
    this.last_array_pos = array_pos;
    this.world.registerCollider(this, array_pos);
  }
  remove() {
    let array_pos = this.world.get_collider_array_pos(this.parent.position);
    this.world.unregisterCollider(this, array_pos);
    super.remove();
  }
}
// Todo:
// Add more collision shapes
// In future projects, having a collision management object makes more sense than defining collision handling in each object
class pos_hash_2d extends static_pos_hash_2d {
  __process() {
    let array_pos = this.world.get_collider_array_pos(this.parent.position);
    // check if moved
    
    if (!this.last_array_pos.equals(array_pos)) {
      this.world.unregisterCollider(this, this.last_array_pos);
      this.world.registerCollider(this, array_pos);
      this.last_array_pos = array_pos;
    }
  }
  remove() {
    this.world.unregisterCollider(this, this.last_array_pos);
    super.remove()
  }
}

class bullet extends entity_2d {
  constructor(parent, position, direction, particle_effect, speed=2) {
    super(parent, position, direction);
    this.particle = particle_effect;
    this.speed = speed;
    this.emit = new emitter(this, particle_effect, p5.Vector.fromAngle(this.direction, 0.5), 0.5, 60, 30, 2, 1, 5);
    this.collision = new collision_2d(this, vec_array([-5,-5, 5,0, -5,5]));
    this.pos_hash = new pos_hash_2d(this);
  }
  __process() {
    // do collisions
    this.world.forNearby(this.world.get_collider_array_pos(this.position), function(ent){
      let ent_coll = ent.parent.hasInstance(collision_2d);
      if (ent_coll && ent_coll != this.collision) {
        let coll = this.collision.check(ent_coll)
        if (coll) {
          if (ent.parent instanceof tank) {
            ent.parent.blow_up();
            if (ent.parent instanceof enemy && ent.parent.alive == true) {
              this.world.score++;
              if (this.world.score >= 5) {
                this.world.state = WON;
              }
            }
            this.blow_up();
          }
          else if (ent.parent instanceof bullet){
            ent.parent.blow_up();
            this.blow_up();
          }
          else {
            this.blow_up();
          }
        }
      }
    }, 1, this);

    // Force within bounds of level
    let edge = new plane_2d(createVector(0,0), createVector(1,0));
    if (this.collision.shape.crosses_plane(edge) <= 0) {
      this.blow_up();
    }
    edge.normal = createVector(0,1);
    if (this.collision.shape.crosses_plane(edge) <= 0) {
      this.blow_up();
    }
    edge.origin.x = this.world.level_width;
    edge.normal = createVector(-1,0);
    if (this.collision.shape.crosses_plane(edge) <= 0) {
      this.blow_up();
    }
    edge.origin.y = this.world.level_height;
    edge.normal = createVector(0,-1);
    if (this.collision.shape.crosses_plane(edge) <= 0) {
      this.blow_up();
    }
    this.position.add(p5.Vector.fromAngle(this.direction, this.speed));
  }
  blow_up() {
    //(parent, particle, vel, vel_dev, life_max, life_min, emit_max, emit_min, emit_delta, oneshot=false, offset=createVector(0,0))
    new emitter(this.world, this.particle, createVector(0,0), 3, 15, 5, 15, 2, 1, 120, this.position.copy());
    this.remove();
  }
  __draw() {
    translate(this.position);
    rotate(this.direction);
    stroke('black');
    fill('white');
    strokeWeight(1);
    triangle(-5,-5, 5,0, -5,5);
    rotate(-this.direction);
    translate(this.position.copy().mult(-1));
  }
}

class tank_physics extends node {
  constructor(parent) {
    super(parent);
    this.pos_hash = this.parent.hasInstance(pos_hash_2d);
    this.collision = this.parent.hasInstance(collision_2d);
    //print(this.pos_hash);
    console.assert(parent instanceof entity_2d, "Parent of tank_physics must be entity_2d");
    console.assert(this.pos_hash, "Parent of tank_physics needs a pos_hash_2d!");
    console.assert(this.collision, "Parent of tank_physics needs a collision_2d!");
    this.velocity = 0;
    this.rot_vel = 0;
    this.top_rot_speed = TWO_PI/180;
    this.top_speed = 1;
    this.accel = 0.05;
    this.rot_accel = PI/360;
    this.input_forward = 0;
    this.input_turn    = 0;
    this.shoot = false;
    this.cooldown = 0;
  }
  __process() {
    // Process inputs
    this.velocity = towards_number(this.velocity, this.top_speed*this.input_forward,  this.accel);
    this.rot_vel  = towards_number(this.rot_vel,  this.top_rot_speed*this.input_turn, this.rot_accel);
    
    if (this.shoot && this.cooldown == 0) {
      this.cooldown = 60;
      new bullet(this.world, this.parent.position.copy().add(p5.Vector.fromAngle(this.parent.direction,20)), this.parent.direction, this.parent.particle);
    }
    if (this.cooldown > 0) {      
      this.cooldown--;
    }
    this.shoot = false;
    // process velocity
    this.parent.direction  += this.rot_vel;
    this.parent.position.x += this.velocity*cos(this.parent.direction);
    this.parent.position.y += this.velocity*sin(this.parent.direction);
    

    /*
      Loops is to ensure processing stops when no collisions exist. The issue without the loop is that
      some collision corrections could push you into other collisions. The 1.1 multipliers are too
      give a little bit of overshoot to ensure that a collision correction isn't actually enough to
      correct the collision. MAX_COLLISION_LOOPS is an extra safety measure for a rare case where
      we get stuck regardless.
    */
    let collided = true;
    for (let count = 0; collided && count < MAX_COLLISION_LOOPS && this.parent.alive; count++)
    {
      collided = false;
    
      // do collisions
      this.world.forNearby(this.world.get_collider_array_pos(this.parent.position), function(ent){
        let ent_coll = ent.parent.hasInstance(collision_2d);
        if (ent.parent instanceof wall || ent.parent instanceof tank){
          if (ent_coll && ent_coll != this.collision) {
            let coll = this.collision.check(ent_coll)
            if (coll) {
              if (coll.shape==this.collision.shape) {
                collided = true;
                this.parent.position.add(coll.plane.normal.copy().mult(1.1).mult(coll.plane.dist(coll.point)));
              }
              else {
                collided = true;
                this.parent.position.sub(coll.plane.normal.copy().mult(1.1).mult(coll.plane.dist(coll.point)));
              }
              this.velocity *= 0.90;
            }
          }
        }
      }, 1, this);
      
      // Force within bounds of level
      let edge = new plane_2d(createVector(0,0), createVector(1,0));
      if (this.collision.shape.crosses_plane(edge) <= 0) {
        let vec = this.collision.shape.get_min_point(edge)
        collided = true;
        this.parent.position.add(edge.normal.copy().mult(-1.1).mult(edge.dist(vec)));
        this.velocity *= 0.90;
      }
      edge.normal = createVector(0,1);
      if (this.collision.shape.crosses_plane(edge) <= 0) {
        let vec = this.collision.shape.get_min_point(edge)
        collided = true;
        this.parent.position.add(edge.normal.copy().mult(-1.1).mult(edge.dist(vec)));
        this.velocity *= 0.90;
      }
      edge.origin.x = this.world.level_width;
      edge.normal = createVector(-1,0);
      if (this.collision.shape.crosses_plane(edge) <= 0) {
        let vec = this.collision.shape.get_min_point(edge)
        collided = true;
        this.parent.position.add(edge.normal.copy().mult(-1.1).mult(edge.dist(vec)));
        this.velocity *= 0.90;
      }
      edge.origin.y = this.world.level_height;
      edge.normal = createVector(0,-1);
      if (this.collision.shape.crosses_plane(edge) <= 0) {
        let vec = this.collision.shape.get_min_point(edge)
        collided = true;
        this.parent.position.add(edge.normal.copy().mult(-1.1).mult(edge.dist(vec)));
        this.velocity *= 0.90;
      }
      this.collision.__process();
    }
  }
}

class player_controller extends node {
  constructor(parent) {
    super(parent);
    this.physics = this.parent.hasInstance(tank_physics)
    console.assert(this.physics, "Parent node needs tank_physics");
  }
  __process() {
    if (DIR_INPUT[1] > 0) {
      this.physics.input_forward = 1;
    }
    else if (DIR_INPUT[1] < 0) {
      this.physics.input_forward = -1;
    }
    else {
      this.physics.input_forward = 0;
    }
    if (DIR_INPUT[0] < 0) {
      this.physics.input_turn = -1;
    }
    else if (DIR_INPUT[0] > 0) {
      this.physics.input_turn = 1;
    }
    else {
      this.physics.input_turn = 0;
    }
    if (SPACE_WAS_PRESSED) {
      SPACE_WAS_PRESSED = false;
      this.physics.shoot = true;
    }
  }
  remove() {
    this.parent.physics.input_forward = 0;
    this.parent.physics.input_turn    = 0;
    this.parent.physics.shoot         = false;
    this.world.state = LOST;
    super.remove();
  }
}

class enemy_controller extends node {
  constructor(parent) {
    super(parent);
    console.assert(this.parent instanceof tank, "Attached physics controller to non-physics node");
    this.state = this.fire_at_player;
    this.current_worry = null;
  }
  __process() {
    // this.state.execute()
    // the following line accomplishes the same thing as above but with less fuss. There's no point
    // in using inheritance if there is no data stored in the class or checks for type. While the
    // inheritance model does look cleaner than a switch, so does calling a function reference.
    if (!this.world.player.alive) {
      this.remove();
      return;
    }
    this.state();
    
    // check if there's a dangerous missile in range
    this.world.forNearby(this.world.get_collider_array_pos(this.parent.position), function(ent){
      if (ent.parent instanceof bullet &&
          this.bullet_dangerous(ent.parent) &&
          (ent.parent.position.copy().sub(this.parent.position).magSq() < 10000)) {
        this.state = this.avoid_missile;
        this.current_worry = ent.parent;
      }
    }, 3, this);

    if (this.state != this.fire_at_player) {
      return; // break if anything higher priority is happening
    }
    
    // if player is within 150 distance units
    this.current_worry = this.world.player;
    if (this.world.player.position.copy().sub(this.parent.position).magSq() < 10000) {
      this.state = this.give_chase;
    }
    else {
      this.current_worry = this.world.player;
      this.state = this.fire_at_player;
    }
    
  }
  
  avoid_missile() {
    let m_dir = p5.Vector.fromAngle(this.current_worry.direction);
    let m_pos = this.current_worry.position.copy();
    let t_dir = p5.Vector.fromAngle(this.parent.direction);
    let t_pos = this.parent.position.copy();
    
    let facing_missile = -p5.Vector.dot(m_dir, t_dir);
    let left_of_path   = p5.Vector.dot(m_dir.copy().rotate(-HALF_PI), t_pos.copy().sub(m_pos));
    let facing_path    = -p5.Vector.dot(m_dir.copy().rotate(-HALF_PI), t_dir)*(2*(left_of_path < 0)-1);
    if (facing_missile < -0.71) {
      this.parent.physics.input_forward = 1;
    }
    else if (facing_missile > 0.71) {
      this.parent.physics.input_forward = -1;
    }
    else if (facing_path > 0) {
      this.parent.physics.input_forward = 1;
    }
    else {
      this.parent.physics.input_forward = -1;
    }
    if (facing_missile > 0) {
      this.parent.physics.input_turn = 1;
    }
    else {
      this.parent.physics.input_turn = -1;
    }
  
    // if it no longer exists or is no longer dangerous
    if (!this.current_worry.collision || !this.bullet_dangerous(this.current_worry)) {
      this.current_worry = this.world.player;
      this.state = this.fire_at_player;
      this.parent.physics.input_forward = 0;
      this.parent.physics.input_turn    = 0;
    }
  }
  give_chase() {
    if (this.can_see_player()) {
      let p_pos = this.current_worry.position.copy();
      let t_pos = this.parent.position.copy();
      let p_dir = p5.Vector.fromAngle(this.current_worry.direction);
      let t_dir = p5.Vector.fromAngle(this.parent.direction);
      let forward_dist = p5.Vector.dot(p_pos.copy().sub(t_pos),t_dir);
      let angle = p_pos.copy().sub(t_pos).angleBetween(t_dir);

      if (forward_dist > 0 && p5.Vector.sub(p_pos, t_pos).magSq() > 600) {
        this.parent.physics.input_forward = 1;
      }
      else {
        this.parent.physics.input_forward = 0; 
      }
      if (angle > 0) {
        this.parent.physics.input_turn = -1;
      }
      else {
        this.parent.physics.input_turn =  1;
      }
      if (abs(angle) < 0.2) {
        this.parent.physics.shoot = true;
      }
    }
    else {
      this.parent.physics.input_forward = 0;
      this.parent.physics.input_turn    = 0;
    }
    
  }
  fire_at_player() {
    if (this.current_worry === null) {
      return;
    }
    let t_pos = this.parent.position.copy();
    let p_dir = p5.Vector.fromAngle(this.world.player.direction);
    let t_dir = p5.Vector.fromAngle(this.parent.direction);
    let p_pos = this.world.player.position.copy();
    let angle = p_pos.copy().sub(t_pos).angleBetween(t_dir);
    if (this.can_see_player()) {
      if (angle > 0) {
        this.parent.physics.input_turn = -1;
      }
      else {
        this.parent.physics.input_turn =  1;
      }
      if (abs(angle) < 0.2) {
        this.parent.physics.shoot = true;
      }
    }
    else {
      this.parent.physics.input_forward = 0;
      this.parent.physics.input_turn    = 0;
    }

  }
can_see_player() {
  let t_pos = this.parent.position.copy();
  let p_dir = p5.Vector.fromAngle(this.world.player.direction);
  let t_dir = p5.Vector.fromAngle(this.parent.direction);
  let p_pos = this.world.player.position.copy();
  let in_front = new plane_2d(t_pos.copy(),p_pos.copy().sub(t_pos));
  let in_front_player = new plane_2d(p_pos.copy(),t_pos.copy().sub(p_pos));
  let sight_line = new plane_2d(t_pos.copy(),p_pos.copy().sub(t_pos).rotate(HALF_PI));
  let can_see = true;

  this.world.forLine(this.world.get_collider_array_pos(t_pos),
                     this.world.get_collider_array_pos(p_pos),
    function(ent){
      let ent_coll = ent.parent.hasInstance(collision_2d);  
      if (ent_coll &&
          ent_coll.parent instanceof wall && 
          in_front.dist(ent_coll.parent.position) > 0 &&
          in_front_player.dist(ent_coll.parent.position) > 0 &&
          ent_coll.shape.crosses_plane(sight_line) == 0) {
        can_see = false;
      }
    }, 1, this);
  return can_see;
  }
  bullet_dangerous(bull) {
    // If in direction bullet travels in
    let m_dir = p5.Vector.fromAngle(bull.direction)
    if (p5.Vector.dot(m_dir, p5.Vector.sub(this.parent.position, bull.position)) > 0) {
      //if in bullets path
      if (abs(m_dir.rotate(HALF_PI).dot(p5.Vector.sub(this.parent.position, bull.position))) < 50) {
        return true;
      }
    }
    return false;
  }
  remove() {
    this.parent.physics.input_forward = 0;
    this.parent.physics.input_turn    = 0;
    this.parent.physics.shoot         = false;
    super.remove();
  }
  
}
/*
  These are classes specific to the current game
  // image locations
const PLAYER               = [0,0];
const ENEMY                = [0,1];
const DEAD                 = [0,2];
const WALL_CORNER_CONVEX   = [2,1];
const WALL_CORNER_CONCAVE  = [1,1];
const WALL_SIDE_HORIZONTAL = [1,0];
const WALL_SIDE_VERTICAL   = [2,0];
const EMPTY                = [1,2];
*/

class wall extends entity_2d { 
  constructor(parent, posistion, direction, neighbors) {
    super(parent, posistion, direction, neighbors);
    let points =  []
    this.pos_hash = new static_pos_hash_2d(this, this.position);
    this.sprite = [];
    let masks = [
      (1<<2)*!!(neighbors & 0b0000000010)+(1<<1)*!!(neighbors & 0b0000000001)+!!(neighbors & 0b0000001000),
      (1<<2)*!!(neighbors & 0b0000000010)+(1<<1)*!!(neighbors & 0b0000000100)+!!(neighbors & 0b0000100000), 
      (1<<2)*!!(neighbors & 0b0010000000)+(1<<1)*!!(neighbors & 0b0001000000)+!!(neighbors & 0b0000001000), 
      (1<<2)*!!(neighbors & 0b0010000000)+(1<<1)*!!(neighbors & 0b0100000000)+!!(neighbors & 0b0000100000), 
      ];
    for (let i = 0; i < 4; i++) {
      switch(masks[i]) {
        case 0b0111:
          this.sprite.push(EMPTY);
          break;
        case 0b0110:
          this.sprite.push(WALL_SIDE_VERTICAL);
          break;
        case 0b0101:
          this.sprite.push(WALL_CORNER_CONCAVE);
          break;
        case 0b0100:
          this.sprite.push(WALL_SIDE_VERTICAL);
          break;
        case 0b0011:
          this.sprite.push(WALL_SIDE_HORIZONTAL);
          break;
        case 0b0010:
          this.sprite.push(WALL_CORNER_CONVEX);
          break;
        case 0b0001:
          this.sprite.push(WALL_SIDE_HORIZONTAL);
          break;
        case 0b0000:
          this.sprite.push(WALL_CORNER_CONVEX);
          break; 
      }
    }
    // same as above but the order needs to change to construct the hitbox properly (z-order to clockwise)
    for (let i of [0,1,3,2]) {
      let offsetx = !!(i&0b01)*2 - 1;
      let offsety = !!(i&0b10)*2 - 1;
      switch(masks[i]) {
        case 0b0111:
          points.push(offsetx*10);
          points.push(offsety*10);
          break;
        case 0b0110:
          points.push(offsetx*8);
          points.push(offsety*10);
          break;
        case 0b0101:
          points.push(offsetx*10);
          points.push(offsety*10);
          break;
        case 0b0100:
          points.push(offsetx*8);
          points.push(offsety*10);
          break;
        case 0b0011:
          points.push(offsetx*10);
          points.push(offsety*8);
          break;
        case 0b0010:
          points.push(offsetx*10);
          points.push(offsety*10);
          break;
        case 0b0001:
          points.push(offsetx*10);
          points.push(offsety*8);
          break;
        case 0b0000:
          switch(i){
            case 0:
              points.push(-8);
              points.push(-7);
              points.push(-7);
              points.push(-8);
              break;
            case 1:
              points.push( 7);
              points.push(-8);
              points.push( 8);
              points.push(-7);
              break;
            case 3:
              points.push(8);
              points.push(7);
              points.push(7);
              points.push(8);
              break;
            case 2:
              points.push(-7);
              points.push( 8);
              points.push(-8);
              points.push( 7);
              break;
          }
          break; 
      }
    }
    this.collision = new collision_2d(this, vec_array(points));


  }
  __draw() {
    for (let i = 0; i < 4; i++) {
      this.world.sprites.draw_tile_quad(this.sprite[i], i, this.position, 0);
      //this.world.sprites.draw_tile_quad([2,1], i, this.position, 0);
    }
    
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
    let frame_c = frameCount;
    let size = lerp(20, 0, (frame_c - (this.frame+60))/60);
    if (size > 0)
    {
      translate(this.position.x, this.position.y);
      rotate((frame_c)/10);
      rect(-size/2, -size/2, size, size);
      rotate(QUARTER_PI);
      rotate(-(frame_c)/5);
      rect(-size/2, -size/2, size, size);
      rotate(QUARTER_PI+((frame_c)/10));
      
      fill('orange')
      rotate((frame_c)/10);
      rect(-size/4, -size/4, size/2, size/2);
      rotate(QUARTER_PI);
      rotate(-(frame_c)/5);
      rect(-size/4, -size/4, size/2, size/2);
      rotate(-3*QUARTER_PI+((frame_c)/10));
      translate(-this.position.x, -this.position.y);
    }
  }
}

class tank extends entity_2d {
  constructor(parent, posistion, direction) {
    super(parent, posistion, direction);
    this.collision = new collision_2d(this, vec_array([-10,-10, 6,-10, 6,10, -10,10]));
    this.pos_hash = new pos_hash_2d(this);
    this.physics = new tank_physics(this);
    this.alive = true;
  }
  blow_up() {
    this.alive = false;
    this.controller.remove();
  }
}

class player extends tank {
  constructor(parent, posistion, direction) {
    super(parent, posistion, direction);
    this.controller = new player_controller(this);
    this.particle = bullet_trail_blue;
  }
  __draw() {
    if (this.alive) {
      this.world.sprites.draw_sprite(PLAYER, this.position, this.direction);
    }
    else {
      this.world.sprites.draw_sprite(DEAD, this.position, this.direction);
    }
  }
}

class enemy extends tank {
  constructor(parent, posistion, direction) {
    super(parent, posistion, direction);
    this.controller = new enemy_controller(this);
    this.particle = bullet_trail_red;
  }
  __draw() {
    if (this.alive) {
      this.world.sprites.draw_sprite(ENEMY, this.position, this.direction);
    }
    else {
      this.world.sprites.draw_sprite(DEAD, this.position, this.direction);
    }
  }
}


/*
  This part is for making sprites
*/

class spriteSheet {
  constructor(canvas) {
    canvas.clear();
    
    // Blocks
    // Four corners - outer
    noFill();
    stroke(0,255,0, 32)
    translate(30,30);
    for (let i = 6; i > 0; i--) {
      strokeWeight(i)
      rect(-21,-21,14,14,4);
      rect(7,-21,14,14,4);
      rect(7,7,14,14,4);
      rect(-21,7,14,14,4);
    }
    fill('black');
    erase(255,0);
    rect(-30,-30,60,20);
    rect(-30,-30,20,60);
    rect(-30,10,60,20);
    rect(10,-30,20,60);
    noErase();
    noFill();
    
    // sides - lr
    translate(-20,-20);
    for (let i = 6; i > 0; i--) {
      strokeWeight(i)
      rect(-7,-7,14+40,14,4);
    }
    fill('black');
    erase(255,0);
    rect(-10,-10,20,20);
    rect(30,-10,20,20);
    noErase();
    noFill();
    // sides - ud
    translate(40,-20);
     for (let i = 6; i > 0; i--) {
      strokeWeight(i)
      rect(-7,-7,14,14+40,4);
    }
    fill('black');
    erase(255,0);
    rect(-10,-10,20,20);
    rect(-10,30,20,20);
    noErase();
    noFill();
    translate(0,40);
    noFill();
    stroke(0,255,0, 32)
    for (let i = 6; i > 0; i--) {
      strokeWeight(i)
      rect(-7,-7,14,14,4);
    }


    
    
    // player
    resetMatrix();
    translate(10,10);
    
    noStroke();
    fill(96,64,255);
    rect( -8, -5, 12, 10);
    
    fill(128,128,255);
    rect(-10,-10, 16,  4);
    rect(-10,  6, 16,  4);
    stroke('black');
    strokeWeight(1);
    fill(64,64,255);
    rect(-2, -2, 10, 4);

    // Enemy
    translate(0,20);
    
    noStroke();
    fill(255,64,96);
    rect( -8, -5, 12, 10);
    
    fill(255,128,128);
    rect(-10,-10, 16,  4);
    rect(-10,  6, 16,  4);
    stroke('black');
    strokeWeight(1);
    fill(255,64,64);
    rect(-2, -2, 10, 4);
    
    // dead
    translate(0,20);
    
    noStroke();
    fill('grey');
    rect( -8, -5, 12, 10);
    
    fill('lightGrey');
    rect(-10,-10, 16,  4);
    rect(-10,  6, 16,  4);
    stroke('black');
    strokeWeight(1);
    fill('darkGrey');
    rect(-2, -2, 10, 4);

    resetMatrix();
    this.subpixel_scale = pixelDensity();
    this.sprites = createImage(400*this.subpixel_scale,400*this.subpixel_scale);
    this.sprites.copy(canvas,0,0,400,400,0,0, 400*this.subpixel_scale, 400*this.subpixel_scale);
  }
  draw_sprite(index, position, rotation = 0) {
    translate(position);
    rotate(rotation);
    image(this.sprites, -10, -10, 20, 20,
          index[0]*20*this.subpixel_scale, index[1]*20*this.subpixel_scale, 20*this.subpixel_scale, 20*this.subpixel_scale);
    rotate(-rotation);
    translate(position.copy().mult(-1));
  }
  draw_tile_quad(index, quad, position, rotation = 0) {
    let offset = createVector((!!(quad & 0b001))*10, (!!(quad & 0b010))*10);
    translate(position);
    rotate(rotation);
    image(this.sprites, -10+offset.x, -10+offset.y, 10, 10,
          (index[0]*20+offset.x)*this.subpixel_scale, (index[1]*20+offset.y)*this.subpixel_scale, 10*this.subpixel_scale, 10*this.subpixel_scale);
    rotate(-rotation);
    translate(position.copy().mult(-1));
  }
}

/*
  Parts for drawing game screens
*/

function draw_menu(world) {
  textAlign(LEFT);
  textSize(12);
  noStroke();
  fill('white');
  text("\
You are a tank.\n\
Move with wasd or arrowkeys.\n\
Shoot with space and avoid missiles\n\n\
Kill all enemy tanks to win\n\n\n\
DEBUG:\n\
Press H to view hitboxes\n\
Press M to view the position hash array\n\n\n\
Click anywhere to start.\n\n\n\
Have fun!\
", 20,50);
  world.sprites.draw_sprite(PLAYER, createVector(320, 60));
  world.sprites.draw_sprite(ENEMY, createVector(320, 120));
  //world.sprites.draw_sprite(OBSTACLE, createVector(320, 150));

}

/*
  This is the part that loads the world and starts the game.
*/

var gameWorld;
var half_width;
var half_height;
function setup() {
  gameWorld = new world();
  gameWorld.map = [
    "##                ##",
    "#                  #",
    "                    ",
    "     #       #      ",
    "  e  #       # e    ",
    "     #       #      ",
    "   #####   #####    ",
    "                    ",
    "        @           ",
    "                    ",
    "                    ",
    "                    ",
    "    #          #    ",
    "    ############    ",
    "  e      ##         ",
    "         ##         ",
    "                    ",
    "        e       e   ",
    "#                  #",
    "##                ##",
  ];
  // level dimensions
  gameWorld.level_width   = gameWorld.map[0].length*20;
  gameWorld.level_height  = gameWorld.map.length*20;
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
  /*for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      switch(gameWorld.map[row][col]) {
        case '.':
          new border(gameWorld, createVector(col*20 + 10, row*20 + 10), createVector(0,0));
          break
      }
    }
  }
  */
  
  // floor layer (layer 1)
  for (let row = 0; row < gameWorld.map.length; row++) {
    for (let col = 0; col < gameWorld.map[0].length; col++) {
      let neighbors = 0;
      switch(gameWorld.map[row][col]) {
        case 'O':
          neighbors = (2<<8)-1;
          for (let subrow = max(row-1, 0); subrow < min(row+2, gameWorld.map.length); subrow++) {
            for (let subcol = max(col-1,0); subcol < min(col+2,gameWorld.map[0].length); subcol++) {
              
              if (gameWorld.map[subrow][subcol] !== '#' && gameWorld.map[subrow][subcol] !== 'O') {
                print((3*(subrow-row+1)+(subcol-col+1)));
                neighbors ^= (1<<(3*(subrow-row+1)+(subcol-col+1)));
              }
            }
          }
          print(neighbors);
          new wall(gameWorld, createVector(col*20 + 10, row*20 + 10), 0, neighbors);
          break;
        case '#':
          neighbors = (2<<8)-1;
          for (let subrow = max(row-1, 0); subrow < min(row+2, gameWorld.map.length); subrow++) {
            for (let subcol = max(col-1,0); subcol < min(col+2,gameWorld.map[0].length); subcol++) {
              
              if (gameWorld.map[subrow][subcol] !== '#' && gameWorld.map[subrow][subcol] !== 'O') {
                //print((3*(subrow-row+1)+(subcol-col+1)));
                neighbors ^= (1<<(3*(subrow-row+1)+(subcol-col+1)));
              }
            }
          }
          //print(neighbors);
          new wall(gameWorld, createVector(col*20 + 10, row*20 + 10), 0, neighbors);
          break;
      }
    }
  }
  
  // foreground layer (layer 2)
  for (let row = 0; row < gameWorld.map.length; row++) {
    for (let col = 0; col < gameWorld.map[0].length; col++) {
      switch(gameWorld.map[row][col]) {
        case '@':
          gameWorld.player = new player(gameWorld, createVector(col*20 + 10, row*20 + 10), QUARTER_PI);
          break
        case 'e':
          let ent = new enemy(gameWorld, createVector(col*20 + 10, row*20 + 10), random(0, TWO_PI));
          break
      }
    }
  }
  gameWorld.canvas = createCanvas(400, 400);
  half_width    = width/2;
  half_height   = height/2;
  gameWorld.sprites = new spriteSheet(gameWorld.canvas);
  if (PAUSE_FOR_SPRITESHEET) {
    gameWorld.state = SPRITES;
  }
  else {
    gameWorld.state = MENU;
  }
  gameWorld.endFrame = 0;
  gameWorld.gravity = 0.1;
}

function draw() {

  if (gameWorld.state != SPRITES) {
    background(32);
  }
  switch(gameWorld.state) {
    case SPRITES:
      if (MOUSE_WAS_PRESSED) {
        gameWorld.state = MENU;
        MOUSE_WAS_PRESSED = false;
      }
      break;
    case MENU: // main menu
      draw_menu(gameWorld);
      if (MOUSE_WAS_PRESSED) {
        MOUSE_WAS_PRESSED = false;
        SPACE_WAS_PRESSED = false;
        gameWorld.state = RUNNING;
      }
      break;
    case RUNNING: // game running
    case LOST: //game over
    case WON: // game won
      for (let i = 0; i < 300; i++) {
        fill('white');
        noStroke();
      } 
      gameWorld.process();
      translate(-max(0, min(gameWorld.player.position.x-half_width, gameWorld.level_width-width)),
                -max(0, min(gameWorld.player.position.y-half_height, gameWorld.level_height-height)));
      gameWorld.draw();
      resetMatrix();
      strokeWeight(2);
      textAlign(LEFT);
      textSize(11);
      stroke('black');
      fill('white');
      //text("Score: " + gameWorld.score.toString() + "/20", 5,395);
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
