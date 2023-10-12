// Set up a canvas that is 1300 x 1200
function getContext() {
    var canvas = document.getElementById('canvas');

    canvas.width = 1300;
    canvas.height = 1200;

    return canvas.getContext("2d");
}
var ctx = getContext();

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    copy(p) {
        this.x = p.x;
        this.y = p.y;
        return this;
    }

    add(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    multiplyScalar(v) {
        this.x *= v;
        this.y *= v;
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const l = this.length();
        this.x /= l;
        this.y /= l;
        return this;
    }
}


var w = 1900;
var h = 1850;
//circle size, default 3
var radius = Math.min(w, h) / 3.3;
var points = []; // Array Data Structure that will hold point objects
var count = 150;  // Count^2 is the number of points on the canvas, default 150

function createPoint(i, j, count, radius) {
  const x = j / count * radius - radius / 2;
  const y = i / count * radius - radius / 2;
  const p = new Point(x, y);
  p.origin = p.clone();
  p.life = Math.random() * 50;
  return p;
}

// i columns
// j rows
// We are looping over the canvas grid
for (let i = 0; i < count; i++) {
  for (let j = 0; j < count; j++) {
    points.push(createPoint(i, j, count, radius));
  }
}



class SimpleNoise {
  constructor(seed) {
    this.seed = seed;
  }

  noise(x) {
    return Math.sin(this.seed + x * Math.cos(this.seed));
  }
}



function curlNoise(p, scale, delta) {
    // Pre-compute repeated calculations
    const scaledX = scale * p.x;
    const scaledY = scale * p.y;
    const simpleNoise = new SimpleNoise(0); // Initialize with a seed

    // Perlin noise means that values close to each other in the input space will also be close in the output space, creating a smooth, continuous function.

    //const noiseLeft = noise.perlin2(scaledX - scale, scaledY);
    const noiseLeft = simpleNoise.noise(scaledX - scale)
    //const noiseRight = noise.perlin2(scaledX + scale, scaledY);
    const noiseRight = simpleNoise.noise(scaledX + scale)
    //const noiseUp = noise.perlin2(scaledX, scaledY - scale);
    const noiseUp = simpleNoise.noise(scaledY - scale);
    //const noiseDown = noise.perlin2(scaledX, scaledY + scale);
    const noiseDown = simpleNoise.noise(scaledY + scale);

    // Compute curl noise based on Perlin noise gradient
    return new Point(noiseUp - noiseDown, noiseLeft - noiseRight)
        .normalize()
        .multiplyScalar(1.0 / (2.0 * delta));
}



// raf() is a rendering loop
function raf() {

    /*
    The window.requestAnimationFrame() method tells the browser that you wish to
    perform an animation and requests that the browser calls a specified function to
    update an animation right before the next repaint.
    */
    requestAnimationFrame(raf);

    // Restores the most recently saved canvas state
    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0)";   // Make the canvas drawing transparent
    ctx.strokeStyle = "#03e9f4";        // Make the points blue

    //ctx.globalAlpha = 15 / 0xff;
    // fill and clear entire canvas, to reset canvas
    //ctx.fillRect(0, 0, w, h);       
    ctx.clearRect(0, 0, w, h);



    ctx.save();
    ctx.translate(w / 3, h / 3);
    //ctx.globalAlpha = 0.2;
    //ctx.globalAlpha = 1;

    // K effects the density of the planet
    // A large K (250) makes the planet very small and dense
    // A small K (2) makes the planet have a disk, black center, like a black hole
    var K = 25;

    // A small k makes the particles move like a water fall, in a downard or upward way
    var scale = 0.05;
    var time = Date.now() * 0.001;  // slow or speed up the moving particles
    var d = new Point(Math.cos(time), Math.sin(time));  // Create a new point based on the time

    // Create a new point at the origin    
    var n = new Point(0, 0);

    // double time
    var t = time * 2; // lerp( Math.abs( Math.sin( time * .01 ) ), time * 2, Math.sin( time ) * 10 ); 

    // the '10' here controls how fast the swirls moves across the scene, '40' is lines, much better
    var o = new Point(time * 10, t);
    // .add adds one point to another, so modify point by adding some Noise
    o.add(curlNoise(o, 0.05, 2));

    var length, x, y, r0 = radius;

    function transformPoint(p, K, r0) {
        const n = new Point(0, 0).copy(p).add(o);

        const cp = curlNoise(n, scale, 1);

        p.add(cp);

        const length = p.length();

        if (length > r0 * 0.45) return null;

        const x = p.x / (length + K) * r0;
        const y = p.y / (length + K) * r0;

        return new Point(x, y);
    }



    ctx.beginPath();
    points.forEach(p => { 

        const transformedPoint = transformPoint(p, K, r0);

        if (transformedPoint) {
            ctx.moveTo(transformedPoint.x, transformedPoint.y);
            ctx.lineTo(transformedPoint.x + 1, transformedPoint.y);
        }

        //respawn
        if (p.life-- < 0) {
            p.copy(p.origin);
            p.life = Math.random() * 100;
        }
    });
    ctx.stroke();
}
window.onload = raf;

