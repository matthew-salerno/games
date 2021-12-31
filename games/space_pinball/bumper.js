class bumper extends entity_2d {
	constructor(parent, position, direction, shape, fill_c, stroke_c) {
		super(parent, position, direction);
		this.shape = shape;
		this.shape.position = this.position;
		this.shape.direction = this.direction;
		this.fill_c = fill_c;
		this.stroke_c = stroke_c;
	}
	__draw() {
		strokeWeight(2);
		stroke(this.stroke_c);
		fill(this.fill_c);
		this.shape.draw();
	}
}