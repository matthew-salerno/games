/*
Matthew Salerno
ECE 4525
Project 8
Pacman

Just a pacman clone. 

As a Hokie, I will conduct myself with honor and integrity at all times.
I will not lie, cheat, or steal, nor will I accept the actions of those who do.
- Matthew Salerno
*/


// movement constants
const LEFT_RIGHT = 0;
const UP_DOWN    = 1;
const KEY_W      = 87;
const KEY_A      = 65;
const KEY_S      = 83;
const KEY_D      = 68;
const KEY_H      = 72;
const KEY_M      = 77;
const KEY_P      = 80;
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
var VISUALIZE_COLLISIONS    = false;
const PAUSE_FOR_SPRITESHEET = false;
const DRAW_HITBOX             = false;
var DRAW_PATHS              = false;

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
		case KEY_SPACE:
		SPACE_WAS_PRESSED = true;
		break;
		case KEY_M:
		VISUALIZE_COLLISIONS = !VISUALIZE_COLLISIONS;
		break;
		case KEY_P:
			DRAW_PATHS = !DRAW_PATHS;
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


class physics extends node {
	constructor(parent) {
		super(parent);
		this.next_pos = undefined;
		this.prev_pos = this.parent.position.copy();
		
		this.path = new queue();
		this.progress = 0;
		this.speed = 0.05
	}
	__process() {
		if (this.next_pos !== undefined) {

			// movement
			this.progress+=this.speed;
			this.parent.position = p5.Vector.lerp(this.prev_pos, this.next_pos, this.progress);
			this.parent.direction = p5.Vector.sub(this.next_pos, this.prev_pos).heading();
			if (this.progress >= 1) {
				this.progress-=1;
				this.prev_pos=this.next_pos.copy();
				this.next_pos=this.path.pop();
			}
			

			// world wrapping
			if (this.parent.position.x < 0) {
				this.parent.position.x += 400;
				this.next_pos.x += 400;
				this.prev_pos.x += 400;
			}
			else if (this.parent.position.x > 400) {
				this.parent.position.x -= 400;
				this.next_pos.x -= 400;
				this.prev_pos.x -= 400;
			}
			if (this.parent.position.y < 0) {
				this.parent.position.y += 400;
				this.next_pos.y += 400;
				this.prev_pos.y += 400;
			}
			else if (this.parent.position.y > 400) {
				this.parent.position.y -= 400;
				this.next_pos.y -= 400;
				this.prev_pos.y -= 400;
			}
		}
		else {
			this.parent.position = this.prev_pos.copy();
			this.progress = 0;
			this.next_pos=this.path.pop();
		}
	}

	__draw() {
		if (DRAW_PATHS) {
			for (let pnt of this.path.arr) {
				noFill();
				strokeWeight(2);
				stroke('green');
				circle(pnt.x, pnt.y, 5)
			}
		}
	}
}

class player_controller extends node {
	constructor(parent) {
		super(parent);
		console.assert(this.parent instanceof entity_2d, "Attached physics controller wrong node");
		this.physics = this.parent.hasInstance(physics);
		console.assert(this.physics, "Attached physics controller to non-physics node");
		this.cached_input = createVector(0,0);
	}
	__process() {
		if ( (PREFERRED_AXIS == UP_DOWN && DIR_INPUT[1] && DIR_INPUT[0]) || (DIR_INPUT[1] && !DIR_INPUT[0]) ) {
			this.cached_input = createVector(0, DIR_INPUT[1]);
		}
		else if ( (PREFERRED_AXIS == LEFT_RIGHT && DIR_INPUT[1] && DIR_INPUT[0]) || (!DIR_INPUT[1] && DIR_INPUT[0]) ) {
			this.cached_input = createVector(DIR_INPUT[0], 0);
		}
		if (this.physics.next_pos === undefined && this.world.state == RUNNING) {
			let new_path = this.parent.position.copy().div(20);
			
			new_path.add(this.cached_input);
			new_path.x = floor(new_path.x);
			new_path.y = floor(new_path.y);
			if (!this.cached_input.equals(0,0) && this.world.map[new_path.y%20][new_path.x%20] != '#' && this.world.map[new_path.y%20][new_path.x%20] != '-') {
				new_path.mult(20).add(createVector(10,10));
				this.physics.path.push(new_path);
			}
			else {
				new_path.sub(this.cached_input);
				new_path.add(p5.Vector.fromAngle(this.parent.direction));
				new_path.x = round(new_path.x);
				new_path.y = round(new_path.y);
				if (this.world.map[new_path.y%20][new_path.x%20] != '#' && this.world.map[new_path.y%20][new_path.x%20] != '-') {
					new_path.mult(20).add(createVector(10,10));
					this.physics.path.push(new_path);
				}
			}
			this.cached_input = createVector(0,0);
		}
	}
}

