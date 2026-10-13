
DROP TRIGGER IF EXISTS trg_cycle_dates_after_update;
DELIMITER $$

CREATE TRIGGER trg_cycle_dates_after_update AFTER UPDATE ON cycle_dates FOR EACH ROW BEGIN
    -- Solo registramos cuando alguna de las dos fechas cambia.
    -- Sin este IF, actualizar updated_by o cualquier otro campo generaria ruido.
    IF OLD.start_date <> NEW.start_date OR OLD.end_date <> NEW.end_date THEN
        INSERT INTO cycle_dates_history (
            id_cycle_date,
            id_cycle,
            stage,
            old_start_date,
            old_end_date,
            new_start_date,
            new_end_date,
            updated_by,
            changed_at
        ) VALUES (
            NEW.id_cycle_date,
            NEW.id_cycle,
            NEW.stage,
            OLD.start_date,
            OLD.end_date,
            NEW.start_date,
            NEW.end_date,
            NEW.updated_by,
            NOW()
        );
    END IF;
END$$
DELIMITER ;