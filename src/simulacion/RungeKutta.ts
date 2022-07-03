export class RungeKutta {
  private matrizRK: number[][];

  // Definición de la ecuación diferencial.
  public ecuacionTiempoReparacion(s: number): number {
    return  31 * s + 5;
  }

  // Método que nos devuelve el tiempo de secado, utilizando el método de Runge-Kutta de 4to Orden.
  public getTiempoSecado(t0: number, s0: number, h: number): number {
    this.matrizRK = [];
    let fila: number[];
    let sCorte: number = 60;

    while (true) {
      if (s0 >= sCorte) break;
      fila = [];
      fila.push(t0, s0);

      let k1: number = this.ecuacionTiempoReparacion(s0);
      let k2: number = this.ecuacionTiempoReparacion(s0 + (k1*h/2));
      let k3: number = this.ecuacionTiempoReparacion(s0 + (k2*h/2));
      let k4: number = this.ecuacionTiempoReparacion(s0 + (k3*h));

      t0 = t0 + h;
      s0 = s0 + ((h/6) * (k1 + 2 * k2 + 2 * k3 + k4));

      fila.push(k1, k2, k3, k4, t0, s0);
      this.matrizRK.push(fila);
    }
    return this.matrizRK[this.matrizRK.length-1][6] * 60;
  }

  public getMatrizRK(): number[][] {
    return this.matrizRK;
  }
}