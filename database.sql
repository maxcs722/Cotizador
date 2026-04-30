-- =====================================================
-- BASE DE DATOS SQL PARA COTIZADOR
-- =====================================================

-- Crear base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS cotizador_db;
USE cotizador_db;

-- =====================================================
-- TABLA: clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    razon_social VARCHAR(255),
    direccion VARCHAR(500),
    ciudad VARCHAR(100),
    telefono VARCHAR(50),
    email VARCHAR(255),
    contacto VARCHAR(255),
    giro VARCHAR(255),
    observaciones TEXT,
    activo TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rut (rut),
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: productos
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    unidad VARCHAR(20) DEFAULT 'und',
    precio_unitario DECIMAL(12,2) DEFAULT 0,
    costo DECIMAL(12,2) DEFAULT 0,
    stock INT DEFAULT 0,
    categoria VARCHAR(100),
    marca VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sku (sku),
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cotizaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio INT UNIQUE NOT NULL,
    fecha DATE NOT NULL,
    cliente_id INT,
    proyecto_codigo VARCHAR(50),
    subtotal DECIMAL(12,2) DEFAULT 0,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    descuento_monto DECIMAL(12,2) DEFAULT 0,
    iva DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    estado ENUM('borrador', 'enviada', 'aprobada', 'rechazada') DEFAULT 'borrador',
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    INDEX idx_folio (folio),
    INDEX idx_fecha (fecha),
    INDEX idx_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cotizacion_detalle
-- =====================================================
CREATE TABLE IF NOT EXISTS cotizacion_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    producto_id INT,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    INDEX idx_cotizacion (cotizacion_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS DE EJEMPLO (seed data)
-- =====================================================

-- Insertar clientes de ejemplo
INSERT INTO clientes (rut, nombre, razon_social, direccion, ciudad, telefono, email, contacto, giro) VALUES
('11111111-1', 'Empresa Ejemplo SpA', 'Empresa Ejemplo SpA', 'Av. Principal 123', 'Santiago', '+56 2 2123 4567', 'contacto@ejemplo.cl', 'Juan Pérez', 'Servicios de consultoría'),
('22222222-2', 'Comercial ABC Ltda', 'Comercial ABC Ltda', 'Calle Secondary 456', 'Valparaíso', '+56 32 2123 4568', 'ventas@abc.cl', 'María González', 'Comercialización de productos'),
('33333333-3', 'Industrias XYZ SA', 'Industrias XYZ SA', 'Paseo Industrial 789', 'Concepción', '+56 41 2123 4569', 'compras@xyz.cl', 'Carlos López', 'Fabricación industrial');

-- Insertar productos de ejemplo
INSERT INTO productos (sku, nombre, descripcion, unidad, precio_unitario, costo, stock, categoria, marca) VALUES
('PROD-001', 'Producto A', 'Descripción del producto A', 'und', 50000, 30000, 100, 'Categoría 1', 'Marca X'),
('PROD-002', 'Producto B', 'Descripción del producto B', 'und', 75000, 45000, 50, 'Categoría 1', 'Marca Y'),
('PROD-003', 'Servicio de Instalación', 'Servicio de instalación profesional', 'serv', 150000, 80000, 999, 'Servicios', 'N/A'),
('PROD-004', 'Producto C', 'Descripción del producto C', 'kg', 25000, 15000, 200, 'Categoría 2', 'Marca Z');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de clientes con cantidad de cotizaciones
CREATE OR REPLACE VIEW v_clientes_cotizaciones AS
SELECT 
    c.id,
    c.rut,
    c.nombre,
    c.razon_social,
    c.telefono,
    c.email,
    c.activo,
    COUNT(co.id) as total_cotizaciones,
    SUM(CASE WHEN co.estado = 'aprobada' THEN 1 ELSE 0 END) as cotizaciones_aprobadas
FROM clientes c
LEFT JOIN cotizaciones co ON c.id = co.cliente_id
GROUP BY c.id;

-- Vista de productos con rotación
CREATE OR REPLACE VIEW v_productos_stock AS
SELECT 
    p.id,
    p.sku,
    p.nombre,
    p.categoria,
    p.stock,
    p.precio_unitario,
    p.costo,
    (p.precio_unitario - p.costo) as margen,
    CASE 
        WHEN p.stock = 0 THEN 'Sin stock'
        WHEN p.stock < 10 THEN 'Stock bajo'
        ELSE 'Disponible'
    END as estado_stock
FROM productos p
WHERE p.activo = 1;