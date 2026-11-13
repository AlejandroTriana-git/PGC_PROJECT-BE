
DROP TRIGGER IF EXISTS trg_proposals_after_update_state;
DELIMITER $$
CREATE TRIGGER trg_proposals_after_update_state AFTER UPDATE ON proposals FOR EACH ROW BEGIN
    -- Solo registramos cuando el estado realmente cambia.
    -- Sin este IF, cualquier UPDATE (ej: cambiar el título) generaria una fila basura.
    IF OLD.state_proposal <> NEW.state_proposal THEN
        INSERT INTO proposal_state_history (
            id_proposal,
            old_state,
            new_state,
            rejection_comment,
            resubmit_count,
            reviewed_by,
            changed_at
        ) VALUES (
            NEW.id_proposal,
            OLD.state_proposal,
            NEW.state_proposal,
            NEW.rejection_comment,
            NEW.resubmit_count,
            NEW.reviewed_by,
            NOW()
        );
    END IF;
END$$

DELIMITER ;