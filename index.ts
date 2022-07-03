import { RungeKutta } from './src/simulacion/RungeKutta';
import { Simulador } from './src/simulacion/Simulador';
import { HTMLUtils } from './src/utils/HTMLUtils';
import './style.css';

// Definición de los cuadros de texto de la interfaz de usuario.
const txtCantEventos: HTMLInputElement = document.getElementById('txtCantEventos') as HTMLInputElement;
const txtEventoDesde: HTMLInputElement = document.getElementById('txtEventoDesde') as HTMLInputElement;
const txtProbRetiro: HTMLInputElement = document.getElementById('txtProbRetiro') as HTMLInputElement;
const txtProbPedido: HTMLInputElement = document.getElementById('txtProbPedido') as HTMLInputElement;

const txtMediaLlegadaClientes: HTMLInputElement = document.getElementById('txtMediaLlegadaClientes') as HTMLInputElement;

const txtTiempoAtencionClienteA: HTMLInputElement = document.getElementById('txtTiempoAtencionClienteA') as HTMLInputElement;
const txtTiempoAtencionClienteB: HTMLInputElement = document.getElementById('txtTiempoAtencionClienteB') as HTMLInputElement;

const txtTiempoReparacionZapatosA: HTMLInputElement = document.getElementById('txtTiempoReparacionZapatosA') as HTMLInputElement;
const txtTiempoReparacionZapatosB: HTMLInputElement = document.getElementById('txtTiempoReparacionZapatosB') as HTMLInputElement;

// Definición de las alertas para mostrar las métricas.
const alertTiempoPromedioReparacion: HTMLDivElement = document.getElementById('alertTiempoPromedioReparacion') as HTMLDivElement;
const alertCantMaxColaZapatos: HTMLDivElement = document.getElementById('alertCantMaxColaZapatos') as HTMLDivElement;
const alertTiempoPromedioAtencionClientes: HTMLDivElement = document.getElementById('alertTiempoPromedioAtencionClientes') as HTMLDivElement;
const alertPorcentajeClientesRechazados: HTMLDivElement = document.getElementById('alertPorcentajeClientesRechazados') as HTMLDivElement;
const alertCantMaxColaClientes: HTMLDivElement = document.getElementById('alertCantMaxColaClientes') as HTMLDivElement;


// Definición de la secciones.
const divTablaSimulacion: HTMLDivElement = document.getElementById('divTablaSimulacion') as HTMLDivElement;
const divRungeKutta: HTMLDivElement = document.getElementById('divRungeKutta') as HTMLDivElement;

// Definición de la tablas de simulación de colas.
const tablaSimulacion: HTMLTableElement = document.getElementById('tablaSimulacion') as HTMLTableElement;
const cantEncabezadosTablaSimulacion = tablaSimulacion.rows[0].cells.length;
const cantSubEncabezadosTablaSimulacion = tablaSimulacion.rows[1].cells.length;
const indicesEventosCandidatos: number[] = [6, 11, 15];
const columnasClientes: string[] = ['N° Cliente', 'Estado', 'Minuto llegada'];
const columnasParZapatos: string[] = ['N° Par', 'Estado', 'Minuto llegada'];

// Definición de botones de la interfaz de usuario.
const btnSimular: HTMLButtonElement = document.getElementById('btnSimular') as HTMLButtonElement;
const btnRK: HTMLButtonElement = document.getElementById('btnRK') as HTMLButtonElement;

// Definición de los objetos que realizan la simulación de colas.
let simulador: Simulador;
let matrizEstado: string[][];
let matrizClientes: string[][];
let matrizZapatos: string[][];
let rungeKutta: RungeKutta = new RungeKutta();

// Definición de los parámetros.
let cantEventos: number;
let eventoDesde: number;

let probRetiro: number;
let probPedido: number;

let mediaLlegadaClientes: number;

let tiempoAtencionClienteA: number;
let tiempoAtencionClienteB: number;

let tiempoReparacionZapatosA: number;
let tiempoReparacionZapatosB: number;

//Ocultamos la seccion en donde esta la tabla.
HTMLUtils.ocultarSeccion(divTablaSimulacion);

// Detecta que el valor de la probabilidad de retiro de zapatos es ingresado por teclado y calcula la de pedido.
txtProbRetiro.addEventListener('input', () => {
  txtProbPedido.value = (1 - Number(txtProbRetiro.value)).toFixed(2);
});

// Detecta que el valor de la probabilidad de pedido de zapatos es ingresado por teclado y calcula la de retiro.
txtProbPedido.addEventListener('input', () => {
  txtProbRetiro.value = (1 - Number(txtProbPedido.value)).toFixed(2);
});

// Mostramos la tabla de Runge-Kutta.
btnRK.addEventListener('click', () => mostrarRK());

const mostrarRK = () => {
  HTMLUtils.mostrarSeccion(divRungeKutta);
  divRungeKutta.innerHTML = '';
  divRungeKutta.innerHTML += '<h1 class="text-center">Tabla de Runge-Kutta de tiempo de secado (t = 60 minutos):</h1>';
  let tiempoSecado: number = rungeKutta.getTiempoSecado(0, 0, 0.001);
  let tablaRK: number[][] = rungeKutta.getMatrizRK();
  let tablaRKHTML: string = HTMLUtils.crearTablaRK(tablaRK, 'S');
  divRungeKutta.innerHTML += tablaRKHTML;
  divRungeKutta.innerHTML += `
  <div class="mb-3 mx-3 row justify-content-center text-center">
  <div class="col-sm-auto alert alert-info mx-2" role="alert">Tiempo secado: ${tiempoSecado.toFixed(2)} minutos</div>
  </div>`;
}

