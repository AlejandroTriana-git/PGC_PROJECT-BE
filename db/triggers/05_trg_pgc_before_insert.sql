

DROP TRIGGER IF EXISTS trg_pgc_before_insert;
DELIMITER $$
CREATE TRIGGER trg_pgc_before_insert BEFORE INSERT ON pgc FOR EACH ROW BEGIN
    DECLARE v_proposal_cycle INT UNSIGNED DEFAULT NULL;

    -- Obtenemos el ciclo real de la propuesta referenciada.
    SELECT id_cycle INTO v_proposal_cycle
      FROM proposals
     WHERE id_proposal = NEW.id_proposal;

    -- Si la propuesta no existe, v_proposal_cycle queda NULL
    -- y dejamos que el FK fk_pgc_proposals1 rechace el INSERT con su mensaje estandar.
    -- Solo validamos coherencia cuando la propuesta sí existe.
    IF v_proposal_cycle IS NOT NULL AND v_proposal_cycle <> NEW.id_cycle THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El ciclo del PGC debe coincidir con el ciclo de la propuesta.';
    END IF;
END$$
DELIMITER ;