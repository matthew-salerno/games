class black_hole_walls extends entity_2d {
	constructor(parent, position, direction) {
		super(parent, position, direction);
		colorMode(RGB);
		this.color = color(85);
		this.collisions = [];
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			700, 500,
			720, 500,
			600, 600,
			580, 600
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			280, 500,
			300, 500,
			420, 600,
			400, 600
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			720, 500,
			700, 500,
			580, 400,
			600, 400
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			300, 500,
			280, 500,
			400, 400,
			420, 400
		]),createVector(0,0), 0, 0));
	}
	__draw() {
		for (let coll of this.collisions) {
			
			noStroke();
			
			if (DRAW_HITBOX) {
				strokeWeight(2);
				noFill();
				stroke('red');
				for (normal of coll.normals) {
					circle(normal.origin.x, normal.origin.y, 10);
					line(normal.origin.x, normal.origin.y, normal.origin.x+normal.normal.x*20, normal.origin.y+normal.normal.y*20);
				}
			}
			fill(this.color);
			coll.draw();
		}
	}
}

class bh_particle extends particle_2d {
	constructor(parent, position, velocity, life) {
		super(parent, position, velocity, life);
	}
	__process() {
		super.__process();
		this.velocity.add(this.position.copy().sub(createVector(500,500)).normalize().mult(-0.1)).add(createVector(random(-0.01,0.01),random(-0.01,0.01)));
		this.velocity.mult(0.99);
	}
	__draw() {
		noStroke();
		fill(192, 128, 128, 128);
		circle(this.position.x, this.position.y, 10);
	}
}

class bh_horizon extends particle_2d {
	constructor(parent, position, velocity, life) {
		super(parent, position, velocity, life);
		this.position = createVector(500,500).add(this.velocity).add(this.velocity.copy().normalize().mult(50));
		this.velocity=createVector(0,0);
	}
	__process() {
		super.__process();
		this.velocity.add(this.position.copy().sub(createVector(500,500)).normalize().mult(-0.1));
	}
	__draw() {
		noStroke();
		fill(0);
		circle(this.position.x, this.position.y, 4);
	}
}

class level_2_world extends world {
	constructor() {
		super();
	}
	draw() {
		background(32, 0, 64);
		fill(48, 0, 92);
		circle(500,500,800)
		fill(64, 0, 128);
		circle(500,500,400)
		fill(92, 0, 184);
		circle(500,500,200)
		fill('white');
		noStroke();
		circle(this.ball.position.x, this.ball.position.y, 22);
		super.draw();
		fill('purple');
		noStroke();
		rect(0,0,1000,20);
		rect(0,20,20,980);
		rect(20,980,980,20);
		rect(980,20,20,960);
		textSize(40);
		textAlign(LEFT);
		stroke('white');
		text("Score:", 30,60);
		text(str(this.score),180,60);
		text("Lives:", 30,120);
		text(str(this.lives),180,120);
		if (this.lives <= 0) {
			textAlign(RIGHT);
			text("GAME OVER\n Click to continue", 970,60);
		}
		else if (this.ball_gone) {
			textAlign(RIGHT);
			text("Click to spawn ball", 970,60);
		}
		noStroke()
		fill('black');
		circle(500,500,100)
	}
	setup() {
		this.ball_gone = true;
		this.drawAbove = new Set();
		this.lives=3;
		this.score=0;
		this.walls = new black_hole_walls(this, createVector(0,0), 0);
		this.ball = new ball(this, createVector(0,100), 0);
		this.ball.position = createVector(2000,2000);
		this.ldpaddle = new paddle(this, createVector(420, 590), PI/180*330, true, KEY_A);
		this.rdpaddle = new paddle(this, createVector(580, 590), PI/180*210, false, KEY_D);
		this.lupaddle = new paddle(this, createVector(420, 410), PI/180*30, false, KEY_A);
		this.rupaddle = new paddle(this, createVector(580, 410), PI/180*150, true, KEY_D);
		this.paddles = [this.lupaddle, this.rupaddle, this.ldpaddle, this.rdpaddle];
		this.moving = true;
		this.timer = 0;
		this.emitter  = new emitter(this, bh_particle, createVector(10,0), 2, 300, 300, 2, 1, 20, false, createVector(0, 100));
		this.emitter2 = new emitter(this, bh_horizon, createVector(0,0), 10, 20, 15, 4, 1, 2, false, createVector(500, 500));
		this.bumpers = [];
		for (let i = 0; i < TWO_PI; i+=QUARTER_PI) {
			this.bumpers.push(new bumper(this, p5.Vector.fromAngle(i, 300).add(createVector(500,500)), 0,
				new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
				color(70,0,0), color(155, 26, 38)));
		}
		for (let i = QUARTER_PI/2; i < TWO_PI+QUARTER_PI/2; i+=QUARTER_PI) {
			this.bumpers.push(new bumper(this, p5.Vector.fromAngle(i, 400).add(createVector(500,500)), 0,
				new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
				color(70,0,0), color(155, 26, 38)));
		}
	}
	process() {
		if (this.lives <= 0) {
			if (MOUSE_WAS_PRESSED) {
				MOUSE_WAS_PRESSED=false;
				WORLD = W_MENU;
				this.ball.remove();
			}
			return;
		}
		super.process();
		if (!this.ball_gone) {
			if (this.ball.position.copy().sub(createVector(500,500)).magSq() < 40**2) {
				this.ball_gone = true;
				this.ball.velocity = createVector(0,0);
				this.lives--;
			}
			this.ball.velocity.add(this.ball.position.copy().sub(createVector(500,500)).normalize().mult(-0.2));
		}
		else if (MOUSE_WAS_PRESSED && this.lives > 0) {
			this.ball.position = this.ball.spawn.copy();
			this.ball.velocity = createVector(10,0);
			this.ball.position.add(p5.Vector.fromAngle(random(0,TWO_PI), 10));
			this.ball_gone = false;
		}
		MOUSE_WAS_PRESSED=false;
	}
}