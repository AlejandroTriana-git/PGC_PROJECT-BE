DROP procedure IF EXISTS sp_buscar_pgc;

DELIMITER $$
CREATE PROCEDURE sp_buscar_pgc(
    IN  p_q_pattern      VARCHAR(300),   -- ya viene con % y escapes desde JS
    IN  p_id_cycle       INT,            -- NULL = sin filtro
    IN  p_state_pgc      VARCHAR(50),    -- NULL = sin filtro
    IN  p_id_category    INT,            -- NULL = sin filtro
    IN  p_limite         INT,
    IN  p_desplazamiento INT,
    OUT p_total          INT,
    OUT p_codigo          INT,
    OUT p_mensaje        VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DROP TEMPORARY TABLE IF EXISTS tmp_pgc_page;
        SET p_total   = 0;
        SET p_codigo  = 500;
        SET p_mensaje = 'Error al buscar PGCs';
    END;

    SET p_codigo  = 0;
    SET p_mensaje = 'Error desconocido';
    SET p_total   = 0;

    -- ---------- 1. Total de resultados (para paginación) ----------
    SELECT COUNT(*) INTO p_total
      FROM pgc
      INNER JOIN proposals p ON p.id_proposal = pgc.id_proposal
      INNER JOIN cycles    c ON c.id_cycle    = pgc.id_cycle
     WHERE p.state_proposal = 'Aprobada'
       AND (p_q_pattern   IS NULL OR p.title_proposal LIKE p_q_pattern
                                   OR p.descr_proposal LIKE p_q_pattern)
       AND (p_id_cycle    IS NULL OR pgc.id_cycle  = p_id_cycle)
       AND (p_state_pgc   IS NULL OR pgc.state_pgc = p_state_pgc)
       AND (p_id_category IS NULL OR EXISTS (
              SELECT 1 FROM proposal_categories pc
               WHERE pc.id_proposal = p.id_proposal
                 AND pc.id_category = p_id_category));

    -- ---------- 2. Temporal con los PGC de la página ----------
    DROP TEMPORARY TABLE IF EXISTS tmp_pgc_page;
    CREATE TEMPORARY TABLE tmp_pgc_page (
        id_pgc      INT PRIMARY KEY,
        id_proposal INT NOT NULL
    );

    INSERT INTO tmp_pgc_page (id_pgc, id_proposal)
    SELECT pgc.id_pgc, pgc.id_proposal
      FROM pgc
      INNER JOIN proposals p ON p.id_proposal = pgc.id_proposal
      INNER JOIN cycles    c ON c.id_cycle    = pgc.id_cycle
     WHERE p.state_proposal = 'Aprobada'
       AND (p_q_pattern   IS NULL OR p.title_proposal LIKE p_q_pattern
                                   OR p.descr_proposal LIKE p_q_pattern)
       AND (p_id_cycle    IS NULL OR pgc.id_cycle  = p_id_cycle)
       AND (p_state_pgc   IS NULL OR pgc.state_pgc = p_state_pgc)
       AND (p_id_category IS NULL OR EXISTS (
              SELECT 1 FROM proposal_categories pc
               WHERE pc.id_proposal = p.id_proposal
                 AND pc.id_category = p_id_category))
     ORDER BY pgc.registered_at DESC, pgc.id_pgc DESC
     LIMIT p_limite OFFSET p_desplazamiento;

    -- ---------- 3. Result set 1: página de resultados ----------
    SELECT pgc.id_pgc, pgc.id_proposal, pgc.state_pgc,
           p.title_proposal, c.name_cycle
      FROM tmp_pgc_page t
      INNER JOIN pgc        ON pgc.id_pgc      = t.id_pgc
      INNER JOIN proposals p ON p.id_proposal  = pgc.id_proposal
      INNER JOIN cycles    c ON c.id_cycle     = pgc.id_cycle
     ORDER BY pgc.registered_at DESC, pgc.id_pgc DESC;

    -- ---------- 4. Result set 2: categorías de las propuestas de esa página ----------
    SELECT pc.id_proposal, cat.id_category, cat.name_category
      FROM tmp_pgc_page t
      INNER JOIN proposal_categories pc  ON pc.id_proposal  = t.id_proposal
      INNER JOIN categories         cat ON cat.id_category = pc.id_category
     ORDER BY pc.id_proposal ASC, cat.id_category ASC;

    -- ---------- 5. Limpieza ----------
    DROP TEMPORARY TABLE IF EXISTS tmp_pgc_page;

    SET p_codigo  = 1;
    SET p_mensaje = 'OK';
END$$

DELIMITER ;

