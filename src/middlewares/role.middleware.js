// aca creamos la peticion a revisar

// por asi decirlo esta funcion crea el como se revisa la peticion sin tener encuenta que rol sea pero si revisandolo
function autorizarRoles(...rolesPermitidos) {
//aca se guarda temporalmente a pesar de que ya se termino de ejecutar    
  return (req, res, next) => {
//chequeo de seguridad por si corre sin que verifique el token
    if (!req.usuario) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }
// aca se revisa si el usuario tiene ese rol y tiene los permisos
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: "No tienes permiso para esta acción" });
    }

    next();
  };
}

export default autorizarRoles;
