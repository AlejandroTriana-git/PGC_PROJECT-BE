-- =====================================================================
-- SEED DEFINITIVA — pgc_db (esquema vigente: BD_CON_CORRECCIONES)
-- Pensada para: (1) que todo el equipo trabaje con los MISMOS datos y
--               (2) tener un escenario completo para la sustentación que se hará.
--
-- IMPORTANTE: este script es REINICIABLE. El bloque 0 vacía TODAS las
-- tablas antes de insertar. Ejecútalo solo sobre una BD de desarrollo/demo.
--
-- Orden de ejecución:  schema (BD_CON_CORRECCIONES)  ->  este archivo.
--
-- Contraseñas (las mismas del seed anterior, mismos hashes bcrypt costo 10):
--   estudiantes: Estudiante123!   profesores: Profesor123!   admin: Admin123!
--
-- Fechas: TODAS son relativas al día en que se carga el seed (NOW/CURDATE),
-- así las ventanas abiertas/cerradas se comportan igual sin importar cuándo
-- se ejecute. Para "refrescar" el escenario antes de la sustentación basta
-- con volver a ejecutar este archivo.
-- =====================================================================
SET NAMES utf8mb4;
USE `pgc_db`;

-- ---------------------------------------------------------------------
-- 0. LIMPIEZA (reinicia también los AUTO_INCREMENT)
-- ---------------------------------------------------------------------
SET @OLD_FK = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `jury_grades`;
TRUNCATE TABLE `pgc_files`;
TRUNCATE TABLE `pgc`;
TRUNCATE TABLE `proposal_students`;
TRUNCATE TABLE `proposal_categories`;
TRUNCATE TABLE `proposals`;
TRUNCATE TABLE `cycle_documents`;
TRUNCATE TABLE `guideline_documents`;
TRUNCATE TABLE `cycle_dates`;
TRUNCATE TABLE `cycle_juror`;
TRUNCATE TABLE `students`;
TRUNCATE TABLE `blacklisted_tokens`;
TRUNCATE TABLE `cycles`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `rol`;
SET FOREIGN_KEY_CHECKS = @OLD_FK;

-- ---------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------
INSERT INTO `rol` (`name_role`) VALUES ('Estudiante'), ('Profesor'), ('Administrador');
SET @rol_est = (SELECT id_rol FROM rol WHERE name_role = 'Estudiante');
SET @rol_pro = (SELECT id_rol FROM rol WHERE name_role = 'Profesor');
SET @rol_adm = (SELECT id_rol FROM rol WHERE name_role = 'Administrador');

SET @pw_est = '$2b$10$xEEINlvSDK6gR1uVunWbrOrQpkwPliTLniMJdXanv.WL2a8ei/Jxa';  -- Estudiante123!
SET @pw_pro = '$2b$10$/EAikjDSP3VAheGs9d4tIe1MtBVK9uZWALm80a0pg.U6Ap16cD6eS';  -- Profesor123!
SET @pw_adm = '$2b$10$18wAmk7xcGck8MEVlh.IieqCZFw5e33En1M0NLFCk2NWwNbl7OlKq';  -- Admin123!

-- ---------------------------------------------------------------------
-- 2. Usuarios: 1 administrador, 21 profesores jurados (3 son además encargados),
--    3 profesores sin asignaciones y 33 estudiantes
-- ---------------------------------------------------------------------
-- Administrador
INSERT INTO `users` (`id_rol`, `mail_user`, `password_user`, `full_name`) VALUES
  (@rol_adm, 'admin@cundinamarcau.edu.co', @pw_adm, 'Diego Fernando Ramírez');
-- Profesores
INSERT INTO `users` (`id_rol`, `mail_user`, `password_user`, `full_name`) VALUES
  (@rol_pro, 'omorera@cundinamarcau.edu.co', @pw_pro, 'Oscar Morera'),  -- Jurado Fundamentación + ENCARGADO del ciclo
  (@rol_pro, 'abravo@cundinamarcau.edu.co', @pw_pro, 'Angelica Bravo'),  -- Jurado Fundamentación
  (@rol_pro, 'jrodriguez@cundinamarcau.edu.co', @pw_pro, 'Jorge Rodriguez'),  -- Jurado Fundamentación
  (@rol_pro, 'aespinosa@cundinamarcau.edu.co', @pw_pro, 'Alexander Espinosa'),  -- Jurado Fundamentación
  (@rol_pro, 'aolaya@cundinamarcau.edu.co', @pw_pro, 'Alfonso Olaya'),  -- Jurado Fundamentación
  (@rol_pro, 'asuarez@cundinamarcau.edu.co', @pw_pro, 'Angela Suarez'),  -- Jurado Fundamentación
  (@rol_pro, 'dcuartas@cundinamarcau.edu.co', @pw_pro, 'David Cuartas'),  -- Jurado Fundamentación
  (@rol_pro, 'ysanchez@cundinamarcau.edu.co', @pw_pro, 'Yamin Sanchez'),  -- Jurado Profundización
  (@rol_pro, 'jmican@cundinamarcau.edu.co', @pw_pro, 'Jorge Mican'),  -- Jurado Profundización
  (@rol_pro, 'ogomez@cundinamarcau.edu.co', @pw_pro, 'Oscar Gomez'),  -- Jurado Profundización + ENCARGADO del ciclo
  (@rol_pro, 'gvalenzuela@cundinamarcau.edu.co', @pw_pro, 'Gina Valenzuela'),  -- Jurado Profundización
  (@rol_pro, 'fmoreno@cundinamarcau.edu.co', @pw_pro, 'Fernel Moreno'),  -- Jurado Profundización
  (@rol_pro, 'dhernandez@cundinamarcau.edu.co', @pw_pro, 'Diego Hernandez'),  -- Jurado Profundización
  (@rol_pro, 'hhernandez@cundinamarcau.edu.co', @pw_pro, 'Harvey Hernandez'),  -- Jurado Profundización
  (@rol_pro, 'jtavera@cundinamarcau.edu.co', @pw_pro, 'Javier Tavera'),  -- Jurado Investigación-producción
  (@rol_pro, 'horjuela@cundinamarcau.edu.co', @pw_pro, 'Hernando Orjuela'),  -- Jurado Investigación-producción
  (@rol_pro, 'cvargas@cundinamarcau.edu.co', @pw_pro, 'Carlos Vargas'),  -- Jurado Investigación-producción
  (@rol_pro, 'xacosta@cundinamarcau.edu.co', @pw_pro, 'Ximena Acosta'),  -- Jurado Investigación-producción
  (@rol_pro, 'jpedroche@cundinamarcau.edu.co', @pw_pro, 'Juan Pedroche'),  -- Jurado Investigación-producción
  (@rol_pro, 'iforero@cundinamarcau.edu.co', @pw_pro, 'Ivon Forero'),  -- Jurado Investigación-producción
  (@rol_pro, 'jandrade@cundinamarcau.edu.co', @pw_pro, 'Jaime Andrade'),  -- Jurado Investigación-producción + ENCARGADO del ciclo
  (@rol_pro, 'docente1@cundinamarcau.edu.co', @pw_pro, 'Docente Demo 1'),  -- Profesor sin asignaciones
  (@rol_pro, 'docente2@cundinamarcau.edu.co', @pw_pro, 'Docente Demo 2'),  -- Profesor sin asignaciones
  (@rol_pro, 'docente3@cundinamarcau.edu.co', @pw_pro, 'Docente Demo 3');  -- Profesor sin asignaciones
