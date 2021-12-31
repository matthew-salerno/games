class paddle extends entity_2d {
	constructor(parent, position, direction, clockwise, key) {
		super(parent, position, direction);
		this.downAngleVec = p5.Vector.fromAngle(direction);
		this.upAngleVec = p5.Vector.fromAngle(direction-PI/3*(1-2*clockwise));
		this.clockwise=clockwise;
		this.shape = new convex_shape(zip_array_to_vecs([
			-15, -15,
			40, -7,
			75, -7,
			75, 7,
			40, 7,
			-15, 15
		]), this.position, this.direction, 2);
		this.state=false; //down
		this.key = key;
	}
	__process() {
		if (keyIsDown(this.key) && this.state==false) {
			if (!SOUND_PADDLE_UP.played) {
				SOUND_PADDLE_UP.played = true;
				SOUND_PADDLE_UP.play();
			}
			this.direction = this.upAngleVec.heading();
			let ball_rel = this.world.ball.position.copy().sub(this.position);
			let upNorm = this.upAngleVec.copy().normalize().rotate(HALF_PI*(2*this.clockwise-1));
			let downNorm = this.downAngleVec.copy().normalize().rotate(HALF_PI*(2*this.clockwise-1));
			let ball_dist = this.position.dist(this.world.ball.position);
			if (ball_dist < 75 && (ball_rel.dot(upNorm) != ball_rel.dot(downNorm)) && ball_rel.dot(this.upAngleVec) > 0) {
				this.world.ball.velocity.reflect(ball_rel.copy().normalize().rotate(HALF_PI*(2*this.clockwise-1)));
				this.world.ball.velocity.add(ball_rel.copy().normalize().rotate(HALF_PI*(2*this.clockwise-1)).mult((ball_dist**2)/300));
				this.world.ball.position = this.upAngleVec.copy().mult(ball_dist).add(this.position).add(upNorm.copy().mult(10));
			}
			this.state = true;
		}
		else if (!keyIsDown(this.key) && this.state==true) {
			this.direction = this.downAngleVec.heading();
			this.state = false;
			if (!SOUND_PADDLE_DOWN.played) {
				SOUND_PADDLE_DOWN.played = true;
				SOUND_PADDLE_DOWN.play();
			}
		}
		this.shape.rotation=this.direction;
	}
	__draw() {
		strokeWeight(2);
		stroke(160,120,190);
		fill(170,130,200);
		circle(this.position.x, this.position.y, 20);
		this.shape.draw();
	}
}