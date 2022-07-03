import { Zapatero } from "../modelo/Zapatero";
import { TipoEvento } from "../modelo/TipoEvento";
import { Utils } from "../utils/Utils";

export class Simulador {
  private _matrizEventos: string[][];
  private _matrizClientes: string[][];
  private _matrizZapatos: string[][];

  private _cantMaxClientesAMostrar: number = 0;
  private _cantMaxParZapatosAMostrar: number = 0;

  private _tiempoPromedioReparacion: number = 0;
  private _cantMaxZapatosEnColaReparacion: number = 0;
  private _cantMaxClientesEnCola: number = 0;
  private _tiempoPromedioAtencion: number = 0;
  private _porcentajeClientesRechazados: number = 0;

  public constructor(
    private readonly mediaLlegadaClientes: number,
    private readonly probObjetivosVisita: number[],
    private readonly tiempoAtencionClienteA: number,
    private readonly tiempoAtencionClienteB: number,
    private readonly tiempoReparacionZapatosA: number,
    private readonly tiempoReparacionZapatosB: number,
    private readonly tiempoSecado: number
  ) {}

  public simular(
    cantEventos: number,
    eventoDesde: number,
    ): void {
    this._matrizEventos = [];
    this._matrizClientes = [];
    this._matrizZapatos = [];
    this._cantMaxClientesAMostrar = 0;
    this._cantMaxParZapatosAMostrar = 0;

    // Definimos el rango de filas que vamos a mostrar.
    let indiceHasta: number = eventoDesde + 399;
    if (indiceHasta > cantEventos - 1) indiceHasta = cantEventos;

    // Vector de estado de la iteración actual.
    let evento: string[];
    let clientesEvento: string[];
    let zapatosEvento: string[];

    let tipoEvento: TipoEvento;
    let reloj: number = 0;
    let relojHoras: Date = new Date();
    let dia: number = 1;

    // Zapatero.
    let zapatero: Zapatero;

    for (let i: number = 0; i < cantEventos; i++) {
      evento = [];
      clientesEvento = [];
      zapatosEvento = [];

      // El evento es el inicio de la simulación.
      if (i === 0) tipoEvento = TipoEvento.INICIO_SIMULACION;

      // El evento es el fin de la simulación.
      else if (i === cantEventos - 1) tipoEvento = TipoEvento.FIN_SIMULACION;

      // El evento es un inicio de jornada: no se reciben pedidos y ya no hay zapatos para reparar, así que comienza un nuevo día a las 8hs.
      else if (!zapatero.estaRecibiendoPedidos() && zapatero.estaLibre() && !zapatero.hayZapatosParaRetirar()) tipoEvento = TipoEvento.INICIO_JORNADA;

      else {
        let eventosCandidatos: number[] = zapatero.eventosCandidatos;
        reloj = Utils.getMenorMayorACero(eventosCandidatos);
        tipoEvento = this.getSiguienteEvento(eventosCandidatos);
      }

      // El evento es un fin de recepción de pedidos: todos los días a las 16hs.
      if (reloj >= 480 && zapatero.estaRecibiendoPedidos()) tipoEvento = TipoEvento.FIN_RECEPCION_PEDIDOS;

      // Actualizamos el reloj en formato hh:mm:ss.
      relojHoras.setHours(8, reloj, (reloj - Math.trunc(reloj)) * 60);

      switch (tipoEvento) {
        // Inicio de la simulación.
        case TipoEvento.INICIO_SIMULACION: {
          // El reloj inicia a las 8hs.
          relojHoras.setHours(8, 0, 0);

          zapatero = new Zapatero(
            this.mediaLlegadaClientes,
            this.probObjetivosVisita,
            this.tiempoAtencionClienteA,
            this.tiempoAtencionClienteB,
            this.tiempoReparacionZapatosA,
            this.tiempoReparacionZapatosB,
            this.tiempoSecado);
          zapatero.iniciarSimulacion(reloj);
          break;
        }

        // Llegada de un cliente.
        case TipoEvento.LLEGADA_CLIENTE: {
          zapatero.recibirNuevoCliente(reloj);
          break;
        }

        // Fin de atención de cliente.
        case TipoEvento.FIN_ATENCION: {
          zapatero.finalizarAtencionCliente(reloj);
          break;
        }

        // Fin de reparación de un par de zapatos.
        case TipoEvento.FIN_REPARACION: {    
          zapatero.finalizarReparacion(reloj);
          break;
        }

        // Fin de recepción pedidos.
        case TipoEvento.FIN_RECEPCION_PEDIDOS: {
          reloj = 480;
          relojHoras.setHours(16, 0, 0);
          zapatero.detenerRecepcionPedidos();
          break;
        }

        // Inicio de una nueva jornada a las 8hs.
        case TipoEvento.INICIO_JORNADA: {
          dia++;
          reloj = 0;
          relojHoras.setHours(8, 0, 0);
          zapatero.iniciarJornada(reloj);
          break;
        }

        // Fin de simulación.
        case TipoEvento.FIN_SIMULACION: {
          // Calculamos las métricas para la última iteración.
          zapatero.calcularMetricas(reloj);

          this._tiempoPromedioReparacion = zapatero.tiempoPromedioReparacion;

          this._cantMaxZapatosEnColaReparacion = zapatero.cantMaxZapatosEnColaReparacion;
          this._cantMaxClientesEnCola = zapatero.cantMaxClientesEnCola;

          this._tiempoPromedioAtencion = zapatero.tiempoPromedioAtencion;

          this._porcentajeClientesRechazados = zapatero.porcentajeClientesRechazados;
          break;
        }
      }

      zapatero.actualizarMetricasColas();

      // Cargamos la matriz de estado a mostrar solo para el rango pasado por parámetro.
      if ((i >= eventoDesde && i <= indiceHasta) || i == cantEventos-1) {
        evento.push(
          i.toString(),
          TipoEvento[tipoEvento],
          dia.toString(),
          reloj.toFixed(2),
          relojHoras.toTimeString().substring(0,8),
        );
        evento = evento.concat(zapatero.datosEvento);

        clientesEvento = zapatero.datosClientesEnSistema;

        zapatosEvento = zapatero.datosParZapatosEnSistema;

        this._matrizEventos.push(evento);
        this._matrizClientes.push(clientesEvento);
        this._matrizZapatos.push(zapatosEvento);

        // Actualizamos la cantidad máxima de pasajeros que hubo en el sistema para las filas a mostrar.
        this._cantMaxClientesAMostrar = Math.max(zapatero.cantClientesEnSistema, this._cantMaxClientesAMostrar);

        // Actualizamos la cantidad máxima de pares de zapatos que hubo en el sistema para las filas a mostrar.
        this._cantMaxParZapatosAMostrar = Math.max(zapatero.cantParZapatosEnSistema, this._cantMaxParZapatosAMostrar);
      }
      zapatero.resetearTiempos();
    }
  }

