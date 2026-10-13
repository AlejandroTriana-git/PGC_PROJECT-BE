
DROP TRIGGER IF EXISTS trg_jury_grades_before_insert;
DELIMITER $$
CREATE TRIGGER trg_jury_grades_before_insert BEFORE INSERT ON jury_grades FOR EACH ROW BEGIN
    DECLARE v_pgc_cycle INT UNSIGNED DEFAULT NULL;
    DECLARE v_count     INT DEFAULT 0;

    -- 1. Obtener el ciclo del PGC que se va a calificar
    SELECT id_cycle INTO v_pgc_cycle
      FROM pgc
     WHERE id_pgc = NEW.id_pgc;

    -- Si el PGC no existe, dejamos que el FK lo rechace.
    IF v_pgc_cycle IS NOT NULL THEN
        -- 2. Verificar que el jurado esté asignado a ese ciclo
        SELECT COUNT(*) INTO v_count
          FROM cycle_juror
         WHERE id_juror = NEW.id_juror
           AND id_cycle = v_pgc_cycle;

        IF v_count = 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'El jurado no esta asignado al ciclo del PGC.';
        END IF;
    END IF;
END$$
DELIMITER ;