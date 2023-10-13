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

    ctx.beginPath();
    points.forEach(function (p) {
      n.copy(p).add(o);
      var cp = curlNoise(n, scale, 1);
      p.add(cp);
      length = p.length();
      if (length > r0 * 0.45) return;

      //hyperbolic point
      x = p.x / (length + K) * r0;
      y = p.y / (length + K) * r0;

      ctx.moveTo(x, y);
      ctx.lineTo(x + 1, y);

      //bounds
      if (p.x > radius / 2) p.x -= radius;
      if (p.x < -radius / 2) p.x += radius;
      if (p.y > radius / 2) p.y -= radius;
      if (p.y < -radius / 2) p.y += radius;

        //respawn
        if (p.life-- < 0) {
            p.copy(p.origin);
            p.life = Math.random() * 100;
        }
    });
    ctx.stroke();
  }
  window.onload = raf;






/////////////////////////////////
/*
         * A speed-improved perlin and simplex noise algorithms for 2D.
         *
         * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
         * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
         * Better rank ordering method by Stefan Gustavson in 2012.
         * Converted to Javascript by Joseph Gentle.
         *
         * Version 2012-03-09
         *
         * This code was placed in the public domain by its original author,
         * Stefan Gustavson. You may use it as you see fit, but
         * attribution is appreciated.
         *https://github.com/josephg/noisejs
         */

(function (global) {
    var module = (global.noise = {});

    // Gradient vector with components x,y,z
    function Grad(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    Grad.prototype.dot2 = function (x, y) {
        return this.x * x + this.y * y;
    };

    Grad.prototype.dot3 = function (x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    };

    var grad3 = [
        new Grad(1, 1, 0),
        new Grad(-1, 1, 0),
        new Grad(1, -1, 0),
        new Grad(-1, -1, 0),
        new Grad(1, 0, 1),
        new Grad(-1, 0, 1),
        new Grad(1, 0, -1),
        new Grad(-1, 0, -1),
        new Grad(0, 1, 1),
        new Grad(0, -1, 1),
        new Grad(0, 1, -1),
        new Grad(0, -1, -1)
    ];

    // Permutation table an array of 256 integers
    /*
        The permutation table is used for hashing, a technique to map data of arbitrary
        size to fixed-size values. Hashing is essential for generating coherent noise
        patterns.
    */
    var p = [
        151,
        160,
        137,
        91,
        90,
        15,
        131,
        13,
        201,
        95,
        96,
        53,
        194,
        233,
        7,
        225,
        140,
        36,
        103,
        30,
        69,
        142,
        8,
        99,
        37,
        240,
        21,
        10,
        23,
        190,
        6,
        148,
        247,
        120,
        234,
        75,
        0,
        26,
        197,
        62,
        94,
        252,
        219,
        203,
        117,
        35,
        11,
        32,
        57,
        177,
        33,
        88,
        237,
        149,
        56,
        87,
        174,
        20,
        125,
        136,
        171,
        168,
        68,
        175,
        74,
        165,
        71,
        134,
        139,
        48,
        27,
        166,
        77,
        146,
        158,
        231,
        83,
        111,
        229,
        122,
        60,
        211,
        133,
        230,
        220,
        105,
        92,
        41,
        55,
        46,
        245,
        40,
        244,
        102,
        143,
        54,
        65,
        25,
        63,
        161,
        1,
        216,
        80,
        73,
        209,
        76,
        132,
        187,
        208,
        89,
        18,
        169,
        200,
        196,
        135,
        130,
        116,
        188,
        159,
        86,
        164,
        100,
        109,
        198,
        173,
        186,
        3,
        64,
        52,
        217,
        226,
        250,
        124,
        123,
        5,
        202,
        38,
        147,
        118,
        126,
        255,
        82,
        85,
        212,
        207,
        206,
        59,
        227,
        47,
        16,
        58,
        17,
        182,
        189,
        28,
        42,
        223,
        183,
        170,
        213,
        119,
        248,
        152,
        2,
        44,
        154,
        163,
        70,
        221,
        153,
        101,
        155,
        167,
        43,
        172,
        9,
        129,
        22,
        39,
        253,
        19,
        98,
        108,
        110,
        79,
        113,
        224,
        232,
        178,
        185,
        112,
        104,
        218,
        246,
        97,
        228,
        251,
        34,
        242,
        193,
        238,
        210,
        144,
        12,
        191,
        179,
        162,
        241,
        81,
        51,
        145,
        235,
        249,
        14,
        239,
        107,
        49,
        192,
        214,
        31,
        181,
        199,
        106,
        157,
        184,
        84,
        204,
        176,
        115,
        121,
        50,
        45,
        127,
        4,
        150,
        254,
        138,
        236,
        205,
        93,
        222,
        114,
        67,
        29,
        24,
        72,
        243,
        141,
        128,
        195,
        78,
        66,
        215,
        61,
        156,
        180
    ];
    // perm holds an extended permutation table, doubling length to remove the need for index wrapping
    // To remove the need for index wrapping, double the permutation table length
    var perm = new Array(512);

    // Holds gradient vectors
    var gradP = new Array(512);

    // This isn't a very good seeding function, but it works ok. It supports 2^16
    // different seed values. Write something better if you need more seeds.

    // This function seeds the noise generator. It takes an input seed and uses
    // it to shuffle the permutation table, thereby affecting the generated
    // noise pattern.

    /*
    The seeding function serves as the cornerstone of the noise generator,
    setting the initial conditions that dictate the pattern of the generated
    noise. It is a blend of bitwise operations, hashing, and array manipulation,
    designed to initialize the generator effectively.
    */
    module.seed = function (seed) {
        if (seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 655360;
        }

        // floor the seed to ensure it is an integer
        seed = Math.floor(seed);

        // Expand the seed into a larger integer, likely to improve randomness of permutation table
        if (seed < 256) {
            seed |= seed << 8;
        }

        /*
        A loop iterates over the permutation table p, using the seed to shuffle
        it. The shuffled table is stored in perm, and the corresponding gradient
        vectors are stored in gradP.


        The loop essentially performs a hashing operation, using the seed to shuffle the
        permutation table. This is crucial for generating different noise patterns based
        on the seed.
        */
        for (var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = p[i] ^ (seed & 255);
            } else {
                v = p[i] ^ ((seed >> 8) & 255);
            }

            perm[i] = perm[i + 256] = v;
            gradP[i] = gradP[i + 256] = grad3[v % 12];
        }
    };

    // initially seeded with a value of 0
    module.seed(0);

    // ##### Perlin noise stuff

    // This cubic function is used to create smooth transitions. It starts and
    // ends at 0, with its first and last derivatives also being 0, ensuring
    // smoothness.
    function fade(t) {
        // increasing '10' makes the pattern more of a grid
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // The formula for linear interpolation 
    function lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }


    // The noise value is calculated using gradient vectors and the fade and
    // lerp functions. This involves several dot products and interpolations,
    // designed to generate a smooth, coherent noise pattern.

    // 2D Perlin Noise
    // takes x and y coordinates as input and returns a noise value.
    module.perlin2 = function (x, y) {
        // Find unit grid cell containing point
        var X = Math.floor(x),
            Y = Math.floor(y);

        // Get relative xy coordinates of point within that cell
        x = x - X;
        y = y - Y;

        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255;
        Y = Y & 255;

        // Calculate noise contributions from each of the four corners
        var n00 = gradP[X + perm[Y]].dot2(x, y);
        var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
        var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
        var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

        // Compute the fade curve value for x
        var u = fade(x);


        // Interpolate the four results
        return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
    };
})(this);
