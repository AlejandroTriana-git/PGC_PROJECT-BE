DROP procedure IF EXISTS sp_obtener_pgc_por_id;


DELIMITER $$
CREATE PROCEDURE sp_obtener_pgc_por_id(
    IN  p_id_pgc  INT,
    OUT p_codigo   INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    -- 1. Inicialización de OUTs
    SET p_codigo  = 0;
    SET p_mensaje = 'Error desconocido';

    -- 2. Validar existencia del PGC
    SELECT COUNT(*) INTO v_exists
      FROM pgc
     WHERE id_pgc = p_id_pgc;

    IF v_exists = 0 THEN
        SET p_codigo  = 404;
        SET p_mensaje = 'PGC no encontrado';
    ELSE
        -- -------- Result set 1: PGC + propuesta + ciclo --------
        SELECT p.id_pgc, p.id_cycle, p.id_proposal, p.id_pgc_previous,
               p.state_pgc, p.registered_at,
               pr.title_proposal, pr.problem_proposal, pr.justification_proposal,
               pr.objectives_proposal, pr.solution_proposal,
               c.name_cycle
          FROM pgc p
          INNER JOIN proposals pr ON p.id_proposal = pr.id_proposal
          INNER JOIN cycles    c  ON p.id_cycle    = c.id_cycle
         WHERE p.id_pgc = p_id_pgc;

        -- -------- Result set 2: categorías de la propuesta --------
        SELECT c.id_category, c.name_category
          FROM proposal_categories pc
          INNER JOIN categories c ON pc.id_category = c.id_category
          INNER JOIN pgc        p ON p.id_proposal  = pc.id_proposal
         WHERE p.id_pgc = p_id_pgc;

        -- -------- Result set 3: integrantes de la propuesta --------
        SELECT u.id_user, u.full_name
          FROM proposal_students ps
          INNER JOIN students s ON ps.id_student = s.id_student
          INNER JOIN users    u ON s.id_user     = u.id_user
          INNER JOIN pgc      p ON p.id_proposal = ps.id_proposal
         WHERE p.id_pgc = p_id_pgc;

        SET p_codigo  = 1;
        SET p_mensaje = 'OK';
    END IF;
END$$

DELIMITER ;

