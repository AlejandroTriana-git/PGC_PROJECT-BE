

DROP TRIGGER IF EXISTS trg_jury_grades_before_delete;
DELIMITER $$
CREATE TRIGGER trg_jury_grades_before_delete BEFORE DELETE ON jury_grades FOR EACH ROW BEGIN
    -- Una nota, una vez registrada, es inmutable.
    -- Cualquier correccion debe pasar por un proceso administrativo explicito
    -- (por ejemplo: emitir una nueva fila, anular la anterior, etc.).
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se permite eliminar una nota ya registrada. Si hubo un error, contacta al administrador.';
END$$
DELIMITER ;