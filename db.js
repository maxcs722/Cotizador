// ===== BASE DE DATOS LOCAL (localStorage) =====

const DB = {
    // Keys para localStorage
    PROYECTOS_KEY: "cotizador_proyectos",
    PRODUCTOS_KEY: "cotizador_productos",
    EMPRESA_KEY: "cotizador_empresa",
    
    // ===== EMPRESA (mis datos) =====
    getEmpresa() {
        return JSON.parse(localStorage.getItem(this.EMPRESA_KEY)) || null;
    },
    
    saveEmpresa(empresa) {
        empresa.updatedAt = new Date().toISOString();
        localStorage.setItem(this.EMPRESA_KEY, JSON.stringify(empresa));
        return empresa;
    },
    
    // ===== PROYECTOS =====
    getClientes() {
        return JSON.parse(localStorage.getItem(this.PROYECTOS_KEY)) || [];
    },
    
    saveCliente(proyecto) {
        const proyectos = this.getClientes();
        const existente = proyectos.findIndex(p => p.rut === proyecto.rut);
        
        if (existente >= 0) {
            proyectos[existente] = { ...proyecto, updatedAt: new Date().toISOString() };
        } else {
            proyecto.id = Date.now();
            proyecto.createdAt = new Date().toISOString();
            proyectos.push(proyecto);
        }
        
        localStorage.setItem(this.PROYECTOS_KEY, JSON.stringify(proyectos));
        return proyecto;
    },
    
    deleteCliente(rut) {
        const proyectos = this.getClientes().filter(p => p.rut !== rut);
        localStorage.setItem(this.PROYECTOS_KEY, JSON.stringify(proyectos));
    },
    
    getClienteByRut(rut) {
        return this.getClientes().find(p => p.rut === rut);
    },
    
    // ===== PRODUCTOS =====
    getProductos() {
        return JSON.parse(localStorage.getItem(this.PRODUCTOS_KEY)) || [];
    },
    
    saveProducto(producto) {
        const productos = this.getProductos();
        const nombreLower = producto.nombre.toLowerCase();
        const existente = productos.findIndex(p => p.nombre.toLowerCase() === nombreLower);
        
        if (existente >= 0) {
            productos[existente] = { ...producto, updatedAt: new Date().toISOString() };
        } else {
            producto.id = Date.now();
            producto.createdAt = new Date().toISOString();
            productos.push(producto);
        }
        
        localStorage.setItem(this.PRODUCTOS_KEY, JSON.stringify(productos));
        return producto;
    },
    
    deleteProducto(nombre) {
        const productos = this.getProductos().filter(p => p.nombre.toLowerCase() !== nombre.toLowerCase());
        localStorage.setItem(this.PRODUCTOS_KEY, JSON.stringify(productos));
    },
    
    getProductoByNombre(nombre) {
        return this.getProductos().find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    },
    
    // ===== UTILIDADES =====
    buscarClientes(query) {
        const q = query.toLowerCase();
        return this.getClientes().filter(c => 
            c.nombre.toLowerCase().includes(q) || 
            c.rut.includes(q)
        );
    },
    
    buscarProductos(query) {
        const q = query.toLowerCase();
        return this.getProductos().filter(p => 
            p.nombre.toLowerCase().includes(q)
        );
    },
    
    // Exportar datos
    exportData() {
        return {
            proyectos: this.getClientes(),
            productos: this.getProductos(),
            exportedAt: new Date().toISOString()
        };
    },
    
    // Importar datos
    importData(data) {
        if (data.proyectos) {
            localStorage.setItem(this.PROYECTOS_KEY, JSON.stringify(data.proyectos));
        }
        if (data.productos) {
            localStorage.setItem(this.PRODUCTOS_KEY, JSON.stringify(data.productos));
        }
    }
};

// Exportar para uso global
window.DB = DB;