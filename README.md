# 🎾 Sistema de Gestión de Clases de Pádel

Un sistema completo y profesional para la gestión de academias de pádel, desarrollado con React, TypeScript y Tailwind CSS.

## 🚀 Características Principales

### 👥 Gestión de Alumnos
- ✅ Registro completo de estudiantes (nombre, DNI, teléfono, dirección)
- ✅ Clasificación por condición (Titular, Familiar, Invitado)
- ✅ Búsqueda y filtrado avanzado por nombre, DNI o teléfono
- ✅ Historial de cuenta corriente individual con exportación
- ✅ Seguimiento de saldos pendientes en tiempo real

### 📅 Calendario y Clases
- ✅ Calendario mensual interactivo con navegación fluida
- ✅ Creación de clases individuales y grupales
- ✅ **Buscador de alumnos** en formulario de clases para selección rápida
- ✅ Programación con repetición (semanal/mensual)
- ✅ **Replicación inteligente** de clases del mes anterior por día de semana
- ✅ Edición completa de clases programadas
- ✅ Eliminación segura con confirmación
- ✅ Registro de asistencia con un click
- ✅ Vista detallada de cada clase con información completa

### 💰 Sistema de Facturación Avanzado
- ✅ Gestión de facturas pendientes por alumno
- ✅ **Pagos parciales** - Permite cobrar montos menores al total adeudado
- ✅ **Sistema de descuentos flexible**:
  - Descuentos globales sobre el total del alumno
  - Descuentos por selección de clases específicas
  - Aplicación por monto fijo o porcentaje
- ✅ **Cobro por selección** - Elegir qué clases cobrar específicamente
- ✅ Múltiples métodos de pago (efectivo, transferencia, tarjeta)
- ✅ Generación automática de recibos detallados
- ✅ Cálculo automático de saldos restantes
- ✅ Manejo inteligente de saldos remanentes

### 📊 Reportes y Análisis
- ✅ Reportes detallados por período con filtros de fecha
- ✅ Estadísticas de asistencia por alumno
- ✅ Análisis de ingresos y transacciones
- ✅ Exportación múltiple (CSV, JSON)
- ✅ Impresión de reportes profesionales
- ✅ Historial completo de todas las operaciones

### 🧾 Gestión de Recibos
- ✅ **Historial completo de recibos** con filtros avanzados
- ✅ Búsqueda por alumno y rango de fechas
- ✅ **Previsualización** de recibos antes de imprimir
- ✅ **Impresión profesional** con formato optimizado
- ✅ Exportación de datos de recibos (CSV, JSON)
- ✅ Detalles completos: subtotal, descuentos, montos abonados

### 🔧 Características Técnicas
- ✅ Interfaz responsive (móvil y desktop)
- ✅ Persistencia de datos en localStorage
- ✅ Validaciones completas en todos los formularios
- ✅ Manejo robusto de errores
- ✅ Diseño profesional con Tailwind CSS
- ✅ Iconografía consistente con Lucide React
- ✅ Navegación intuitiva entre módulos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Build Tool**: Vite
- **Almacenamiento**: localStorage (navegador)
- **Despliegue**: Netlify

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
3. Usa la búsqueda para encontrar alumnos por nombre, DNI o teléfono
4. Filtra por condición (Titular, Familiar, Invitado)
5. Click en el ícono de edición para modificar datos
6. Click en el ícono de dólar para ver la cuenta corriente detallada

### 2. Programación de Clases
1. Ve a la sección **"Agenda"**
2. Haz click en cualquier día para crear una nueva clase
3. **Usa el buscador de alumnos** para encontrar rápidamente estudiantes
4. Configura tipo (individual/grupal), precio, alumnos y horario
5. Usa **"Repetir mes anterior"** para replicar clases automáticamente
6. Click en cualquier clase para ver detalles, editarla o eliminarla

### 3. Registro de Asistencia
1. En el calendario, click en una clase programada
2. Haz click en **"Registrar Asistencia"**
3. Marca cada alumno como Presente o Ausente
4. El sistema genera automáticamente los cargos por las clases
5. Agrega nuevos alumnos directamente desde el modal si es necesario

### 4. Facturación y Cobros Avanzados
1. Ve a la sección **"Facturas"**
2. Verás todos los alumnos con deudas pendientes
3. Selecciona un alumno para ver sus opciones de cobro

#### Opciones de Descuento:
- **Descuento Global**: Aplica descuento sobre todo el saldo pendiente
- **Cobro por Selección**: Elige qué clases cobrar específicamente

