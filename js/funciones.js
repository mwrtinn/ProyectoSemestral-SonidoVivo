/* ============================================================
   Sonido Vivo - funciones.js
   DOM, Eventos y Validación de Formularios
   ============================================================ */

// Clave usada para guardar el carrito en localStorage
const CLAVE_CARRITO = "sonidoVivoCarrito";

/* ------------------------------------------------------------
   UTILIDADES GENERALES
   ------------------------------------------------------------ */

// Convierte un texto de precio tipo "$129.990" a número (129990)
function parsearPrecio(texto) {
    // Elimina todo lo que no sea un dígito (quita "$" y los puntos de miles)
    const soloNumeros = texto.replace(/[^0-9]/g, "");
    return Number(soloNumeros) || 0;
}

// Camino inverso: convierte un número a precio con formato chileno
// 129990 -> "$129.990"
function formatearPrecio(numero) {
    return "$" + numero.toLocaleString("es-CL");
}

// Lee el carrito guardado en localStorage. Si no hay nada guardado
// (o el dato está corrupto), devuelve un carrito vacío
function obtenerCarrito() {
    const datos = localStorage.getItem(CLAVE_CARRITO);
    try {
        return datos ? JSON.parse(datos) : [];
    } catch (error) {
        console.error("El carrito guardado estaba corrupto, se reinicia.", error);
        return [];
    }
}

// Guarda el carrito completo en localStorage.
// Se guarda como texto (JSON.stringify) porque localStorage no
// acepta arrays ni objetos directamente, solo strings
function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

// Le agrega la clase "activo" al link del menú que corresponde
// a la página en la que estamos parados
function marcarEnlaceActivo() {
    const enlaces = document.querySelectorAll(".menu-lista a");
    const paginaActual = window.location.pathname.split("/").pop() || "index.html";

    enlaces.forEach((enlace) => {
        const destino = enlace.getAttribute("href");
        if (destino === paginaActual) {
            enlace.classList.add("activo");
        }
    });
}

/* ------------------------------------------------------------
   CATÁLOGO (catalogo.html): agregar productos al carrito
   ------------------------------------------------------------ */

function inicializarCatalogo() {
    const botonesAgregar = document.querySelectorAll(".btn-agregar");
    if (botonesAgregar.length === 0) return; // No estamos en catalogo.html

    botonesAgregar.forEach((boton) => {
        boton.addEventListener("click", manejarClickAgregar);
    });
}

// Se ejecuta al hacer click en "Agregar al carrito".
// Sube desde el botón hasta la tarjeta del producto (closest),
// lee sus datos, y lo agrega al carrito (o suma 1 si ya estaba)
function manejarClickAgregar(evento) {
    const boton = evento.currentTarget;
    const tarjeta = boton.closest(".tarjeta-producto");

    const nombre = tarjeta.querySelector(".nombre-producto").textContent.trim();
    const marca = tarjeta.querySelector(".marca-modelo").textContent.trim();
    const precio = parsearPrecio(tarjeta.querySelector(".precio-producto").textContent);
    const imagen = tarjeta.querySelector("img").getAttribute("src");

    const carrito = obtenerCarrito();
    const productoExistente = carrito.find((item) => item.nombre === nombre && item.marca === marca);

    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({ nombre, marca, precio, imagen, cantidad: 1 });
    }

    guardarCarrito(carrito);
    darFeedbackVisual(boton);
}

// Cambia el texto del botón un momento para confirmar que
// el producto se agregó, y lo vuelve a dejar como estaba
function darFeedbackVisual(boton) {
    const textoOriginal = boton.textContent;
    boton.textContent = "Agregado ✓";
    boton.disabled = true;

    setTimeout(() => {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }, 900);
}

/* ------------------------------------------------------------
   PEDIDO (pedido.html): renderizar carrito + validar formulario
   ------------------------------------------------------------ */

function inicializarPedido() {
    const contenedorVacio = document.getElementById("contenedor-carrito-vacio");
    const contenedorCheckout = document.getElementById("contenedor-checkout");

    // Si estos elementos no existen, no estamos en pedido.html
    if (!contenedorVacio || !contenedorCheckout) return;

    renderizarCarrito();

    // Delegación de eventos: un solo listener para todos los botones de la tabla
    const cuerpoTabla = document.getElementById("cuerpo-tabla-carrito");
    cuerpoTabla.addEventListener("click", manejarClickTablaCarrito);
    cuerpoTabla.addEventListener("change", manejarCambioCantidad);

    const formulario = document.getElementById("formulario-pedido");
    formulario.addEventListener("submit", manejarEnvioFormulario);
}

// Dibuja de nuevo toda la tabla del carrito (o el mensaje de carrito vacío) a partir de lo que hay guardado en localStorage
function renderizarCarrito() {
    const carrito = obtenerCarrito();
    const contenedorVacio = document.getElementById("contenedor-carrito-vacio");
    const contenedorCheckout = document.getElementById("contenedor-checkout");
    const cuerpoTabla = document.getElementById("cuerpo-tabla-carrito");
    const totalFinal = document.getElementById("total-final-pago");

    if (carrito.length === 0) {
        contenedorVacio.style.display = "block";
        contenedorCheckout.style.display = "none";
        return;
    }

    contenedorVacio.style.display = "none";
    contenedorCheckout.style.display = "block";

    // Limpiar tabla antes de redibujar, si no las filas se van acumulando
    cuerpoTabla.innerHTML = "";

    let total = 0;

    carrito.forEach((producto, indice) => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        const fila = document.createElement("tr");
        fila.dataset.indice = indice; // guardamos a qué producto del array corresponde esta fila

        fila.innerHTML = `
            <td>${producto.nombre} (${producto.marca})</td>
            <td>${formatearPrecio(producto.precio)}</td>
            <td>
                <input type="number" class="input-cantidad" min="1" max="99"
                       value="${producto.cantidad}" data-indice="${indice}">
            </td>
            <td>${formatearPrecio(subtotal)}</td>
            <td><button type="button" class="btn-eliminar" data-indice="${indice}">Eliminar</button></td>
        `;

        cuerpoTabla.appendChild(fila);
    });

    totalFinal.textContent = formatearPrecio(total);
}

