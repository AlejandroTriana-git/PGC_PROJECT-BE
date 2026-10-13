DROP procedure IF EXISTS sp_crear_pgc;


DELIMITER $$
CREATE PROCEDURE sp_crear_pgc(
    IN  p_id_proposal      INT,
    IN  p_id_usuario       INT,
    IN  p_dentro_de_fecha  TINYINT,
    OUT p_id_pgc           INT,
    OUT p_codigo            INT,
    OUT p_mensaje          VARCHAR(255)
)
BEGIN
    -- 1. Variables
    DECLARE v_state_proposal VARCHAR(50);
    DECLARE v_id_leader      INT;
    DECLARE v_id_cycle       INT;
    DECLARE v_existe         INT DEFAULT 0;

    -- 2. Handlers (van aquí, ANTES de cualquier SET)
    DECLARE EXIT HANDLER FOR 1062
    BEGIN
        SET p_id_pgc  = NULL;
        SET p_codigo  = 400;
        SET p_mensaje = 'Ya existe un PGC para esta propuesta';
    END;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_id_pgc  = NULL;
        SET p_codigo  = 500;
        SET p_mensaje = 'Error interno al registrar el PGC';
    END;

    -- 3. Inicialización de OUTs
    SET p_id_pgc  = NULL;
    SET p_codigo  = 0;
    SET p_mensaje = 'Error desconocido';

    -- 4. Lógica
    SELECT state_proposal, id_leader, id_cycle
      INTO v_state_proposal, v_id_leader, v_id_cycle
      FROM proposals
     WHERE id_proposal = p_id_proposal;

    IF v_state_proposal IS NULL THEN
        SET p_codigo = 404; SET p_mensaje = 'Propuesta no encontrada';
    ELSEIF v_state_proposal <> 'Aprobada' THEN
        SET p_codigo = 400; SET p_mensaje = 'La propuesta no está aprobada';
    ELSE
        SELECT COUNT(*) INTO v_existe
          FROM students
         WHERE id_user    = p_id_usuario
           AND id_student = v_id_leader;

        IF v_existe = 0 THEN
            SET p_codigo = 403; SET p_mensaje = 'Solo el líder puede registrar el PGC';
        ELSE
            SELECT COUNT(*) INTO v_existe
              FROM pgc WHERE id_proposal = p_id_proposal;

            IF v_existe > 0 THEN
                SET p_codigo = 400; SET p_mensaje = 'Ya existe un PGC para esta propuesta';
            ELSEIF p_dentro_de_fecha = 0 THEN
                SET p_codigo = 400; SET p_mensaje = 'Fuera del rango de fechas';
            ELSE
                INSERT INTO pgc (id_cycle, id_proposal)
                VALUES (v_id_cycle, p_id_proposal);

                SET p_id_pgc  = LAST_INSERT_ID();
                SET p_codigo  = 1;
                SET p_mensaje = 'PGC registrado exitosamente';
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

