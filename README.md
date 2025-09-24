# 🎾 Sistema de Gestión de Clases de Pádel

Un sistema completo y profesional para la gestión de academias de pádel, desarrollado con React, TypeScript y Tailwind CSS.

## 🚀 Características Principales

### 👥 Gestión de Alumnos
- ✅ Registro completo de estudiantes (nombre, DNI, teléfono, dirección)
- ✅ Clasificación por condición (Titular, Familiar, Invitado)
- ✅ Búsqueda y filtrado avanzado
- ✅ Historial de cuenta corriente individual
- ✅ Seguimiento de saldos pendientes

### 📅 Calendario y Clases
- ✅ Calendario mensual interactivo
- ✅ Creación de clases individuales y grupales
- ✅ Programación con repetición (semanal/mensual)
- ✅ Replicación inteligente de clases del mes anterior
- ✅ Edición completa de clases programadas
- ✅ Eliminación segura con confirmación
- ✅ Registro de asistencia con un click

### 💰 Sistema de Facturación
- ✅ Gestión de facturas pendientes
- ✅ **Pagos parciales** - Permite cobrar montos menores al total adeudado
- ✅ **Sistema de descuentos** - Aplicar descuentos por clase
- ✅ **Montos personalizados** - Modificar precios individuales
- ✅ Múltiples métodos de pago (efectivo, transferencia, tarjeta)
- ✅ Generación automática de recibos
- ✅ Cálculo automático de saldos restantes

### 📊 Reportes y Análisis
- ✅ Reportes detallados por período
- ✅ Estadísticas de asistencia
- ✅ Análisis de ingresos
- ✅ Exportación a CSV
- ✅ Impresión de reportes
- ✅ Historial completo de recibos

### 🔧 Características Técnicas
- ✅ Interfaz responsive (móvil y desktop)
- ✅ Persistencia de datos en localStorage
- ✅ Validaciones completas
- ✅ Manejo de errores
- ✅ Diseño profesional con Tailwind CSS
- ✅ Iconografía con Lucide React

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Build Tool**: Vite
- **Almacenamiento**: localStorage (navegador)

## 📦 Instalación

```bash
# Clonar el repositorio
git clone [url-del-repositorio]

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🎯 Uso del Sistema

### 1. Gestión de Alumnos
1. Ve a la sección **"Alumnos"**
2. Haz click en **"Nuevo Alumno"** para registrar estudiantes
3. Usa la búsqueda para encontrar alumnos específicos
4. Click en el ícono de edición para modificar datos
5. Click en el ícono de dólar para ver la cuenta corriente

### 2. Programación de Clases
1. Ve a la sección **"Agenda"**
2. Haz click en cualquier día para crear una nueva clase
3. Configura tipo (individual/grupal), precio, alumnos y horario
4. Usa **"Repetir mes anterior"** para replicar clases automáticamente
5. Click en cualquier clase para editarla o eliminarla

### 3. Registro de Asistencia
1. En el calendario, click en una clase programada
2. Haz click en **"Registrar Asistencia"**
3. Marca cada alumno como Presente o Ausente
4. El sistema genera automáticamente los cargos por las clases

### 4. Facturación y Cobros
1. Ve a la sección **"Facturas"**
2. Verás todos los alumnos con deudas pendientes
3. Haz click en **"Cobrar"** para procesar pagos

#### Opciones de Pago:
- **Pago completo**: Cobra todas las clases seleccionadas
- **Pago parcial**: Activa el checkbox y ingresa el monto que paga el alumno
- **Descuentos**: Ingresa descuentos individuales por clase
- **Montos custom**: Modifica el precio de clases específicas

### 5. Reportes
1. Ve a la sección **"Reportes"**
2. Selecciona el rango de fechas
3. Exporta datos a CSV o imprime reportes
4. Click en cualquier alumno para ver su historial detallado

### 6. Historial de Recibos
1. Ve a la sección **"Recibos"**
2. Filtra por alumno o fecha
3. Imprime o exporta recibos individuales
4. Elimina recibos si es necesario

## 💡 Casos de Uso Comunes

### Pago Parcial
**Situación**: Un alumno debe $3000 pero solo puede pagar $1500
1. En "Facturas", click en "Cobrar"
2. Activa "Pago parcial"
3. Ingresa $1500
4. El sistema crea automáticamente una nueva deuda de $1500

### Aplicar Descuento
**Situación**: Dar 20% de descuento a un alumno regular
1. En "Facturas", selecciona las clases
2. En el campo "Descuento", ingresa el monto del descuento
3. El total se actualiza automáticamente

### Replicar Clases Mensuales
**Situación**: Copiar todas las clases del mes anterior
1. En "Agenda", click en "Repetir mes anterior"
2. El sistema replica automáticamente por día de semana
3. Mantiene horarios, precios y alumnos asignados

## 🔒 Seguridad y Datos

- Los datos se almacenan localmente en el navegador
- No se envía información a servidores externos
- Respaldos automáticos en localStorage
- Validaciones para prevenir pérdida de datos

## 🎨 Personalización

El sistema utiliza Tailwind CSS, permitiendo fácil personalización de:
- Colores y temas
- Espaciado y tipografía
- Componentes responsive
- Animaciones y transiciones

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Dispositivos móviles (responsive)
- ✅ Tablets y desktop
- ✅ Funciona offline (datos locales)

## 🚀 Despliegue

El sistema está optimizado para despliegue en:
- Netlify (recomendado)
- Vercel
- GitHub Pages
- Cualquier hosting de archivos estáticos

## 🤝 Contribuciones

Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Crear un issue en GitHub
- Documentación completa en el README
- Código completamente comentado

---

**Desarrollado con ❤️ para academias de pádel profesionales**