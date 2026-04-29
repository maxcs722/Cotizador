// ===== BASE DE DATOS LOCAL (localStorage) =====

const DB = {
    // Keys para localStorage
    CLIENTES_KEY: "cotizador_clientes",
    PRODUCTOS_KEY: "cotizador_productos",
    EMPRESA_KEY: "cotizador_empresa",
    PROYECTO_KEY: "cotizador_proyecto_actual",
    
    // ===== EMPRESA (mis datos) =====
    getEmpresa() {
        return JSON.parse(localStorage.getItem(this.EMPRESA_KEY)) || null;
    },
    
    saveEmpresa(empresa) {
        empresa.updatedAt = new Date().toISOString();
        localStorage.setItem(this.EMPRESA_KEY, JSON.stringify(empresa));
        return empresa;
    },
    
    // ===== CLIENTES =====
    getClientes() {
        return JSON.parse(localStorage.getItem(this.CLIENTES_KEY)) || [];
    },
    
    saveCliente(cliente) {
        const clientes = this.getClientes();
        const existente = clientes.findIndex(c => c.rut === cliente.rut);
        
        if (existente >= 0) {
            clientes[existente] = { ...cliente, updatedAt: new Date().toISOString() };
        } else {
            cliente.id = Date.now();
            cliente.createdAt = new Date().toISOString();
            clientes.push(cliente);
        }
        
        localStorage.setItem(this.CLIENTES_KEY, JSON.stringify(clientes));
        return cliente;
    },
    
    deleteCliente(rut) {
        const clientes = this.getClientes().filter(c => c.rut !== rut);
        localStorage.setItem(this.CLIENTES_KEY, JSON.stringify(clientes));
    },
    
    getClienteByRut(rut) {
        return this.getClientes().find(c => c.rut === rut);
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