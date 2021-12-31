class ship_walls extends entity_2d {
	constructor(parent, position, direction) {
		super(parent, position, direction);
		colorMode(RGB);
		this.color = color(85);
		this.collisions = [];
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			120, 20,
			140, 20,
			140, 820,
			120, 820
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			520, 20,
			540, 20,
			540, 820,
			520, 820
		]),createVector(0,0), 0, 0));;
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			140, 100,
			140, 20,
			300, 20,
			300, 40
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			360, 20,
			520, 20,
			520, 100,
			360, 40
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			440, 280,
			520, 240,
			520, 400
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			140, 240,
			220, 280,
			140, 400
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			180, 560,
			260, 700,
			260, 720,
			240, 720,
			160, 680,
			160, 560,
		]),createVector(0,0), 0, 1));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			500, 560,
			500, 680,
			420, 720,
			400, 720,
			400, 700,
			480, 560
		]),createVector(0,0), 0, 1));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			160, 720,
			260, 760,
			260, 820,
			160, 820,
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			500, 820,
			400, 820,
			400, 760,
			500, 720
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

class engine_particle extends particle_2d {
	constructor(parent, position, velocity, life) {
		super(parent, position, velocity, life);
		this.origLife = life;
		this.position.x += random(-30, 30);
	}
	__process() {
		super.__process();
		this.velocity.x *= 0.95;
	}
	__draw() {
		noStroke();
		colorMode(HSB);
		fill(lerp(16, 0, this.life/this.origLife), 192, 255);
		circle(this.position.x, this.position.y, 5);
		colorMode(RGB);
	}
}

class ship_engine extends entity_2d{
	constructor(parent, position, direction) {
		super(parent, position, direction);
		this.color = color(85);
		this.emitter = new emitter(this, engine_particle, createVector(0,4), 2, 60, 10, 4, 1, 2, false, createVector(10, 60));
		this.shape = new convex_shape(zip_array_to_vecs([-10,0, 30, 0, 40, 60, -20, 60]), this.position.copy(), this.direction, 0);
	}
	__process() {
		this.emitter.enabled = this.world.moving;
	}
	__draw() {
		noStroke();
		fill(this.color);
		this.shape.draw();
	}
}

class level_1_world extends world {
	constructor() {
		super();

	}
	draw() {
		background("black");
		fill(57, 101, 131);
		noStroke();
		rect(120, 20, 420, 800);
		super.draw();
		fill('purple');
		noStroke();
		rect(0,0,1000,20);
		rect(0,20,20,980);
		rect(20,980,980,20);
		rect(980,20,20,960);
		textSize(40);
		textAlign(LEFT);
		stroke('white')
		text("Score:", 550,60);
		text(str(this.score),700,60);
		text("Lives:", 550,120);
		text(str(this.lives),700,120);
		if (this.lives <= 0) {
			textAlign(CENTER);
			text("GAME OVER\n Click to continue", 750,500);
		}
		else if (this.ball_gone) {
			textAlign(CENTER);
			text("Click to spawn ball", 750,500);
		}
		noStroke();
		fill(70);
		triangle(120,420, 80, 420, 120, 160);
		triangle(540,420, 580, 420, 540, 160);
		triangle(120,820, 40, 820, 120, 560);
		triangle(540,820, 620, 820, 540, 560);
		if (this.moving) {
			fill('green');
		}
		else {
			fill('red');
		}
		rect(300, 20, 60, 10);
	}
	setup() {
		this.ball_gone = true;
		this.drawAbove = new Set();
		this.lives=3;
		this.score=0;
		this.walls = new ship_walls(this, createVector(0,0), 0);
		this.ball = new ball(this, createVector(330,70), 0);
		this.ball.position = createVector(2000,2000);
		this.lpaddle = new paddle(this, createVector(250, 770), PI/180*30, false, KEY_A);
		this.rpaddle = new paddle(this, createVector(410, 770), PI/180*150, true, KEY_D);
		this.rengine = new ship_engine(this, createVector(500, 820), 0);
		this.lengine = new ship_engine(this, createVector(140, 820), 0);
		this.paddles = [this.rpaddle, this.lpaddle];
		this.moving = true;
		this.timer = 0;
		this.bumpers = [];
		this.bumpers.push(new bumper(this, createVector(330,190), 0,
			new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
			color(70,0,0), color(155, 26, 38)));
		this.bumpers.push(new bumper(this, createVector(190,210), 0,
			new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
			color(70,0,0), color(155, 26, 38)));
		this.bumpers.push(new bumper(this, createVector(230,150), 0,
			new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
			color(70,0,0), color(155, 26, 38)));
		this.bumpers.push(new bumper(this, createVector(430,150), 0,
			new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
			color(70,0,0), color(155, 26, 38)));
		this.bumpers.push(new bumper(this, createVector(470,210), 0,
			new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
			color(70,0,0), color(155, 26, 38)));
		this.bumpers.push(new bumper(this, createVector(0,0), 0,
			new convex_shape(zip_array_to_vecs([175,570, 185,570, 255,690, 255,705]), createVector(0,0), 0, 0),
			color(0,0,70), color(38, 26, 155)))
		this.bumpers.push(new bumper(this, createVector(0,0), 0,
			new convex_shape(zip_array_to_vecs([660-175,570, 660-255,705, 660-255,690, 660-185,570]), createVector(0,0), 0, 0),
			color(0,0,70), color(38, 26, 155)))
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
			if (this.moving) {
				this.ball.velocity.y += 0.1;
			}
			if (this.ball.position.y > 1020) {
				this.ball_gone = true;
				this.lives--;
			}
			if (this.ball.position.y < 10) {
				this.ball.position.y=20;
				this.ball.velocity.y*=-1;
				this.moving = false;
				this.timer = 300;
			}
			if (this.timer == 0) {
				this.moving = true;
			}
			else {
				this.timer--;
			}
		}
		else if (MOUSE_WAS_PRESSED && this.lives > 0) {
			this.ball.position = this.ball.spawn.copy();
			this.ball.position.add(p5.Vector.fromAngle(random(0,TWO_PI), 10));
			this.ball.velocity = createVector(0,0);
			this.ball_gone = false;
		}
		MOUSE_WAS_PRESSED=false;
	}
}