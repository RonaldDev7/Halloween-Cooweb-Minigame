# ☣️ COOWEB — THE LAST PROTOCOL [2041]

Videojuego web de terror y supervivencia en 2.5D ambientado en el año 2041. La inteligencia artificial **E.V.A.** ha exterminado a la humanidad y asimilado al desarrollador **Ronald** como su principal criatura biomecánica. El jugador debe adentrarse en las instalaciones subterráneas de CooWeb, recuperar los 3 fragmentos del código de curación o sobrevivir a la persecución implacable de Ronald.

---

## 🎮 Modos de Juego

1. **MODO ESCAPE (Campaña Principal)**:
   - Explora el laboratorio subterráneo en penumbra absoluta.
   - Encuentra los **3 Fragmentos del Código de la Cura** (`BIO-CÓDIGO`, `NEURAL`, `NÚCLEO`).
   - Evita a Ronald apagando la linterna o escondiéndote en taquillas metálicas.
   - Alcanza la esclusa de descontaminación para sellar el laboratorio y ganar.

2. **PROTOCOLO: CONTENCIÓN (Modo Competitivo)**:
   - Diseñado para dinámicas presenciales y eventos de CooWeb.
   - Sobrevive el mayor tiempo posible mientras el nivel de amenaza de E.V.A. escala cada 30 segundos.
   - Hackea terminales de purga (+250 pts) y recoge biocélulas (+100 pts) además de los puntos por segundo.
   - Al caer, registra tu apodo en el **Ranking Global de Supabase**.

3. **CLASIFICACIÓN GLOBAL**:
   - Visualización del **TOP 10** de supervivientes con medallas, puntuación, tiempo y fecha.
   - Conectado a la base de datos de Supabase con respaldo transparente en almacenamiento local.

---

## 🕹️ Controles de Supervivencia

| Acción | Control Teclado / Ratón |
|---|---|
| **Moverse** | `W`, `A`, `S`, `D` o `Flechas` |
| **Apuntar Linterna** | Mover el cursor del ratón |
| **Esprintar** | Mantener `Shift` (Consume barra de estamina) |
| **Conmutar Linterna (Sigilo)** | Pulsar `F` (Apagar luz para no ser visto por Ronald) |
| **Interactuar / Recoger / Esconderse** | Pulsar `E` o `Espacio` cerca del objeto/taquilla |

---

## 🛠️ Stack Tecnológico

- **Next.js 16** (App Router & Server Components / API Routes)
- **React 19 & TypeScript**
- **Motor 2D en Canvas** con Iluminación Volumétrica y Raycasting de sombras en tiempo real
- **GSAP & @gsap/react** para transiciones cinematográficas y efectos de jumpscare
- **Tailwind CSS** con paleta oficial: `#09080A`, `#530570`, `#F5F3F2`, `#FF1E42`, `#00FFC2`
- **Web Audio API** para diseño sonoro procedural (pasos metálicos, latidos cardíacos, zumbido de servidor y rugidos de Ronald)
- **Supabase** (`@supabase/supabase-js`) para persistencia del Leaderboard global

---

## 📦 Estructura de Assets Oficiales

```text
public/
  images/
    ronald-monster.jpg   # Arte oficial del monstruo biomecánico Ronald
    cooweb-logo.png      # Logotipo oficial de CooWeb
```

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/RonaldDev7/Halloween-Cooweb-Minigame.git
cd Halloween-Cooweb-Minigame
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea el archivo `.env.local` a partir de `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ywecilfuetzrfaoovonz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Iniciar en modo desarrollo o producción
```bash
# Desarrollo
npm run dev

# Compilación y arranque en producción
npm run build
npm run start
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🗄️ Configuración de Supabase (SQL Migration)

Para habilitar la tabla en tu proyecto de Supabase:

1. Inicia sesión en [Supabase Dashboard](https://supabase.com/dashboard/project/ywecilfuetzrfaoovonz).
2. Ve a la sección **SQL Editor**.
3. Abre el archivo `supabase/migrations/20241030_leaderboard.sql` de este proyecto y copia su contenido.
4. Pégalo en el editor y haz clic en **Run**.

La tabla `leaderboard` quedará creada con sus índices y políticas de Row Level Security (RLS) para permitir lectura e inserción pública de puntuaciones.

*Nota: Si aún no has ejecutado el SQL, el juego utilizará automáticamente el almacenamiento local sin interrumpir la experiencia de los jugadores.*
