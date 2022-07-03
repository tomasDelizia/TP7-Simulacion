import { EstadoParZapatos } from "./EstadoParZapatos";

export class ParZapatos {
  private _idPar: number;
  private _minutoLlegada: number;
  private _estado: EstadoParZapatos;

  public constructor(id: number, minutoLlegada: number) {
    this._idPar = id;
    this._minutoLlegada = minutoLlegada;
  }

  public enReparacion(): void {
    this._estado = EstadoParZapatos.EN_REPARACION;
  }

  public esperandoReparacion(): void {
    this._estado = EstadoParZapatos.ESPERANDO_REPARACION;
  }

  public pausarReparacion(): void {
    this._estado = EstadoParZapatos.REPARACION_PAUSADA;
  }

  public terminarReparacion(): void {
    this._estado = EstadoParZapatos.LISTOS;
  }

  public estaPausadoEnReparacion(): boolean {
    return this._estado === EstadoParZapatos.REPARACION_PAUSADA;
  }

  public estaEnReparacion(): boolean {
    return this._estado === EstadoParZapatos.EN_REPARACION;
  }

  public get estado(): string {
    return EstadoParZapatos[this._estado];
  }

  public get idPar(): number {
    return this._idPar;
  }

  public get minutoLlegada(): number {
    return this._minutoLlegada;
  }
}