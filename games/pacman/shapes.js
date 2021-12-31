class intersection {
	// Note, assumes only one point intersects
	constructor(shape, pln, pnt) {
		this.shape=shape;
		this.plane=pln.copy();
		this.point=pnt.copy(); 
	}
}
// must be defined clockwise
class convex_shape {
	constructor(points, position = createVector(0,0), rotation = 0, subdivision = 0) {
		this._points = points;
		this.rotation = rotation;
		this.position = position.copy();
		this._normals = [];
		this.subdivide(subdivision);
		for (let i = 0; i < this._points.length; i++) {
			let i_next = (i+1)%this._points.length;
			let orig = p5.Vector.lerp(this._points[i], this._points[i_next], 0.5);
			let norm = p5.Vector.sub(this._points[i_next], this._points[i]).rotate(-HALF_PI).normalize();
			this._normals.push(new plane_2d(orig, norm));
		}
		this._bounding_circle = 0;
		for (let pnt of points) {
			this._bounding_circle = max(this.bounding_circle, p5.Vector.mag(pnt));
		}
		console.assert(this._points.length > 0, "convex shape with no points!");
		console.assert(this._normals.length > 0, "convex shape with no normals!");
		
		// this is pain, basically just converts relative position of _points to absolute position
		let this_shape = this;
		this.points = new Proxy(this._points, {
			get: function(target, name) {
				if (name === Symbol.iterator) {
					return function () {
						let iter = target.values();
						return {
							next: function () {
								let ret = iter.next();
								if (!ret.done) {
									return {
										value: ret.value.copy().rotate(this_shape.rotation).add(this_shape.position),
										done: ret.done
									};
								}
								else {
									return {done: true};
								}
							}
						}
					};
				}
				return target[name].copy().rotate(this.rotation).translate(this.position)
			}
		});
		this.normals = new Proxy(this._normals, {
			get: function(target, name) {
				if (name === Symbol.iterator) {
					return function () {
						let iter = target.values();
						return {
							next: function () {
								let ret = iter.next();
								if (!ret.done) {
									let tmpPln = ret.value.copy();
									tmpPln.origin.rotate(this_shape.rotation);
									tmpPln.origin.add(this_shape.position);
									tmpPln.normal.rotate(this_shape.rotation);
									return {
										value: tmpPln,
										done: ret.done
									};
								}
								else {
									return {done: true};
								}
							}
						}
					};
				}
				let tmpPln = pln.copy();
				tmpPln.origin.rotate(this.rotation);
				tmpPln.origin.add(this.position);
				tmpPln.normal.rotate(this.rotation);
				return tmpPln;
			}
		});
	}
	get bounding_circle() {
		return this._bounding_circle;
	}

	subdivide(num) {
		for (let _ = 0; _ < num; _++) {
			for (let i = 0; i < this._points.length; i+=2) { // +=2 because we're inserting as we traverse
				let curPnt  = this._points[i];
				let nextPnt = this._points[(i+1)%this._points.length];
				let new_point = p5.Vector.lerp(curPnt, nextPnt,0.5);
				this._points.splice(i+1, 0, new_point);
			}
			for (let i = 0; i < this._points.length; i+=2) { // +=2 because we're inserting as we traverse
				let prevPnt  = this._points[(i-1+this._points.length)%this._points.length];
				let nextPnt = this._points[(i+1)%this._points.length];
				this._points[i]= p5.Vector.lerp(this._points[i], p5.Vector.lerp(prevPnt, nextPnt,0.5), 0.6666666);
			}
		}
	}

	translate(vec) {
		this.position.add(vec);
	}

	rotate(rad, absolute=false) {
		this.rotation += rad%TWO_PI;
		if (absolute){
			this.position.rotate(rad)
		}
	}
	intersect_shape(shape) {
		for (let pnt of shape.points) {
			if (this.intersect_vector(pnt)) {
				return new intersection(this, this.get_closest_plane(pnt), pnt);
			}
		}
		for (let pnt of this.points) {
			if (shape.intersect_vector(pnt)) {
				return new intersection(shape, shape.get_closest_plane(pnt), pnt);
			}
		}
		return false;
	}
	
	intersect_vector(vec) {
		let allInside = true;
		for (let pln of this.normals) {
			if (pln.dist(vec) > 0) {
				return false;
			}
		}
		return true;
	}
	
	// returns 0 for intersection, otherwise returns distance closest to plane
	crosses_plane(pln) {
	  let sign = null;
	  let dist = Infinity;
	  for (let pnt of this.points) {
		let new_dist = pln.dist(pnt);
		dist = min(dist, abs(new_dist));
		switch (sign) {
			case null:
				if (new_dist > 0) {
					sign = 1;
				}
				else {
					sign = -1;
				}
				break;
			case 1:
				if (new_dist < 0) {
					return 0;
				}
				break;
			case -1:
				if (new_dist > 0) {
					return 0;
				}
				break;
			}
		}
		return sign*dist;
	}
	
	get_closest_point(pln) {
		let min = Infinity;
		let closest = null;
		for (let pnt of this.points) {
			let newDist = abs(pln.dist(pnt));
			if (newDist < min) {
			min=newDist;
			closest = pnt;
			}
		}
		return closest;
	}
	
	get_closest_plane(vec) {
		let min = Infinity;
		let closest = null;
		for (let pln of this.normals) {
			let newDist = abs(pln.dist(vec));
			if (newDist < min) {
				min=newDist;
			closest = pln;
			}
		}
		return closest;
	}
	
	get_min_point(pln) {
		let min = Infinity;
		let closest = null;
		for (let pnt of this.points) {
			let newDist = pln.dist(pnt);
			if (newDist < min) {
				min=newDist;
				closest = pnt;
			}
		}
		return closest;
	}
	
	draw() {
		beginShape();
		for (let i of this.points) {
			vertex(i.x, i.y);
		}
		endShape(CLOSE);
	}

	drawNormals() {
		for (let i of this.normals) {
			line(i.origin.x, i.origin.y, i.origin.x+i.normal.copy().mult(5).x, i.origin.y+i.normal.copy().mult(5).y);
			circle(i.origin.x, i.origin.y, 3);
		}
	}
}

class plane_2d {
	constructor(origin, normal) {
		this.origin = origin;
		this.normal = normal.normalize();
	}
	dist(vec) {
		return p5.Vector.dot(this.normal, p5.Vector.sub(vec, this.origin));
	}
	copy() {
		return new plane_2d(this.origin.copy(), this.normal.copy())
	}
}