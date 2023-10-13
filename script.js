function getContext(w, h) {
    var canvas = document.getElementById('canvas');

    canvas.width = w;
    canvas.height = h;

    return canvas.getContext("2d");
}
//! ::NOTE:: The canvas dimensions and its display size are two different matters, often
//! confused but crucial to distinguish

// When you set the width and height attributes of the canvas element, you are
// setting the dimensions of the drawing surface. This is where your shapes and
// images will be rendered.
var w = 120;
var h = 120;

//  the size at which the canvas is displayed on the web page can be different.
//  This is controlled by CSS and can be set using the style attribute or a CSS
//  stylesheet. 
canvas.style.width = w + "px";
canvas.style.height = h + "px";
var ctx = getContext(w, h);

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

// Perlin noise means that values close to each other in the input space will
// also be close in the output space, creating a smooth, continuous function.
class SimpleNoise {
  constructor(seed) {
    this.seed = seed;
  }

  noise(x) {
    return Math.sin(this.seed + x * Math.cos(this.seed));
  }
}

// By taking the .min() we ensure that the circle fits within the canvas
var canvasPercentage = 1.00 / 2;  // 100% of the canvas size, by dividing by two we ensure that the radius is half the canvas width
var radius = Math.min(w, h) * canvasPercentage;  // Size of circle
var pointsPerUnit = .3;  // Number of points per unit of radius, adjust as needed
var count = Math.floor(radius * pointsPerUnit);  // count^2 is the number of points on the canvas
var points = [];  // array of point objects


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






function curlNoise(p, scale, delta) {
    // Pre-compute repeated calculations
    const scaledX = scale * p.x;
    const scaledY = scale * p.y;
    const simpleNoise = new SimpleNoise(0); // Initialize with a seed


    const noiseLeft = simpleNoise.noise(scaledX - scale)
    const noiseRight = simpleNoise.noise(scaledX + scale)
    const noiseUp = simpleNoise.noise(scaledY - scale);
    const noiseDown = simpleNoise.noise(scaledY + scale);

    return new Point(noiseUp * noiseDown, noiseLeft * noiseRight)
        .normalize()
        .multiplyScalar(1.0 / (2.0 * delta));
}



// raf() is a rendering loop
function raf() {

    requestAnimationFrame(raf); // Schedule the next frame of the animation.
    //? What do you mean next repain?

    
    ctx.restore(); // Restore canvas to last saved state
    //? Why is this necessary?

    //ctx.fillStyle = "rgba(100,10,10,10)";   // Make the canvas drawing transparent
    //? Why doesn't this do anything?

    ctx.strokeStyle = "#03e9f4"; // Set point color

    ctx.clearRect(0, 0, w, h);  // Clear entire canvas


    // save() saves the state of the canvas, , which is affected by rotate,
    // translate, scale, etc. It does not save any of the actual content of the
    // canvas.
    ctx.save();

    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/translate
    // By dividing w and h by 2 we are effectivly moving the origin to the
    // center of the grid instead of the top left
    ctx.translate(w / 2, h / 2);  

    // K effects the density of the planet
    // A large K (250) makes the planet very small and dense
    // A small K (2) makes the planet have a disk, black center, like a black hole
    var K = 25;

    var scale = 0.05;
    var time = Date.now() * 0.001;  // slow or speed up the moving particles


    var o = new Point(time, 0);
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

