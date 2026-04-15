-- Tabla de usuarios: alumnos y administrador.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(10) NOT NULL CHECK (rol IN ('admin', 'alumno')),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla editable del contenido "Sobre Mí".
CREATE TABLE IF NOT EXISTS about_content (
  id INT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  imagen_url TEXT NOT NULL,
  actualizado_por INT REFERENCES users(id) ON DELETE SET NULL,
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de eventos de calendario por usuario.
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  tipo_evento VARCHAR(50),
  creado_por_admin BOOLEAN NOT NULL DEFAULT false
);

-- Tabla de rutinas por usuario.
CREATE TABLE IF NOT EXISTS routines (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ejercicio VARCHAR(120) NOT NULL,
  series VARCHAR(20) NOT NULL,
  repeticiones VARCHAR(20) NOT NULL,
  observaciones TEXT,
  dia VARCHAR(30) NOT NULL
);

-- Tabla de historial de actividad por usuario.
CREATE TABLE IF NOT EXISTS history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  actividad VARCHAR(150) NOT NULL,
  observaciones TEXT,
  evolucion TEXT
);

-- Avisos generales solo del administrador.
CREATE TABLE IF NOT EXISTS general_announcements (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  subtitulo VARCHAR(200),
  contenido TEXT NOT NULL,
  link TEXT,
  media_url TEXT,
  tipo_media VARCHAR(15),
  fecha_publicacion TIMESTAMP NOT NULL DEFAULT NOW(),
  admin_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Tópicos de discusión del foro.
CREATE TABLE IF NOT EXISTS forum_topics (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  contenido TEXT NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Respuestas por tópico del foro.
CREATE TABLE IF NOT EXISTS forum_replies (
  id SERIAL PRIMARY KEY,
  topic_id INT NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  fecha_respuesta TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Mensajes de contacto opcionales.
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT NOW()
);