-- Estudiantes
INSERT INTO `users` (`id_rol`, `mail_user`, `password_user`, `full_name`) VALUES
  (@rol_est, 'gnietog@cundinamarcau.edu.co', @pw_est, 'Gabriel Nieto Garzon'),  -- Equipo 1 (líder)
  (@rol_est, 'jdmoralesmartinez@cundinamarcau.edu.co', @pw_est, 'Juan David Morales Martinez'),  -- Equipo 1
  (@rol_est, 'scortess@cundinamarcau.edu.co', @pw_est, 'Santiago Cortes Soto'),  -- Equipo 1
  (@rol_est, 'kscastrillon@cundinamarcau.edu.co', @pw_est, 'Kevin Snayder Castrillon Organista'),  -- Equipo 1
  (@rol_est, 'sfbuitrago@cundinamarcau.edu.co', @pw_est, 'Simon Francisco Buitrago Navarrete'),  -- Equipo 2 (líder)
  (@rol_est, 'eyessidbeltran@cundinamarcau.edu.co', @pw_est, 'Edwin Yessid Beltran Granados'),  -- Equipo 2
  (@rol_est, 'davidfernandogonzalez@cundinamarcau.edu.co', @pw_est, 'David Fernando Gonzalez Soler'),  -- Equipo 3 (líder)
  (@rol_est, 'idgiraldo@cundinamarcau.edu.co', @pw_est, 'Ivan David Giraldo Garavito'),  -- Equipo 3
  (@rol_est, 'mefonseca@cundinamarcau.edu.co', @pw_est, 'Maycol Estiven Fonseca Muñoz'),  -- Equipo 3
  (@rol_est, 'jduvanvelandia@cundinamarcau.edu.co', @pw_est, 'Jaider Duvan Velandia Menjura'),  -- Equipo 4 (líder)
  (@rol_est, 'esebastiansalinas@cundinamarcau.edu.co', @pw_est, 'Erick Sebastian Salinas Pedrosa'),  -- Equipo 4
  (@rol_est, 'wcarolinarodriguez@cundinamarcau.edu.co', @pw_est, 'Wendy Carolina Rodríguez Guanume'),  -- Equipo 4
  (@rol_est, 'juliansramirez@cundinamarcau.edu.co', @pw_est, 'Julian Steven Ramirez Diaz'),  -- Equipo 4
  (@rol_est, 'jalejandrotriana@cundinamarcau.edu.co', @pw_est, 'Jose Alejandro Triana Velasquez'),  -- Equipo 5 (líder)
  (@rol_est, 'jcquitora@cundinamarcau.edu.co', @pw_est, 'Joseph Camilo Quitora Orjuela'),  -- Equipo 5
  (@rol_est, 'kepena@cundinamarcau.edu.co', @pw_est, 'Kevin Esteban Peña Barón'),  -- Equipo 5
  (@rol_est, 'dlinaresf@cundinamarcau.edu.co', @pw_est, 'Dioneiver Linares Fernandez'),  -- Equipo 5
  (@rol_est, 'aremiso@cundinamarcau.edu.co', @pw_est, 'Anderson Camilo Remiso Niño'),  -- Equipo 6 (líder)
  (@rol_est, 'malejandroaldana@cundinamarcau.edu.co', @pw_est, 'Manuel Alejandro Aldana Rincon'),  -- Equipo 6
  (@rol_est, 'sssalazar@cundinamarcau.edu.co', @pw_est, 'Sara Sofia Salazar Villarreal'),  -- Equipo 7 (líder)
  (@rol_est, 'jdavidpuentes@cundinamarcau.edu.co', @pw_est, 'Joel David Puentes Rodriguez'),  -- Equipo 7
  (@rol_est, 'jestebanbernal@cundinamarcau.edu.co', @pw_est, 'Juan Esteban Bernal Ramirez'),  -- Equipo 7
  (@rol_est, 'jsebastianposada@cundinamarcau.edu.co', @pw_est, 'Johan Sebastián Posada Beltrán'),  -- Equipo 8 (líder)
  (@rol_est, 'jpfonseca@cundinamarcau.edu.co', @pw_est, 'Juan Pablo Fonseca Celis'),  -- Equipo 8
  (@rol_est, 'esantiagomendez@cundinamarcau.edu.co', @pw_est, 'Edwin Santiago Méndez Martín'),  -- Equipo 9 (líder)
  (@rol_est, 'mfernandamendez@cundinamarcau.edu.co', @pw_est, 'Maria Fernanda Mendez Galeano'),  -- Equipo 9
  (@rol_est, 'hygamba@cundinamarcau.edu.co', @pw_est, 'Harold Yulian Gamba Forero'),  -- Equipo 9
  (@rol_est, 'jltapiero@cundinamarcau.edu.co', @pw_est, 'Jean Luiggy Tapiero Ortiz'),  -- Equipo 10 (líder)
  (@rol_est, 'danielcsierra@cundinamarcau.edu.co', @pw_est, 'Daniel Camilo Sierra Peña'),  -- Equipo 10
  (@rol_est, 'ealejandroprieto@cundinamarcau.edu.co', @pw_est, 'Esteban Alejandro Prieto Cantor'),  -- Equipo 10
  (@rol_est, 'bduvanlozano@cundinamarcau.edu.co', @pw_est, 'Bairon Duvan Lozano Zamudio'),  -- Equipo 11 (líder)
  (@rol_est, 'juandiegoguerrero@cundinamarcau.edu.co', @pw_est, 'Juan Diego Guerrero Amaya'),  -- Equipo 11
  (@rol_est, 'sergioacamacho@cundinamarcau.edu.co', @pw_est, 'Sergio Andres Camacho Bonilla');  -- Equipo 11

-- ---------------------------------------------------------------------
-- 3. Ciclos (cada uno con su profesor encargado)
-- ---------------------------------------------------------------------
INSERT INTO `cycles` (`name_cycle`, `max_members`, `id_person_charge`) VALUES
  ('Fundamentación', 4, (SELECT id_user FROM users WHERE mail_user = 'omorera@cundinamarcau.edu.co')),
  ('Profundización', 4, (SELECT id_user FROM users WHERE mail_user = 'ogomez@cundinamarcau.edu.co')),
  ('Investigación-producción', 2, (SELECT id_user FROM users WHERE mail_user = 'jandrade@cundinamarcau.edu.co'));
SET @c1 = (SELECT id_cycle FROM cycles WHERE name_cycle = 'Fundamentación');
SET @c2 = (SELECT id_cycle FROM cycles WHERE name_cycle = 'Profundización');
SET @c3 = (SELECT id_cycle FROM cycles WHERE name_cycle = 'Investigación-producción');
SET @enc_c1 = (SELECT id_user FROM users WHERE mail_user = 'omorera@cundinamarcau.edu.co');
SET @enc_c2 = (SELECT id_user FROM users WHERE mail_user = 'ogomez@cundinamarcau.edu.co');
SET @enc_c3 = (SELECT id_user FROM users WHERE mail_user = 'jandrade@cundinamarcau.edu.co');

