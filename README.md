# 💼 InvestMatch  
**Proyecto desarrollado por:** Gonzalo Rodríguez  

---

## 🌐 Descripción del proyecto

**InvestMatch** es una aplicación web en la nube que conecta a **emprendedores** que buscan financiación con **inversores** interesados en descubrir y apoyar nuevos proyectos.

La plataforma permite:
- Publicar proyectos de inversión (emprendedores)  
- Explorar, reservar e invertir en proyectos (inversores)  
- Gestionar usuarios, reservas y pagos (administrador)  

El sistema incluye una funcionalidad de **impulso de proyectos**, donde los usuarios pueden pagar para destacar su proyecto y aparecer en el **Top 10 VIP** dentro de la app.

---

## ☁️ Tecnologías utilizadas

- **Frontend:** Desplegado con [Vercel](https://vercel.com)  
- **Backend y base de datos:** [Firebase](https://firebase.google.com) (Auth, Firestore y Hosting)  
- **Diseño UML:** Creado siguiendo el modelo de clases con relaciones y métodos definidos.  
- **Lenguaje:** JavaScript / HTML / CSS (para interfaz web)  

---

## 💰 Método de monetización

1. **Comisión por inversión:**  
   La plataforma obtiene un **2.5% del monto invertido** en cada operación completada.  
2. **Impulso de proyectos:**  
   Los emprendedores pueden pagar para **destacar su proyecto**.  
3. **Top 10 VIP:**  
   Los proyectos más impulsados aparecen en una sección especial, aumentando su visibilidad ante inversores.

---

## ⚙️ Requisitos Funcionales

### 🔐 Gestión de usuarios
- Registro e inicio de sesión mediante **Firebase Auth**.  
- Roles: *Inversor*, *Emprendedor*, *Administrador*.  
- Edición de perfil y cierre de sesión.  
- Cifrado de contraseñas y correos.  
- Activación o desactivación de usuarios por parte del administrador.

### 💼 Publicación e impulso de proyectos
- Crear, editar o eliminar proyectos.  
- Datos: título, descripción, imagen, monto, categoría.  
- Notificaciones al recibir reservas.  
- Botón **“Impulsar proyecto”** mediante pago (tarjeta, Bizum o Apple Pay).  
- Los proyectos impulsados aparecen en el **Top 10 VIP**.

### 💰 Reservas e inversiones
- Los inversores pueden explorar proyectos, filtrarlos y reservar inversión.  
- Posibilidad de cancelar reservas antes del pago.  
- Estados de pago: *pendiente*, *pagado*, *rechazado*.  
- Añadir proyectos a favoritos.

### 🧑‍💼 Panel de administración
- Gestión de usuarios, proyectos y reservas.  
- Control de pagos e impulsos.  
- Bloqueo de usuarios sospechosos.  

### 🔒 Seguridad y control
- Cifrado de datos mediante Firebase.  
- Detección de actividad sospechosa (múltiples intentos de login, cuentas duplicadas).  
- Cierre de sesión seguro.  
- Orden FIFO para proyectos (excepto impulsados, que aparecen primero).

---

## ⚡ Requisitos No Funcionales

- **Diseño:** interfaz moderna y adaptable a móviles.  
- **Rendimiento:** carga rápida (<2s por página).  
- **Seguridad:** uso de HTTPS y autenticación segura.  
- **Escalabilidad:** posible integración futura con Supabase o Laravel.  
- **Mantenimiento:** código modular y versionado con GitHub.  
- **Compatibilidad:** navegadores modernos (Chrome, Edge, Firefox, Safari).  
- **Backups:** copias automáticas de la base de datos en Firebase.
---

##  diagrama UML

### clases

class Usuario {
  - id: string
  - email: string
  - passwordHash: string
  - nombre: string
  - apellidos: string
  - fechaRegistro: number
  - activo: boolean
  - rol: string << "inversor" | "emprendedor" | "admin" >>
  --
  + registro()
  + login()
  + editarPerfil()
  + desactivarCuenta()
}

class Proyecto {
  - id: string
  - emprendedorId: string
  - titulo: string
  - descripcion: string
  - imagenes: string[]
  - montoSolicitado: number
  - categoria: string
  - estado: string << "activo" | "cerrado" >>
  - esVIP: boolean
  - nivelBoost: number
  - fechaBoost: number
  - fechaCreacion: number
  --
  + crear()
  + editar()
  + eliminar()
  + asignarBoost()
  + quitarBoost()
}

class Reserva {
  - id: string
  - proyectoId: string
  - inversorId: string
  - monto: number
  - metodoPago: string
  - comision: number
  - estado: string << "pendiente" | "pagado" | "cancelado" >>
  - fechaReservado: number
  --
  + crearReserva()
  + cancelarReserva()
  + confirmarPago()
}

class Pago {
  - id: string
  - reservaId: string
  - inversorId: string
  - proyectoId: string
  - metodoPago: string
  - estado: string << "pendiente" | "completado" | "fallido" >>
  - comision: number
  - fechaPago: number
  --
  + procesarPago()
  + reembolsar()
}

### relaciones

Usuario "1" -- "0..*" Proyecto : crea >
Usuario "1" -- "0..*" Reserva : realiza >
Proyecto "1" -- "0..*" Reserva : recibe >
Reserva "1" -- "0..1" Pago : genera >

© 2025 Gonzalo Rodríguez — 2º DAM  
