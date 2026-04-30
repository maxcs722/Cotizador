# Cotizador PRO

Sistema de cotización profesional para empresas chilenas. Genera cotizaciones en PDF, gestiona clientes y productos, con soporte para almacenamiento local y Firebase.

## Características

- **Gestión de Empresa**: Guarda datos de tu empresa (nombre, RUT, dirección, teléfono)
- **Gestión de Clientes**: Administra clientes con validación de RUT chileno
- **Gestión de Proyectos**: Crea y guarda proyectos con folio automático
- **Productos/Servicios**: Catálogo de productos con precios
- **Generación de PDF**: Exporta cotizaciones profesionales
- **Importar/Exportar**: Respaldo en JSON
- **Firebase**: Sincronización en la nube (opcional)

## Requisitos

- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet (para Firebase y CDN de jsPDF)

## Instalación

1. Clona o descarga este repositorio
2. Abre `index.html` en tu navegador
3. ¡Listo! No requiere servidor

## Configuración de Firebase (Opcional)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Agrega una "Web App"
4. Copia la configuración en `db.js`:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

## Uso

### Empresa
1. Ingresa los datos de tu empresa
2. Click en "Guardar Empresa"

### Cliente
1. Ingresa datos del cliente (el RUT se valida automáticamente)
2. Click en "Guardar Cliente"

### Crear Cotización
1. Ingresa nombre y código del proyecto
2. Agrega productos con cantidad y precio
3. El total se calcula automáticamente
4. Click en "Descargar PDF" para generar

### Importar/Exportar
- **Exportar Datos**: Descarga todos los datos en JSON
- **Importar Datos**: Restaura desde archivo JSON
- **Importar Cliente**: Trae cliente desde Firebase
- **Importar Producto**: Trae producto desde Firebase

## Estructura de Archivos

```
├── index.html    # Interfaz principal
├── app.js        # Lógica de la aplicación
├── db.js         # Gestión de base de datos (Firebase + localStorage)
├── style.css     # Estilos
└── database.sql  # Estructura de base de datos (referencia)
```

## Validación de RUT

El sistema valida automáticamente el RUT chileno usando el algoritmo módulo 11.

## Tecnologías

- Vanilla JavaScript (ES6+)
- Firebase Firestore
- jsPDF para generación de PDF
- localStorage como respaldo local

## Licencia

MIT