class station_walls extends entity_2d {
	constructor(parent, position, direction) {
		super(parent, position, direction);
		colorMode(RGB);
		this.color = color(85);
		this.collisions = [];
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			100, 580,
			120, 580,
			420, 880,
			420, 900,
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			900, 420,
			880, 420,
			580, 120,
			580, 100,
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			100, 420,
			420, 100,
			420, 120,
			120, 420,
		]),createVector(0,0), 0, 0));
		this.collisions.push(new convex_shape(zip_array_to_vecs([
			580, 880,
			880, 580,
			900, 580,
			580, 900,
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

class level_3_world extends world {
	constructor() {
		super();
	}
	draw() {
		background(0);
		for (let star of this.stars) {
			fill("white");
			translate(500,500);
			rotate(this.angle);
			circle(star.x, star.y, 5);
			rotate(-this.angle);
			translate(-500,-500);
		}
		fill(131, 101, 57);
		beginShape();
		vertex(100, 580);
		vertex(100, 420);
		vertex(420, 100);
		vertex(580, 100);
		vertex(900, 420);
		vertex(900, 580);
		vertex(580, 900);
		vertex(420, 900);
		endShape(CLOSE);
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

	}
	setup() {
		this.ball_gone = true;
		this.angle = 0;
		this.rotation_period = 300
		this.drawAbove = new Set();
		this.lives=3;
		this.score=0;
		this.walls = new station_walls(this, createVector(0,0), 0);
		this.ball = new ball(this, createVector(500,500), 0);
		this.ball.position = createVector(2000,2000);
		this.swpaddle = new paddle(this, createVector(420, 110), PI/180*330, true, KEY_A);
		this.sepaddle = new paddle(this, createVector(580, 110), PI/180*210, false, KEY_D);
		this.nwpaddle = new paddle(this, createVector(420, 890), PI/180*30, false, KEY_A);
		this.nepaddle = new paddle(this, createVector(580, 890), PI/180*150, true, KEY_D);

		this.wnpaddle = new paddle(this, createVector(110, 420), PI/180*120, false, KEY_A);
		this.wspaddle = new paddle(this, createVector(110, 580), PI/180*240, true, KEY_D);
		this.enpaddle = new paddle(this, createVector(890, 420), PI/180*60, true, KEY_A);
		this.espaddle = new paddle(this, createVector(890, 580), PI/180*300, false, KEY_D);
		this.paddles = [this.swpaddle, this.sepaddle, this.nwpaddle, this.nepaddle, this.wnpaddle, this.wspaddle, this.enpaddle, this.espaddle];
		this.moving = true;
		this.timer = 0;
		this.bumpers = [];
		this.stars = [];
		for (let i = 0; i < 500; i++) {
			this.stars.push(p5.Vector.fromAngle(random(0,TWO_PI), max(random(0,708),random(0,708))));
		}
		for (let i = QUARTER_PI; i < TWO_PI+QUARTER_PI; i+=HALF_PI) {
			this.bumpers.push(new bumper(this, p5.Vector.fromAngle(i, 250).add(createVector(500,500)), 0,
				new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
				color(0,0,70), color(38, 26, 155)));
			this.bumpers.push(new bumper(this, p5.Vector.fromAngle(i+PI/8, 300).add(createVector(500,500)), 0,
				new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
				color(0,0,70), color(38, 26, 155)));
			this.bumpers.push(new bumper(this, p5.Vector.fromAngle(i-PI/8, 300).add(createVector(500,500)), 0,
				new convex_shape(zip_array_to_vecs([-15, -15, 15, -15, 15, 15, -15, 15]), createVector(0,0), 0, 2),
				color(0,0,70), color(38, 26, 155)));
		}
	}
	process() {
		this.angle += TWO_PI/this.rotation_period;
		if (this.angle >= TWO_PI) {
			this.angle -= TWO_PI;
		}
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
			let cent_accel = (TWO_PI/this.rotation_period)**2*this.ball.position.dist(createVector(500,500));

			this.ball.velocity.add()
			if (this.ball.position.copy().sub(createVector(500,500)).magSq() > 500**2) {
				this.ball_gone = true;
				this.lives--;
			}
			this.ball.velocity.add(this.ball.position.copy().sub(createVector(500,500)).normalize().mult(cent_accel));
			this.ball.velocity.rotate(TWO_PI/this.rotation_period);
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