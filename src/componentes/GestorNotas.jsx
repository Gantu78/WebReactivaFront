// src/componentes/GestorNotas.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Alert from './Alert';

// -----------------------------------------------------------------
// ENDPOINTS DE BACKEND (Spring Boot) REQUERIDOS:
//
// POST   /api/notas         -> Recibe Mono<Nota>, Devuelve Mono<Nota>
// DELETE /api/notas/{id}    -> Devuelve Mono<Void>
// GET    /api/notas/materia/{idMateria}/estudiante/{idEstudiante}  -> Devuelve Flux<Nota>
// GET    /api/promedio/materia/{idMateria}/estudiante/{idEstudiante} -> Devuelve Mono<Double>
// -----------------------------------------------------------------

const URL_API_NOTAS = '/api/notas';
const URL_API_PROMEDIO = '/api/notas/promedio';

const GestorNotas = ({ listaMaterias, listaEstudiantes, selectedMateriaId, selectedEstudianteId }) => {
    // Estados para la selección
    const [idMateriaSel, setIdMateriaSel] = useState('');
    const [idEstudianteSel, setIdEstudianteSel] = useState('');

    // Estados para los datos
    const [notas, setNotas] = useState([]);
    const [promedioFinal, setPromedioFinal] = useState(0.0);
    const [datosFormulario, setDatosFormulario] = useState({ id: null, observacion: '', valor: '', porcentaje: '' });
    const [alert, setAlert] = useState({ type: '', message: '' });

    // Referencias a los nombres seleccionados para mostrar en el título
    const materiaSel = listaMaterias.find(m => m.id === parseInt(idMateriaSel));
    const estudianteSel = listaEstudiantes.find(e => e.id === parseInt(idEstudianteSel));

    // Función para cargar notas Y promedio
    const obtenerNotasYPromedio = async () => {
        if (!idMateriaSel || !idEstudianteSel) return;

        try {
            // 1. Cargar Notas
            const respuestaNotas = await axios.get(`${URL_API_NOTAS}/materia/${idMateriaSel}/estudiante/${idEstudianteSel}`);
            setNotas(respuestaNotas.data);

            // 2. Cargar Promedio (Cálculo Reactivo del Backend)
            //
            const respuestaPromedio = await axios.get(`${URL_API_PROMEDIO}/materia/${idMateriaSel}/estudiante/${idEstudianteSel}`);
            setPromedioFinal(respuestaPromedio.data);

        } catch (error) {
            console.error("Error al cargar notas o promedio:", error);
            setNotas([]);
            setPromedioFinal(0.0);
            setAlert({
                type: 'danger',
                message: 'Error al cargar las notas: ' + (error.response?.data?.message || error.message)
            });
        }
    };

    // Cargar datos cuando cambie la selección
    useEffect(() => {
        // Resetea si la selección cambia
        setNotas([]);
        setPromedioFinal(0.0);
        if(idMateriaSel && idEstudianteSel) {
            obtenerNotasYPromedio();
        }
    }, [idMateriaSel, idEstudianteSel]);

    // Si el padre indica una selección (por ejemplo al pulsar "Calificar"), la aplicamos
    useEffect(() => {
        if (selectedMateriaId) setIdMateriaSel(String(selectedMateriaId));
    }, [selectedMateriaId]);

    useEffect(() => {
        if (selectedEstudianteId) setIdEstudianteSel(String(selectedEstudianteId));
    }, [selectedEstudianteId]);

    // Suscripción SSE para actualizaciones reactivas del promedio del estudiante
    // Cuando el backend emite el id del estudiante, volvemos a solicitar el promedio
    useEffect(() => {
        if (!idEstudianteSel) return;

        const sseUrl = `/api/notas/stream/promedio/${idEstudianteSel}`;
        const es = new EventSource(sseUrl);

        es.onmessage = () => {
            // Solo refrescamos el promedio para la materia seleccionada
            if (idMateriaSel && idEstudianteSel) {
                axios.get(`${URL_API_PROMEDIO}/materia/${idMateriaSel}/estudiante/${idEstudianteSel}`)
                    .then(res => setPromedioFinal(res.data))
                    .catch(err => console.error('Error al actualizar promedio vía SSE:', err));
            }
        };

        es.onerror = (err) => {
            console.error('EventSource error:', err);
            // Si hay error cerramos la conexión; se reabrirá cuando cambie la selección
            es.close();
        };

        return () => es.close();
    }, [idEstudianteSel, idMateriaSel]);


    const manejarCambio = (e) => {
        setDatosFormulario({ ...datosFormulario, [e.target.name]: e.target.value });
    };

    // Maneja el envío del formulario de Nota
    const manejarEnvio = async (e) => {
        e.preventDefault();
        if (!idMateriaSel || !idEstudianteSel) {
            alert("Debe seleccionar una materia y un estudiante.");
            return;
        }

        const nota = {
            materiaId: parseInt(idMateriaSel),
            estudianteId: parseInt(idEstudianteSel),
            observacion: datosFormulario.observacion,
            valor: parseFloat(datosFormulario.valor),
            porcentaje: parseFloat(datosFormulario.porcentaje)
        };

        try {
            if (datosFormulario.id) {
                // Actualizar (PUT)
                await axios.put(`${URL_API_NOTAS}/${datosFormulario.id}`, nota);
            } else {
                // Crear (POST)
                await axios.post(URL_API_NOTAS, nota);
            }

            reiniciarFormulario();
            // Recarga notas y promedio para reflejar el cambio (Simula la reactividad)
            obtenerNotasYPromedio();
            setAlert({
                type: 'success',
                message: datosFormulario.id ? 'Nota actualizada correctamente' : 'Nota agregada correctamente'
            });
            setTimeout(() => setAlert({ type: '', message: '' }), 3000);
        } catch (error) {
            console.error("Error al guardar nota:", error);
            const backendMsg = error.response?.data?.message || error.response?.data?.error || error.message;
            let mensajeError = "Error: ";

            if (backendMsg.includes("porcentajes excede el 100%")) {
                mensajeError += "La suma de los porcentajes no puede exceder el 100%. Ajusta el porcentaje de la nota.";
            } else if (error.response?.status === 500) {
                mensajeError += "Error en el servidor. Por favor, verifica que los valores sean correctos:";
                mensajeError += "\n- El valor debe estar entre 0 y 5";
                mensajeError += "\n- El porcentaje debe estar entre 1 y 100";
            } else if (backendMsg.includes("not found") || backendMsg.includes("no existe")) {
                mensajeError += "No se encontró la nota a actualizar";
            } else {
                mensajeError += backendMsg || "Hubo un problema al guardar la nota. Verifica los valores ingresados";
            }

            setAlert({
                type: 'danger',
                message: mensajeError
            });
        }
    };

    const manejarEditarNota = (nota) => {
        setDatosFormulario({
            id: nota.id,
            observacion: nota.observacion || '',
            valor: nota.valor != null ? String(nota.valor) : '',
            porcentaje: nota.porcentaje != null ? String(nota.porcentaje) : ''
        });
    };

    const manejarEliminar = async (id) => {
        try {
            await axios.delete(`${URL_API_NOTAS}/${id}`);
            // Recarga notas y promedio para reflejar el cambio
            obtenerNotasYPromedio();
        } catch (error) {
            console.error("Error al eliminar nota:", error);
        }
    };

    const reiniciarFormulario = () => {
        setDatosFormulario({ id: null, observacion: '', valor: '', porcentaje: '' });
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header">
                <h3>Gestión de Notas (Sección 5.3)</h3>
            </div>
            <div className="card-body">

                {/* Alertas */}
                <Alert 
                    type={alert.type} 
                    message={alert.message} 
                    onClose={() => setAlert({ type: '', message: '' })} 
                />

                {/* --- 1. SELECCIÓN DE CONTEXTO --- */}
                <div className="row mb-3 p-3 border rounded">
                    <div className="col-md-6">
                        <label className="form-label">Seleccione una Materia:</label>
                        <select className="form-select" value={idMateriaSel} onChange={(e) => setIdMateriaSel(e.target.value)}>
                            <option value="">-- Materias --</option>
                            {listaMaterias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Seleccione un Estudiante:</label>
                        <select className="form-select" value={idEstudianteSel} onChange={(e) => setIdEstudianteSel(e.target.value)}>
                            <option value="">-- Estudiantes --</option>
                            {listaEstudiantes.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- 2. GESTIÓN DE NOTAS (Solo si hay selección) --- */}
                {idMateriaSel && idEstudianteSel && (
                    <div>
                        <h4 className="mb-3">
                            Notas de: <span className="text-primary">{estudianteSel?.nombre} {estudianteSel?.apellido}</span> <br/>
                            Materia: <span className="text-primary">{materiaSel?.nombre}</span>
                        </h4>

                        {/* Formulario Crear Nota (Mockup página 4) */}
                        <form onSubmit={manejarEnvio} className="mb-3 p-3 border rounded">
                            <h5>{datosFormulario.id ? 'Editar Nota' : 'Crear Nota'}</h5>
                            <div className="row g-2 align-items-end">
                                <div className="col-md-2">
                                    <label>Valor (0-5)</label>
                                    <input type="number" name="valor" value={datosFormulario.valor} onChange={manejarCambio} className="form-control" required min="0" max="5" step="0.1" />
                                </div>
                                <div className="col-md-2">
                                    <label>Porcentaje %</label>
                                    <input type="number" name="porcentaje" value={datosFormulario.porcentaje} onChange={manejarCambio} className="form-control" required min="1" max="100" />
                                </div>
                                <div className="col-md-5">
                                    <label>Observación</label>
                                    <input type="text" name="observacion" value={datosFormulario.observacion} onChange={manejarCambio} placeholder="Ej: Parcial primer corte" className="form-control" />
                                </div>
                                <div className="col-md-3">
                                    <button type="submit" className="btn btn-primary me-2">{datosFormulario.id ? 'Actualizar Nota' : 'Agregar Nota'}</button>
                                    {datosFormulario.id && (
                                        <button type="button" onClick={reiniciarFormulario} className="btn btn-secondary">Cancelar</button>
                                    )}
                                </div>
                            </div>
                        </form>

                        {/* Lista de Notas (Mockup página 4) */}
                        <h5>Lista de Notas</h5>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Observación</th>
                                <th>Valor</th>
                                <th>Porcentaje</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {notas.map(n => (
                                <tr key={n.id}>
                                    <td>{n.observacion}</td>
                                    <td>{n.valor.toFixed(1)}</td>
                                    <td>{n.porcentaje}%</td>
                                    <td>
                                        <button className="btn btn-sm btn-warning me-2" onClick={() => manejarEditarNota(n)}>Editar</button>
                                        <button onClick={() => manejarEliminar(n.id)} className="btn btn-sm btn-danger">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Promedio Final (Mockup página 4) */}
                        <h3 className="text-end text-danger">
                            Promedio Final Acumulado: {promedioFinal.toFixed(2)}
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestorNotas;