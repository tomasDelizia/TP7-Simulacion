import { Utils } from "../utils/Utils";
import { Cliente } from "./Cliente";
import { EstadoZapatero } from "./EstadoZapatero";
import { ParZapatos } from "./ParZapatos";

export class Zapatero {
  private _estado: EstadoZapatero;
  private recibePedidos: boolean;

  private rndLlegada = -1;
  private tiempoEntreLlegadas = -1;
  private proximaLlegada = -1;

  private colaClientes: Cliente[] = [];
  private clienteEnAtencion: Cliente;
  private rndObjetivoVisita: number = -1;
  private objetivoVisita: string = ''; 
  private rndAtencion: number = -1;
  private tiempoAtencion: number = -1;
  private finAtencion: number = -1;
  private acumuladorTiempoAtencion: number = 0;
  private cantClientesAtendidos: number = 0;
  private cantClientesRechazados: number = 0;
  private cantClientesIngresadosAlSistema: number = 0;
  private _cantMaxClientesEnCola: number = 0;
  private _tiempoPromedioAtencion: number = 0;
  private _porcentajeClientesRechazados: number = 0;

  private colaZapatosAReparar: ParZapatos[] = [];
  private colaZapatosListos: ParZapatos[] = [];
  private parZapatosEnReparacion: ParZapatos;
  private parZapatosPausadosEnReparacion: ParZapatos;
  private rndReparacion: number = -1;
  private tiempoReparacion: number = -1;
  private tiempoSecado: number = -1;
  private finReparacion: number = -1;
  private tiempoRemanenteReparacion: number = -1;
  private cantZapatosReparados: number = 0;
  private acumuladorTiempoReparacion: number = 0;
  private cantZapatosIngresadosAlSistema: number = 0;
  private _cantMaxZapatosEnColaReparacion: number = 0;
  private _tiempoPromedioReparacion: number = 0;

  constructor(
    private readonly mediaLlegadaClientes: number,
    private readonly probObjetivosVisita: number[],
    private readonly tiempoAtencionClienteA: number,
    private readonly tiempoAtencionClienteB: number,
    private readonly tiempoReparacionZapatosA: number,
    private readonly tiempoReparacionZapatosB: number,
    private readonly tiempoSecadoRK: number
    ) {}

  public iniciarSimulacion(reloj: number): void {
    this.iniciarJornada(reloj);
    // Carga de condiciones iniciales.
    for (let i: number = 1; i <= 10; i++) {
      this.cantZapatosIngresadosAlSistema++;
      let parZapatosReparados: ParZapatos = new ParZapatos(i, -1);
      parZapatosReparados.terminarReparacion();
      this.colaZapatosListos.push(parZapatosReparados);
    }
  }

  public iniciarJornada(reloj: number): void {
    this.liberar();
    this.habilitarRecepcionPedidos();

    // C??lculo de la pr??xima llegada.
    this.rndLlegada = Math.random();
    this.tiempoEntreLlegadas = this.getTiempoEntreLlegadas(this.rndLlegada);
    this.proximaLlegada = reloj + this.tiempoEntreLlegadas;
  }

  public resetearTiempos(): void {
    this.rndLlegada = -1;
    this.tiempoEntreLlegadas = -1;
    this.rndObjetivoVisita = -1;
    this.objetivoVisita = "";
    this.rndAtencion = -1;
    this.tiempoAtencion = -1;
    this.rndReparacion = -1;
    this.tiempoReparacion = -1;
    this.tiempoSecado = -1;
  }

  // Se actualizan las m??tricas en cada iteraci??n.
  public actualizarMetricasColas(): void {
    this._cantMaxZapatosEnColaReparacion = Math.max(this.colaZapatosAReparar.length, this._cantMaxZapatosEnColaReparacion);

    this._cantMaxClientesEnCola = Math.max(this.colaClientes.length, this._cantMaxClientesEnCola);
  }

  // Se calculan las m??tricas finales.
  public calcularMetricas(reloj: number): void {
    // Acumulamos los tiempos de atenci??n para los clientes que quedaron en el sistema.
    if (this.hayClienteEnAtencion()) this.acumuladorTiempoAtencion += reloj - this.clienteEnAtencion.minutoLlegada;
    for (let i: number = 0; i < this.colaClientes.length; i++) this.acumuladorTiempoAtencion += reloj - this.colaClientes[i].minutoLlegada;

    // Acumulamos los tiempos de reparaci??n para los zapatos que quedaron en el sistema.
    if (this.hayZapatosEnReparacion()) this.acumuladorTiempoReparacion += reloj - this.parZapatosEnReparacion.minutoLlegada;
    if (this.hayZapatosPausadosEnReparacion()) this.acumuladorTiempoReparacion += reloj - this.parZapatosPausadosEnReparacion.minutoLlegada;
    for (let i: number = 0; i < this.colaZapatosAReparar.length; i++) this.acumuladorTiempoReparacion += reloj - this.colaZapatosAReparar[i].minutoLlegada;


    if (this.cantZapatosReparados > 0) this._tiempoPromedioReparacion = this.acumuladorTiempoReparacion / this.cantZapatosReparados;

    if ((this.cantClientesAtendidos + this.cantClientesRechazados) > 0) this._tiempoPromedioAtencion = this.acumuladorTiempoAtencion / (this.cantClientesAtendidos + this.cantClientesRechazados);

    if ((this.cantClientesAtendidos + this.cantClientesRechazados) > 0)
    this._porcentajeClientesRechazados = this.cantClientesRechazados / (this.cantClientesAtendidos + this.cantClientesRechazados) * 100;
  }

  public habilitarRecepcionPedidos(): void {
    this.recibePedidos = true;
  }

  public detenerRecepcionPedidos(): void {
    this.recibePedidos = false;
  }

  public estaRecibiendoPedidos(): boolean {
    return this.recibePedidos;
  }

  public liberar(): void {
    this._estado = EstadoZapatero.LIBRE;
  }

  public estaLibre(): boolean {
    return this._estado === EstadoZapatero.LIBRE;
  }

  public estaAtendiendo(): boolean {
    return this._estado === EstadoZapatero.ATENDIENDO;
  }

  public estaReparando(): boolean {
    return this._estado === EstadoZapatero.REPARANDO;
  }

  public estaParaAtender(): boolean {
    return this.estaLibre() || this.estaReparando();
  }

  // C??lculo del tiempo entre llegadas, que tiene distribuci??n exponencial.
  public getTiempoEntreLlegadas(rndLlegada: number): number {
    return Utils.getDistribucionExponencial(rndLlegada, this.mediaLlegadaClientes);
  }

  // Obtenci??n del objetivo de la visita del cliente, seg??n la probabilidad asociada.
  public getObjetivoVisita(rndObjetivo: number): string {
    if (rndObjetivo < this.probObjetivosVisita[0]) return "Retirar";
    return "Dejar";
  }

  // C??lculo del tiempo de atenci??n de cliente, que tiene distribuci??n uniforme.
  public getTiempoAtencion(rndAtencion: number): number {
    return Utils.getDistribucionUniforme(rndAtencion, this.tiempoAtencionClienteA, this.tiempoAtencionClienteB);
  }

  // C??lculo del tiempo de reparaci??n, que tiene distribuci??n uniforme.
  public getTiempoReparacion(rndReparacion: number): number {
    return Utils.getDistribucionUniforme(rndReparacion, this.tiempoReparacionZapatosA, this.tiempoReparacionZapatosB);
  }

  public get estado(): string {
    return EstadoZapatero[this._estado];
  }

  public get eventosCandidatos(): number[] {
    return [this.proximaLlegada, this.finAtencion, this.finReparacion];
  }

  public get cantClientesEnSistema(): number {
    let cont: number = 0;
    if (this.hayClienteEnAtencion()) cont++;
    cont += this.colaClientes.length;
    return cont;
  }

  public get cantParZapatosEnSistema(): number {
    let cont: number = 0;
    if (this.hayZapatosEnReparacion()) cont++;
    if (this.hayZapatosPausadosEnReparacion()) cont++;
    cont += this.colaZapatosAReparar.length;
    cont += this.colaZapatosListos.length;
    return cont;
  }

  public get datosEvento(): string[] {
    let datosEvento: string[] = [];
    datosEvento.push(
      this.rndLlegada.toFixed(2),
      this.tiempoEntreLlegadas.toFixed(2),
      this.proximaLlegada.toFixed(2),

      this.rndObjetivoVisita.toFixed(2),
      this.objetivoVisita,
      this.rndAtencion.toFixed(2),
      this.tiempoAtencion.toFixed(2),
      this.finAtencion.toFixed(2),

      this.rndReparacion.toFixed(2),
      this.tiempoReparacion.toFixed(2),
      this.tiempoSecado.toFixed(2),
      this.finReparacion.toFixed(2),

      this.estado,
      this.estaRecibiendoPedidos() ? 'S??' : 'No',
      this.colaClientes.length.toString(),
      this.tiempoRemanenteReparacion.toFixed(2),
      this.colaZapatosAReparar.length.toString(),
      this.colaZapatosListos.length.toString(),

      this.acumuladorTiempoReparacion.toFixed(2),
      this.cantZapatosReparados.toString(),
      this._cantMaxZapatosEnColaReparacion.toString(),
      this.acumuladorTiempoAtencion.toFixed(2),
      this.cantClientesAtendidos.toString(),
      this.cantClientesRechazados.toString(),
      this._cantMaxClientesEnCola.toString()
    );
    return datosEvento;
  }

  public get datosClientesEnSistema(): string[] {
    let datosClientesEnSistema: string[] = [];
    if (this.hayClienteEnAtencion()) datosClientesEnSistema = datosClientesEnSistema.concat(this.clienteEnAtencion.datos);
    for (let i: number = 0; i < this.colaClientes.length; i++) datosClientesEnSistema = datosClientesEnSistema.concat(this.colaClientes[i].datos);
    return datosClientesEnSistema;
  }

  public get datosParZapatosEnSistema(): string[] {
    let datosParZapatosEnSistema: string[] = [];
    for (let i: number = 0; i < this.colaZapatosListos.length; i++) datosParZapatosEnSistema = datosParZapatosEnSistema.concat(this.colaZapatosListos[i].datos);
    if (this.hayZapatosEnReparacion()) datosParZapatosEnSistema = datosParZapatosEnSistema.concat(this.parZapatosEnReparacion.datos);
    if (this.hayZapatosPausadosEnReparacion()) datosParZapatosEnSistema = datosParZapatosEnSistema.concat(this.parZapatosPausadosEnReparacion.datos);
    for (let i: number = 0; i < this.colaZapatosAReparar.length; i++) datosParZapatosEnSistema = datosParZapatosEnSistema.concat(this.colaZapatosAReparar[i].datos);
    return datosParZapatosEnSistema;
  }

  public get tiempoPromedioAtencion(): number {
    return this._tiempoPromedioAtencion;
  }

  public get tiempoPromedioReparacion(): number {
    return this._tiempoPromedioReparacion;
  }

  public get porcentajeClientesRechazados(): number {
    return this._porcentajeClientesRechazados;
  }

  public get cantMaxClientesEnCola(): number {
    return this._cantMaxClientesEnCola;
  }

  public get cantMaxZapatosEnColaReparacion(): number {
    return this._cantMaxZapatosEnColaReparacion;
  }


  // ATENCI??N DE CLIENTES

  public hayClienteEnAtencion(): boolean {
    return this.clienteEnAtencion != null;
  }

  public hayClientesParaAtender(): boolean {
    return this.colaClientes.length > 0;
  }

  public atendiendo(): void {
    this._estado = EstadoZapatero.ATENDIENDO;
  }

  // Generamos la llegada del pr??ximo cliente.
  public generarProximaLlegada(reloj: number): void {
    this.rndLlegada = Math.random();
    this.tiempoEntreLlegadas = this.getTiempoEntreLlegadas(this.rndLlegada);
    this.proximaLlegada = reloj + this.tiempoEntreLlegadas;
  }

  // Generamos el tiempo de atenci??n.
  public generarFinAtencion(reloj: number): void {
    this.rndAtencion = Math.random();
    this.tiempoAtencion = this.getTiempoAtencion(this.rndAtencion);
    this.finAtencion = reloj + this.tiempoAtencion;
  }

  // Calculamos el tiempo de reparaci??n.
  public generarFinReparacion(reloj: number): void {
    this.rndReparacion = Math.random();
    this.tiempoReparacion = this.getTiempoReparacion(this.rndReparacion);
    this.tiempoSecado = this.tiempoSecadoRK;
    this.finReparacion = reloj + this.tiempoReparacion + this.tiempoSecado;
  }

