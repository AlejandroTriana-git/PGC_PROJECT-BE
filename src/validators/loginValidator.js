const validarLogin = (data) => {
    if (!data.correo || !data.contrasena) {
        return { mensaje: 'Debe completar todos los campos' };
    }
    return null;
};

export default validarLogin;