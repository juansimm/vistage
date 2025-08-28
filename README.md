# Vistage AI - Coaching Ejecutivo Inteligente

Vistage AI es una aplicación de asistente de voz inteligente diseñada específicamente para coaching ejecutivo y reuniones de negocios. La aplicación utiliza tecnologías avanzadas de IA para proporcionar una experiencia de coaching estructurada y efectiva.

## 🎯 Características Principales

### Sistema de Fases de Coaching
- **Descubrimiento**: Explorar el contexto y desafíos actuales
- **Exploración**: Profundizar en las causas raíz y alternativas
- **Plan de Acción**: Diseñar estrategias y pasos concretos
- **Compromiso**: Confirmar responsabilidades y próximos pasos

### Funcionalidades Avanzadas
- **Transcripción en Tiempo Real**: STT (Speech-to-Text) en vivo
- **Respuestas Inteligentes**: IA generativa adaptada a cada fase
- **Síntesis de Voz Natural**: TTS (Text-to-Speech) con voces naturales
- **Visualizador de Audio**: Ondas de audio en tiempo real
- **Editor de Prompts**: Personalización del comportamiento de la IA
- **Controles de Sesión**: Iniciar, pausar, reanudar y terminar sesiones

## 🚀 Casos de Uso

### Coaching Ejecutivo
- Sesiones individuales de desarrollo profesional
- Análisis de desafíos empresariales
- Mejora de habilidades directivas

### Reuniones de Negocios
- Facilitación de discusiones estratégicas
- Documentación automática de decisiones
- Seguimiento de acciones y compromisos

### Consultoría Estratégica
- Exploración de problemas complejos
- Generación de alternativas creativas
- Planificación de implementación

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **UI**: Tailwind CSS, NextUI
- **Audio**: Web Audio API, MediaRecorder API
- **IA**: Deepgram (STT/TTS), OpenAI GPT-4
- **Comunicación**: WebSockets para tiempo real
- **Estado**: React Context API, Hooks

## 📁 Estructura del Proyecto

```
app/
├── components/           # Componentes de React
│   ├── VistageAIDashboard.tsx    # Dashboard principal
│   ├── PhaseSelector.tsx         # Selector de fases
│   ├── PromptEditor.tsx          # Editor de prompts
│   ├── SessionControls.tsx       # Controles de sesión
│   ├── LiveTranscription.tsx     # Transcripción en vivo
│   ├── AudioVisualizer.tsx       # Visualizador de audio
│   └── AgentControls.tsx         # Controles del agente
├── context/             # Contextos de React
│   └── WebSocketContext.tsx      # Contexto de WebSocket
├── lib/                 # Utilidades y tipos
│   ├── types.ts                 # Tipos de TypeScript
│   ├── constants.ts             # Constantes de la aplicación
│   └── helpers.ts               # Funciones auxiliares
└── page.tsx             # Página principal
```

## 🎨 Interfaz de Usuario

### Diseño Responsivo
- Layout adaptativo para diferentes tamaños de pantalla
- Grid system flexible para organizar componentes
- Diseño móvil-first con breakpoints optimizados

### Paleta de Colores
- **Primario**: Azul (#3B82F6) y Verde (#10B981)
- **Secundario**: Púrpura (#8B5CF6) y Naranja (#F59E0B)
- **Neutro**: Grises oscuros para el fondo (#111827)
- **Acentos**: Colores de estado (éxito, error, advertencia)

### Componentes Interactivos
- Botones con estados visuales claros
- Indicadores de estado en tiempo real
- Animaciones suaves y transiciones
- Feedback visual inmediato

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
- Seleccionar fase de coaching
- Personalizar prompts si es necesario
- Verificar conexión de audio

### 2. Inicio de Sesión
- Hacer clic en "Iniciar Sesión"
- El sistema activa el micrófono
- La IA se adapta al prompt de la fase seleccionada

### 3. Conversación
- Hablar naturalmente con el asistente
- Ver transcripción en tiempo real
- Observar visualización de audio
- Monitorear progreso de la sesión

### 4. Gestión de Sesión
- Pausar/reanudar según sea necesario
- Cambiar entre fases si es apropiado
- Terminar sesión cuando se complete

## 🎯 Ventajas del Sistema de Fases

### Estructura Clara
- Proporciona un marco organizado para las conversaciones
- Evita la deriva en temas no relacionados
- Mantiene el enfoque en objetivos específicos

### Adaptabilidad de la IA
- El comportamiento se ajusta automáticamente a cada fase
- Prompts especializados para diferentes tipos de coaching
- Respuestas contextualmente apropiadas

### Progresión Natural
- Flujo lógico de descubrimiento a acción
- Cada fase construye sobre la anterior
- Resultados medibles y accionables

## 🔮 Roadmap Futuro

### Funcionalidades Planificadas
- **Análisis de Sentimientos**: Detección de emociones en tiempo real
- **Resúmenes Automáticos**: Generación de actas de sesión
- **Integración CRM**: Sincronización con sistemas de gestión
- **Métricas de Progreso**: Seguimiento de objetivos a largo plazo
- **Colaboración en Equipo**: Múltiples participantes por sesión

### Mejoras Técnicas
- **Offline Mode**: Funcionalidad sin conexión
- **Multiidioma**: Soporte para múltiples idiomas
- **APIs Públicas**: Endpoints para integraciones externas
- **Analytics**: Dashboard de métricas de uso

## 🤝 Contribución

### Guías de Contribución
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- Seguir las convenciones de TypeScript
- Usar ESLint y Prettier para formateo
- Escribir tests para nuevas funcionalidades
- Documentar APIs y componentes

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Deepgram** por las APIs de audio y voz
- **OpenAI** por los modelos de lenguaje
- **Next.js** por el framework de React
- **Tailwind CSS** por el sistema de diseño

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Consultar la documentación de la API

---

**Vistage AI** - Transformando el coaching ejecutivo con inteligencia artificial.
