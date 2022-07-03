export module Utils {
  export function getMenorMayorACero(vec: number[]): number {
    let menor: number = vec[0];
    for (let i: number = 0; i < vec.length; i++) {
      if (vec[i] > 0 && menor <= 0) {
        menor = vec[i];
        continue;
      }
      if (vec[i] < menor && vec[i] > 0) menor = vec[i];
    }
    if (menor > 0) return menor;
    return -1;
  }

  export function getDistribucionExponencial(rnd: number, media: number): number {
    if (1 - rnd !== 0) return -media * Math.log(1 - rnd);
    return -media * Math.log(1 - rnd + 9e-16);
  }

  export function getDistribucionUniforme(rnd: number, a: number, b: number): number {
    return a + rnd * (b - a);
  }
}