#### Funcionalidades de Cobro:
- **Pago completo**: Cobra todas las clases seleccionadas
- **Pago parcial**: Ingresa el monto que paga el alumno
- **Descuentos flexibles**: Por monto fijo o porcentaje
- **Selección de clases**: Cobra solo las clases que elijas

### 5. Reportes y Análisis
1. Ve a la sección **"Reportes"**
2. Selecciona el rango de fechas deseado
3. Exporta datos a CSV o JSON
4. Imprime reportes para análisis offline
5. Filtra por tipo de transacción o alumno específico

### 6. Historial de Recibos
1. Ve a la sección **"Recibos"**
2. **Filtra por alumno** usando el selector
3. **Busca por nombre** con el campo de búsqueda
4. **Filtra por fechas** usando los campos desde/hasta
5. **Previsualiza** recibos antes de imprimir
6. **Imprime** recibos con formato profesional
7. **Exporta** datos para análisis externo

## 💡 Casos de Uso Comunes

### Pago Parcial con Descuento
**Situación**: Un alumno debe $5000, se le hace 10% de descuento y paga $3000
1. En "Facturas", selecciona el alumno
2. Ve a la pestaña "Cobrar clases"
3. Selecciona las clases a cobrar
4. Aplica 10% de descuento
5. Ingresa $3000 como monto a cobrar
6. El sistema genera el recibo y mantiene el saldo restante

### Búsqueda Rápida de Alumnos
**Situación**: Tienes 100 alumnos y necesitas agregar "García" a una clase
1. En el formulario de nueva clase
2. En la sección "Alumnos", escribe "gar" en el buscador
3. Aparecen solo los alumnos con "García" en el nombre
4. Selecciona el alumno deseado

### Replicación Mensual de Clases
**Situación**: Copiar todas las clases de enero a febrero
1. En "Agenda", navega a febrero
2. Click en "Repetir mes anterior"
3. El sistema replica automáticamente por día de semana
4. Mantiene horarios, precios y alumnos asignados

### Análisis de Ingresos
**Situación**: Ver ingresos del último trimestre
1. En "Reportes", selecciona fechas del trimestre
2. Exporta a CSV para análisis en Excel
3. Filtra por tipo de transacción
4. Imprime reporte para presentación

## 🔒 Seguridad y Datos

- Los datos se almacenan localmente en el navegador
- No se envía información a servidores externos
- Respaldos automáticos en localStorage
- Validaciones para prevenir pérdida de datos
- Confirmaciones para operaciones críticas

## 🎨 Personalización

El sistema utiliza Tailwind CSS, permitiendo fácil personalización de:
- Colores y temas corporativos
- Espaciado y tipografía
- Componentes responsive
- Animaciones y transiciones

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge (últimas versiones)
- ✅ Dispositivos móviles (responsive design)
- ✅ Tablets y desktop
- ✅ Funciona offline (datos locales)

## 🚀 Despliegue

El sistema está optimizado para despliegue en:
- **Netlify** (recomendado) - Despliegue automático
- Vercel
- GitHub Pages
- Cualquier hosting de archivos estáticos

### URL de Producción
🌐 **Demo en vivo**: https://majestic-elf-bd82cc.netlify.app

## 🆕 Últimas Actualizaciones

### v2.1.0 - Enero 2026
- ✅ **Buscador de alumnos** en formulario de clases
- ✅ **Historial completo de recibos** con filtros avanzados
- ✅ **Sistema de descuentos mejorado** (global y por selección)
- ✅ **Previsualización e impresión** de recibos profesional
- ✅ **Exportación mejorada** de datos (CSV, JSON)
- ✅ **Interfaz optimizada** para mejor experiencia de usuario

### Próximas Funcionalidades
- 🔄 Backup y restauración de datos
- 📧 Notificaciones por email
- 📊 Dashboard con métricas avanzadas
- 🏆 Sistema de membresías y planes

## 🤝 Contribuciones

Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios con commits descriptivos
4. Envía un pull request detallado

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- 🐛 **Issues**: Crear un issue en GitHub con descripción detallada
- 📖 **Documentación**: README completo con ejemplos
- 💻 **Código**: Completamente comentado y documentado

## 🏆 Reconocimientos

Desarrollado con ❤️ para academias de pádel profesionales que buscan:
- **Eficiencia** en la gestión diaria
- **Control total** de ingresos y alumnos  
- **Profesionalismo** en la atención al cliente
- **Simplicidad** sin sacrificar funcionalidad

---

**🎾 Sistema de Gestión de Clases de Pádel - La solución completa para tu academia**