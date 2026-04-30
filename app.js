const { jsPDF } = window.jspdf;

// ===== UTIL =====
function formatoCLP(num){
    return new Intl.NumberFormat('es-CL').format(num);
}

function limpiarNumero(str){
    return str.replace(/\./g,'');
}

// ===== SANITIZACIÓN (seguridad XSS) =====
function sanitizarHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== VALIDACIÓN RUT CHILENO =====
function validarRut(rut) {
    if (!rut) return false;
    rut = rut.replace(/[^0-9kK-]/g, '');
    if (rut.length < 2) return false;
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toLowerCase();
    
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvCalculado = 11 - (suma % 11);
    const dvString = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'k' : String(dvCalculado);
    
    return dv === dvString;
}

function formatearRut(input) {
    let rut = input.value.replace(/[^0-9kK]/g, '');
    if (rut.length > 1) {
        let cuerpo = rut.slice(0, -1);
        let dv = rut.slice(-1);
        cuerpo = cuerpo.replace(/(\d)(?=(\d))/g, '$1.');
        input.value = cuerpo + '-' + dv;
    } else {
        input.value = rut;
    }
}

// ===== STATE =====
let productos = [];
let folio = parseInt(localStorage.getItem("folio")) || 1;

// ===== DOM =====
const folioInput = document.getElementById("folio");
const fechaInput = document.getElementById("fecha");
const totalSpan = document.getElementById("total");

const nombreInput = document.getElementById("nombre");
const cantidadInput = document.getElementById("cantidad");
const precioInput = document.getElementById("precio");

const detalle = document.getElementById("detalle");

// ===== INIT =====
folioInput.value = folio;
fechaInput.value = new Date().toLocaleDateString('es-CL');

// Cargar logo guardado
cargarLogoGuardado();

// Código de proyecto automático
let proyectoFolio = parseInt(localStorage.getItem("proyectoFolio")) || 1;
document.getElementById("proyectoCodigo").value = "PROY-" + proyectoFolio.toString().padStart(4, "0");

// Cargar datos de empresa guardados (async)
(async () => {
    const empresaGuardada = await DB.getEmpresa();
    if (empresaGuardada) {
        document.getElementById("empresaNombre").value = empresaGuardada.nombre || "";
        document.getElementById("empresaRut").value = empresaGuardada.rut || "";
        document.getElementById("empresaDireccion").value = empresaGuardada.direccion || "";
        document.getElementById("empresaTelefono").value = empresaGuardada.telefono || "";
    }
})();

// Guardar empresa cuando cambie algún campo
["empresaNombre", "empresaRut", "empresaDireccion", "empresaTelefono"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
        DB.saveEmpresa({
            nombre: document.getElementById("empresaNombre").value,
            rut: document.getElementById("empresaRut").value,
            direccion: document.getElementById("empresaDireccion").value,
            telefono: document.getElementById("empresaTelefono").value
        });
    });
});

// Auto-formatear RUT al escribir
document.getElementById("clienteRut").addEventListener("input", function(e) {
    formatearRut(e.target);
});

document.getElementById("empresaRut").addEventListener("input", function(e) {
    formatearRut(e.target);
});

// ===== FORMATO PRECIO =====
precioInput.addEventListener("input", e=>{
    let valor = limpiarNumero(e.target.value);
    if(valor) e.target.value = formatoCLP(valor);
});

// ===== ADD =====
function agregarProducto(){
    let n = nombreInput.value.trim();
    let c = parseInt(cantidadInput.value);
    let p = parseInt(limpiarNumero(precioInput.value));

    // Validaciones
    if(!n || !c || !p){
        alert("Completa todos los campos");
        return;
    }
    
    if(c < 1){
        alert("La cantidad debe ser al menos 1");
        return;
    }
    
    if(p < 0){
        alert("El precio no puede ser negativo");
        return;
    }

    productos.push({n,c,p,sub:c*p});
    render();

    nombreInput.value="";
    cantidadInput.value="";
    precioInput.value="";
}

// ===== DELETE =====
function eliminar(i){
    productos.splice(i,1);
    render();
}

