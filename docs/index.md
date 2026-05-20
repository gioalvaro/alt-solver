---
layout: default
title: AltSolver
---

# AltSolver

**Solver de Excel para Google Sheets.** Open-source, sin backend, sin telemetría.

Resuelve programación lineal (LP) y entera mixta (MIP) usando el motor HiGHS compilado a WebAssembly. Produce los reportes clásicos de Respuesta, Sensibilidad y una Solución Gráfica para problemas de 2 variables.

[Repositorio en GitHub](https://github.com/gioalvaro/alt-solver) · [Instalá desde Workspace Marketplace](#)

## Documentación legal

- [Política de privacidad](legal/privacy-policy/)
- [Términos de servicio](legal/terms-of-service/)

## ¿Qué hace AltSolver?

- Resuelve LP con el método Simplex revisado.
- Resuelve MIP con branch-and-bound (variables `int` y `bin`).
- Calcula análisis de sensibilidad con **rangos admisibles reales** (incremento/decremento) por bisección sobre la base óptima.
- Para problemas de 2 variables, grafica la región factible, los vértices, las curvas de nivel del objetivo y el óptimo.
- Trae 4 ejemplos pre-cargados (Producción Taha 3.1, Dieta, Mezcla, Mochila 0-1).

## Privacidad en 30 segundos

- Solo accede a la **hoja activa**, nunca a otras hojas o archivos del usuario.
- **No envía datos a servidores externos** — el solver corre dentro del navegador del usuario.
- **No recolecta telemetría** ni identifica usuarios.
- **No comparte con terceros.**

Detalle completo en la [política de privacidad](legal/privacy-policy/).

## Licencia

MIT. Ver [LICENSE](https://github.com/gioalvaro/alt-solver/blob/main/LICENSE).
