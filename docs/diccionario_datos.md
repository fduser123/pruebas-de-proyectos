# Diccionario de datos - Diagnostico OCTAVE (Banco)

Resumen de las tablas principales del esquema `sql/octave_diagnostico_banco.sql`.

| Tabla | Descripcion |
|---|---|
| organizaciones | Entidad bancaria auditada |
| sucursales | Sucursales/agencias del banco |
| departamentos | Areas funcionales |
| empleados | Personal y roles de seguridad |
| activos | Activos de informacion criticos |
| requisitos_seguridad | Requisitos C/I/D por activo |
| actores_amenaza | Actores que pueden amenazar |
| perfiles_amenaza | Perfiles de amenaza por activo |
| vulnerabilidades_organizacionales | Debilidades organizacionales |
| sistemas | Sistemas y aplicaciones TI |
| componentes_infraestructura | Componentes tecnicos |
| vulnerabilidades_tecnicas | Vulnerabilidades tecnicas (CVE) |
| diagnosticos | Ejecuciones del diagnostico |
| diagnosticos_activos | Activos incluidos en un diagnostico |
| diagnosticos_sistemas | Sistemas incluidos en un diagnostico |
| riesgos | Riesgos identificados |
| controles | Controles de seguridad |
| riesgo_controles | Relacion riesgo-control |
| planes_mitigacion | Planes de tratamiento |
| estrategias_seguridad | Estrategia de seguridad |
