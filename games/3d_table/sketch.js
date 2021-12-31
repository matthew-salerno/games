// Matthew Salerno, 'coffee' table

var PROJECTION_DIST = 200;
var CAMERA_DIST = 512;
var CAMERA_ROT;
var points;
var MOUSE_PRESSED = false;
var MOUSE_ANCHOR;

class shape {
  constructor(points, col=color('red')) {
    this.color=col
    this.orig_points = points;
    this.points = [];
    for (let pnt of this.orig_points) {
      this.points.push(pnt.copy());
    }
  }
  draw() {
    fill(this.color);
    translate(width/2, height/2);
    let draw_points = this.points.map(project);
    if (clockwise(draw_points)) {
      beginShape();
      for (let pos of draw_points) {
        vertex(pos.x, pos.y);
      }
      endShape(CLOSE);
    }
    translate(-width/2, -height/2);
  }
  rotate() {
    let new_points = [0,0,0];
    for (let i = 0; i < this.points.length; i++) {
      let point_temp1 = this.orig_points[i].copy();
      point_temp1.x = this.orig_points[i].x*cos(CAMERA_ROT.y)-this.orig_points[i].z*sin(CAMERA_ROT.y);
      point_temp1.z = this.orig_points[i].x*sin(CAMERA_ROT.y)+this.orig_points[i].z*cos(CAMERA_ROT.y);
      let point_temp2 = point_temp1.copy();
      point_temp2.y = point_temp1.y*cos(CAMERA_ROT.x)+point_temp1.z*sin(CAMERA_ROT.x);
      point_temp2.z = point_temp1.y*sin(CAMERA_ROT.x)-point_temp1.z*cos(CAMERA_ROT.x);
      let point_temp3 = point_temp2.copy();
      point_temp3.x = point_temp2.x*cos(CAMERA_ROT.z)+point_temp2.y*sin(CAMERA_ROT.z);
      point_temp3.y = point_temp2.y*cos(CAMERA_ROT.z)-point_temp2.x*sin(CAMERA_ROT.z);
      this.points[i] = point_temp3
      if (i < 3) {
        new_points[i] = point_temp3.copy();
      }
    }
  }
}

function clockwise(vecs) {
  return (vecs[1].copy().sub(vecs[0]).angleBetween(vecs[2].copy().sub(vecs[0])) > 0);
}

// no matrix library here so might as well do it the ald fashioned way
function project(pos) {
  point_2d = pos.copy();
  point_2d.add(0,0,CAMERA_DIST);
  point_2d.x/=point_2d.z;
  point_2d.y/=point_2d.z;
  point_2d.z=1;
  point_2d.mult(PROJECTION_DIST);
  return point_2d
}

function mousePressed() {
  MOUSE_PRESSED = true;
  MOUSE_ANCHOR = createVector(mouseX, mouseY);
}

