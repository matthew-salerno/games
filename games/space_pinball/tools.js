function zip_array_to_vecs(points) {
	arr = [];
	for (let i = 0; i < points.length; i+=2){
		arr.push(createVector(points[i], points[i+1]))
	}
	return arr;
}

function clamp(_min, _mid, _max) {
	let ret = _mid;
	if (ret < _min) {
		return _min;
	}
	else if (ret > _max) {
		return _max;
	}
	else {
		return _mid;
	}
}

function towards_number(amount, target, step) {
	let delta = 0;
	if (amount < target) {
		delta = min(target-amount, step);
	}
	else if (amount > target){
		delta = max(target-amount, -step);
	}
	return amount+delta;
}

// updated line algo, probably less efficient than the previous lerp method
// but I have more confidence in this one
function line_pixels(x0, y0, x1, y1, thickness) {
	let pixels = new Set();
	let dx = x1 - x0;
	let dy = y1 - y0;
	let dydx = (dy/dx)
	let dxdy = (dx/dy)
	// # Math: y=\frac{\delta y}{\delta x}*(x-x_0)
	// # Math: x=\frac{\delta x}{\delta y}*(y-y_0)
	let y = function(__x) {return dydx*__x-dydx*x0+y0;};
	let x = function(__y) {return dxdy*__y-dxdy*y0+x0;};

	// Get whether x or y is positive/negative
	let x_inc = ((dx>0)<<1)-1;
	let y_inc = ((dy>0)<<1)-1;

	// X is longest axis (make independent)
	if (abs(dx) > abs (dy)) {
		for (let _x = x0; abs(_x-x0) <= abs(dx); _x+=x_inc) {
			pixels.add(createVector(_x, round(y(_x))));
			for (let i = 1; i <= thickness; i++) {
				pixels.add(createVector(_x, round(y(_x)+i)));
				pixels.add(createVector(_x, round(y(_x)-i)));
			}
		}
	}

	// Y is longest axis (make independent)
	else {
		for (let _y = y0; abs(_y-y0) <= abs(dy); _y+=y_inc) {
			pixels.add(createVector(round(x(_y)), _y));
			for (let i = 1; i <= thickness; i++) {
				pixels.add(createVector(round(x(_y)+i), _y));
				pixels.add(createVector(round(x(_y)-i), _y));
			}
		}
	}
	return pixels;
}