  // M??todo para recibir una llegada de un cliente nuevo al sistema.
  public recibirNuevoCliente(reloj: number): void {
    this.generarProximaLlegada(reloj);
    
    // Obtenemos el objetivo de la visita.
    this.rndObjetivoVisita = Math.random();
    this.objetivoVisita = this.getObjetivoVisita(this.rndObjetivoVisita);

    // Actualizamos contador de clientes que alguna vez ingresaron al sistema.
    this.cantClientesIngresadosAlSistema++;

    // Creamos el objeto cliente.
    let nuevoCliente: Cliente = new Cliente(this.cantClientesIngresadosAlSistema, reloj);

    switch (this.objetivoVisita) {
      // Llega un cliente que quiere retirar un par de zapatos reparados.
      case "Retirar": {
        // Preguntamos si el zapatero puede atender (est?? libre o reparando) y si hay zapatos para retirar.
        if (this.estaParaAtender() && this.hayZapatosParaRetirar()) {
          // Si estaba reparando, deja la reparaci??n pendiente y atiende al cliente.
          if (this.estaReparando()) this.pausarReparacion(reloj);
          this.clienteEnAtencion = nuevoCliente;
          nuevoCliente.retirandoZapatos();
          this.atendiendo();

          this.generarFinAtencion(reloj);
        }
        // No hay zapatos para retirar, se rechaza el cliente.
        else if (!this.hayZapatosParaRetirar()) this.cantClientesRechazados++;
        // Si estaba atendiendo otro cliente, va a la cola.
        else {
          nuevoCliente.enEsperaRetiro();
          this.colaClientes.push(nuevoCliente);
        }
        break;
      }

      // Llega un cliente que quiere realizar un pedido de reparaci??n de un par de zapatos.
      case "Dejar": {
        // Preguntamos si el zapatero est?? libre o reparando, y si est?? recibiendo pedidos.
        if (this.estaParaAtender() && this.estaRecibiendoPedidos()) {
          // Si estaba reparando, deja la reparaci??n pendiente y atiende al cliente.
          if (this.estaReparando()) this.pausarReparacion(reloj);
          this.clienteEnAtencion = nuevoCliente;
          nuevoCliente.haciendoPedido();
          this.atendiendo();

          this.generarFinAtencion(reloj);
        }
        // Si estaba atendiendo otro cliente, va a la cola.
        else if (this.estaAtendiendo() && this.estaRecibiendoPedidos()) {
          nuevoCliente.enEsperaPedido();
          this.colaClientes.push(nuevoCliente);
        }
        // No est?? recibiendo pedidos, se va del sistema.
        else this.cantClientesRechazados++;
        break;
      }
    }
  }

  public finalizarAtencionCliente(reloj: number): void {
    this.finAtencion = -1;
    let clienteAtendido: Cliente = this.clienteEnAtencion;

    // Actualizamos el contador de clientes atendidos con ??xito y el acumulador de tiempo de atenci??n.
    this.cantClientesAtendidos++;
    this.acumuladorTiempoAtencion += reloj - clienteAtendido.minutoLlegada;

    // El cliente siendo atendido estaba retirando un par de zapatos.
    if (clienteAtendido.estaRetirandoZapatos()) this.colaZapatosListos.shift();
    // El cliente siendo atendido estaba haciendo un pedido de reparaci??n.
    else this.recibirParZapatos(reloj);

    // Eliminamos al cliente atendido del sistema.
    this.clienteEnAtencion = null;

    // Iteramos hasta poder atender a un cliente.
    while (true) {
      // Preguntamos si hay nadie en la cola para atender.
      if (this.hayClientesParaAtender()) {
        // Quitamos un cliente de la cola y cambiamos su estado, seg??n su estado actual.
        let clientePorAtender: Cliente = this.colaClientes.shift();

        // El cliente estaba esperando retirar un par de zapatos.
        if (clientePorAtender.estaEsperandoRetirarPedido()) {
          // Preguntamos si hay zapatos para retirar.
          if (this.hayZapatosParaRetirar()) {
            clientePorAtender.retirandoZapatos();
            this.clienteEnAtencion = clientePorAtender;
            this.generarFinAtencion(reloj);

            // El zapatero pasa de ocupado a ocupado.
            this.atendiendo();
            break;
          }
          // No hay zapatos para retirar, se rechaza el cliente.
          else this.cantClientesRechazados++;
        }
        // El cliente estaba esperando hacer un pedido de zapatos.
        else {
          clientePorAtender.haciendoPedido();
          this.clienteEnAtencion = clientePorAtender;
          this.generarFinAtencion(reloj);

          // El zapatero pasa de ocupado a ocupado.
          this.atendiendo();
          break;
        }
      }
      // No hay nadie en la cola.
      else {
        // Verificamos si hab??a un par de zapatos siendo reparado antes de que llegara el cliente.
        if (this.hayZapatosPausadosEnReparacion()) this.reanudarReparacion(reloj);
        else {
          // Si no, preguntamos si hay zapatos por reparar.
          if (this.hayZapatosParaReparar()) this.repararParZapatos(reloj);
          else this.liberar();
        }
        break;
      }
    }
    
  }