// Mostramos la simulación.
btnSimular.addEventListener('click', () => {
  HTMLUtils.ocultarSeccion(divTablaSimulacion);
  HTMLUtils.ocultarSeccion(divRungeKutta);
  simular();
});

const simular = () => {
  // Validamos los parámetros ingresados por el usuario.
  if (!validarParametros()) return;

  // Mostramos las métricas.
  alertTiempoPromedioReparacion.innerHTML = 'Tiempo Promedio de Reparación de Par de Zapatos: ';
  alertCantMaxColaZapatos.innerHTML = 'Cantidad Máxima de Par de Zapatos a Reparar en la Cola: ';
  alertTiempoPromedioAtencionClientes.innerHTML = 'Tiempo Promedio de Atención de Clientes: ';
  alertPorcentajeClientesRechazados.innerHTML = 'Porcentaje de Clientes Rechazados: ';
  alertCantMaxColaClientes.innerHTML = 'Cantidad Máxima de Clientes en la Cola: ';

  let startTime: number = performance.now();
  HTMLUtils.limpiarTablaSimulacion(tablaSimulacion, cantEncabezadosTablaSimulacion, cantSubEncabezadosTablaSimulacion);
  console.log(`La limpieza tardó ${performance.now() - startTime} milisegundos`);

  // Realizamos la simulación.
  startTime = performance.now();
  rungeKutta = new RungeKutta();
  let tiempoSecado: number = rungeKutta.getTiempoSecado(0, 0, 0.001);

  simulador = new Simulador(
    mediaLlegadaClientes,
    [probRetiro, probPedido],
    tiempoAtencionClienteA,
    tiempoAtencionClienteB,
    tiempoReparacionZapatosA,
    tiempoReparacionZapatosB,
    tiempoSecado
  );
  simulador.simular(cantEventos, eventoDesde);

  console.log(`La simulación tardó ${performance.now() - startTime} milisegundos`);

  matrizEstado = simulador.matrizEstado;
  matrizClientes = simulador.matrizClientes;
  matrizZapatos = simulador.matrizZapatos;
  let cantMaxClientes: number = simulador.cantMaxClientesAMostrar;
  let cantMaxParZapatos: number = simulador.cantMaxParZapatosAMostrar;

  // Cargamos la tabla a mostrar.
  startTime = performance.now();
  HTMLUtils.agregarEncabezados(cantMaxClientes, tablaSimulacion, columnasClientes, 'Cliente');
  HTMLUtils.agregarEncabezados(cantMaxParZapatos, tablaSimulacion, columnasParZapatos, 'Par Zapatos');
  HTMLUtils.llenarTablaSimulacion(matrizEstado, matrizClientes, matrizZapatos, cantMaxClientes, cantMaxParZapatos, indicesEventosCandidatos, tablaSimulacion);

  // Cargamos métricas.
  alertTiempoPromedioReparacion.innerHTML += simulador.tiempoPromedioReparacion.toFixed(2) + ' minutos';
  alertCantMaxColaZapatos.innerHTML += simulador.cantMaxZapatosEnColaReparacion + ' zapatos';
  alertTiempoPromedioAtencionClientes.innerHTML += simulador.tiempoPromedioAtencion.toFixed(2) + ' minutos';
  alertPorcentajeClientesRechazados.innerHTML += simulador.porcentajeClientesRechazados.toFixed(2) + '%';
  alertCantMaxColaClientes.innerHTML += simulador.cantMaxClientesEnCola + ' clientes';

  console.log(`La renderización tardó ${performance.now() - startTime} milisegundos`);
  HTMLUtils.mostrarSeccion(divTablaSimulacion);
}

// Validación de los parámetros del usuario.
function validarParametros(): boolean {
  if (txtCantEventos.value === '' || txtEventoDesde.value === '') {
    alert('Tiene que ingresar todos los parámetros solicitados.');
    return false;
  }

  cantEventos = Number(txtCantEventos.value);
  eventoDesde = Number(txtEventoDesde.value);
  probRetiro = Number(txtProbRetiro.value);
  probPedido = Number(txtProbPedido.value);
  mediaLlegadaClientes = Number(txtMediaLlegadaClientes.value);
  tiempoAtencionClienteA = Number(txtTiempoAtencionClienteA.value);
  tiempoAtencionClienteB = Number(txtTiempoAtencionClienteB.value);
  tiempoReparacionZapatosA = Number(txtTiempoReparacionZapatosA.value);
  tiempoReparacionZapatosB = Number(txtTiempoReparacionZapatosB.value);

  if (cantEventos <= 0) {
    alert('La cantidad de eventos a generar debe ser mayor a cero.');
    return false;
  }

  if (eventoDesde < 0 || eventoDesde > cantEventos) {
    alert('El evento desde ingresado debe estar comprendido entre 0 y ' + cantEventos + '.');
    return false;
  }

  if (probRetiro < 0 || probRetiro > 1) {
    alert('El valor de probabilidad de hacer un retiro debe estar entre 0 y 1');
    return false;
  }

  if (probPedido < 0 || probPedido > 1) {
    alert('El valor de probabilidad de hacer un pedido debe estar entre 0 y 1');
    return false;
  }

  if (mediaLlegadaClientes <= 0) {
    alert('La media de la llegada de clientes debe ser mayor a cero.');
    return false;
  }

  if (tiempoAtencionClienteA >= tiempoAtencionClienteB) {
    alert('El valor de "B" del tiempo de atención de clientes debe ser mayor a "A".');
    return false;
  }

  if (tiempoReparacionZapatosA >= tiempoReparacionZapatosB) {
    alert('El valor de "B" del tiempo de reparación de zapatos debe ser mayor a "A".');
    return false;
  }

  return true;
}