// Escucha los clicks de TODA la tabla (delegación de eventos) y
// revisa si el click fue justo en un botón "Eliminar"
function manejarClickTablaCarrito(evento) {
    if (!evento.target.classList.contains("btn-eliminar")) return;

    const indice = Number(evento.target.dataset.indice);
    const carrito = obtenerCarrito();

    carrito.splice(indice, 1);
    guardarCarrito(carrito);
    renderizarCarrito();
}

// Igual que la de arriba, pero para cuando cambia la cantidad
// en el input numérico de una fila
function manejarCambioCantidad(evento) {
    if (!evento.target.classList.contains("input-cantidad")) return;

    const indice = Number(evento.target.dataset.indice);
    let nuevaCantidad = Number(evento.target.value);

    if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 1) {
        nuevaCantidad = 1; // por si escriben 0, negativo o texto raro
    }

    const carrito = obtenerCarrito();
    carrito[indice].cantidad = nuevaCantidad;
    guardarCarrito(carrito);
    renderizarCarrito();
}

/* ------------------------------------------------------------
   VALIDACIÓN DEL FORMULARIO DE PEDIDO
   ------------------------------------------------------------ */

// Patrones para revisar formato: nombre solo letras, correo con
// arroba y dominio, teléfono chileno (+56 9 + 8 dígitos)
const EXPRESIONES = {
    nombre: /^[A-Za-zÀ-ÿ\s]{3,60}$/,
    correo: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
    telefono: /^(\+?56)?\s?9\d{8}$/, // Ej: +56 9 12345678
};

// ids de todos los campos obligatorios del formulario de pedido
const CAMPOS_FORMULARIO = [
    "nombre-envio",
    "correo-envio",
    "telefono-envio",
    "direccion-despacho",
    "metodo-pago",
];

// Marca un campo como inválido: le pone el borde rojo (clase
// campo-error, definida en style.css) y escribe el mensaje debajo
function mostrarError(idCampo, idError, mensaje) {
    document.getElementById(idCampo).classList.add("campo-error");
    document.getElementById(idError).textContent = mensaje;
}

// Deja el formulario "limpio" antes de validar de nuevo: saca el
// borde rojo de todos los campos y borra todos los mensajes de error
function limpiarErrores() {
    CAMPOS_FORMULARIO.forEach((idCampo) => {
        document.getElementById(idCampo).classList.remove("campo-error");
    });
    document.querySelectorAll(".mensaje-error").forEach((span) => {
        span.textContent = "";
    });
}

// Revisa cada campo del formulario y devuelve true solo si todos
// pasaron su validación (obligatorio y/o formato, según el campo)
function validarFormularioPedido() {
    limpiarErrores();
    let esValido = true;

    const nombre = document.getElementById("nombre-envio").value.trim();
    const correo = document.getElementById("correo-envio").value.trim();
    const telefono = document.getElementById("telefono-envio").value.trim();
    const direccion = document.getElementById("direccion-despacho").value.trim();
    const metodoPago = document.getElementById("metodo-pago").value;

    if (!EXPRESIONES.nombre.test(nombre)) {
        mostrarError("nombre-envio", "error-nombre", "Ingresa tu nombre completo (solo letras, mínimo 3 caracteres).");
        esValido = false;
    }

    if (!EXPRESIONES.correo.test(correo)) {
        mostrarError("correo-envio", "error-correo", "Ingresa un correo electrónico válido.");
        esValido = false;
    }

    if (!EXPRESIONES.telefono.test(telefono)) {
        mostrarError("telefono-envio", "error-telefono", "Ingresa un teléfono válido. Ej: +56 9 12345678");
        esValido = false;
    }

    if (direccion.length < 5) {
        mostrarError("direccion-despacho", "error-direccion", "Ingresa una dirección de despacho válida.");
        esValido = false;
    }

    if (metodoPago === "") {
        mostrarError("metodo-pago", "error-pago", "Selecciona un método de pago.");
        esValido = false;
    }

    return esValido;
}

// Se ejecuta al enviar el formulario. Primero frena la recarga de
// la página, valida, y si todo está bien, muestra el mensaje de
// éxito y vacía el carrito
function manejarEnvioFormulario(evento) {
    evento.preventDefault();

    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
        return; // No debería poder llegar aquí, pero por seguridad no se procesa
    }

    if (!validarFormularioPedido()) {
        return;
    }

    const mensajeExito = document.getElementById("mensaje-exito");
    mensajeExito.textContent = "¡Compra confirmada! Te contactaremos pronto para coordinar el despacho.";
    mensajeExito.style.display = "block";

    // Deshabilitar el botón para evitar doble envío
    document.getElementById("btn-confirmar-compra").disabled = true;

    // Vaciar carrito y volver a mostrar el estado "carrito vacío" tras un momento
    localStorage.removeItem(CLAVE_CARRITO);

    setTimeout(() => {
        window.location.href = "index.html";
    }, 2500);
}

/* ------------------------------------------------------------
   PUNTO DE ENTRADA
   ------------------------------------------------------------ */

// Espera a que todo el HTML esté cargado antes de tocar cualquier
// elemento (por eso también existe el "defer" en el <script> del HTML)
document.addEventListener("DOMContentLoaded", () => {
    marcarEnlaceActivo();
    inicializarCatalogo();
    inicializarPedido();
});