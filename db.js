// ===== BASE DE DATOS FIREBASE (Firestore) =====
// Configuración de Firebase - REEMPLAZA con tu config

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase (solo si está configurado)
let db = null;
let app = null;
let firebaseInicializado = false;

async function initFirebase() {
    if (firebaseInicializado) return;
    
    // Verificar que config no sea la默认值
    if (firebaseConfig.apiKey === "TU_API_KEY") {
        console.warn("Firebase no configurado. Usando localStorage.");
        return;
    }
    
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        const { getFirestore, getDocs, doc, setDoc, deleteDoc, collection, query, where } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        firebaseInicializado = true;
        console.log("Firebase conectado");
    } catch(e) {
        console.error("Error al inicializar Firebase:", e);
    }
}

// ===== BASE DE DATOS CON FALLBACK =====
const DB = {
    modo: "local", // "firebase" o "local"
    
    // Keys para localStorage (fallback)
    CLIENTES_KEY: "cotizador_clientes",
    PRODUCTOS_KEY: "cotizador_productos",
    EMPRESA_KEY: "cotizador_empresa",
    PROYECTO_KEY: "cotizador_proyecto_actual",
    
    // ===== FIREBASE: Métodos async =====
    async _getFromFirebase(collectionName) {
        if (!db) return null;
        try {
            const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            const snapshot = await getDocs(collection(db, collectionName));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch(e) {
            console.error("Error Firebase:", e);
            return null;
        }
    },
    
    async _saveToFirebase(collectionName, data, idField) {
        if (!db) return false;
        try {
            const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            const id = data[idField] || data.id || Date.now().toString();
            await setDoc(doc(db, collectionName, id), { ...data, updatedAt: new Date().toISOString() });
            return true;
        } catch(e) {
            console.error("Error Firebase:", e);
            return false;
        }
    },
    
    async _deleteFromFirebase(collectionName, id) {
        if (!db) return false;
        try {
            const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            await deleteDoc(doc(db, collectionName, id));
            return true;
        } catch(e) {
            console.error("Error Firebase:", e);
            return false;
        }
    },
    
    // ===== FALLBACK: localStorage =====
    _getLocal(key) {
        return JSON.parse(localStorage.getItem(key)) || null;
    },
    
    _setLocal(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // ===== EMPRESA =====
    async getEmpresa() {
        if (db) {
            const data = await this._getFromFirebase("empresa");
            if (data && data.length > 0) return data[0];
        }
        return this._getLocal(this.EMPRESA_KEY);
    },
    
    async saveEmpresa(empresa) {
        empresa.updatedAt = new Date().toISOString();
        if (db) {
            await this._saveToFirebase("empresa", empresa, "rut");
        }
        this._setLocal(this.EMPRESA_KEY, empresa);
        return empresa;
    },
    
    // ===== CLIENTES =====
    async getClientes() {
        if (db) {
            const data = await this._getFromFirebase("clientes");
            if (data) return data;
        }
        return this._getLocal(this.CLIENTES_KEY) || [];
    },
    
    async saveCliente(cliente) {
        cliente.updatedAt = new Date().toISOString();
        if (!cliente.id) cliente.id = Date.now().toString();
        
        if (db) {
            await this._saveToFirebase("clientes", cliente, "rut");
        }
        
        // También guardar en localStorage como backup
        const clientes = await this.getClientes();
        const existente = clientes.findIndex(c => c.rut === cliente.rut);
        if (existente >= 0) {
            clientes[existente] = cliente;
        } else {
            cliente.createdAt = new Date().toISOString();
            clientes.push(cliente);
        }
        this._setLocal(this.CLIENTES_KEY, clientes);
        return cliente;
    },
    
    async deleteCliente(rut) {
        if (db) {
            await this._deleteFromFirebase("clientes", rut);
        }
        const clientes = (await this.getClientes()).filter(c => c.rut !== rut);
        this._setLocal(this.CLIENTES_KEY, clientes);
    },
    
    async getClienteByRut(rut) {
        const clientes = await this.getClientes();
        return clientes.find(c => c.rut === rut);
    },
    
    // ===== PRODUCTOS =====
    async getProductos() {
        if (db) {
            const data = await this._getFromFirebase("productos");
            if (data) return data;
        }
        return this._getLocal(this.PRODUCTOS_KEY) || [];
    },
    
    async saveProducto(producto) {
        producto.updatedAt = new Date().toISOString();
        if (!producto.id) producto.id = Date.now().toString();
        
        if (db) {
            await this._saveToFirebase("productos", producto, "nombre");
        }
        
        const productos = await this.getProductos();
        const nombreLower = producto.nombre.toLowerCase();
        const existente = productos.findIndex(p => p.nombre.toLowerCase() === nombreLower);
        if (existente >= 0) {
            productos[existente] = producto;
        } else {
            producto.createdAt = new Date().toISOString();
            productos.push(producto);
        }
        this._setLocal(this.PRODUCTOS_KEY, productos);
        return producto;
    },
    
    async deleteProducto(nombre) {
        if (db) {
            await this._deleteFromFirebase("productos", nombre);
        }
        const productos = (await this.getProductos()).filter(p => p.nombre.toLowerCase() !== nombre.toLowerCase());
        this._setLocal(this.PRODUCTOS_KEY, productos);
    },
    
    async getProductoByNombre(nombre) {
        const productos = await this.getProductos();
        return productos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    },
    
    // ===== UTILIDADES =====
    async buscarClientes(query) {
        const clientes = await this.getClientes();
        const q = query.toLowerCase();
        return clientes.filter(c => 
            c.nombre.toLowerCase().includes(q) || 
            c.rut.includes(q)
        );
    },
    
    async buscarProductos(query) {
        const productos = await this.getProductos();
        const q = query.toLowerCase();
        return productos.filter(p => 
            p.nombre.toLowerCase().includes(q)
        );
    },
    
    // Exportar datos
    async exportData() {
        return {
            empresa: await this.getEmpresa(),
            clientes: await this.getClientes(),
            productos: await this.getProductos(),
            exportedAt: new Date().toISOString()
        };
    },
    
    // Importar datos
    async importData(data) {
        if (data.empresa) {
            await this.saveEmpresa(data.empresa);
        }
        if (data.clientes && Array.isArray(data.clientes)) {
            for (const cliente of data.clientes) {
                await this.saveCliente(cliente);
            }
        }
        if (data.productos && Array.isArray(data.productos)) {
            for (const producto of data.productos) {
                await this.saveProducto(producto);
            }
        }
    },
    
    // Verificar conexión Firebase
    isFirebaseConfigured() {
        return firebaseConfig.apiKey !== "TU_API_KEY";
    }
};

// Inicializar Firebase al cargar
initFirebase();

// Exportar para uso global
window.DB = DB;