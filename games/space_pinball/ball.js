class ball extends entity_2d {
	constructor(parent, position, direction) {
		super(parent, position, direction);
		this.spawn = position.copy();
		this.velocity = createVector(0,0);
		this.friction = 0.99;
		this.bounce = 0.90;
	}
	__process() {
		this.position.add(this.velocity);
		for (let wall of this.world.walls.collisions) {
			if (wall.intersect_circle(this.position, 10)) {
				let pln = wall.get_closest_plane(this.position.copy().sub(this.velocity),10);
				if (pln === null) {
					continue;
				}
				this.position.add(pln.normal.copy().mult(abs(pln.dist(this.position)-10)));
				this.velocity.reflect(pln.normal);
				this.velocity.mult(this.bounce);
			}
		}
		for (let paddle of this.world.paddles) {
			if (paddle.shape.intersect_circle(this.position, 10)) {
				let pln = paddle.shape.get_closest_plane(this.position.copy().sub(this.velocity),10);
				if (pln === null) {
					continue;
				}
				this.position.add(pln.normal.copy().mult(abs(pln.dist(this.position)-10)));
				this.velocity.reflect(pln.normal);
				this.velocity.mult(this.bounce);
			}
		}
		for (let bumper of this.world.bumpers) {
			if (bumper.shape.intersect_circle(this.position, 10)) {
				let pln = bumper.shape.get_closest_plane(this.position.copy().sub(this.velocity),10);
				if (pln === null) {
					continue;
				}
				SOUND_BALL.play();
				this.position.add(pln.normal.copy().mult(abs(pln.dist(this.position)-10)));
				this.velocity.reflect(pln.normal);
				this.velocity.add(this.velocity.copy().normalize().mult(5));
				this.world.score+=5;
			}
		}
		this.velocity.mult(this.friction);
	}
	__draw() {
		translate(this.position.x, this.position.y);
		image(BALL_IMG, -10, -10, 20, 20);
		translate(-this.position.x, -this.position.y);
	}
}