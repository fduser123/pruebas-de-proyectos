-- ============================================================================
-- Esquema para diagnostico de seguridad usando la metodologia OCTAVE
-- (Operationally Critical Threat, Asset, and Vulnerability Evaluation)
-- aplicado a una entidad bancaria.
-- Motor: PostgreSQL 17 (Supabase). Todas las tablas en schema public.
-- ============================================================================

-- ===================== ORGANIZACION Y ESTRUCTURA =====================

CREATE TABLE IF NOT EXISTS organizaciones (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          text NOT NULL,
    descripcion     text,
    sector          text NOT NULL DEFAULT 'banca',
    pais            text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sucursales (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo          text NOT NULL,
    nombre          text NOT NULL,
    tipo            text NOT NULL DEFAULT 'sucursal', -- matriz, sucursal, agencia, centro_servicio
    direccion       text,
    ciudad          text,
    pais            text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organizacion_id, codigo)
);

CREATE TABLE IF NOT EXISTS departamentos (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id     uuid REFERENCES sucursales(id) ON DELETE SET NULL,
    nombre          text NOT NULL,
    responsable     text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS empleados (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    departamento_id uuid REFERENCES departamentos(id) ON DELETE SET NULL,
    nombre          text NOT NULL,
    cargo           text,
    email           text,
    rol_seguridad   text, -- propietario_activo, responsable_riesgo, administrador, usuario
    activo          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ===================== ACTIVOS (OCTAVE Fase 1) =====================

CREATE TABLE IF NOT EXISTS activos (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    departamento_id uuid REFERENCES departamentos(id) ON DELETE SET NULL,
    nombre          text NOT NULL,
    descripcion     text,
    tipo            text NOT NULL DEFAULT 'informacion', -- informacion, sistema, servicio, persona, fisico, reputacion
    clasificacion    text NOT NULL DEFAULT 'interno',     -- publico, interno, confidencial, restringido
    valor           text NOT NULL DEFAULT 'medio',       -- alto, medio, bajo
    propietario_id  uuid REFERENCES empleados(id) ON DELETE SET NULL,
    ubicacion       text,
    critico         boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requisitos_seguridad (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activo_id       uuid NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
    confidencialidad text NOT NULL DEFAULT 'medio', -- alto, medio, bajo, no_aplica
    integridad       text NOT NULL DEFAULT 'medio',
    disponibilidad   text NOT NULL DEFAULT 'medio',
    descripcion      text,
    created_at       timestamptz NOT NULL DEFAULT now()
);

-- ===================== AMENAZAS (OCTAVE Fase 1) =====================

CREATE TABLE IF NOT EXISTS actores_amenaza (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre          text NOT NULL,
    tipo            text NOT NULL DEFAULT 'externo', -- interno, externo, socio, proveedor, cliente
    motivacion      text,
    capacidad       text, -- alta, media, baja
    descripcion     text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS perfiles_amenaza (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostico_id      uuid, -- FK agregada despues de crear diagnosticos
    activo_id           uuid NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
    actor_amenaza_id    uuid REFERENCES actores_amenaza(id) ON DELETE SET NULL,
    descripcion_amenaza text NOT NULL,
    consecuencia        text, -- divulgacion, modificacion, interrupcion, destruccion
    probabilidad        text NOT NULL DEFAULT 'media', -- alta, media, baja
    impacto             text NOT NULL DEFAULT 'medio',  -- alto, medio, bajo
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- ===================== VULNERABILIDADES ORGANIZACIONALES (OCTAVE Fase 1) =====================

CREATE TABLE IF NOT EXISTS vulnerabilidades_organizacionales (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    activo_id       uuid REFERENCES activos(id) ON DELETE SET NULL,
    descripcion     text NOT NULL,
    categoria       text NOT NULL DEFAULT 'proceso', -- proceso, personas, fisico, tecnologia, gestion
    severidad       text NOT NULL DEFAULT 'media',  -- critica, alta, media, baja
    estado          text NOT NULL DEFAULT 'abierta', -- abierta, mitigada, aceptada, en_progreso
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ===================== INFRAESTRUCTURA (OCTAVE Fase 2) =====================

CREATE TABLE IF NOT EXISTS sistemas (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id     uuid REFERENCES sucursales(id) ON DELETE SET NULL,
    nombre          text NOT NULL,
    descripcion     text,
    tipo            text NOT NULL DEFAULT 'aplicacion', -- core_banking, aplicacion, api, mobile, web, base_datos, middleware
    criticidad      text NOT NULL DEFAULT 'media',       -- critica, alta, media, baja
    proveedor       text,
    version         text,
    en_produccion   boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS componentes_infraestructura (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sistema_id      uuid NOT NULL REFERENCES sistemas(id) ON DELETE CASCADE,
    nombre          text NOT NULL,
    tipo            text NOT NULL DEFAULT 'servidor', -- servidor, red, firewall, base_datos, cloud, almacenamiento, endpoint
    descripcion     text,
    ubicacion       text,
    direccion_ip    text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vulnerabilidades_tecnicas (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sistema_id      uuid REFERENCES sistemas(id) ON DELETE CASCADE,
    componente_id   uuid REFERENCES componentes_infraestructura(id) ON DELETE CASCADE,
    cve_id          text,
    titulo          text NOT NULL,
    descripcion     text,
    severidad       text NOT NULL DEFAULT 'media', -- critica, alta, media, baja, informativa
    cvss_score      numeric(4,2),
    estado          text NOT NULL DEFAULT 'abierta', -- abierta, mitigada, aceptada, en_progreso, cerrada
    fecha_deteccion timestamptz NOT NULL DEFAULT now(),
    fecha_cierre    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluaciones_infraestructura (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostico_id  uuid, -- FK agregada despues
    sistema_id      uuid NOT NULL REFERENCES sistemas(id) ON DELETE CASCADE,
    fecha           timestamptz NOT NULL DEFAULT now(),
    resultado       text, -- conforme, no_conforme, parcial
    observaciones   text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ===================== DIAGNOSTICOS =====================

CREATE TABLE IF NOT EXISTS diagnosticos (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre          text NOT NULL,
    metodologia     text NOT NULL DEFAULT 'OCTAVE',
    alcance         text,
    fecha_inicio    date,
    fecha_fin       date,
    estado          text NOT NULL DEFAULT 'en_progreso', -- planificado, en_progreso, completado, cancelado
    responsable_id  uuid REFERENCES empleados(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- FKs diferidas para diagnosticos
ALTER TABLE perfiles_amenaza
    ADD CONSTRAINT fk_perfiles_diagnostico
    FOREIGN KEY (diagnostico_id) REFERENCES diagnosticos(id) ON DELETE CASCADE;

ALTER TABLE evaluaciones_infraestructura
    ADD CONSTRAINT fk_eval_diagnostico
    FOREIGN KEY (diagnostico_id) REFERENCES diagnosticos(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS diagnosticos_activos (
    diagnostico_id  uuid NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
    activo_id       uuid NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
    PRIMARY KEY (diagnostico_id, activo_id)
);

CREATE TABLE IF NOT EXISTS diagnosticos_sistemas (
    diagnostico_id  uuid NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
    sistema_id      uuid NOT NULL REFERENCES sistemas(id) ON DELETE CASCADE,
    PRIMARY KEY (diagnostico_id, sistema_id)
);

-- ===================== RIESGOS (OCTAVE Fase 3) =====================

CREATE TABLE IF NOT EXISTS riesgos (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostico_id      uuid NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
    activo_id           uuid REFERENCES activos(id) ON DELETE SET NULL,
    perfil_amenaza_id   uuid REFERENCES perfiles_amenaza(id) ON DELETE SET NULL,
    vulnerabilidad_org_id uuid REFERENCES vulnerabilidades_organizacionales(id) ON DELETE SET NULL,
    vulnerabilidad_tec_id uuid REFERENCES vulnerabilidades_tecnicas(id) ON DELETE SET NULL,
    descripcion         text NOT NULL,
    probabilidad        text NOT NULL DEFAULT 'media', -- alta, media, baja
    impacto             text NOT NULL DEFAULT 'medio', -- alto, medio, bajo
    nivel_riesgo        text NOT NULL DEFAULT 'medio', -- critico, alto, medio, bajo
    estado              text NOT NULL DEFAULT 'identificado', -- identificado, en_tratamiento, mitigado, aceptado, cerrado
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS controles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre          text NOT NULL,
    tipo            text NOT NULL DEFAULT 'preventivo', -- preventivo, detective, correctivo, compensatorio
    categoria       text, -- tecnico, administrativo, fisico
    descripcion     text,
    efectividad     text NOT NULL DEFAULT 'media', -- alta, media, baja
    estado          text NOT NULL DEFAULT 'implementado', -- implementado, parcial, planificado, no_implementado
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riesgo_controles (
    riesgo_id       uuid NOT NULL REFERENCES riesgos(id) ON DELETE CASCADE,
    control_id      uuid NOT NULL REFERENCES controles(id) ON DELETE CASCADE,
    aplicabilidad   text,
    PRIMARY KEY (riesgo_id, control_id)
);

-- ===================== PLANES DE MITIGACION Y ESTRATEGIA (OCTAVE Fase 3) =====================

CREATE TABLE IF NOT EXISTS planes_mitigacion (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    riesgo_id       uuid NOT NULL REFERENCES riesgos(id) ON DELETE CASCADE,
    accion          text NOT NULL,
    descripcion     text,
    responsable_id  uuid REFERENCES empleados(id) ON DELETE SET NULL,
    prioridad       text NOT NULL DEFAULT 'media', -- critica, alta, media, baja
    fecha_inicio    date,
    fecha_fin       date,
    estado          text NOT NULL DEFAULT 'pendiente', -- pendiente, en_progreso, completado, cancelado
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estrategias_seguridad (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    diagnostico_id  uuid REFERENCES diagnosticos(id) ON DELETE SET NULL,
    objetivo        text NOT NULL,
    descripcion     text,
    prioridad       text NOT NULL DEFAULT 'media',
    horizonte       text, -- corto_plazo, mediano_plazo, largo_plazo
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ===================== INDICES =====================

CREATE INDEX IF NOT EXISTS idx_activos_org ON activos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_activos_clasif ON activos(clasificacion);
CREATE INDEX IF NOT EXISTS idx_perfiles_activo ON perfiles_amenaza(activo_id);
CREATE INDEX IF NOT EXISTS idx_vuln_org_org ON vulnerabilidades_organizacionales(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_sistemas_org ON sistemas(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_vuln_tec_sistema ON vulnerabilidades_tecnicas(sistema_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_diag ON riesgos(diagnostico_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_nivel ON riesgos(nivel_riesgo);
CREATE INDEX IF NOT EXISTS idx_planes_riesgo ON planes_mitigacion(riesgo_id);

-- ===================== RLS (opcional, habilitar segun necesidad) =====================
-- ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