  // Método que devuelve el evento que sigue, dados los tiempos de los eventos candidatos.
  private getSiguienteEvento(tiemposEventos: number[]): TipoEvento {
    let menor: number = Utils.getMenorMayorACero(tiemposEventos);
    for (let i: number = 0; i < tiemposEventos.length; i++) {
      if (tiemposEventos[i] === menor) return TipoEvento[TipoEvento[i+1]];
    }
    return -1;
  }

  public get matrizEstado(): string[][] {
    return this._matrizEventos;
  }

  public get matrizClientes(): string[][] {
    return this._matrizClientes;
  }

  public get matrizZapatos(): string[][] {
    return this._matrizZapatos;
  }

  public get tiempoPromedioReparacion(): number {
    return this._tiempoPromedioReparacion;
  }

  public get cantMaxZapatosEnColaReparacion(): number {
    return this._cantMaxZapatosEnColaReparacion;
  }

  public get cantMaxClientesEnCola(): number {
    return this._cantMaxClientesEnCola;
  }

  public get tiempoPromedioAtencion(): number {
    return this._tiempoPromedioAtencion;
  }

  public get porcentajeClientesRechazados(): number {
    return this._porcentajeClientesRechazados;
  }

  // Devuelve la máxima cantidad de clientes que hubo en algún momento en el sistema para el intervalo de iteraciones a mostrar.
  public get cantMaxClientesAMostrar(): number {
    return this._cantMaxClientesAMostrar;
  }

  // Devuelve la máxima cantidad de pares de zapatos que hubo en algún momento en el sistema para el intervalo de iteraciones a mostrar.
  public get cantMaxParZapatosAMostrar(): number {
    return this._cantMaxParZapatosAMostrar;
  }
}