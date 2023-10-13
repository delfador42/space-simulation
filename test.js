

function dotProduct(gradient, x) {
  return gradient * x;
}

const x0 = Math.floor(x);  // Lower grid point = 2
const x1 = x0 + 1;  // Upper grid point = 3

const dot0 = dotProduct(gradients[x0], x - x0);  // dotProduct(-1, 0.3)
const dot1 = dotProduct(gradients[x1], x - x1);  // dotProduct(1, -0.7)



function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

const t = x - x0;  // Fractional part = 0.3




function perlinNoise(x, gradients) {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const t = x - x0;

  const dot0 = dotProduct(gradients[x0], x - x0);
  const dot1 = dotProduct(gradients[x1], x - x1);

  return lerp(dot0, dot1, t);
}

const gradients = [-1, 1, -1, 1, -1];
const x = 2.3;
const noiseValue = perlinNoise(x, gradients);