function mouseReleased() {
  MOUSE_PRESSED = false; 
  MOUSE_ANCHOR = createVector(0, 0);
}
function mouseWheel(event) {
  if (keyIsDown(SHIFT)) {
    PROJECTION_DIST += event.delta/8;
  }
  else {
    CAMERA_DIST += event.delta/2;
  }
}
function setup() {
  MOUSE_ANCHOR = createVector(0,0,0);
  CAMERA_ROT = createVector(0,0)
  shapes = [
    new shape(
      [(createVector(400,50,200)),
      (createVector(400, 25,200)),
      (createVector(400, 25,-200)),
      (createVector(400, 50,-200))], color('brown')),
    new shape(
      [(createVector(-400,50,200)),
      (createVector(-400,50,-200)),
      (createVector(-400, 25,-200)),
      (createVector(-400, 25,200))], color('brown')),
    new shape(
      [(createVector(400,50,200)),
      (createVector(400,50,-200)),
      (createVector(-400,50,-200)),
      (createVector(-400,50,200))], color('brown')),
    new shape(
      [(createVector(400, 25,200)),
      (createVector(-400, 25,200)),
      (createVector(-400, 25,-200)),
      (createVector(400, 25,-200))], color('brown')),
    new shape(
      [(createVector(400, 50,200)),
      (createVector(-400, 50,200)),
      (createVector(-400, 25,200)),
      (createVector( 400, 25,200))], color('brown')),
    new shape(
      [(createVector(400,50,-200)),
      (createVector(400, 25,-200)),
      (createVector(-400, 25,-200)),
      (createVector(-400,50,-200))], color('brown')),


    new shape(
      [(createVector(400,275,200)),
      (createVector(400, 250,200)),
      (createVector(400, 250,-200)),
      (createVector(400, 275,-200))], color(92,64,32)),
    new shape(
      [(createVector(-400,275,200)),
      (createVector(-400,275,-200)),
      (createVector(-400, 250,-200)),
      (createVector(-400, 250,200))], color(92,64,32)),
    new shape(
      [(createVector(400,275,200)),
      (createVector(400,275,-200)),
      (createVector(-400,275,-200)),
      (createVector(-400,275,200))], color(92,64,32)),
    new shape(
      [(createVector(400, 250,200)),
      (createVector(-400, 250,200)),
      (createVector(-400, 250,-200)),
      (createVector(400, 250,-200))], color(92,64,32)),
    new shape(
      [(createVector(400, 275,200)),
      (createVector(-400, 275,200)),
      (createVector(-400, 250,200)),
      (createVector( 400, 250,200))], color(92,64,32)),
    new shape(
      [(createVector(400,275,-200)),
      (createVector(400, 250,-200)),
      (createVector(-400, 250,-200)),
      (createVector(-400,275,-200))], color(92,64,32)),

    new shape(
      [(createVector(425,300,225)),
      (createVector(425, 0,225)),
      (createVector(425, 0,200)),
      (createVector(425, 300,200))], color(196)),
    new shape(
      [(createVector(400,300,225)),
      (createVector(400,300,200)),
      (createVector(400, 0,200)),
      (createVector(400, 0,225))], color(196)),
    new shape(
      [(createVector(425,300,225)),
      (createVector(425,300,200)),
      (createVector(400,300,200)),
      (createVector(400,300,225))], color(196)),
    new shape(
      [(createVector(425, 0,225)),
      (createVector(400, 0,225)),
      (createVector(400, 0,200)),
      (createVector(425, 0,200))], color(196)),
    new shape(
      [(createVector(425, 300,225)),
      (createVector(400, 300,225)),
      (createVector(400, 0,225)),
      (createVector( 425, 0,225))], color(196)),
    new shape(
      [(createVector(425,300,200)),
      (createVector(425, 0,200)),
      (createVector(400, 0,200)),
      (createVector(400,300,200))], color(196)),


    new shape(
      [(createVector(-400,300,-200)),
      (createVector(-400, 0,-200)),
      (createVector(-400, 0,-225)),
      (createVector(-400, 300,-225))], color(196)),
    new shape(
      [(createVector(-425,300,-200)),
      (createVector(-425,300,-225)),
      (createVector(-425, 0,-225)),
      (createVector(-425, 0,-200))], color(196)),
    new shape(
      [(createVector(-400,300,-200)),
      (createVector(-400,300,-225)),
      (createVector(-425,300,-225)),
      (createVector(-425,300,-200))], color(196)),
    new shape(
      [(createVector(-400, 0,-200)),
      (createVector(-425, 0,-200)),
      (createVector(-425, 0,-225)),
      (createVector(-400, 0,-225))], color(196)),
    new shape(
      [(createVector(-400, 300,-200)),
      (createVector(-425, 300,-200)),
      (createVector(-425, 0,-200)),
      (createVector( -400, 0,-200))], color(196)),
    new shape(
      [(createVector(-400,300,-225)),
      (createVector(-400, 0,-225)),
      (createVector(-425, 0,-225)),
        (createVector(-425,300,-225))], color(196)),

    new shape(
      [(createVector(425,300,-200)),
      (createVector(425, 0,-200)),
      (createVector(425, 0,-225)),
      (createVector(425, 300,-225))], color(196)),
    new shape(
      [(createVector(400,300,-200)),
      (createVector(400,300,-225)),
      (createVector(400, 0,-225)),
      (createVector(400, 0,-200))], color(196)),
    new shape(
      [(createVector(425,300,-200)),
      (createVector(425,300,-225)),
      (createVector(400,300,-225)),
      (createVector(400,300,-200))], color(196)),
    new shape(
      [(createVector(425, 0,-200)),
      (createVector(400, 0,-200)),
      (createVector(400, 0,-225)),
      (createVector(425, 0,-225))], color(196)),
    new shape(
      [(createVector(425, 300,-200)),
      (createVector(400, 300,-200)),
      (createVector(400, 0,-200)),
      (createVector( 425, 0,-200))], color(196)),
    new shape(
      [(createVector(425,300,-225)),
      (createVector(425, 0,-225)),
      (createVector(400, 0,-225)),
        (createVector(400,300,-225))], color(196)),

    new shape(
      [(createVector(-400,300,225)),
      (createVector(-400, 0,225)),
      (createVector(-400, 0,200)),
      (createVector(-400, 300,200))], color(196)),
    new shape(
      [(createVector(-425,300,225)),
      (createVector(-425,300,200)),
      (createVector(-425, 0,200)),
      (createVector(-425, 0,225))], color(196)),
    new shape(
      [(createVector(-400,300,225)),
      (createVector(-400,300,200)),
      (createVector(-425,300,200)),
      (createVector(-425,300,225))], color(196)),
    new shape(
      [(createVector(-400, 0,225)),
      (createVector(-425, 0,225)),
      (createVector(-425, 0,200)),
      (createVector(-400, 0,200))], color(196)),
    new shape(
      [(createVector(-400, 300,225)),
      (createVector(-425, 300,225)),
      (createVector(-425, 0,225)),
      (createVector( -400, 0,225))], color(196)),
    new shape(
      [(createVector(-400,300,200)),
      (createVector(-400, 0,200)),
      (createVector(-425, 0,200)),
        (createVector(-425,300,200))], color(196)),

    ];
  createCanvas(400, 400);
  for (let shp of shapes) {
    shp.rotate();
  }
  shapes.sort(draw_sort);
}

function draw_sort(first, second) {
  let first_min = Infinity;
  for (let pnt of first.points) {
    first_min = min(first_min, pnt.z);
  }
  let second_min = Infinity;
  for (let pnt of second.points) {
    second_min = min(second_min, pnt.z);
  }
  return second_min-first_min;
}

function draw() {
  if (MOUSE_PRESSED) {
    CAMERA_ROT.add(createVector(mouseY-MOUSE_ANCHOR.y, -mouseX+MOUSE_ANCHOR.x, 0).div(400));
    if (CAMERA_ROT.x > 0.6*HALF_PI) {
      CAMERA_ROT.x = 0.6*HALF_PI;
    }
    if (CAMERA_ROT.x < -0.6*HALF_PI) {
      CAMERA_ROT.x = -0.6*HALF_PI;
    }
    for (let shp of shapes) {
      shp.rotate();
    }
    shapes.sort(draw_sort);
    MOUSE_ANCHOR = createVector(mouseX, mouseY);
  }
  background(220);
  for (shp of shapes) {
    stroke('black');
    strokeWeight(1);
    shp.draw();
  }
  noStroke();
  fill('black');
  textSize(20)
  text("Click and drag to move, scroll to zoom\nshift+scroll to change fov",10,20)
}