-- Jurados por ciclo (todos los jurados de un ciclo califican TODOS los PGC de ese ciclo)
INSERT INTO `cycle_juror` (`id_juror`, `id_cycle`)
SELECT u.id_user, c.id_cycle FROM (
  SELECT 'omorera@cundinamarcau.edu.co' AS m, 'Fundamentación' AS cy
  UNION ALL SELECT 'abravo@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 'jrodriguez@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 'aespinosa@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 'aolaya@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 'asuarez@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 'dcuartas@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 'ysanchez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 'jmican@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 'ogomez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 'gvalenzuela@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 'fmoreno@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 'dhernandez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 'hhernandez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 'jtavera@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 'horjuela@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 'cvargas@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 'xacosta@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 'jpedroche@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 'iforero@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 'jandrade@cundinamarcau.edu.co', 'Investigación-producción'
) t JOIN users u ON u.mail_user = t.m JOIN cycles c ON c.name_cycle = t.cy;

-- ---------------------------------------------------------------------
-- 4. Estudiantes (una fila por persona y ciclo; Modelo A)
--    Reparto: Fundamentación = equipos 1,3,5,7 | Profundización = 4,9,10,11
--             Investigación-producción = 2,6,8 (máx. 2 integrantes por equipo)
-- ---------------------------------------------------------------------
INSERT INTO `students` (`id_user`, `id_cycle`)
SELECT u.id_user, c.id_cycle FROM (
  SELECT 1 AS n, 'gnietog@cundinamarcau.edu.co' AS m, 'Fundamentación' AS cy
  UNION ALL SELECT 2, 'jdmoralesmartinez@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 3, 'scortess@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 4, 'kscastrillon@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 5, 'sfbuitrago@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 6, 'eyessidbeltran@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 7, 'davidfernandogonzalez@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 8, 'idgiraldo@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 9, 'mefonseca@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 10, 'jduvanvelandia@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 11, 'esebastiansalinas@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 12, 'wcarolinarodriguez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 13, 'juliansramirez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 14, 'jalejandrotriana@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 15, 'jcquitora@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 16, 'kepena@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 17, 'dlinaresf@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 18, 'aremiso@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 19, 'malejandroaldana@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 20, 'sssalazar@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 21, 'jdavidpuentes@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 22, 'jestebanbernal@cundinamarcau.edu.co', 'Fundamentación'
  UNION ALL SELECT 23, 'jsebastianposada@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 24, 'jpfonseca@cundinamarcau.edu.co', 'Investigación-producción'
  UNION ALL SELECT 25, 'esantiagomendez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 26, 'mfernandamendez@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 27, 'hygamba@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 28, 'jltapiero@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 29, 'danielcsierra@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 30, 'ealejandroprieto@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 31, 'bduvanlozano@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 32, 'juandiegoguerrero@cundinamarcau.edu.co', 'Profundización'
  UNION ALL SELECT 33, 'sergioacamacho@cundinamarcau.edu.co', 'Profundización'
) t JOIN users u ON u.mail_user = t.m JOIN cycles c ON c.name_cycle = t.cy ORDER BY t.n;  -- el orden fija id_student 1..33 (lo usan las rutas de Firebase)

-- ---------------------------------------------------------------------
-- 5. Categorías
-- ---------------------------------------------------------------------
INSERT INTO `categories` (`name_category`) VALUES ('Web'), ('App Móvil'), ('IoT'), ('Hardware'), ('Gestión');

-- ---------------------------------------------------------------------
-- 6. Fechas por ciclo y etapa (relativas a hoy). Diseñadas para la demo:
--    Fundamentación  -> TODAS las ventanas abiertas (flujo completo en vivo)
--    Profundización  -> Radicación CERRADA; Registro PGC y Calificación abiertas
--    Investigación-p -> Registro PGC y Calificación CERRADAS (mensajes de "periodo finalizado")
--    (Sustentación solo es informativa por ahora)
-- ---------------------------------------------------------------------
INSERT INTO `cycle_dates` (`id_cycle`, `updated_by`, `stage`, `start_date`, `end_date`) VALUES
  (@c1, @enc_c1, 'Radicación', DATE_ADD(CURDATE(), INTERVAL -60 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 30 DAY), '23:59:59')),
  (@c1, @enc_c1, 'Registro PGC', DATE_ADD(CURDATE(), INTERVAL -20 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 30 DAY), '23:59:59')),
  (@c1, @enc_c1, 'Sustentación', DATE_ADD(CURDATE(), INTERVAL 20 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 25 DAY), '23:59:59')),
  (@c1, @enc_c1, 'Calificación', DATE_ADD(CURDATE(), INTERVAL -5 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 40 DAY), '23:59:59')),
  (@c2, @enc_c2, 'Radicación', DATE_ADD(CURDATE(), INTERVAL -60 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL -30 DAY), '23:59:59')),
  (@c2, @enc_c2, 'Registro PGC', DATE_ADD(CURDATE(), INTERVAL -20 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 30 DAY), '23:59:59')),
  (@c2, @enc_c2, 'Sustentación', DATE_ADD(CURDATE(), INTERVAL 20 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 25 DAY), '23:59:59')),
  (@c2, @enc_c2, 'Calificación', DATE_ADD(CURDATE(), INTERVAL -5 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 40 DAY), '23:59:59')),
  (@c3, @enc_c3, 'Radicación', DATE_ADD(CURDATE(), INTERVAL -90 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL -60 DAY), '23:59:59')),
  (@c3, @enc_c3, 'Registro PGC', DATE_ADD(CURDATE(), INTERVAL -60 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL -20 DAY), '23:59:59')),
  (@c3, @enc_c3, 'Sustentación', DATE_ADD(CURDATE(), INTERVAL -15 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL -10 DAY), '23:59:59')),
  (@c3, @enc_c3, 'Calificación', DATE_ADD(CURDATE(), INTERVAL -9 DAY), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL -1 DAY), '23:59:59'));

-- ---------------------------------------------------------------------
-- 7. Propuestas (una por equipo; el primer integrante listado es el líder)
--    El contenido (títulos, problema, objetivos...) es de EJEMPLO y se puede reemplazar.
-- ---------------------------------------------------------------------
-- Equipo 1 · Fundamentación · Aprobada · PGC Terminado
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'gnietog@cundinamarcau.edu.co'), @c1,
   'Plataforma web para el control de inventario de laboratorios de la universidad',
   'Sistema web que permite registrar, consultar y hacer seguimiento a los equipos y materiales de los laboratorios, con control de préstamos y alertas de mantenimiento.',
   'El inventario de los laboratorios se lleva en hojas de cálculo dispersas, lo que genera pérdidas de equipos, registros duplicados y dificultad para conocer la disponibilidad real.',
   'Centralizar el inventario reduce pérdidas, agiliza los préstamos y entrega información confiable para decidir sobre compras y mantenimiento.',
   'General: desarrollar una plataforma web para el control de inventario de laboratorios. Específicos: levantar requerimientos con los encargados, diseñar la base de datos, implementar los módulos de inventario y préstamos, y validar el sistema con usuarios reales.',
   'Aplicación web con módulos de inventario, préstamos y reportes, con arquitectura cliente-servidor, base de datos relacional y roles diferenciados para administrador y auxiliar.',
   'propuestas/1/1/formato-pgc-1787097607919.pdf', 'Aprobada', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -50 DAY), DATE_ADD(NOW(), INTERVAL -44 DAY), @enc_c1, DATE_ADD(NOW(), INTERVAL -44 DAY));
