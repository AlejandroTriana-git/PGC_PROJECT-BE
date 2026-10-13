

DROP PROCEDURE IF EXISTS sp_ver_mi_propuesta
DELIMITER $$
CREATE PROCEDURE sp_ver_mi_propuesta (
    IN  p_id_user INT,
    OUT p_codigo  INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_id_student  INT DEFAULT NULL;
    DECLARE v_id_proposal INT DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_codigo  = 500;
        SET p_mensaje = 'Error al obtener la propuesta';
    END;

    SET p_codigo  = 0;
    SET p_mensaje = 'Error desconocido';

    -- ---------- 1. Validar que el usuario sea estudiante ----------
    SELECT id_student INTO v_id_student
      FROM students
     WHERE id_user = p_id_user;

    IF v_id_student IS NULL THEN
        SET p_codigo  = 404;
        SET p_mensaje = 'El usuario no es estudiante';
    ELSE
        -- ---------- 2. Buscar la propuesta más reciente del estudiante ----------
        SELECT p.id_proposal INTO v_id_proposal
          FROM proposals p
          INNER JOIN proposal_students ps ON p.id_proposal = ps.id_proposal
         WHERE ps.id_student = v_id_student
           AND p.state_proposal IN ('Pendiente de validación', 'Aprobada', 'Rechazada', 'Anulada')
         ORDER BY p.created_at DESC
         LIMIT 1;

        IF v_id_proposal IS NULL THEN
            SET p_codigo  = 404;
            SET p_mensaje = 'No tienes propuestas registradas';
        ELSE
            -- ---------- 3. Result set 1: propuesta + leader_name ----------
            SELECT p.*, u.full_name AS leader_name
              FROM proposals p
              INNER JOIN students s ON p.id_leader = s.id_student
              INNER JOIN users    u ON s.id_user   = u.id_user
             WHERE p.id_proposal = v_id_proposal;

            -- ---------- 4. Result set 2: integrantes ----------
            SELECT s.id_student, u.id_user, u.full_name
              FROM proposal_students ps
              INNER JOIN students s ON s.id_student = ps.id_student
              INNER JOIN users    u ON u.id_user    = s.id_user
             WHERE ps.id_proposal = v_id_proposal;

            -- ---------- 5. Result set 3: categorías ----------
            SELECT c.id_category, c.name_category
              FROM proposal_categories pc
              INNER JOIN categories c ON c.id_category = pc.id_category
             WHERE pc.id_proposal = v_id_proposal
             ORDER BY c.id_category ASC;

            SET p_codigo  = 1;
            SET p_mensaje = 'OK';
        END IF;
    END IF;
END$$

DELIMITER ;