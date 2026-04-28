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

    let empresaNombre = document.getElementById("empresaNombre").value;
    let clienteNombre = document.getElementById("clienteNombre").value;
    let proyectoCodigo = document.getElementById("proyectoCodigo").value;

    let y = 15;

    // Logo en PDF
    const logoImg = localStorage.getItem("cotizador_logo");
    if (logoImg) {
        try {
            doc.addImage(logoImg, 'JPEG', 10, 10, 30, 30);
        } catch(e) {
            // Si falla, usar formato PNG
            doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
        }
    }

    doc.setFontSize(16);
    doc.text(empresaNombre || "Empresa", 50, y);

    doc.setFontSize(14);
    doc.text("COTIZACIÓN", 140, 15);

    doc.setFontSize(10);
    doc.text("Folio: " + folio, 140, 22);
    doc.text("Fecha: " + fechaInput.value, 140, 27);
    doc.text("Proyecto: " + proyectoCodigo, 140, 32);

    y += 15;
    let proyectoNombre = document.getElementById("proyectoNombre").value;
    doc.text("Proyecto: " + (proyectoNombre || "Sin nombre"), 10, y);

    y += 10;

    productos.forEach(p=>{
        doc.text(p.n, 10, y);
        doc.text(String(p.c), 90, y);
        doc.text("$"+formatoCLP(p.p), 110, y);
        doc.text("$"+formatoCLP(p.sub), 150, y);
        y += 6;
    });

    y += 10;
    doc.setFontSize(13);
    doc.text("TOTAL NETO: $" + totalSpan.textContent, 140, y);

    doc.save("cotizacion_"+folio+".pdf");

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

// ===== PROYECTO =====
function guardarCliente() {
    const proyecto = {
        nombre: document.getElementById("clienteNombre").value,
        rut: document.getElementById("clienteRut").value,
        direccion: document.getElementById("clienteDireccion").value,
        correo: document.getElementById("clienteCorreo").value
    };
    
    if (!proyecto.nombre || !proyecto.rut) {
        alert("Ingresa nombre y código del proyecto");
        return;
    }
    
    DB.saveCliente(proyecto);
    alert("Proyecto guardado: " + proyecto.nombre);
}

function mostrarClientes() {
    const clientes = DB.getClientes();
    
    if (clientes.length === 0) {
        alert("No hay clientes guardados");
        return;
    }
    
    let mensaje = "Mis Clientes:\n\n";
    clientes.forEach((c, i) => {
        mensaje += `${i + 1}. ${c.nombre} (${c.rut})\n`;
    });
    mensaje += "\nIngresa el número para cargar:";
    
    const opcion = prompt(mensaje);
    const idx = parseInt(opcion) - 1;
    
    if (idx >= 0 && idx < clientes.length) {
        const c = clientes[idx];
        document.getElementById("clienteNombre").value = c.nombre;
        document.getElementById("clienteRut").value = c.rut;
        document.getElementById("clienteDireccion").value = c.direccion || "";
        document.getElementById("clienteCorreo").value = c.correo || "";
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