SET @p1 = LAST_INSERT_ID();
-- Equipo 2 · Investigación-producción · Aprobada · PGC Terminado
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'sfbuitrago@cundinamarcau.edu.co'), @c3,
   'Modelo de predicción de deserción estudiantil con aprendizaje automático',
   'Modelo que estima el riesgo de deserción de los estudiantes a partir de datos académicos y presenta los resultados en un tablero para bienestar universitario.',
   'La deserción se identifica tarde, cuando el estudiante ya abandonó, lo que limita las acciones de acompañamiento.',
   'Detectar a tiempo a los estudiantes en riesgo permite intervenir con apoyo académico y psicosocial antes del abandono.',
   'General: construir un modelo de predicción de deserción. Específicos: preparar el conjunto de datos, entrenar y comparar modelos, evaluar su desempeño y desplegar un tablero de consulta.',
   'Pipeline de preparación de datos y modelo de clasificación evaluado con métricas estándar, expuesto mediante un tablero web para el personal de bienestar.',
   'propuestas/3/5/formato-pgc-1784073615838.pdf', 'Aprobada', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -85 DAY), DATE_ADD(NOW(), INTERVAL -80 DAY), @enc_c3, DATE_ADD(NOW(), INTERVAL -80 DAY));
SET @p2 = LAST_INSERT_ID();
-- Equipo 3 · Fundamentación · Aprobada · PGC En Proceso
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'davidfernandogonzalez@cundinamarcau.edu.co'), @c1,
   'Aplicación móvil para el reporte de incidencias en el campus',
   'App móvil que permite a la comunidad universitaria reportar daños e incidencias en la infraestructura del campus con fotografía y ubicación, y hacer seguimiento a su atención.',
   'Los reportes de daños en aulas y zonas comunes se hacen de forma verbal o por correo, sin trazabilidad ni tiempos de respuesta conocidos.',
   'Un canal único de reporte acelera la atención de incidencias y permite a la administración priorizar con datos.',
   'General: construir una aplicación móvil para reportar incidencias del campus. Específicos: definir el flujo de reporte, diseñar la interfaz, implementar el registro con foto y ubicación, y evaluar la usabilidad con estudiantes.',
   'Aplicación móvil conectada a un servicio web que registra cada incidencia con estado, responsable y fecha, y notifica al usuario cuando cambia su estado.',
   'propuestas/1/7/formato-pgc-1787270423757.pdf', 'Aprobada', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -48 DAY), DATE_ADD(NOW(), INTERVAL -42 DAY), @enc_c1, DATE_ADD(NOW(), INTERVAL -42 DAY));
SET @p3 = LAST_INSERT_ID();
-- Equipo 4 · Profundización · Aprobada · PGC En Proceso
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'jduvanvelandia@cundinamarcau.edu.co'), @c2,
   'Sistema de riego automatizado con sensores de humedad para huertas urbanas',
   'Sistema que mide la humedad del suelo y activa el riego solo cuando es necesario, reduciendo el consumo de agua en huertas urbanas.',
   'El riego manual en huertas urbanas desperdicia agua y depende de que alguien esté presente para regar en el momento adecuado.',
   'Automatizar el riego con base en la humedad real del suelo ahorra agua y mejora el rendimiento de los cultivos.',
   'General: construir un sistema de riego automatizado. Específicos: calibrar los sensores de humedad, diseñar el circuito de control de la bomba, desarrollar la lógica de riego y evaluar el ahorro de agua.',
   'Controlador con sensores de humedad y electroválvula que decide el riego según umbrales configurables y registra el historial de consumo.',
   'propuestas/2/10/formato-pgc-1786665631676.pdf', 'Aprobada', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -55 DAY), DATE_ADD(NOW(), INTERVAL -48 DAY), @enc_c2, DATE_ADD(NOW(), INTERVAL -48 DAY));
SET @p4 = LAST_INSERT_ID();
-- Equipo 5 · Fundamentación · Aprobada
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'jalejandrotriana@cundinamarcau.edu.co'), @c1,
   'Sistema de monitoreo de calidad del aire en aulas con sensores IoT',
   'Prototipo con sensores de CO2 y temperatura que reporta en tiempo real la calidad del aire de las aulas y alerta cuando se superan los niveles recomendados.',
   'No existe medición de la calidad del aire en las aulas, por lo que no se detecta la mala ventilación que afecta la concentración y la salud.',
   'Medir y visualizar la calidad del aire permite actuar a tiempo sobre la ventilación y mejora las condiciones de estudio.',
   'General: implementar un sistema IoT de monitoreo de calidad del aire. Específicos: seleccionar los sensores, construir el prototipo, transmitir los datos a un panel web y probarlo en un aula piloto.',
   'Nodo basado en microcontrolador con sensores ambientales que envía lecturas por Wi-Fi a un servidor y las muestra en un panel con alertas.',
   'propuestas/1/14/formato-pgc-1787356839595.pdf', 'Aprobada', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -47 DAY), DATE_ADD(NOW(), INTERVAL -40 DAY), @enc_c1, DATE_ADD(NOW(), INTERVAL -40 DAY));
SET @p5 = LAST_INSERT_ID();
-- Equipo 6 · Investigación-producción · Aprobada · PGC En Proceso
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'aremiso@cundinamarcau.edu.co'), @c3,
   'Plataforma de trazabilidad de residuos sólidos con sensores y aplicación móvil',
   'Plataforma que mide el llenado de los contenedores con sensores y optimiza las rutas de recolección, con una aplicación móvil para los operarios.',
   'La recolección de residuos sigue rutas fijas sin importar el nivel de llenado de los contenedores, generando desbordamientos y recorridos innecesarios.',
   'Conocer el llenado en tiempo real permite recolectar cuando es necesario, reduciendo costos y mejorando la limpieza del entorno.',
   'General: implementar una plataforma de trazabilidad de residuos. Específicos: instalar sensores de nivel, transmitir los datos, calcular rutas de recolección y desarrollar la aplicación móvil del operario.',
   'Sensores de nivel conectados a un servidor que calcula rutas sugeridas, consumidas por una aplicación móvil para los operarios de recolección.',
   'propuestas/3/18/formato-pgc-1783987247514.pdf', 'Aprobada', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -86 DAY), DATE_ADD(NOW(), INTERVAL -79 DAY), @enc_c3, DATE_ADD(NOW(), INTERVAL -79 DAY));
SET @p6 = LAST_INSERT_ID();
-- Equipo 7 · Fundamentación · Pendiente de validación
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'sssalazar@cundinamarcau.edu.co'), @c1,
   'Portal web de agendamiento de tutorías académicas entre estudiantes y docentes',
   'Portal que permite a los estudiantes consultar la disponibilidad de los docentes y agendar tutorías, con recordatorios y registro de asistencia.',
   'Las tutorías se acuerdan por mensajería informal, lo que causa cruces de horario y no deja registro de las asesorías realizadas.',
   'Un sistema de agendamiento ordena la atención, evita cruces y deja evidencia del acompañamiento académico.',
   'General: desarrollar un portal web de agendamiento de tutorías. Específicos: modelar la disponibilidad docente, implementar el agendamiento y los recordatorios, y validar el flujo con estudiantes y docentes.',
   'Aplicación web con calendario de disponibilidad por docente, reserva de cupos, notificaciones por correo y reporte de tutorías realizadas.',
   'propuestas/1/20/formato-pgc-1791244855433.pdf', 'Pendiente de validación', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -2 DAY), DATE_ADD(NOW(), INTERVAL -2 DAY), NULL, NULL);