class enemy_controller extends node {
	constructor(parent, frame_offset) {
		super(parent);
		console.assert(this.parent instanceof entity_2d, "Attached physics controller wrong node");
		this.physics = this.parent.hasInstance(physics);
		console.assert(this.physics, "Attached physics controller to non-physics node");
		this.frame_offset = frame_offset;
		this.period = 20;
	}
	__process() {
		if (this.world.player_died || gameWorld.state != RUNNING) {
			return;
		}
		let player_grid_pos = this.world.player.position.copy().div(20);
		player_grid_pos.x = clamp(0, floor(player_grid_pos.x), 19);
		player_grid_pos.y = clamp(0, floor(player_grid_pos.y), 19);
		let cur_grid_pos = this.physics.prev_pos.copy().div(20);
		if (this.physics.next_pos !== undefined) {
			cur_grid_pos = this.physics.next_pos.copy().div(20);
		}
		cur_grid_pos.x = floor(cur_grid_pos.x);
		cur_grid_pos.y = floor(cur_grid_pos.y);
		let player_dist = abs(player_grid_pos.x-cur_grid_pos.x)+abs(player_grid_pos.y-cur_grid_pos.y);
		if (player_dist < 10) { //chase
			if ((frameCount+this.frame_offset)%this.period === 0) {
				this.physics.path.arr = []; // clear path before recalculating;
				let path = this.a_star(cur_grid_pos, player_grid_pos, manhattan_dist);
				while (path && path.prev !== null) {
					let pnt = path.pos.mult(20).add(createVector(10,10));
					this.physics.path.arr.push(pnt); // push like a stack (reversed by using arr)
					path = path.prev;
				}
			}
		}
		else if (this.physics.next_pos === undefined) { // wander
			this.physics.path.arr = []; // clear path, hacky way to prevent hard to find bug
			let moves = [-HALF_PI, 0, HALF_PI];
			let choice = random([0,1,2]);
			let dir = random([-1, 1]);
			let turn = p5.Vector.fromAngle(this.parent.direction+moves[choice]);
			for (let i = 0; i < 4; i++) {
				let new_path = cur_grid_pos.copy();
				if (i == 3) { // turn around
					turn = p5.Vector.fromAngle(this.parent.direction).mult(-1);
				}
				else {
					turn = p5.Vector.fromAngle(this.parent.direction+moves[choice]);
				}
				new_path.add(turn);
				new_path.x = floor(new_path.x);
				new_path.y = floor(new_path.y);
				if (new_path.x >= 0 && new_path.x < 20 && new_path.y >= 0 && new_path.y < 20 && this.world.map[new_path.y][new_path.x] != '#') {
					new_path.mult(20).add(createVector(10,10));
					this.physics.path.push(new_path);
					break;
				}
				choice = (choice+dir+3)%3
			}
		}
	}

