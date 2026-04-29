const { jsPDF } = window.jspdf;

// ===== UTIL =====
function formatoCLP(num){
    return new Intl.NumberFormat('es-CL').format(num);
}

function limpiarNumero(str){
    return str.replace(/\./g,'');
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

// Cargar datos de empresa guardados
const empresaGuardada = DB.getEmpresa();
if (empresaGuardada) {
    document.getElementById("empresaNombre").value = empresaGuardada.nombre || "";
    document.getElementById("empresaRut").value = empresaGuardada.rut || "";
    document.getElementById("empresaDireccion").value = empresaGuardada.direccion || "";
    document.getElementById("empresaTelefono").value = empresaGuardada.telefono || "";
}

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

// ===== FORMATO PRECIO =====
precioInput.addEventListener("input", e=>{
    let valor = limpiarNumero(e.target.value);
    if(valor) e.target.value = formatoCLP(valor);
});

// ===== ADD =====
function agregarProducto(){
    let n = nombreInput.value;
    let c = parseInt(cantidadInput.value);
    let p = parseInt(limpiarNumero(precioInput.value));

    if(!n || !c || !p){
        alert("Completa todo");
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
        html += `
        <tr>
            <td>${p.n}</td>
            <td>${p.c}</td>
            <td>$${formatoCLP(p.p)}</td>
            <td>$${formatoCLP(p.sub)}</td>
            <td><button onclick="eliminar(${i})">X</button></td>
        </tr>`;
    });

    detalle.innerHTML = html;
    totalSpan.textContent = formatoCLP(total);
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

    // ===== ENCABEZADO =====
    // Logo
    const logoImg = localStorage.getItem("cotizador_logo");
    if (logoImg) {
        try {
            doc.addImage(logoImg, 'PNG', margen, y, 25, 25);
        } catch(e) {
            try {
                doc.addImage(logoImg, 'JPEG', margen, y, 25, 25);
            } catch(e2) {}
        }
    }

    // Título cotizador
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("COTIZACIÓN", pageWidth - margen, y + 5, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Folio: " + folio, pageWidth - margen, y + 12, { align: "right" });
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
function guardarEmpresa() {
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
    
    DB.saveEmpresa(empresa);
    alert("Empresa guardada: " + empresa.nombre);
}

function cargarEmpresa() {
    const empresa = DB.getEmpresa();
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
function guardarCliente() {
    const cliente = {
        nombre: document.getElementById("clienteNombre").value,
        rut: document.getElementById("clienteRut").value,
        direccion: document.getElementById("clienteDireccion").value,
        correo: document.getElementById("clienteCorreo").value
    };
    
    if (!cliente.nombre || !cliente.rut) {
        alert("Ingresa nombre y RUT del cliente");
        return;
    }
    
    DB.saveCliente(cliente);
    alert("Cliente guardado: " + cliente.nombre);
}

function mostrarClientes() {
    const clientes = DB.getClientes();
    
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
function guardarProducto() {
    const nombre = document.getElementById("nombre").value;
    const precio = parseInt(limpiarNumero(document.getElementById("precio").value));
    
    if (!nombre || !precio) {
        alert("Ingresa nombre y precio del producto");
        return;
    }
    
    const producto = {
        nombre: nombre,
        precio: precio
    };
    
    DB.saveProducto(producto);
    alert("Producto guardado: " + nombre + " - $" + formatoCLP(precio));
}

function mostrarProductos() {
    const productosDB = DB.getProductos();
    
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
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function guardarLogo() {
    const preview = document.getElementById("logoPreview");
    if (preview.src && preview.style.display !== "none") {
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
function exportarDatos() {
    const datos = {
        clientes: DB.getClientes(),
        productos: DB.getProductos(),
        empresa: DB.getEmpresa(),
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cotizador_backup_" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    URL.revokeObjectURL(url);
    
    alert("Datos exportados. Sube este archivo a GitHub para respaldarlos.");
}

function importarDatos() {
    // Trigger the hidden file input
    document.getElementById("importFile").click();
}

function importarDesdeArchivo() {
    const input = document.getElementById("importFile");
    const file = input.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.clientes) {
                localStorage.setItem("cotizador_clientes", JSON.stringify(data.clientes));
            }
            if (data.productos) {
                localStorage.setItem("cotizador_productos", JSON.stringify(data.productos));
            }
            if (data.empresa) {
                localStorage.setItem("cotizador_empresa", JSON.stringify(data.empresa));
            }
            alert("Datos importados correctamente.");
        } catch(error) {
            alert("Error al leer el archivo: " + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input
    input.value = "";
}