SET @p7 = LAST_INSERT_ID();
-- Equipo 8 · Investigación-producción · Aprobada
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'jsebastianposada@cundinamarcau.edu.co'), @c3,
   'Sistema embebido para el monitoreo de consumo energético en edificios institucionales',
   'Dispositivo embebido que mide el consumo eléctrico por zonas de un edificio y lo muestra en un panel para identificar consumos anómalos.',
   'No se conoce el consumo eléctrico por zonas de los edificios, por lo que es difícil detectar desperdicios.',
   'Medir el consumo por zonas permite identificar desperdicios y plantear acciones de ahorro de energía.',
   'General: desarrollar un sistema embebido de monitoreo energético. Específicos: seleccionar los sensores de corriente, construir el prototipo, transmitir las mediciones y visualizarlas en un panel.',
   'Módulo con sensores de corriente y microcontrolador que reporta mediciones periódicas a un panel de visualización con alertas de consumo anómalo.',
   'propuestas/3/23/formato-pgc-1784160063352.pdf', 'Aprobada', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -84 DAY), DATE_ADD(NOW(), INTERVAL -78 DAY), @enc_c3, DATE_ADD(NOW(), INTERVAL -78 DAY));
SET @p8 = LAST_INSERT_ID();
-- Equipo 9 · Profundización · Rechazada
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'esantiagomendez@cundinamarcau.edu.co'), @c2,
   'Aplicación móvil para el seguimiento de hábitos de estudio',
   'Aplicación que ayuda a los estudiantes a registrar y visualizar sus hábitos de estudio para mejorar su organización del tiempo.',
   'Muchos estudiantes no tienen claridad sobre cuánto tiempo dedican realmente al estudio ni cómo lo distribuyen.',
   'Visualizar los hábitos de estudio ayuda a tomar decisiones para organizar mejor el tiempo académico.',
   'General: desarrollar una aplicación móvil de seguimiento de hábitos de estudio. Específicos: definir los hábitos a medir, diseñar los registros y construir las gráficas de seguimiento.',
   'Aplicación móvil con registro de sesiones de estudio, metas semanales y gráficas de progreso.',
   'propuestas/2/25/formato-pgc-1786406471271.pdf', 'Rechazada', 'Se debe delimitar mejor el alcance: precisar el público objetivo y qué hábitos se van a medir, y ajustar los objetivos específicos para que sean medibles.', 1,
   DATE_ADD(NOW(), INTERVAL -58 DAY), DATE_ADD(NOW(), INTERVAL -50 DAY), @enc_c2, DATE_ADD(NOW(), INTERVAL -50 DAY));
SET @p9 = LAST_INSERT_ID();
-- Equipo 10 · Profundización · Anulada
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'jltapiero@cundinamarcau.edu.co'), @c2,
   'Sistema de gestión de préstamos de equipos audiovisuales',
   'Sistema para registrar y controlar el préstamo de equipos audiovisuales a docentes y estudiantes.',
   'El préstamo de equipos audiovisuales se registra en un cuaderno, lo que dificulta saber qué equipo está disponible.',
   'Un registro digital agiliza el préstamo y reduce la pérdida de equipos.',
   'General: desarrollar un sistema de gestión de préstamos. Específicos: levantar el proceso actual, diseñar el modelo de datos e implementar el registro de préstamos y devoluciones.',
   'Aplicación web para registrar préstamos y devoluciones con historial por equipo y por usuario.',
   'propuestas/2/28/formato-pgc-1786320079190.pdf', 'Anulada', 'Tercer rechazo: persiste la inconsistencia entre el problema planteado y la solución propuesta señalada en las revisiones anteriores.', 3,
   DATE_ADD(NOW(), INTERVAL -59 DAY), DATE_ADD(NOW(), INTERVAL -45 DAY), @enc_c2, DATE_ADD(NOW(), INTERVAL -45 DAY));
SET @p10 = LAST_INSERT_ID();
-- Equipo 11 · Profundización · Pendiente de validación
INSERT INTO `proposals` (`id_leader`, `id_cycle`, `title_proposal`, `descr_proposal`, `problem_proposal`, `justification_proposal`, `objectives_proposal`, `solution_proposal`, `pdf_storage_path`, `state_proposal`, `rejection_comment`, `resubmit_count`, `created_at`, `updated_at`, `reviewed_by`, `reviewed_at`) VALUES
  ((SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'bduvanlozano@cundinamarcau.edu.co'), @c2,
   'Plataforma web para la gestión de eventos académicos y certificados digitales',
   'Plataforma para inscribir asistentes a eventos académicos, controlar la asistencia con código QR y emitir certificados digitales automáticamente.',
   'La inscripción y la certificación de asistentes a eventos académicos se hace de forma manual, con demoras y errores en los certificados.',
   'Automatizar la inscripción, la asistencia y la certificación ahorra tiempo a los organizadores y entrega certificados verificables.',
   'General: desarrollar una plataforma web de gestión de eventos académicos. Específicos: modelar los procesos de inscripción y asistencia, implementar el control por QR y generar certificados en PDF.',
   'Aplicación web con inscripción, lectura de QR para asistencia y generación automática de certificados con código de verificación.',
   'propuestas/2/31/formato-pgc-1788566487109.pdf', 'Pendiente de validación', NULL, 0,
   DATE_ADD(NOW(), INTERVAL -33 DAY), DATE_ADD(NOW(), INTERVAL -33 DAY), NULL, NULL);
SET @p11 = LAST_INSERT_ID();

-- Categorías de cada propuesta
INSERT INTO `proposal_categories` (`id_proposal`, `id_category`)
SELECT t.p, c.id_category FROM (
  SELECT @p1 AS p, 'Web' AS cat
  UNION ALL SELECT @p1, 'Gestión'
  UNION ALL SELECT @p2, 'Web'
  UNION ALL SELECT @p2, 'Gestión'
  UNION ALL SELECT @p3, 'App Móvil'
  UNION ALL SELECT @p4, 'IoT'
  UNION ALL SELECT @p4, 'Hardware'
  UNION ALL SELECT @p5, 'IoT'
  UNION ALL SELECT @p5, 'Hardware'
  UNION ALL SELECT @p6, 'IoT'
  UNION ALL SELECT @p6, 'App Móvil'
  UNION ALL SELECT @p7, 'Web'
  UNION ALL SELECT @p8, 'Hardware'
  UNION ALL SELECT @p8, 'IoT'
  UNION ALL SELECT @p9, 'App Móvil'
  UNION ALL SELECT @p10, 'Gestión'
  UNION ALL SELECT @p11, 'Web'
  UNION ALL SELECT @p11, 'Gestión'
) t JOIN categories c ON c.name_category = t.cat;

