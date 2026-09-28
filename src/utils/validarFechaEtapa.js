// Función auxiliar: verifica si la fecha actual está dentro de un rango
export const validarFechaEtapa = (fecha_inicio, fecha_fin) => {
    const ahora = new Date();
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    return ahora >= inicio && ahora <= fin;
};