	// not the most efficient because it's operating where each node is a grid cell, but it works.
	a_star(start, dest, heu=p5.Vector.dist) {
		let frontier = new priorityQueue(true);
		let visited = new Set();
		frontier.push({pos: start, prev: null}, heu(dest, start));
		while (frontier.arr.length > 0) {
			let elem = frontier.pop();
			let item = elem.item;
			let item_hash = item.pos.x+item.pos.y*20;
			if (item.pos.equals(dest)) {
				return item;
			}
			visited.add(item_hash);
			// left
			let newPos = item.pos.copy().add(createVector(-1,0));
			if (item_hash%20 > 0 && !visited.has(item_hash-1) && this.world.map[newPos.y][newPos.x] != '#') {
				frontier.push({pos: newPos, prev: item}, heu(dest,newPos));
			}

			// right
			newPos = item.pos.copy().add(createVector(1,0));
			if (item_hash%20 < 19 && !visited.has(item_hash+1) && this.world.map[newPos.y][newPos.x] != '#') {
				frontier.push({pos: newPos, prev: item}, heu(dest,newPos));
			}

			// up
			newPos = item.pos.copy().add(createVector(0,-1));
			if (floor(item_hash/20) > 0 && !visited.has(item_hash-20) && this.world.map[newPos.y][newPos.x] != '#') {
				frontier.push({pos: newPos, prev: item}, heu(dest,newPos));
			}

			// down
			newPos = item.pos.copy().add(createVector(0,1));
			if (floor(item_hash/20) < 19 && !visited.has(item_hash+20) && this.world.map[newPos.y][newPos.x] != '#') {
				frontier.push({pos: newPos, prev: item}, heu(dest,newPos));
			}
		}
	}
}

class player extends entity_2d {
	constructor(parent, position, direction) {
		super(parent, position, direction);
		this.physics = new physics(this);
		this.physics.speed+=0.01;
		this.controller = new player_controller(this);
		this.last_frame = 0;
	}
	__process() {
		this.world.for_radius(this.position, function(ent) {
			ent.remove();
			this.world.pills--;
		}, 10, [pill], this)
	}
	__draw() {
		translate(this.position.x, this.position.y);
		this.single_draw();

		// warp
		if (this.position.x < 20) {
			translate(400, 0);
			this.single_draw();
			translate(-400, 0);
		}
		else if (this.position.x > 380) {
			translate(-400, 0);
			this.single_draw();
			translate(400, 0);
		}
		if (this.position.y < 20) {
			translate(0, 400);
			this.single_draw();
			translate(0, -400);
		}
		else if (this.position.y > 380) {
			translate(0, -400);
			this.single_draw();
			translate(0, 400);
		}
		translate(-this.position.x, -this.position.y);
	}
	single_draw() {
		noStroke();
		fill("yellow");
		rotate(this.direction);
		// death animation
		if (gameWorld.player_died) {
			if (frameCount - this.last_frame < 60) {
				arc(0, 0, 17, 17,
					abs(sin(this.last_frame/5))*(QUARTER_PI)
					+lerp(0, PI-abs(sin(this.last_frame/5))*(QUARTER_PI), min((frameCount-this.last_frame)/60, 1)),
					abs(sin(this.last_frame/5))*(-QUARTER_PI)
					+lerp(0, -PI+abs(sin(this.last_frame/5))*(QUARTER_PI), min((frameCount-this.last_frame)/60, 1)), PIE);
			}
		}
		// normal animation
		else {
			arc(0, 0, 17, 17, abs(sin(frameCount/5))*(QUARTER_PI), abs(sin(frameCount/5))*(-QUARTER_PI), PIE);
			this.last_frame = frameCount;
		}
		rotate(-this.direction);
	}
}