-- Integrantes de cada propuesta (incluye al líder)
INSERT INTO `proposal_students` (`id_proposal`, `id_student`)
SELECT t.p, s.id_student FROM (
  SELECT @p1 AS p, 'gnietog@cundinamarcau.edu.co' AS m
  UNION ALL SELECT @p1, 'jdmoralesmartinez@cundinamarcau.edu.co'
  UNION ALL SELECT @p1, 'scortess@cundinamarcau.edu.co'
  UNION ALL SELECT @p1, 'kscastrillon@cundinamarcau.edu.co'
  UNION ALL SELECT @p2, 'sfbuitrago@cundinamarcau.edu.co'
  UNION ALL SELECT @p2, 'eyessidbeltran@cundinamarcau.edu.co'
  UNION ALL SELECT @p3, 'davidfernandogonzalez@cundinamarcau.edu.co'
  UNION ALL SELECT @p3, 'idgiraldo@cundinamarcau.edu.co'
  UNION ALL SELECT @p3, 'mefonseca@cundinamarcau.edu.co'
  UNION ALL SELECT @p4, 'jduvanvelandia@cundinamarcau.edu.co'
  UNION ALL SELECT @p4, 'esebastiansalinas@cundinamarcau.edu.co'
  UNION ALL SELECT @p4, 'wcarolinarodriguez@cundinamarcau.edu.co'
  UNION ALL SELECT @p4, 'juliansramirez@cundinamarcau.edu.co'
  UNION ALL SELECT @p5, 'jalejandrotriana@cundinamarcau.edu.co'
  UNION ALL SELECT @p5, 'jcquitora@cundinamarcau.edu.co'
  UNION ALL SELECT @p5, 'kepena@cundinamarcau.edu.co'
  UNION ALL SELECT @p5, 'dlinaresf@cundinamarcau.edu.co'
  UNION ALL SELECT @p6, 'aremiso@cundinamarcau.edu.co'
  UNION ALL SELECT @p6, 'malejandroaldana@cundinamarcau.edu.co'
  UNION ALL SELECT @p7, 'sssalazar@cundinamarcau.edu.co'
  UNION ALL SELECT @p7, 'jdavidpuentes@cundinamarcau.edu.co'
  UNION ALL SELECT @p7, 'jestebanbernal@cundinamarcau.edu.co'
  UNION ALL SELECT @p8, 'jsebastianposada@cundinamarcau.edu.co'
  UNION ALL SELECT @p8, 'jpfonseca@cundinamarcau.edu.co'
  UNION ALL SELECT @p9, 'esantiagomendez@cundinamarcau.edu.co'
  UNION ALL SELECT @p9, 'mfernandamendez@cundinamarcau.edu.co'
  UNION ALL SELECT @p9, 'hygamba@cundinamarcau.edu.co'
  UNION ALL SELECT @p10, 'jltapiero@cundinamarcau.edu.co'
  UNION ALL SELECT @p10, 'danielcsierra@cundinamarcau.edu.co'
  UNION ALL SELECT @p10, 'ealejandroprieto@cundinamarcau.edu.co'
  UNION ALL SELECT @p11, 'bduvanlozano@cundinamarcau.edu.co'
  UNION ALL SELECT @p11, 'juandiegoguerrero@cundinamarcau.edu.co'
  UNION ALL SELECT @p11, 'sergioacamacho@cundinamarcau.edu.co'
) t JOIN users u ON u.mail_user = t.m JOIN students s ON s.id_user = u.id_user;

-- ---------------------------------------------------------------------
-- 8. PGC registrados, archivos de evidencia y notas de jurados
--    El estado 'Terminado' solo aparece donde TODOS los jurados del ciclo ya calificaron.
-- ---------------------------------------------------------------------
-- PGC del equipo 1 (Fundamentación) · Terminado
INSERT INTO `pgc` (`id_cycle`, `id_proposal`, `state_pgc`, `registered_at`, `updated_at`) VALUES (@c1, @p1, 'Terminado', DATE_ADD(NOW(), INTERVAL -12 DAY), DATE_ADD(NOW(), INTERVAL -12 DAY));
SET @g1 = LAST_INSERT_ID();
INSERT INTO `pgc_files` (`id_pgc`, `storage_path`, `file_format`, `uploaded_by`, `uploaded_at`, `title_file`, `desc_file`) VALUES
  (@g1, 'pgc/1/1/1/1790899295028-documento-final-del-pgc.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'gnietog@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -6 DAY), 'Documento final del PGC', 'Documento completo del trabajo de grado con marco teórico, metodología y resultados.'),
  (@g1, 'pgc/1/2/1/1790899302947-presentacion-de-sustentacion.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'jdmoralesmartinez@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -6 DAY), 'Presentación de sustentación', 'Diapositivas utilizadas en la sustentación ante los jurados.'),
  (@g1, 'pgc/1/3/1/1790899310866-manual-de-usuario.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'scortess@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -6 DAY), 'Manual de usuario', 'Guía de uso del sistema para el usuario final.'),
  (@g1, 'pgc/1/4/1/1790899318785-diagrama-de-arquitectura.png', 'png', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'kscastrillon@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -6 DAY), 'Diagrama de arquitectura', 'Diagrama de la arquitectura general del sistema.');
-- Notas: 7 de 7 jurados (promedio 4.4)
INSERT INTO `jury_grades` (`id_pgc`, `id_juror`, `grade`, `comment`, `graded_at`) VALUES
  (@g1, (SELECT id_user FROM users WHERE mail_user = 'omorera@cundinamarcau.edu.co'), 4.5, 'Excelente planteamiento del problema y solución bien sustentada. Se recomienda profundizar en las pruebas de usabilidad.', DATE_ADD(NOW(), INTERVAL -48 HOUR)),
  (@g1, (SELECT id_user FROM users WHERE mail_user = 'abravo@cundinamarcau.edu.co'), 4.2, 'Buen nivel técnico y documentación clara. La arquitectura está bien justificada.', DATE_ADD(NOW(), INTERVAL -47 HOUR)),
  (@g1, (SELECT id_user FROM users WHERE mail_user = 'jrodriguez@cundinamarcau.edu.co'), 4.8, 'Proyecto sólido y con alcance adecuado. Mejorar la sección de trabajo futuro.', DATE_ADD(NOW(), INTERVAL -46 HOUR)),
  (@g1, (SELECT id_user FROM users WHERE mail_user = 'aespinosa@cundinamarcau.edu.co'), 4.0, 'Cumple los objetivos propuestos y la sustentación fue clara y bien organizada.', DATE_ADD(NOW(), INTERVAL -45 HOUR)),
  (@g1, (SELECT id_user FROM users WHERE mail_user = 'aolaya@cundinamarcau.edu.co'), 4.6, 'Muy buena implementación. Se sugiere ampliar la validación con más usuarios.', DATE_ADD(NOW(), INTERVAL -44 HOUR)),
  (@g1, (SELECT id_user FROM users WHERE mail_user = 'asuarez@cundinamarcau.edu.co'), 4.3, 'Documento bien estructurado. Faltó detallar algunas decisiones de diseño de la base de datos.', DATE_ADD(NOW(), INTERVAL -43 HOUR)),
  (@g1, (SELECT id_user FROM users WHERE mail_user = 'dcuartas@cundinamarcau.edu.co'), 4.4, 'Resultados consistentes con los objetivos. Buen manejo de las preguntas durante la sustentación.', DATE_ADD(NOW(), INTERVAL -42 HOUR));
-- PGC del equipo 2 (Investigación-producción) · Terminado
INSERT INTO `pgc` (`id_cycle`, `id_proposal`, `state_pgc`, `registered_at`, `updated_at`) VALUES (@c3, @p2, 'Terminado', DATE_ADD(NOW(), INTERVAL -50 DAY), DATE_ADD(NOW(), INTERVAL -50 DAY));
SET @g2 = LAST_INSERT_ID();
INSERT INTO `pgc_files` (`id_pgc`, `storage_path`, `file_format`, `uploaded_by`, `uploaded_at`, `title_file`, `desc_file`) VALUES
  (@g2, 'pgc/3/5/2/1788825726704-documento-final-del-pgc.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'sfbuitrago@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -30 DAY), 'Documento final del PGC', 'Documento completo con la metodología, los modelos comparados y los resultados.'),
  (@g2, 'pgc/3/6/2/1788825734623-presentacion-de-sustentacion.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'eyessidbeltran@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -30 DAY), 'Presentación de sustentación', 'Diapositivas de la sustentación ante los jurados.'),
  (@g2, 'pgc/3/5/2/1788825742542-resultados-del-modelo.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'sfbuitrago@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -30 DAY), 'Resultados del modelo', 'Informe de métricas y comparación de los modelos evaluados.');
