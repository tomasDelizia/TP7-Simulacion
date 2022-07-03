import { Utils } from "./Utils";

export module HTMLUtils {

  // Función para ocultar un elemento div.
  export function ocultarSeccion(div: HTMLDivElement): void {
    div.style.display = 'none';
  }

  // Función para mostrar un elemento div.
  export function mostrarSeccion(div: HTMLDivElement): void {
    div.style.display = 'block';
  }

  // Función que elimina todas las filas de la tabla HTML excepto los encabezados.
  export function limpiarTablaSimulacion(tabla: HTMLTableElement, cantEncabezados: number, cantSubEncabezados: number) {
    for (let i: number = tabla.rows.length; i > 2; i--)
      tabla.deleteRow(i - 1);
 
    // Limpiamos los encabezados correspondientes a los pasajeros.
    for (let i: number = tabla.rows[0].cells.length; i > cantEncabezados; i--)
      tabla.rows[0].deleteCell(i - 1);

    for (let i: number = tabla.rows[1].cells.length; i > cantSubEncabezados; i--)
      tabla.rows[1].deleteCell(i - 1);  
  }

  // Crea una fila a una tabla html a partir de un vector pasado por parámetro.
  export function crearFilaTablaSimulacion(evento: string[], clientesEvento: string[], zapatosEvento: string[], cantClientes: number, cantZapatos: number, indicesColor: number[]): string {
    // Obtenemos el índice de la celda a pintar.
    let eventos: number[] = [];
    for (let i: number = 0; i < indicesColor.length; i++) eventos.push(Number(evento[indicesColor[i]]));
    let eventoMenor: number = Utils.getMenorMayorACero(eventos);
    let indiceEventoMenor: number;
    for (let i: number = 0; i < indicesColor.length; i++) {
      if (Number(evento[indicesColor[i]]) === eventoMenor) indiceEventoMenor = indicesColor[i];
    }

    // Creamos la fila.
    let filaHTML: string = "<tr>";
    // Iteramos el evento.
    for (let i: number = 0; i < evento.length; i++) {
      let celdaHTML: string;
      if (i === indiceEventoMenor) celdaHTML = crearCeldaHTML(evento[i], true);
      else celdaHTML = crearCeldaHTML(evento[i], false);
      filaHTML += celdaHTML;
    }
    // Iteramos los clientes del evento.
    for (let i: number = 0; i < cantClientes * 3; i++) {
      let celdaHTML: string;
      if (i < clientesEvento.length) celdaHTML = crearCeldaHTML(clientesEvento[i], false);
      else celdaHTML = "<td>-</td>";
      filaHTML += celdaHTML;
    }
    // Iteramos los pares de zapatos del evento.
    for (let i: number = 0; i < cantZapatos * 3; i++) {
      let celdaHTML: string;
      if (i < zapatosEvento.length) celdaHTML = crearCeldaHTML(zapatosEvento[i], false);
      else celdaHTML = "<td>-</td>";
      filaHTML += celdaHTML;
    }
    filaHTML += "</tr>"
    return filaHTML;
  }

  function crearCeldaHTML(valorCelda: string, correspondeColor: boolean): string {
    let celdaHTML: string = "<td";
    // Pintamos la celda si corresponde.
    if (correspondeColor) celdaHTML += ' style="color: red"';
    celdaHTML += ">";
    let celda: string = !(typeof valorCelda === 'undefined' || valorCelda == 'null' || Number(valorCelda) === -1 || valorCelda === '') ? valorCelda : '-';
    celdaHTML += celda + "</td>";
    return celdaHTML;
  }

  // Carga de tabla html.
  export function llenarTablaSimulacion(matrizEventos: string[][], matrizClientes: string[][], matrizZapatos: string[][], cantClientes: number, cantZapatos: number, indicesColor: number[], tabla: HTMLTableElement): void {
    tabla.hidden = true;
    let bodyTabla: string = "";
    for (let i: number = 0; i < matrizEventos.length; i++) {
      let filaHTML: string = crearFilaTablaSimulacion(matrizEventos[i], matrizClientes[i], matrizZapatos[i], cantClientes, cantZapatos, indicesColor);
      bodyTabla += filaHTML;
    }
    tabla.tBodies[0].innerHTML = bodyTabla;
    tabla.hidden = false;
  }

  // Añade encabezados a la tabla según la cantidad de clientes.
  export function agregarEncabezados(cantidad: number, tabla: HTMLTableElement, columnas: string[], tipo: string): void {
    let encabezados: HTMLTableRowElement = tabla.rows[0];
    let subEncabezados: HTMLTableRowElement = tabla.rows[1];

    for (let i: number = 0; i < cantidad; i++) {
      let col: HTMLTableHeaderCellElement = encabezados.insertCell();
      col.colSpan = columnas.length;
      col.style.fontWeight = "bold";
      col.appendChild(document.createTextNode(tipo + ' N° ' + (i+1)));

      for (let j: number = 0; j < columnas.length; j++) {
        let subCol: HTMLTableHeaderCellElement = subEncabezados.insertCell();
        subCol.style.fontWeight = "bold";
        subCol.appendChild(document.createTextNode(columnas[j]));
      }
    }
  }

  // Crea una tabla html a partir de una matriz del método de Runge-Kutta de 4to orden.
  export function crearTablaRK(matriz: number[][], y: string): string {
    let tabla: string = '<div class="table-responsive scrollable row mb-3 mx-3">';
    tabla += '<table class="table table-hover table-bordered mx-3 mb-3">';
    tabla += `
    <thead>
      <tr>
        <th>ti</th>
        <th>${y}i</th>
        <th>K1</th>
        <th>K2</th>
        <th>K3</th>
        <th>K4</th>
        <th>ti+1</th>
        <th>${y}i+1</th>
      </tr>
    </thead>`;
    tabla += '<tbody>';
    for (let i: number = 0; i < matriz.length; i++) {
      let fila: string = '<tr>';
      for (let j: number = 0; j < 8; j++) {
        fila += `<td>${matriz[i][j].toFixed(4)}</td>`;
      }
      fila += '</tr>';
      tabla += fila;
    }
    tabla += '</tbody></table></div>';
    return tabla;
  }
}