# Vistage AI - Coaching Ejecutivo Inteligente

Vistage AI es una aplicación de asistente de voz inteligente diseñada específicamente para coaching ejecutivo y reuniones de negocios. La aplicación utiliza tecnologías avanzadas de IA para proporcionar una experiencia de coaching estructurada y efectiva.

## 🎯 Características Principales

### Sistema de Fases de Coaching
- **Descubrimiento** (15 min): Explorar el contexto y desafíos actuales
- **Exploración** (20 min): Profundizar en las causas raíz y alternativas  
- **Plan de Acción** (15 min): Diseñar estrategias y pasos concretos

### Funcionalidades Avanzadas
- **Transcripción en Tiempo Real**: STT (Speech-to-Text) en vivo con Deepgram
- **Respuestas Inteligentes**: IA generativa adaptada a cada fase de coaching
- **Síntesis de Voz Natural**: TTS (Text-to-Speech) con voces naturales
- **Visualizador de Audio**: Ondas de audio en tiempo real
- **Editor de Prompts**: Personalización del comportamiento de la IA por fase
- **Controles de Sesión**: Iniciar, pausar, reanudar y terminar sesiones
- **Almacenamiento de Conversaciones**: Guardado automático de sesiones
- **Interfaz Adaptativa**: Diseño responsivo para diferentes dispositivos

## 🚀 Casos de Uso

### Coaching Ejecutivo
- Sesiones individuales de desarrollo profesional
- Análisis de desafíos empresariales complejos
- Mejora de habilidades directivas y estratégicas
- Consultoría en resolución de problemas organizacionales

### Reuniones de Negocios
- Facilitación de discusiones estratégicas
- Documentación automática de decisiones y compromisos
- Seguimiento de acciones y métricas de implementación
- Análisis de riesgos y oportunidades

### Consultoría Estratégica
- Exploración de problemas complejos con metodología estructurada
- Generación de alternativas creativas y estratégicas
- Planificación de implementación con cronogramas
- Evaluación de impacto organizacional

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript 5
- **UI**: Tailwind CSS, NextUI v2, Componentes personalizados
- **Audio**: Web Audio API, MediaRecorder API, Deepgram SDK
- **IA**: Deepgram (STT/TTS), OpenAI GPT-4, AI SDK
- **Comunicación**: WebSockets para tiempo real, react-use-websocket
- **Estado**: React Context API, Hooks, Estado local
- **Almacenamiento**: LocalStorage, Conversaciones persistentes
- **Autenticación**: JWT, Middleware personalizado
- **Herramientas**: ESLint, Husky, Commitlint, Semantic Release

## 📁 Estructura del Proyecto

```
app/
├── components/           # Componentes de React
│   ├── VistageAIDashboard.tsx    # Dashboard principal con gestión de sesiones
│   ├── PhaseSelector.tsx         # Selector de fases de coaching
│   ├── PromptEditor.tsx          # Editor de prompts personalizados
│   ├── SessionControls.tsx       # Controles de sesión (iniciar/pausar/terminar)
│   ├── LiveTranscription.tsx     # Transcripción en vivo con visualización
│   ├── AudioVisualizer.tsx       # Visualizador de audio en tiempo real
│   ├── AgentControls.tsx         # Controles del agente de IA
│   ├── ConversationAgent.tsx     # Agente conversacional inteligente
│   ├── InitialLoadAgent.tsx      # Agente de carga inicial
│   ├── MessageAudio.tsx          # Reproductor de mensajes de audio
│   ├── ChatBubble.tsx            # Burbujas de chat personalizadas
│   ├── MessageHeader.tsx         # Encabezados de mensajes
│   ├── RightBubble.tsx           # Burbujas de respuesta del agente
│   ├── TextContext.tsx           # Contexto de texto para mensajes
│   ├── UserAvatar.tsx            # Avatar del usuario
│   ├── DgSvg.tsx                 # Iconos SVG personalizados
│   ├── Headphones.tsx            # Componente de auriculares
│   └── icons/                    # Biblioteca de iconos SVG
├── context/             # Contextos de React
│   ├── WebSocketContext.tsx      # Contexto de WebSocket para comunicación
│   ├── Auth.tsx                  # Contexto de autenticación
│   └── Toast.tsx                 # Contexto de notificaciones
├── api/                 # API Routes de Next.js
│   ├── authenticate/             # Autenticación de usuarios
│   ├── generate-token/           # Generación de tokens JWT
│   ├── save-conversation/        # Guardado de conversaciones
│   └── verify-token/             # Verificación de tokens
├── lib/                 # Utilidades y tipos
│   ├── types.ts                 # Tipos de TypeScript para la aplicación
│   ├── constants.ts             # Constantes y configuración del sistema
│   ├── conversationStorage.ts    # Gestión de almacenamiento de conversaciones
│   ├── authMiddleware.ts         # Middleware de autenticación
│   ├── helpers.ts                # Funciones auxiliares
│   └── jwt.ts                    # Utilidades de JWT
├── config/             # Configuración de la aplicación
├── conversaciones/     # Almacenamiento de conversaciones guardadas
└── page.tsx            # Página principal de la aplicación
```

## 🎨 Interfaz de Usuario

