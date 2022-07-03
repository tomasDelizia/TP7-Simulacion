import { EstadoCliente } from "./EstadoCliente";

export class Cliente {
  private _idCliente: number;
  private _minutoLlegada: number;
  private _estado: EstadoCliente;

  public constructor(id: number, minutoLlegada: number) {
    this._idCliente = id;
    this._minutoLlegada = minutoLlegada;
  }

  public haciendoPedido(): void {
    this._estado = EstadoCliente.HACIENDO_PEDIDO;
  }

  public enEsperaPedido(): void {
    this._estado = EstadoCliente.ESPERANDO_HACER_PEDIDO;
  }

  public retirandoZapatos(): void {
    this._estado = EstadoCliente.RETIRANDO_ZAPATOS;
  }

  public enEsperaRetiro(): void {
    this._estado = EstadoCliente.ESPERANDO_RETIRO;
  }

  public estaSiendoAtendido(): boolean {
    return (this._estado === EstadoCliente.HACIENDO_PEDIDO || this._estado === EstadoCliente.RETIRANDO_ZAPATOS);
  }

  public estaEsperandoHacerPedido(): boolean {
    return this._estado === EstadoCliente.ESPERANDO_HACER_PEDIDO;
  }

  public estaEsperandoRetirarPedido(): boolean {
    return this._estado === EstadoCliente.ESPERANDO_RETIRO;
  }

  public estaRetirandoZapatos(): boolean {
    return this._estado === EstadoCliente.RETIRANDO_ZAPATOS;
  }

  public estaHaciendoPedido(): boolean {
    return this._estado === EstadoCliente.HACIENDO_PEDIDO;
  }

  public get estado(): string {
    return EstadoCliente[this._estado];
  }

  public get idCliente(): number {
    return this._idCliente;
  }

  public get minutoLlegada(): number {
    return this._minutoLlegada;
  }
}