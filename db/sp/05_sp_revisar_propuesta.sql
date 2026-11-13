DROP procedure IF EXISTS sp_revisar_propuesta;

DELIMITER $$
CREATE PROCEDURE sp_revisar_propuesta(
    IN  p_id_proposal      INT,
    IN  p_id_usuario       INT,
    IN  p_accion           VARCHAR(20),    -- 'APROBAR' | 'RECHAZAR'
    IN  p_comentario       VARCHAR(500),   -- NULL si APROBAR
    OUT p_nuevo_resubmit   INT,            -- solo tiene valor si RECHAZAR
    OUT p_codigo           INT,
    OUT p_mensaje           VARCHAR(255)
)
BEGIN
    DECLARE v_state_proposal  VARCHAR(50);
    DECLARE v_id_cycle        INT;
    DECLARE v_resubmit_count  INT;
    DECLARE v_id_encargado    INT;
    DECLARE v_nuevo_estado    VARCHAR(50);
    DECLARE v_nuevo_resubmit  INT;

    -- Handler genérico: cualquier excepción SQL cae aquí y devuelve 500.
    -- El cliente (Node) traduce p_codigo a status HTTP.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_nuevo_resubmit = NULL;
        SET p_codigo  = 500;
        SET p_mensaje = 'Error interno al revisar la propuesta';
    END;

    -- Inicialización defensiva de las OUT
    SET p_codigo         = 0;
    SET p_mensaje        = 'Error desconocido';
    SET p_nuevo_resubmit = NULL;

    -- ---------- 0. Validar acción ----------
    IF p_accion NOT IN ('APROBAR', 'RECHAZAR') THEN
        SET p_codigo  = 400;
        SET p_mensaje = 'Acción no válida';

    -- ---------- 1. Comentario obligatorio para rechazo ----------
    ELSEIF p_accion = 'RECHAZAR' AND (p_comentario IS NULL OR TRIM(p_comentario) = '') THEN
        SET p_codigo  = 400;
        SET p_mensaje = 'Debes enviar un comentario para rechazar';

    ELSE
        -- ---------- 2. Buscar propuesta ----------
        SELECT state_proposal, id_cycle, resubmit_count
          INTO v_state_proposal, v_id_cycle, v_resubmit_count
          FROM proposals
         WHERE id_proposal = p_id_proposal;

        IF v_state_proposal IS NULL THEN
            SET p_codigo  = 404;
            SET p_mensaje = 'Propuesta no encontrada';

        ELSEIF v_state_proposal <> 'Pendiente de validación' THEN
            SET p_codigo  = 409;
            SET p_mensaje = 'Esta propuesta ya fue revisada';

        ELSE
            -- ---------- 3. Validación de encargado (defensa en profundidad) ----------
            -- Aunque el middleware autorizarEncargadoPropuesta ya validó,
            -- el SP revalida por si se invoca desde otro contexto.
            SELECT id_person_charge INTO v_id_encargado
              FROM cycles
             WHERE id_cycle = v_id_cycle;

            IF v_id_encargado IS NULL OR v_id_encargado <> p_id_usuario THEN
                SET p_codigo  = 403;
                SET p_mensaje = 'Solo el encargado del ciclo puede revisar esta propuesta';

            -- ---------- 4. APROBAR ----------
            ELSEIF p_accion = 'APROBAR' THEN
                UPDATE proposals
                   SET state_proposal = 'Aprobada',
                       reviewed_by    = p_id_usuario,
                       reviewed_at    = NOW()
                 WHERE id_proposal = p_id_proposal;

                SET p_codigo  = 1;
                SET p_mensaje = 'Se aprobó la propuesta correctamente';

            -- ---------- 5. RECHAZAR ----------
            ELSE
                SET v_nuevo_resubmit = v_resubmit_count + 1;

                IF v_nuevo_resubmit >= 3 THEN
                    SET v_nuevo_estado = 'Anulada';
                ELSE
                    SET v_nuevo_estado = 'Rechazada';
                END IF;

                UPDATE proposals
                   SET state_proposal     = v_nuevo_estado,
                       rejection_comment  = p_comentario,
                       resubmit_count     = v_nuevo_resubmit,
                       reviewed_by        = p_id_usuario,
                       reviewed_at        = NOW()
                 WHERE id_proposal = p_id_proposal;

                SET p_nuevo_resubmit = v_nuevo_resubmit;
                SET p_codigo         = 1;
                SET p_mensaje        = 'La propuesta fue rechazada';
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;