-- Notas: 7 de 7 jurados (promedio 4.0)
INSERT INTO `jury_grades` (`id_pgc`, `id_juror`, `grade`, `comment`, `graded_at`) VALUES
  (@g2, (SELECT id_user FROM users WHERE mail_user = 'jtavera@cundinamarcau.edu.co'), 4.0, 'Trabajo correcto que cumple los objetivos. Se recomienda fortalecer el marco teórico.', DATE_ADD(NOW(), INTERVAL -120 HOUR)),
  (@g2, (SELECT id_user FROM users WHERE mail_user = 'horjuela@cundinamarcau.edu.co'), 3.8, 'La metodología es adecuada, pero la comparación de resultados puede ser más profunda.', DATE_ADD(NOW(), INTERVAL -119 HOUR)),
  (@g2, (SELECT id_user FROM users WHERE mail_user = 'cvargas@cundinamarcau.edu.co'), 4.2, 'Buen desarrollo general. La documentación necesita mayor detalle en las conclusiones.', DATE_ADD(NOW(), INTERVAL -118 HOUR)),
  (@g2, (SELECT id_user FROM users WHERE mail_user = 'xacosta@cundinamarcau.edu.co'), 3.9, 'Cumple con lo propuesto; se sugiere justificar mejor la selección de las herramientas.', DATE_ADD(NOW(), INTERVAL -117 HOUR)),
  (@g2, (SELECT id_user FROM users WHERE mail_user = 'jpedroche@cundinamarcau.edu.co'), 4.1, 'Resultados aceptables. Conviene incluir una sección de limitaciones del trabajo.', DATE_ADD(NOW(), INTERVAL -116 HOUR)),
  (@g2, (SELECT id_user FROM users WHERE mail_user = 'iforero@cundinamarcau.edu.co'), 4.0, 'Buena sustentación, aunque el alcance final quedó algo por debajo de lo planteado.', DATE_ADD(NOW(), INTERVAL -115 HOUR)),
  (@g2, (SELECT id_user FROM users WHERE mail_user = 'jandrade@cundinamarcau.edu.co'), 4.0, 'Proyecto bien encaminado; revisar la redacción y las referencias del documento.', DATE_ADD(NOW(), INTERVAL -114 HOUR));
-- PGC del equipo 3 (Fundamentación) · En Proceso
INSERT INTO `pgc` (`id_cycle`, `id_proposal`, `state_pgc`, `registered_at`, `updated_at`) VALUES (@c1, @p3, 'En Proceso', DATE_ADD(NOW(), INTERVAL -10 DAY), DATE_ADD(NOW(), INTERVAL -10 DAY));
SET @g3 = LAST_INSERT_ID();
INSERT INTO `pgc_files` (`id_pgc`, `storage_path`, `file_format`, `uploaded_by`, `uploaded_at`, `title_file`, `desc_file`) VALUES
  (@g3, 'pgc/1/7/3/1791158550461-documento-de-avance-del-pgc.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'davidfernandogonzalez@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -3 DAY), 'Documento de avance del PGC', 'Versión de avance del documento con requerimientos y diseño.'),
  (@g3, 'pgc/1/8/3/1791158558380-presentacion-del-proyecto.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'idgiraldo@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -3 DAY), 'Presentación del proyecto', 'Diapositivas de presentación del proyecto.');
-- Notas: 3 de 7 jurados (faltan jurados por calificar)
INSERT INTO `jury_grades` (`id_pgc`, `id_juror`, `grade`, `comment`, `graded_at`) VALUES
  (@g3, (SELECT id_user FROM users WHERE mail_user = 'omorera@cundinamarcau.edu.co'), 3.8, 'Avance coherente con el cronograma. Reforzar las pruebas del componente principal.', DATE_ADD(NOW(), INTERVAL -48 HOUR)),
  (@g3, (SELECT id_user FROM users WHERE mail_user = 'abravo@cundinamarcau.edu.co'), 4.1, 'El diseño es claro; falta evidencia de validación con usuarios.', DATE_ADD(NOW(), INTERVAL -47 HOUR)),
  (@g3, (SELECT id_user FROM users WHERE mail_user = 'jrodriguez@cundinamarcau.edu.co'), 3.6, 'Buen avance. Se recomienda documentar mejor los requerimientos no funcionales.', DATE_ADD(NOW(), INTERVAL -46 HOUR));