// ===== RENDER =====
function render(){
    let total=0;
    let html="";

    productos.forEach((p,i)=>{
        total += p.sub;
        // Sanitizar datos antes de insertar en HTML
        const nombreSeg = sanitizarHTML(p.n);
        const cantidadSeg = sanitizarHTML(String(p.c));
        const precioSeg = sanitizarHTML(formatoCLP(p.p));
        const subtotalSeg = sanitizarHTML(formatoCLP(p.sub));
        
        html += `
        <tr>
            <td>${nombreSeg}</td>
            <td>${cantidadSeg}</td>
            <td>$${precioSeg}</td>
            <td>$${subtotalSeg}</td>
            <td><button onclick="eliminar(${i})">X</button></td>
        </tr>`;
    });

    detalle.innerHTML = html;
    if (totalSpan) totalSpan.textContent = formatoCLP(total);
}

// ===== PDF =====
function generarPDF(){

    let doc = new jsPDF();
    let pageWidth = doc.internal.pageSize.getWidth();

    // Datos
    let empresaNombre = document.getElementById("empresaNombre").value;
    let empresaRut = document.getElementById("empresaRut").value;
    let empresaDireccion = document.getElementById("empresaDireccion").value;
    let empresaTelefono = document.getElementById("empresaTelefono").value;
    
    let clienteNombre = document.getElementById("clienteNombre").value;
    let clienteRut = document.getElementById("clienteRut").value;
    let clienteDireccion = document.getElementById("clienteDireccion").value;
    let clienteCorreo = document.getElementById("clienteCorreo").value;
    
    let proyectoNombre = document.getElementById("proyectoNombre").value;
    let proyectoCodigo = document.getElementById("proyectoCodigo").value;

    let y = 20;
    let margen = 15;
    let anchoUtil = pageWidth - (margen * 2);

    // ===== GUARDAR EN FIREBASE (automático) =====
    async function guardarEnFirebase() {
        try {
            // 1. Guardar empresa
            if (empresaNombre) {
                await DB.saveEmpresa({
                    nombre: empresaNombre,
                    rut: empresaRut,
                    direccion: empresaDireccion,
                    telefono: empresaTelefono
                });
            }
            
            // 2. Guardar cliente si tiene datos
            if (clienteNombre && clienteRut) {
                await DB.saveCliente({
                    nombre: clienteNombre,
                    rut: clienteRut,
                    direccion: clienteDireccion,
                    correo: clienteCorreo
                });
            }
            
            // 3. Guardar productos de la cotización
            for (const p of productos) {
                await DB.saveProducto({
                    nombre: p.n,
                    precio: p.p,
                    cantidad: p.c
                });
            }
            
            // 4. Guardar cotización
            const total = productos.reduce((sum, p) => sum + p.sub, 0);
            await DB.saveCotizacion({
                folio: folio,
                fecha: new Date().toISOString(),
                clienteRut: clienteRut,
                clienteNombre: clienteNombre,
                proyectoCodigo: proyectoCodigo,
                proyectoNombre: proyectoNombre,
                productos: productos,
                total: total,
                estado: 'generada'
            });
            
            console.log("✓ Datos guardados en Firebase");
        } catch(e) {
            console.error("Error al guardar en Firebase:", e);
        }
    }
    
    // Ejecutar guardado en Firebase
    guardarEnFirebase();
    doc.text("Fecha: " + fechaInput.value, pageWidth - margen, y + 17, { align: "right" });

    y += 35;

    // ===== DATOS EMPRESA =====
    doc.setFillColor(240, 240, 245);
    doc.rect(margen, y, anchoUtil, 25, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DE:", margen, y + 7);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(empresaNombre || "Empresa", margen, y + 13);
    if (empresaRut) doc.text("RUT: " + empresaRut, margen, y + 18);
    if (empresaDireccion) doc.text(empresaDireccion, 80, y + 13);
    if (empresaTelefono) doc.text("Tel: " + empresaTelefono, 80, y + 18);

    y += 30;

    // ===== DATOS CLIENTE/PROYECTO =====
    doc.setFillColor(245, 245, 250);
    doc.rect(margen, y, anchoUtil, 25, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PARA:", margen, y + 7);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(clienteNombre || "Cliente", margen, y + 13);
    if (clienteRut) doc.text("RUT: " + clienteRut, margen, y + 18);
    if (clienteDireccion) doc.text(clienteDireccion, 80, y + 13);
    if (clienteCorreo) doc.text("Correo: " + clienteCorreo, 80, y + 18);

    y += 30;

    // ===== PROYECTO =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Proyecto:", margen, y);
    doc.setFont("helvetica", "normal");
    doc.text(proyectoNombre || "Sin nombre", margen + 20, y);
    
    doc.text("Código:", 120, y);
    doc.text(proyectoCodigo || "-", 145, y);

    y += 15;

    // ===== TABLA PRODUCTOS =====
    // Encabezado tabla
    doc.setFillColor(50, 50, 80);
    doc.rect(margen, y, anchoUtil, 8, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Descripción", margen + 3, y + 5.5);
    doc.text("Cant.", margen + 110, y + 5.5);
    doc.text("Precio", margen + 130, y + 5.5);
    doc.text("Subtotal", margen + 160, y + 5.5);
    
    doc.setTextColor(0, 0, 0);
    y += 8;

    // Filas productos
    doc.setFont("helvetica", "normal");
    let total = 0;
    
    productos.forEach((p, i) => {
        total += p.sub;
        
        if (i % 2 === 0) {
            doc.setFillColor(248, 248, 250);
            doc.rect(margen, y, anchoUtil, 7, "F");
        }
        
        doc.setFontSize(8);
        doc.text(p.n, margen + 3, y + 5);
        doc.text(String(p.c), margen + 115, y + 5);
        doc.text("$" + formatoCLP(p.p), margen + 130, y + 5);
        doc.text("$" + formatoCLP(p.sub), margen + 160, y + 5);
        
        y += 7;
    });

    y += 5;

    // ===== TOTAL =====
    doc.setDrawColor(200, 200, 200);
    doc.line(margen, y, pageWidth - margen, y);
    y += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL NETO:", 130, y + 4);
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 80);
    doc.text("$" + totalSpan.textContent, pageWidth - margen, y + 4, { align: "right" });
    doc.setTextColor(0, 0, 0);

    // ===== SEPARADOR GRIS =====
    y += 15;
    doc.setFillColor(230, 230, 230);
    doc.rect(margen, y, anchoUtil, 2, "F");
    y += 7;

    // ===== DATOS PARA OC Y BANCARIOS =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Datos para OC.", margen, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Razón Social: Brothers Solutions SpA", margen, y);
    y += 5;
    doc.text("Rut: 77.504.779-8", margen, y);
    y += 5;
    doc.text("Dirección: Av. Bernardo O'higgins 1302 Santiago", margen, y);
    y += 5;
    doc.text("Giro: Actividades de Consultoría y Gestión Informática", margen, y);
    y += 5;
    doc.text("Email: bsstspa@gmail.com", margen, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Datos Bancarios", margen, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Razón Social: Brothers Solutions SpA", margen, y);
    y += 5;
    doc.text("Rut: 77.504.779-8", margen, y);
    y += 5;
    doc.text("Banco: Bci", margen, y);
    y += 5;
    doc.text("Cuenta Corriente: 70831371", margen, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Todos los valores son neto + IVA", margen, y);
    y += 5;
    doc.text("Cotización válida por 10 Días", margen, y + 5);

    // ===== PIE =====
    y = 270;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Documento generado automáticamente", pageWidth / 2, y, { align: "center" });

    // Guardar
    let nombreArchivo = "cotizacion_" + folio + "_" + (proyectoNombre ? proyectoNombre.replace(/[^a-zA-Z0-9]/g, "_") : "proyecto");
    doc.save(nombreArchivo + ".pdf");

    // Incrementar folio
    folio++;
    localStorage.setItem("folio", folio);
    folioInput.value = folio;
}

// ===== EMPRESA =====
async function guardarEmpresa() {
    const empresa = {
        nombre: document.getElementById("empresaNombre").value,
        rut: document.getElementById("empresaRut").value,
        direccion: document.getElementById("empresaDireccion").value,
        telefono: document.getElementById("empresaTelefono").value
    };
    
    if (!empresa.nombre) {
        alert("Ingresa el nombre de la empresa");
        return;
    }
    
    await DB.saveEmpresa(empresa);
    alert("Empresa guardada: " + empresa.nombre);
}

async function cargarEmpresa() {
    const empresa = await DB.getEmpresa();
    if (empresa) {
        document.getElementById("empresaNombre").value = empresa.nombre || "";
        document.getElementById("empresaRut").value = empresa.rut || "";
        document.getElementById("empresaDireccion").value = empresa.direccion || "";
        document.getElementById("empresaTelefono").value = empresa.telefono || "";
    } else {
        alert("No hay empresa guardada");
    }
}

// ===== CLIENTE =====
async function guardarCliente() {
    const nombre = document.getElementById("clienteNombre").value.trim();
    const rut = document.getElementById("clienteRut").value.trim();
    const direccion = document.getElementById("clienteDireccion").value.trim();
    const correo = document.getElementById("clienteCorreo").value.trim();
    
    if (!nombre || !rut) {
        alert("Ingresa nombre y RUT del cliente");
        return;
    }
    
    // Validar RUT chileno
    if (!validarRut(rut)) {
        alert("RUT inválido. Ingresa un RUT válido (ej: 12345678-9)");
        return;
    }
    
    // Validar email si se ingresa
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        alert("Correo electrónico inválido");
        return;
    }
    
    const cliente = {
        nombre: nombre,
        rut: rut,
        direccion: direccion,
        correo: correo
    };
    
    await DB.saveCliente(cliente);
    alert("Cliente guardado: " + nombre);
}

async function mostrarClientes() {
    const clientes = await DB.getClientes();
    
    if (clientes.length === 0) {
        alert("No hay clientes guardados. Guarda uno primero.");
        return;
    }
    
    let mensaje = "Mis Clientes:\n\n";
    clientes.forEach((c, i) => {
        mensaje += `${i + 1}. ${c.nombre} (${c.rut})\n`;
    });
    mensaje += "\nIngresa el número para cargar:";
    
    const opcion = prompt(mensaje);
    if (!opcion) return;
    
    const idx = parseInt(opcion) - 1;
    
    if (idx >= 0 && idx < clientes.length) {
        const c = clientes[idx];
        document.getElementById("clienteNombre").value = c.nombre;
        document.getElementById("clienteRut").value = c.rut;
        document.getElementById("clienteDireccion").value = c.direccion || "";
        document.getElementById("clienteCorreo").value = c.correo || "";
    } else if (!isNaN(idx)) {
        alert("Número inválido");
    }
}

// ===== PROYECTO (cotización) =====
function guardarProyecto() {
    const proyecto = {
        nombre: document.getElementById("proyectoNombre").value,
        codigo: document.getElementById("proyectoCodigo").value
    };
    
    if (!proyecto.nombre) {
        alert("Ingresa el nombre del proyecto");
        return;
    }
    
    // Guardar en localStorage temporal
    localStorage.setItem("cotizador_proyecto_actual", JSON.stringify(proyecto));
    
    // Incrementar folio para próximo proyecto
    let proyectoFolio = parseInt(localStorage.getItem("proyectoFolio")) || 1;
    proyectoFolio++;
    localStorage.setItem("proyectoFolio", proyectoFolio);
    
    alert("Proyecto guardado: " + proyecto.codigo);
}

function cargarProyecto() {
    const guardado = localStorage.getItem("cotizador_proyecto_actual");
    if (guardado) {
        const proyecto = JSON.parse(guardado);
        document.getElementById("proyectoNombre").value = proyecto.nombre || "";
        document.getElementById("proyectoCodigo").value = proyecto.codigo || "";
    } else {
        alert("No hay proyecto guardado");
    }
}

// ===== PRODUCTOS =====
async function guardarProducto() {
    const nombre = document.getElementById("nombre").value.trim();
    const precio = parseInt(limpiarNumero(document.getElementById("precio").value));
    
    if (!nombre || !precio) {
        alert("Ingresa nombre y precio del producto");
        return;
    }
    
    const producto = {
        nombre: nombre,
        precio: precio
    };
    
    await DB.saveProducto(producto);
    alert("Producto guardado: " + nombre + " - $" + formatoCLP(precio));
}

async function mostrarProductos() {
    const productosDB = await DB.getProductos();
    
    if (productosDB.length === 0) {
        alert("No hay productos guardados. Guarda uno primero.");
        return;
    }
    
    let mensaje = "Mis Productos:\n\n";
    productosDB.forEach((p, i) => {
        mensaje += `${i + 1}. ${p.nombre} - $${formatoCLP(p.precio)}\n`;
    });
    mensaje += "\nIngresa el número para agregar a la cotización:";
    
    const opcion = prompt(mensaje);
    if (!opcion) return;
    
    const idx = parseInt(opcion) - 1;
    
    if (idx >= 0 && idx < productosDB.length) {
        const p = productosDB[idx];
        document.getElementById("nombre").value = p.nombre;
        document.getElementById("precio").value = formatoCLP(p.precio);
    } else if (!isNaN(idx)) {
        alert("Número inválido");
    }
}

// ===== LOGO =====
function cargarLogo() {
    const input = document.getElementById("logoInput");
    const preview = document.getElementById("logoPreview");
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validar tamaño (max 500KB para localStorage)
        if (file.size > 500 * 1024) {
            alert("La imagen es muy grande. Máximo 500KB.");
            input.value = "";
            return;
        }
        
        // Validar tipo
        if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
            alert("Formato no válido. Usa JPG, PNG, GIF o WebP.");
            input.value = "";
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
}

function guardarLogo() {
    const preview = document.getElementById("logoPreview");
    if (preview.src && preview.style.display !== "none") {
        // Verificar tamaño antes de guardar
        if (preview.src.length > 5 * 1024 * 1024) {
            alert("La imagen es muy grande para guardar en el navegador.");
            return;
        }
        localStorage.setItem("cotizador_logo", preview.src);
        alert("Logo guardado");
    } else {
        alert("Selecciona una imagen primero");
    }
}

function cargarLogoGuardado() {
    const logo = localStorage.getItem("cotizador_logo");
    if (logo) {
        document.getElementById("logoPreview").src = logo;
        document.getElementById("logoPreview").style.display = "block";
    }
}

function borrarLogo() {
    localStorage.removeItem("cotizador_logo");
    document.getElementById("logoPreview").src = "";
    document.getElementById("logoPreview").style.display = "none";
    document.getElementById("logoInput").value = "";
}

// ===== EXPORTAR/IMPORTAR DATOS =====
async function exportarDatos() {
    const datos = await DB.exportData();
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cotizador_backup_" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    URL.revokeObjectURL(url);
    
    alert("Datos exportados. Sube este archivo a GitHub para respaldarlos.");
}

async function importarDesdeArchivo() {
    const input = document.getElementById("importFile");
    const file = input.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validar estructura básica
            if (typeof data !== 'object' || data === null) {
                throw new Error("Formato de archivo inválido");
            }
            
            await DB.importData(data);
            alert("Datos importados correctamente.");
        } catch(error) {
            alert("Error al leer el archivo: " + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input
    input.value = "";
}

// ===== IMPORTAR DESDE FIREBASE =====
async function importarDesdeFirebase() {
    try {
        // Cargar empresa
        const empresa = await DB.getEmpresa();
        if (empresa) {
            document.getElementById("empresaNombre").value = empresa.nombre || "";
            document.getElementById("empresaRut").value = empresa.rut || "";
            document.getElementById("empresaDireccion").value = empresa.direccion || "";
            document.getElementById("empresaTelefono").value = empresa.telefono || "";
        }
        
        // Mostrar clientes disponibles
        const clientes = await DB.getClientes();
        if (clientes.length === 0) {
            alert("No hay clientes en Firebase. Genera una cotización primero.");
            return;
        }
        
        let mensaje = "Clientes guardados en Firebase:\n\n";
        clientes.forEach((c, i) => {
            mensaje += `${i + 1}. ${c.nombre} (${c.rut})\n`;
        });
        mensaje += "\nIngresa el número para cargar:";
        
        const opcion = prompt(mensaje);
        if (!opcion) return;
        
        const idx = parseInt(opcion) - 1;
        if (idx >= 0 && idx < clientes.length) {
            const c = clientes[idx];
            document.getElementById("clienteNombre").value = c.nombre;
            document.getElementById("clienteRut").value = c.rut;
            document.getElementById("clienteDireccion").value = c.direccion || "";
            document.getElementById("clienteCorreo").value = c.correo || "";
            alert("Cliente cargado: " + c.nombre);
        } else if (!isNaN(idx)) {
            alert("Número inválido");
        }
    } catch(e) {
        alert("Error al importar desde Firebase: " + e.message);
    }
}

// ===== IMPORTAR PRODUCTOS DESDE FIREBASE =====
async function importarProductosDesdeFirebase() {
    try {
        const productos = await DB.getProductos();
        if (productos.length === 0) {
            alert("No hay productos en Firebase. Genera una cotización primero.");
            return;
        }
        
        let mensaje = "Productos guardados en Firebase:\n\n";
        productos.forEach((p, i) => {
            mensaje += `${i + 1}. ${p.nombre} - $${formatoCLP(p.precio || 0)}\n`;
        });
        mensaje += "\nIngresa el número para agregar a la cotización:";
        
        const opcion = prompt(mensaje);
        if (!opcion) return;
        
        const idx = parseInt(opcion) - 1;
        if (idx >= 0 && idx < productos.length) {
            const p = productos[idx];
            document.getElementById("nombre").value = p.nombre;
            document.getElementById("precio").value = formatoCLP(p.precio || 0);
            alert("Producto cargado: " + p.nombre);
        } else if (!isNaN(idx)) {
            alert("Número inválido");
        }
    } catch(e) {
        alert("Error al importar productos: " + e.message);
    }
}

// ===== BUSCAR COTIZACIONES =====
async function buscarCotizacion(query) {
    const resultadosDiv = document.getElementById("resultadosBusqueda");
    
    if (!query || query.length < 2) {
        resultadosDiv.innerHTML = "";
        return;
    }
    
    try {
        const cotizaciones = await DB.getCotizaciones();
        const q = query.toLowerCase();
        
        const filtradas = cotizaciones.filter(c => {
            return (c.clienteNombre && c.clienteNombre.toLowerCase().includes(q)) ||
                   (c.clienteRut && c.clienteRut.toLowerCase().includes(q)) ||
                   (c.proyectoCodigo && c.proyectoCodigo.toLowerCase().includes(q)) ||
                   (c.proyectoNombre && c.proyectoNombre.toLowerCase().includes(q)) ||
                   (c.folio && String(c.folio).includes(q));
        });
        
        if (filtradas.length === 0) {
            resultadosDiv.innerHTML = "<p style='color:#666;'>No se encontraron cotizaciones</p>";
            return;
        }
        
        let html = "<table style='width:100%; font-size:12px;'><thead><tr><th>Folio</th><th>Cliente</th><th>Proyecto</th><th>Total</th><th>Fecha</th><th>Acción</th></tr></thead><tbody>";
        
        filtradas.forEach(c => {
            const fecha = c.fecha ? new Date(c.fecha).toLocaleDateString('es-CL') : '-';
            html += `
            <tr>
                <td>${sanitizarHTML(String(c.folio || '-'))}</td>
                <td>${sanitizarHTML(c.clienteNombre || '-')}</td>
                <td>${sanitizarHTML(c.proyectoNombre || '-')}</td>
                <td>$${formatoCLP(c.total || 0)}</td>
                <td>${sanitizarHTML(fecha)}</td>
                <td><button onclick="cargarCotizacion('${sanitizarHTML(String(c.folio))}')">Cargar</button></td>
            </tr>`;
        });
        
        html += "</tbody></table>";
        resultadosDiv.innerHTML = html;
    } catch(e) {
        console.error("Error en búsqueda:", e);
        resultadosDiv.innerHTML = "<p style='color:red;'>Error al buscar</p>";
    }
}

// ===== CARGAR COTIZACIÓN DESDE FIREBASE =====
async function cargarCotizacion(folio) {
    try {
        const cotizaciones = await DB.getCotizaciones();
        const cotizacion = cotizaciones.find(c => c.folio == folio);
        
        if (!cotizacion) {
            alert("Cotización no encontrada");
            return;
        }
        
        // Cargar datos en el formulario
        document.getElementById("clienteNombre").value = cotizacion.clienteNombre || "";
        document.getElementById("clienteRut").value = cotizacion.clienteRut || "";
        document.getElementById("proyectoNombre").value = cotizacion.proyectoNombre || "";
        document.getElementById("proyectoCodigo").value = cotizacion.proyectoCodigo || "";
        
        // Cargar productos
        if (cotizacion.productos && Array.isArray(cotizacion.productos)) {
            productos = cotizacion.productos.map(p => ({
                n: p.n,
                c: p.c,
                p: p.p,
                sub: p.sub
            }));
            render();
        }
        
        document.getElementById("resultadosBusqueda").innerHTML = "";
        alert("Cotización cargada: Folio " + folio);
    } catch(e) {
        alert("Error al cargar cotización: " + e.message);
    }
}