### Diseño Responsivo
- Layout adaptativo para diferentes tamaños de pantalla
- Grid system flexible para organizar componentes
- Diseño móvil-first con breakpoints optimizados
- Componentes que se adaptan automáticamente

### Paleta de Colores por Fase
- **Descubrimiento**: Azul a Cian (#3B82F6 → #06B6D4)
- **Exploración**: Púrpura a Rosa (#8B5CF6 → #EC4899)
- **Plan de Acción**: Verde a Esmeralda (#10B981 → #059669)
- **Neutro**: Grises oscuros para el fondo (#111827)
- **Acentos**: Colores de estado (éxito, error, advertencia)

### Componentes Interactivos
- Botones con estados visuales claros y feedback inmediato
- Indicadores de estado en tiempo real (conexión, audio, sesión)
- Animaciones suaves y transiciones CSS
- Visualización de audio con ondas en tiempo real
- Selector de fases con indicadores visuales claros

## 🔧 Configuración y Uso

### Requisitos Previos
- Node.js 18+ y npm/bun
- Cuenta de Deepgram con API key
- Cuenta de OpenAI con API key

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd deepgram-ai-agent-demo

# Instalar dependencias
npm install
# o
bun install

# Configurar variables de entorno
cp sample.env.local .env.local
# Editar .env.local con tus API keys

# Ejecutar en desarrollo
npm run dev
# o
bun dev
```

### Variables de Entorno
```env
NEXT_PUBLIC_DEEPGRAM_SOCKET_URL=wss://api.deepgram.com/v1/listen
DEEPGRAM_API_KEY=tu_api_key_de_deepgram
OPENAI_API_KEY=tu_api_key_de_openai
```

## 📱 Flujo de Usuario

### 1. Configuración Inicial
- Seleccionar fase de coaching (Descubrimiento, Exploración, Plan de Acción)
- Personalizar prompts si es necesario
- Verificar conexión de audio y micrófono

### 2. Inicio de Sesión
- Hacer clic en "Iniciar Sesión"
- El sistema activa el micrófono y establece conexión WebSocket
- La IA se adapta automáticamente al prompt de la fase seleccionada
- Comienza la transcripción en tiempo real

### 3. Conversación Inteligente
- Hablar naturalmente con el asistente "Bibi"
- Ver transcripción en tiempo real con indicadores de hablante
- Observar visualización de audio en tiempo real
- Monitorear progreso de la sesión y tiempo transcurrido
- La IA mantiene contexto y adapta respuestas a la fase actual

### 4. Gestión de Sesión
- Pausar/reanudar según sea necesario
- Cambiar entre fases si es apropiado (solo antes de iniciar)
- Terminar sesión cuando se complete
- Guardado automático de la conversación

## 🎯 Ventajas del Sistema de Fases

### Metodología Estructurada
- **Descubrimiento**: Enfoque en comprensión profunda del problema
- **Exploración**: Análisis de causas raíz y alternativas estratégicas
- **Plan de Acción**: Creación de planes ejecutables con métricas

### Adaptabilidad de la IA
- El comportamiento se ajusta automáticamente a cada fase
- Prompts especializados para diferentes tipos de coaching
- Respuestas contextualmente apropiadas y estratégicas
- Mantenimiento de contexto a lo largo de toda la sesión

### Progresión Natural
- Flujo lógico de descubrimiento a implementación
- Cada fase construye sobre la anterior
- Resultados medibles y accionables
- Seguimiento de compromisos y próximos pasos

## 🔮 Roadmap Futuro

### Funcionalidades Planificadas
- **Análisis de Sentimientos**: Detección de emociones en tiempo real
- **Resúmenes Automáticos**: Generación de actas de sesión estructuradas
- **Integración CRM**: Sincronización con sistemas de gestión empresarial
- **Métricas de Progreso**: Seguimiento de objetivos a largo plazo
- **Colaboración en Equipo**: Múltiples participantes por sesión
- **Exportación de Datos**: PDF, Word, y formatos de presentación

### Mejoras Técnicas
- **Offline Mode**: Funcionalidad sin conexión con sincronización
- **Multiidioma**: Soporte para múltiples idiomas
- **APIs Públicas**: Endpoints para integraciones externas
- **Analytics Avanzado**: Dashboard de métricas de uso y efectividad
- **Machine Learning**: Aprendizaje de patrones de coaching exitosos

## 🤝 Contribución

### Guías de Contribución
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- Seguir las convenciones de TypeScript y React
- Usar ESLint y Prettier para formateo
- Escribir tests para nuevas funcionalidades
- Documentar APIs y componentes con JSDoc
- Seguir principios SOLID y patrones de diseño limpio

### Herramientas de Desarrollo
- **Husky**: Hooks de Git para calidad de código
- **Commitlint**: Validación de mensajes de commit
- **Semantic Release**: Releases automáticos versionados
- **ESLint**: Linting de código TypeScript/React

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Deepgram** por las APIs de audio y voz de alta calidad
- **OpenAI** por los modelos de lenguaje avanzados
- **Next.js** por el framework de React de última generación
- **Tailwind CSS** por el sistema de diseño utilitario
- **NextUI** por los componentes de UI modernos y accesibles

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Consultar la documentación de la API
- Revisar los ejemplos de uso en el código

---

**Vistage AI** - Transformando el coaching ejecutivo con inteligencia artificial avanzada y metodología estructurada.