class enemy extends entity_2d {
	constructor(parent, position, direction, frame_offset) {
		super(parent, position, direction);
		this.physics = new physics(this);
		this.controller = new enemy_controller(this, frame_offset);
		colorMode(HSB, 255);
		this.color = color(random(0,255),192,255);
		colorMode(RGB);
	}
	__process() {
		if (!this.world.player_died && distSq(this.position, this.world.player.position) < 400) {
			this.world.player_died = true;
		}
	}
	__draw() {
		noStroke();
		fill(this.color);
		translate(this.position.x, this.position.y);
		this.draw((frameCount % 60 < 30)? 1 : 2);
		fill(255);
		ellipse(-4, -5, 6, 4);
		ellipse( 4, -5, 6, 4);
		fill(0);
		circle(-4+2*cos(this.direction), -5+2*sin(this.direction), 3);
		circle( 4+2*cos(this.direction), -5+2*sin(this.direction), 3);
		translate(-this.position.x, -this.position.y);
	}

	draw(frame) {
		switch(frame) {
			case 1:
				noStroke();
				ellipse(0,-5, 20, 10);
				rect(-10,-5, 20, 10);
				triangle(-10, 10,-5, 5,-10, 5);
				triangle(  0, 10, 0, 5, -5, 5);
				triangle(  0, 10, 0, 5,  5, 5);
				triangle( 10, 10, 5, 5, 10, 5);
				break;
			case 2:
				ellipse(0,-5, 20, 10);
				rect(-10,-5, 20, 10);
				triangle( -5, 10,-10, 5,-5, 5);
				triangle( -5, 10, -5, 5, 0, 5);
				triangle(  5, 10, 5, 5,  0, 5);
				triangle(  5, 10, 10, 5, 5, 5);
				break;
		}
	}
}

class pill extends entity_2d {
	constructor(parent, position, direction, frame_offset) {
		super(parent, position, direction);
		this.pos_hash = new static_pos_hash_2d(this);
	}
	__draw() {
		noStroke();
		fill("yellow");
		translate(this.position.x, this.position.y);
		circle(0, 0, 5);
		translate(-this.position.x, -this.position.y);
	}
}

class gate extends entity_2d {
	__draw() {
		noStroke();
		fill(0, 128, 192, 192);
		translate(this.position.x, this.position.y);
		rect(-10, -5, 20, 10);
		translate(-this.position.x, -this.position.y);
	}
}

class wall extends entity_2d { 
	constructor(parent, position, direction, neighbors) {
		super(parent, position, direction);
		let points =  []
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
				this.sprite.push(WALL_FULL);
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
	}
	__draw() {
		for (let i = 0; i < 4; i++) {
			this.world.sprites.draw_tile_quad(this.sprite[i], i, this.position, 0);
			//this.world.sprites.draw_tile_quad([2,1], i, this.position, 0);
		}
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
	Welcome to my Pacman game!\n\
	You most likely already know the rules \n\
	\n\n\n\
	DEBUG:\n\
	Press P to see the enemy paths \n\
	Press M to view the position hash array\n\n\n\
	Click anywhere to start.\n\n\n\
	Have fun!\
	", 20,50);	
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
		"####################",
		"#      #    #      #",
		"# #### # ## # #### #",
		"         ##         ",
		"# ### ##    ## ### #",
		"# ###  # ## #  ### #",
		"# #### # ## # #### #",
		"#        ##        #",
		"# # ## #-##-## # # #",
		"# # ## #eeee## # # #",
		"# # ## #-##-## # # #",
		"# #              # #",
		"# ## ### ## ### ## #",
		"# #   ## ## ##   # #",
		"# # #          # # #",
		"#   ############   #",
		"@ #    #    #    #  ",
		"# ## # # ## # # ## #",
		"#                  #",
		"####################",
	];
	// level dimensions
	gameWorld.level_width   = gameWorld.map[0].length*20;
	gameWorld.level_height  = gameWorld.map.length*20;
	gameWorld.doors = new Set();
	gameWorld.pills = 0;

