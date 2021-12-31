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

// globals to handle input
// outside of game world because keyPresses are
// global and may happen when game world doesn't exist
var DIR_INPUT = [0,0]; // Directional keys being pressed. Opposite keys add to zero
var PREFERRED_AXIS = 0 // In case of no diagonal movement in game, we favor the most recent key press
var MOUSE_WAS_PRESSED = false; // we don't want if the mouse is pressed, just if it was since the last time this var was cleared.
var SPACE_WAS_PRESSED = false; // same as above
var A_PRESSED=false;
var D_PRESSED=false;
function mousePressed() {
	MOUSE_WAS_PRESSED = true;
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