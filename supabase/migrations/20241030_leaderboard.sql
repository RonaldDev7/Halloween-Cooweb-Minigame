-- COOWEB: THE LAST PROTOCOL — Migración de Base de Datos para Ranking
-- Ejecutar en el SQL Editor del Dashboard de Supabase (https://supabase.com/dashboard/project/ywecilfuetzrfaoovonz/sql)

-- 1. Crear tabla de clasificación 'leaderboard'
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL CHECK (char_length(player_name) >= 2 AND char_length(player_name) <= 24),
  score INTEGER NOT NULL CHECK (score >= 0),
  survival_time INTEGER NOT NULL CHECK (survival_time >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices de alto rendimiento para el TOP 10 y ranking
CREATE INDEX IF NOT EXISTS idx_leaderboard_score_desc 
  ON public.leaderboard (score DESC, survival_time DESC, created_at ASC);

-- 3. Habilitar Seguridad por Fila (RLS)
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- 4. Política: Permitir a cualquier jugador consultar el ranking
DROP POLICY IF EXISTS "Permitir lectura publica del leaderboard" ON public.leaderboard;
CREATE POLICY "Permitir lectura publica del leaderboard" 
  ON public.leaderboard FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- 5. Política: Permitir a los jugadores guardar su puntuación
DROP POLICY IF EXISTS "Permitir insercion de puntuaciones" ON public.leaderboard;
CREATE POLICY "Permitir insercion de puntuaciones" 
  ON public.leaderboard FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (
    char_length(player_name) >= 2 AND 
    char_length(player_name) <= 24 AND 
    score >= 0 AND 
    survival_time >= 0
  );
