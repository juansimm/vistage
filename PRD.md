# 📄 PRD – Vistage AI Voice Session System (MVP)

## 🎯 Visión General

Construir una plataforma SaaS de **AI conversacional** para potenciar sesiones ejecutivas de Vistage.  
El sistema permite **transcribir reuniones en tiempo real**, organizar las interacciones en **fases (Presentación, Preguntas, Recomendaciones)** y contar con una **IA (Vivi)** que participa de forma **inteligente y contextual**, generando valor estratégico en cada sesión.

## 🚀 Objetivos del MVP

1. Ofrecer un **demo funcional** de sesiones con Vivi.
2. Asegurar **fluidez de uso**: sin fricción en reuniones con 15+ participantes.
3. Garantizar **seguridad y privacidad** (multi-tenant por grupo, datos en MySQL).
4. Integrar **voz natural (ElevenLabs)** y **STT preciso (Whisper / Deepgram)**.
5. Generar un **resumen automático** al finalizar cada sesión para cada miembro.

---

## 🏗️ Arquitectura del Sistema

### Backend

- **Stack**: Node.js + Express + TypeScript
- **Providers**:
    - OpenAI GPT-4 → Razonamiento contextual de Vivi
    - Whisper / Deepgram → Speech-to-Text
    - ElevenLabs → Text-to-Speech (voz “Valeria”)
- **Business Logic**:
    - Toda en **Stored Procedures** de MySQL 2022 (vía Workbench).
    - Backend actúa solo como **controller/orchestrator**.

### Frontend

- **Stack**: React + Next.js + TypeScript
- **Pages principales**:
    - `/desktop-voice`: Consola profesional de sesión
    - `/dashboard-admin`: Vista admin de todos los grupos
    - `/dashboard-chair`: Vista chair con stats + KB
- **Componentes UI/UX clave**:
    - Live transcript panel
    - Voice motion (5-dot animation, colores por fase)
    - Prompt editor en vivo (sincronizado con backend)
    - Session controls:
        - `Start Conversation`
        - `Activate Vivi`
        - `Voice On/Off`
        - `End Session`

---

## 🔄 Flujo de la Sesión (End-to-End)

1. **Start Conversation**
    - Micrófono abierto
    - Transcripción en vivo (texto parcial y final)
    - Se guarda en DB vía SPs
2. **Presentación del Caso** (fase azul)
    - El presentador expone
    - Vivi escucha, pero no interviene
3. **Preguntas** (fase roja)
    - Cada miembro hace su pregunta
    - Vivi formula la última pregunta (única, no redundante)
4. **Recomendaciones** (fase verde)
    - Cada miembro da su devolución
    - Vivi cierra con una síntesis + 3–5 pasos accionables
5. **End Session**
    - Se guarda todo
    - Se genera un **resumen ejecutivo** para cada participante
    - El chair recibe stats y KB actualizada

---

## 📊 Dashboards

### Admin Dashboard

- Ver todos los grupos (250+)
- Ver miembros de cada grupo
- Knowledge Base asociada
- API integrada con **Human** (CRM externo)

### Chair Dashboard

- Stats de cada miembro:
    - Participación
    - Preguntas hechas
    - Recomendaciones dadas
- Resumen post-sesión
- KB de cada usuario actualizado automáticamente

### Session Room

- Transcript en vivo
- Prompt visible y editable
- Botones de control
- Upload de materiales (PDF/PPT)