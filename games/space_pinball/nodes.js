// collision constants
const MAX_COLLISION_LOOPS = 16;

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
		this.chunk_size = createVector(this.world_size.x/this.collision_division.x, this.world_size.y/this.collision_division.y);
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
	
	setup() {

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

	cleanup() {
		this.remove();
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
		let pixels = line_pixels(array_pos1.x, array_pos1.y, array_pos2.x, array_pos2.y, width);
		let cells = new Set();
		// updated line algo: https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
		for (let pix of pixels) {
			noStroke();
			fill(255,0,0, 128);
			if (pix.x < 0 || pix.x >= this.collision_division.x || pix.y < 0 || pix.y >= this.collision_division.y) {
				continue;
			}
			for (let ent of this.collision_array[pix.x][pix.y]){
				cells.add(ent);
			}
		}
		cells.forEach(func, thisArg);
	}

	// returns any classes in 'classes' which obstruct view from start_pos to end_pos
	check_line_of_sight(start_pos, end_pos, collidable_classes) {
		let in_front_of_start = new plane_2d(start_pos.copy(),end_pos.copy().sub(start_pos));
		let in_front_of_end = new plane_2d(end_pos.copy(),start_pos.copy().sub(end_pos));
		let sight_line = new plane_2d(start_pos.copy(),end_pos.copy().sub(start_pos).rotate(HALF_PI));
		let can_see = new Set();
		
		this.forLine(this.get_collider_array_pos(start_pos), this.get_collider_array_pos(end_pos),function(ent){
			let ent_coll = ent.parent.hasInstance(collision_2d);
			let collidable = false;
			if (ent_coll) {
				for (let cls of collidable_classes) {
					if (ent_coll.parent instanceof cls) {
						collidable = true;
						break;
					}
				}
				if (collidable && in_front_of_start.dist(ent_coll.parent.position) > 0 && in_front_of_end.dist(ent_coll.parent.position) > 0 && ent_coll.shape.crosses_plane(sight_line) == 0) {
					can_see.add(ent.parent);
				}
			}
		}, 1, this);
		return can_see;
	}

	// similar to for nearby, but filters classes and checks radius with pixel coordinates
	// Preferable to forNearby as it returns the parent of the collision object (instead of collision object)
	// and is independent of chunk size.
	for_radius(pos, func, radius, classes, thisArg = null) {
		let size = min(this.chunk_size.x, this.chunk_size.y);
		// # Math: = \text{size}^2*2 = \text{size}^2+\text{size}^2 = \sqrt{size^2+size^2}^2
		let diagDistSq = sq(size)<<1; 
		let squareRad  = ceil(sq(radius)/diagDistSq);
		this.forNearby(this.get_collider_array_pos(pos), function(ent) {
			for (let cls of classes) {
				if (ent.parent instanceof cls) {
					func.call(thisArg, ent.parent);
					break;
				}
			}
		}, squareRad, thisArg);
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
		if (this.enabled) {// && this.position.x > 0 && this.position.y > 0 && this.position.x < this.world.level_width && this.position.y < this.world.level_height){
			if (this.counter == 0) {
				let num = round(random(this.emit_min, this.emit_max));
				
				for (let _ = 0; _ < num; _++) {
					new this.particle(this.world, this.position, this.vel.copy().add(p5.Vector.fromAngle(random(0, TWO_PI), random(0, this.vel_dev))), random(this.life_min, this.life_max));
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

class collision_2d extends node {
	constructor(parent, vertices, subdivision = 0) {
		super(parent);
		console.assert(this.parent instanceof entity_2d, "collision must be child of entity_2d!");
		this.old_dir = this.parent.direction;
		this.old_pos = this.parent.position.copy();
		this.shape = new convex_shape(vertices, this.parent.position, this.parent.direction, subdivision);
	}

	// checks for collision between this and another collision_2d object
	check(other){
		// defining collisions
		console.assert(other instanceof collision_2d, "collisions can only be checked with other collision objects!");
		return this.shape.intersect_shape(other.shape);
	}

	// runs for each collision with instance of class in 'classes'
	for_collisions(func, largest_bounding_circle=this.shape.bounding_circle, classes=[entity_2d], forwardArg=this) {
		this.world.for_radius(this.parent.position, function(ent) {
			let ent_coll = ent.hasInstance(collision_2d);
			if (ent_coll && ent_coll != this) {
				let coll = this.check(ent_coll);
				if (coll) {
					func.call(forwardArg, ent, coll); 
				}
			}
		}, largest_bounding_circle<<1, classes, this);
	}

	keep_within_level(correctionFunc=function(collided_plane, pos, closest_point){pos.add(collided_plane.normal.copy().mult(-1.1).mult(collided_plane.dist(closest_point)));}, thisArg=null) {
		// Force within bounds of level
		let collided = false;
		let edge = new plane_2d(createVector(0,0), createVector(1,0));
		if (this.shape.crosses_plane(edge) <= 0) {
			let vec = this.shape.get_min_point(edge)
			collided = true;
			correctionFunc.call(thisArg, edge, this.parent.position, vec);
		}
		edge.normal = createVector(0,1);
		if (this.shape.crosses_plane(edge) <= 0) {
			let vec = this.shape.get_min_point(edge)
			collided = true;
			correctionFunc.call(thisArg, edge, this.parent.position, vec);
		}
		edge.origin.x = this.world.level_width;
		edge.normal = createVector(-1,0);
		if (this.shape.crosses_plane(edge) <= 0) {
			let vec = this.shape.get_min_point(edge)
			collided = true;
			correctionFunc.call(thisArg, edge, this.parent.position, vec);
		}
		edge.origin.y = this.world.level_height;
		edge.normal = createVector(0,-1);
		if (this.shape.crosses_plane(edge) <= 0) {
			let vec = this.shape.get_min_point(edge)
			collided = true;
			correctionFunc.call(thisArg, edge, this.parent.position, vec);
		}
		return collided;
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
			if (this.shape.intersect_vector(createVector(mouseX, mouseY))) {
				stroke('blue');
			}
			this.shape.draw();
			this.shape.drawNormals();
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