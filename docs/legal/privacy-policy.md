---
layout: default
title: Política de privacidad
permalink: /legal/privacy-policy/
---

# Política de Privacidad de AltSolver

**Última actualización:** 2026-05-20
**Contacto:** gioalvaro@gmail.com

AltSolver ("la aplicación", "el add-on") es un complemento de Google Sheets que resuelve problemas de programación lineal y entera mixta. Esta política describe qué datos accede, cómo los procesa y qué garantías ofrece sobre privacidad.

## 1. Datos a los que accede

AltSolver requiere los siguientes permisos OAuth de Google:

| Scope | Para qué se usa |
|---|---|
| `https://www.googleapis.com/auth/spreadsheets.currentonly` | Leer y escribir **solo en la hoja de cálculo donde el usuario abre el add-on**. AltSolver no puede acceder a otras hojas de cálculo del usuario. |
| `https://www.googleapis.com/auth/script.container.ui` | Mostrar el panel lateral y los diálogos modales del add-on. |
| `https://www.googleapis.com/auth/script.locale` | Detectar el idioma del usuario para mostrar mensajes en español o inglés. |

Estos scopes son no-sensibles ("non-sensitive") según la clasificación de Google y no requieren verificación adicional.

## 2. Qué hace AltSolver con los datos

- **Lectura de celdas**: AltSolver lee los valores y fórmulas de las celdas que el usuario define como variables, objetivo, restricciones y lados derechos en el panel lateral. Esto es necesario para extraer los coeficientes del modelo de optimización.
- **Escritura de celdas**: si el usuario opta por conservar la solución, AltSolver escribe los valores óptimos en las celdas de variables y crea hojas nuevas con los reportes (Respuesta, Sensibilidad, Solución gráfica).
- **Persistencia del modelo**: AltSolver guarda la configuración del modelo (referencias de celdas, opciones del solver) en *Developer Metadata* de la hoja activa, bajo la clave `altsolver.model.v1`. Esta metadata viaja con el archivo si el usuario lo copia, pero es invisible para otros editores del documento.

## 3. Qué NO hace AltSolver

- **No transmite datos a servidores externos.** El solver (HiGHS compilado a WebAssembly) corre íntegramente dentro del navegador del usuario, en el iframe del diálogo. AltSolver no usa ninguna API externa.
- **No envía telemetría.** No se recolectan métricas, eventos de uso, ni identificadores del usuario.
- **No comparte datos con terceros.** Nada de lo que el usuario carga en su hoja sale de Google.
- **No usa cookies ni almacenamiento del navegador** más allá de la *Developer Metadata* mencionada.
- **No accede a archivos en Drive** distintos del documento activo.

## 4. Retención de datos

AltSolver no retiene datos del usuario en ningún servidor (ya que no tiene servidor). Toda información persistida vive en el documento del usuario:
- *Developer Metadata* en la hoja: borrable al desinstalar el add-on o eliminar manualmente.
- Hojas de reporte generadas (`Respuesta N`, `Sensibilidad N`, `Solución gráfica N`): permanecen en el documento del usuario hasta que las borre.

## 5. Desinstalación

El usuario puede desinstalar AltSolver en cualquier momento desde:
- `Extensiones → Complementos → Administrar complementos → AltSolver → Desinstalar` (en Google Sheets), o
- `https://workspace.google.com/marketplace` → My apps.

La desinstalación revoca todos los permisos OAuth. Las hojas de reporte y la metadata persistida en documentos pre-existentes no se eliminan automáticamente.

## 6. Cambios en esta política

Si se introducen cambios materiales en cómo AltSolver maneja datos, esta página se actualizará y los usuarios serán notificados a través de la página del Marketplace.

## 7. Contacto

Para consultas, reportes de bugs o solicitudes relacionadas con privacidad:

- **Email:** gioalvaro@gmail.com
- **Repositorio público:** https://github.com/gioalvaro/alt-solver
- **Issues:** https://github.com/gioalvaro/alt-solver/issues
