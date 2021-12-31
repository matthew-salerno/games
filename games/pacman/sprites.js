/*
This part is for making sprites
*/

// image locations
const PLAYER               = [0,0];
const WALL_CORNER_CONVEX   = [2,1];
const WALL_CORNER_CONCAVE  = [1,1];
const WALL_SIDE_HORIZONTAL = [1,0];
const WALL_SIDE_VERTICAL   = [2,0];
const WALL_FULL            = [2,2];
const EMPTY                = [1,2];

// Tile sub-positions
const TOP_LEFT     = 0;
const TOP_RIGHT    = 1;
const BOTTOM_LEFT  = 2;
const BOTTOM_RIGHT = 3;

class spriteSheet {
	constructor(canvas) {
		canvas.clear();
		
		// Blocks
		// Four corners - outer
		fill(96,96,255,32);
		translate(30,30);
		noStroke();
		for (let i = 6; i > 0; i--) {
			rect(-10,-10,20,20);
		}
		erase(255,0);
		fill(255);
		noStroke();
		rect(-21,-21,14,14,4);
		rect(7,-21,14,14,4);
		rect(7,7,14,14,4);
		rect(-21,7,14,14,4);
		noErase();
		noFill();
		stroke(96,96,255,32);
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
		fill(96,96,255,32);
		// full
		translate(20,20);
		noStroke();
		for (let i = 6; i > 0; i--) {
			rect(-10,-10,20,20);
		}
		// sides - lr
		stroke(96,96,255,32);
		translate(-40,-40);
		for (let i = 6; i > 0; i--) {
			strokeWeight(i)
			rect(-7,-7,14+40,14,4);
		}
		fill('black');
		erase(255,0);
		rect(-10,-10,20,20);
		rect(30,-10,20,20);
		noErase();
		fill(96,96,255,32);
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
		fill(96,96,255,32);
		translate(0,40);
		stroke(96,96,255,32)
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