	// background layer (layer 0)
	for (let row = 0; row < gameWorld.map.length; row++) {
		for (let col = 0; col < gameWorld.map[0].length; col++) {
			let neighbors = 0;
			switch(gameWorld.map[row][col]) {
				case '#':
					neighbors = (2<<8)-1;
					for (let subrow = max(row-1, 0); subrow < min(row+2, gameWorld.map.length); subrow++) {
						for (let subcol = max(col-1,0); subcol < min(col+2,gameWorld.map[0].length); subcol++) {
							if (gameWorld.map[subrow][subcol] !== '#' && gameWorld.map[subrow][subcol] !== 'O') {
								neighbors ^= (1<<(3*(subrow-row+1)+(subcol-col+1)));
							}
						}
					}
					new wall(gameWorld, createVector(col*20 + 10, row*20 + 10), 0, neighbors);
					break;
				case '-':
					new gate(gameWorld, createVector(col*20 + 10, row*20 + 10), 0);
					break;
				case ' ':
					new pill(gameWorld, createVector(col*20 + 10, row*20 + 10), 0);
					gameWorld.pills++;
					break;
			}
		}
	}
	
	// foreground layer (layer 1)
	let ghost_frame = 0;
	for (let row = 0; row < gameWorld.map.length; row++) {
		for (let col = 0; col < gameWorld.map[0].length; col++) {
			switch(gameWorld.map[row][col]) {
				case '@':
					new pill(gameWorld, createVector(col*20 + 10, row*20 + 10), 0);
					gameWorld.pills++;
					gameWorld.player = new player(gameWorld, createVector(col*20 + 10, row*20 + 10), 0);
					break;
				case 'e':
					new enemy(gameWorld, createVector(col*20 + 10, row*20 + 10), 0, ghost_frame);
					ghost_frame += 5;
					break;
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
	gameWorld.player_died = false;
	gameWorld.lives = 3;
}

function draw() {
	if (gameWorld.state != SPRITES) {
		background('black');
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
		if (!gameWorld.player_died) {
			gameWorld.process();
		}
		case LOST: //game over
		case WON: // game won
		for (let i = 0; i < 300; i++) {
			fill('white');
			noStroke();
		} 
		gameWorld.draw();
		resetMatrix();
		strokeWeight(2);
		textAlign(LEFT);
		textSize(11);
		stroke('black');
		fill('white');
		switch (gameWorld.state) {
			case RUNNING:
			if (gameWorld.pills == 0) {
				gameWorld.state = WON;
			}
			stroke(0);
			strokeWeight(1);
			fill('yellow');
			for (let i = 0; i < gameWorld.lives; i++){
				arc(10+i*20, 8, 10, 10, QUARTER_PI, -QUARTER_PI, PIE);
			}
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
		if (gameWorld.player_died) {
			if (gameWorld.lives > 0) {
				if (!MOUSE_WAS_PRESSED) {
					textAlign(CENTER);
					textSize(30);
					stroke('black');
					fill('white')
					text("Click To Continue...", 200,210);
				}
				else {
					MOUSE_WAS_PRESSED = false;
					gameWorld.lives--;
					gameWorld.player_died=false;
					gameWorld.player.position = createVector(10, 16*20+10);
					gameWorld.player.physics.next_pos = undefined;
					gameWorld.player.physics.path.arr = [];
					gameWorld.player.physics.prev_pos = gameWorld.player.position;
					gameWorld.player.physics.progress = 0;
					gameWorld.player.direction = 0;
					let i = 8;
					for (let ent of gameWorld.children) {
						if (ent instanceof enemy) {
							ent.position = createVector(i++*20+10, 9*20+10);
							ent.physics.next_pos = undefined;
							ent.physics.path.arr = [];
							ent.physics.prev_pos = ent.position;
							ent.physics.progress = 0;
							ent.direction = 0;
						}
					}
				}
				
			}
			else if (gameWorld.lives <= 0) {
				gameWorld.state = LOST;
			}
		}
		else {
			MOUSE_WAS_PRESSED = false;
		}
		
		break;
	}
}