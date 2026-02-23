# 💼 InvestMatch  
**Proyecto desarrollado por:** Gonzalo Rodríguez  

---

## 🌐 Descripción del proyecto

**InvestMatch** es una aplicación web en la nube que conecta a **emprendedores** que buscan financiación con **inversores** interesados en descubrir y apoyar nuevos proyectos.

La plataforma permite:
- Publicar proyectos de inversión (emprendedores)  
- Explorar, reservar e invertir en proyectos (inversores)  
- Gestionar usuarios, proyectos y pagos (administrador)  

El sistema incluye una funcionalidad de **impulso de proyectos**, donde los usuarios pueden pagar para destacar su proyecto y aparecer en el **Top 10 VIP** dentro de la app.

---

## ☁️ Tecnologías utilizadas

- **Frontend:** HTML, CSS, JavaScript
- **Backend y base de datos:** **Firebase** (Authentication, Realtime Database)
- **Despliegue:** **Firebase Hosting**
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
- **Gestión de Usuarios:** Activar/desactivar, cambiar de rol y eliminar usuarios (baja lógica).
- **Gestión de Proyectos:** Aprobar, rechazar y eliminar proyectos de forma definitiva, incluyendo sus inversiones asociadas.
- **Gestión de Pagos:** Visualizar un historial de todas las inversiones con detalles sobre el inversor, el proyecto, la cantidad y la fecha.
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
*Diagrama de clases simplificado que refleja la estructura en Firebase Realtime Database.*

### clases

class Usuario {
  - uid: string
  - name: string
  - email: string
  - role: string << "inversor" | "emprendedor" | "admin" >>
  - active: boolean
  - createdAt: timestamp
  --
  + register()
  + login()
  + logout()
}

class Proyecto {
  - id: string
  - creatorId: string
  - name: string
  - estado: string << "pendiente" | "aprobado" | "rechazado" >>
  - (otros campos...)
  --
  + crear()
  + editar()
  + eliminar()
}

class Inversion {
  - id: string
  - investorId: string
  - projectId: string
  - amountInvested: number
  - investedAt: timestamp
  --
  + crearInversion()
  + cancelarInversion()
}


### relaciones

Usuario "1" -- "0..*" Proyecto : crea >
Usuario "1" -- "0..*" Inversion : realiza >
Proyecto "1" -- "0..*" Inversion : recibe >

© 2025 Gonzalo Rodríguez — 2º DAM  