-- PGC del equipo 4 (Profundización) · En Proceso
INSERT INTO `pgc` (`id_cycle`, `id_proposal`, `state_pgc`, `registered_at`, `updated_at`) VALUES (@c2, @p4, 'En Proceso', DATE_ADD(NOW(), INTERVAL -15 DAY), DATE_ADD(NOW(), INTERVAL -15 DAY));
SET @g4 = LAST_INSERT_ID();
INSERT INTO `pgc_files` (`id_pgc`, `storage_path`, `file_format`, `uploaded_by`, `uploaded_at`, `title_file`, `desc_file`) VALUES
  (@g4, 'pgc/2/10/4/1791158566299-documento-de-avance-del-pgc.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'jduvanvelandia@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -3 DAY), 'Documento de avance del PGC', 'Avance del documento con el diseño del circuito y resultados preliminares.'),
  (@g4, 'pgc/2/11/4/1791158574218-fotografia-del-prototipo.png', 'png', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'esebastiansalinas@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -3 DAY), 'Fotografía del prototipo', 'Fotografía del prototipo armado en pruebas de laboratorio.');
-- PGC del equipo 6 (Investigación-producción) · En Proceso
INSERT INTO `pgc` (`id_cycle`, `id_proposal`, `state_pgc`, `registered_at`, `updated_at`) VALUES (@c3, @p6, 'En Proceso', DATE_ADD(NOW(), INTERVAL -52 DAY), DATE_ADD(NOW(), INTERVAL -52 DAY));
SET @g6 = LAST_INSERT_ID();
INSERT INTO `pgc_files` (`id_pgc`, `storage_path`, `file_format`, `uploaded_by`, `uploaded_at`, `title_file`, `desc_file`) VALUES
  (@g6, 'pgc/3/18/5/1788825782137-documento-de-avance-del-pgc.pdf', 'pdf', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'aremiso@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -30 DAY), 'Documento de avance del PGC', 'Documento de avance con el diseño de la red de sensores.'),
  (@g6, 'pgc/3/19/5/1788825790056-diagrama-de-flujo-del-proceso.png', 'png', (SELECT s.id_student FROM students s JOIN users u ON u.id_user = s.id_user WHERE u.mail_user = 'malejandroaldana@cundinamarcau.edu.co'), DATE_ADD(NOW(), INTERVAL -30 DAY), 'Diagrama de flujo del proceso', 'Diagrama de flujo del proceso de recolección propuesto.');
-- Notas: 4 de 7 jurados (faltan jurados por calificar)
INSERT INTO `jury_grades` (`id_pgc`, `id_juror`, `grade`, `comment`, `graded_at`) VALUES
  (@g6, (SELECT id_user FROM users WHERE mail_user = 'jtavera@cundinamarcau.edu.co'), 4.4, 'Avance coherente con el cronograma. Reforzar las pruebas del componente principal.', DATE_ADD(NOW(), INTERVAL -120 HOUR)),
  (@g6, (SELECT id_user FROM users WHERE mail_user = 'horjuela@cundinamarcau.edu.co'), 4.0, 'El diseño es claro; falta evidencia de validación con usuarios.', DATE_ADD(NOW(), INTERVAL -119 HOUR)),
  (@g6, (SELECT id_user FROM users WHERE mail_user = 'cvargas@cundinamarcau.edu.co'), 4.2, 'Buen avance. Se recomienda documentar mejor los requerimientos no funcionales.', DATE_ADD(NOW(), INTERVAL -118 HOUR)),
  (@g6, (SELECT id_user FROM users WHERE mail_user = 'xacosta@cundinamarcau.edu.co'), 4.6, 'La propuesta técnica es adecuada; revisar el alcance frente al tiempo restante.', DATE_ADD(NOW(), INTERVAL -117 HOUR));

-- ---------------------------------------------------------------------
-- 9. Documentos: lineamientos (globales, los sube el Administrador) y
--    rúbricas (por ciclo, las sube el encargado). Las filas viejas de un mismo
--    título quedan como historial; la vigente es la más reciente.
-- ---------------------------------------------------------------------
INSERT INTO `guideline_documents` (`title_file`, `desc_file`, `storage_path`, `version_label`, `uploaded_at`, `uploaded_by`) VALUES
  ('Plantilla de radicación de propuesta de PGC', 'Formato oficial que debe diligenciarse para radicar la propuesta inicial del PGC.', 'lineamientos/Plantilla_de_radicacion_de_propuesta_de_PGC_V1.0_1781049797975.pdf', 'V1.0', DATE_ADD(NOW(), INTERVAL -120 DAY), (SELECT id_user FROM users WHERE mail_user = 'admin@cundinamarcau.edu.co')),
  ('Formato del documento final del PGC', 'Estructura y normas de presentación del documento final del trabajo de grado.', 'lineamientos/Formato_del_documento_final_del_PGC_V1.0_1781049805894.pdf', 'V1.0', DATE_ADD(NOW(), INTERVAL -120 DAY), (SELECT id_user FROM users WHERE mail_user = 'admin@cundinamarcau.edu.co')),
  ('Reglamento general de trabajos de grado', 'Reglamento institucional del proceso de trabajo de grado.', 'lineamientos/Reglamento_general_de_trabajos_de_grado_V1.0_1781049813813.pdf', 'V1.0', DATE_ADD(NOW(), INTERVAL -120 DAY), (SELECT id_user FROM users WHERE mail_user = 'admin@cundinamarcau.edu.co')),
  ('Reglamento general de trabajos de grado', 'Actualización del reglamento con ajustes en los plazos de entrega.', 'lineamientos/Reglamento_general_de_trabajos_de_grado_V1.1_1788825821732.pdf', 'V1.1', DATE_ADD(NOW(), INTERVAL -30 DAY), (SELECT id_user FROM users WHERE mail_user = 'admin@cundinamarcau.edu.co'));
INSERT INTO `cycle_documents` (`id_cycle`, `storage_path`, `doc_type`, `version_label`, `uploaded_at`, `uploaded_by`, `title_file`, `desc_file`) VALUES
  (@c1, 'ciclos/1/documentos/rubrica/Rubrica_de_calificacion_del_PGC_V1.0_1785369829651.pdf', 'Rúbrica', 'V1.0', DATE_ADD(NOW(), INTERVAL -70 DAY), @enc_c1, 'Rúbrica de calificación del PGC', 'Criterios de evaluación del documento y del producto del PGC.'),
  (@c1, 'ciclos/1/documentos/rubrica/Rubrica_de_calificacion_del_PGC_V2.0_1789257837570.pdf', 'Rúbrica', 'V2.0', DATE_ADD(NOW(), INTERVAL -25 DAY), @enc_c1, 'Rúbrica de calificación del PGC', 'Ajuste de los pesos de cada criterio de evaluación.'),
  (@c1, 'ciclos/1/documentos/rubrica/Rubrica_de_sustentacion_oral_V1.0_1789257845489.pdf', 'Rúbrica', 'V1.0', DATE_ADD(NOW(), INTERVAL -25 DAY), @enc_c1, 'Rúbrica de sustentación oral', 'Criterios para evaluar la exposición y la defensa del proyecto.'),
  (@c2, 'ciclos/2/documentos/rubrica/Rubrica_de_calificacion_del_PGC_V1.0_1785369853408.pdf', 'Rúbrica', 'V1.0', DATE_ADD(NOW(), INTERVAL -70 DAY), @enc_c2, 'Rúbrica de calificación del PGC', 'Criterios de evaluación del documento y del producto del PGC.'),
  (@c3, 'ciclos/3/documentos/rubrica/Rubrica_de_calificacion_del_PGC_V1.0_1782777861327.pdf', 'Rúbrica', 'V1.0', DATE_ADD(NOW(), INTERVAL -100 DAY), @enc_c3, 'Rúbrica de calificación del PGC', 'Criterios de evaluación del documento y del producto del PGC.');

-- ---------------------------------------------------------------------
-- 10. Resumen de lo cargado (solo informativo)
-- ---------------------------------------------------------------------
SELECT 'users' AS tabla, COUNT(*) AS filas FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'cycle_juror', COUNT(*) FROM cycle_juror
UNION ALL SELECT 'cycle_dates', COUNT(*) FROM cycle_dates
UNION ALL SELECT 'proposals', COUNT(*) FROM proposals
UNION ALL SELECT 'pgc', COUNT(*) FROM pgc
UNION ALL SELECT 'pgc_files', COUNT(*) FROM pgc_files
UNION ALL SELECT 'jury_grades', COUNT(*) FROM jury_grades
UNION ALL SELECT 'guideline_documents', COUNT(*) FROM guideline_documents
UNION ALL SELECT 'cycle_documents', COUNT(*) FROM cycle_documents;