  // REPARACI??N DE ZAPATOS.

  public hayZapatosParaRetirar(): boolean {
    return this.colaZapatosListos.length > 0;
  }

  public hayZapatosParaReparar(): boolean {
    return this.colaZapatosAReparar.length > 0;
  }

  public hayZapatosEnReparacion(): boolean {
    return this.parZapatosEnReparacion != null;
  }

  public hayZapatosPausadosEnReparacion(): boolean {
    return this.parZapatosPausadosEnReparacion != null;
  }

  // Ingresa un nuevo par de zapatos al sistema.
  public recibirParZapatos(reloj: number): void {
    this.cantZapatosIngresadosAlSistema++;
    let nuevoParZapatos: ParZapatos = new ParZapatos(this.cantZapatosIngresadosAlSistema, reloj);
    nuevoParZapatos.esperandoReparacion();
    this.colaZapatosAReparar.push(nuevoParZapatos);
  }

  // Quitamos un par de zapatos de la cola y cambiamos su estado.
  public repararParZapatos(reloj: number): void {
    this.parZapatosEnReparacion = this.colaZapatosAReparar.shift();
    this.reparando();
    this.parZapatosEnReparacion.enReparacion();
    
    this.generarFinReparacion(reloj);
  }

  public reparando(): void {
    this._estado = EstadoZapatero.REPARANDO;
  }

  // Al par de zapatos que estaba siendo reparado le actualizamos su estado.
  public pausarReparacion(reloj: number): void {
    // C??lculo del tiempo remanente de reparaci??n.
    this.tiempoRemanenteReparacion = this.finReparacion - reloj;
    this.finReparacion = -1;

    this.parZapatosPausadosEnReparacion = this.parZapatosEnReparacion;
    this.parZapatosEnReparacion = null;
    this.parZapatosPausadosEnReparacion.pausarReparacion();
  }

  // Al par de zapatos que estaba en pausa le actualizamos su estado.
  public reanudarReparacion(reloj: number): void {
    this.parZapatosEnReparacion = this.parZapatosPausadosEnReparacion;
    this.parZapatosPausadosEnReparacion = null;

    this.finReparacion = reloj + this.tiempoRemanenteReparacion;
    this.tiempoRemanenteReparacion = -1;
    this.parZapatosEnReparacion.enReparacion();
    this.reparando();
  }

  // Buscamos el par de zapatos que estaba en reparaci??n, le cambiamos el estado y lo agregamos a la cola de zapatos listos para retirar.
  public finalizarReparacion(reloj: number): void {
    this.finReparacion = -1;
    let parZapatosReparado: ParZapatos = this.parZapatosEnReparacion;
    parZapatosReparado.terminarReparacion();
    this.colaZapatosListos.push(this.parZapatosEnReparacion);
    this.parZapatosEnReparacion = null;

    // Actualizamos el acumulador de tiempo de reparaci??n de zapatos y el contador de zapatos reparados (ignoramos los primeros 10).
    if (parZapatosReparado.idPar > 10) {
      this.acumuladorTiempoReparacion += reloj - parZapatosReparado.minutoLlegada;
      this.cantZapatosReparados++;
    }

    // Preguntamos si hay zapatos por reparar.
    if (this.hayZapatosParaReparar()) this.repararParZapatos(reloj);
    else this.liberar();
  }
}