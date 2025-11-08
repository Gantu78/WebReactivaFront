// src/componentes/GestorNotas.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// -----------------------------------------------------------------
// ENDPOINTS DE BACKEND (Spring Boot) REQUERIDOS:
//
// POST   /api/notas         -> Recibe Mono<Nota>, Devuelve Mono<Nota>
// DELETE /api/notas/{id}    -> Devuelve Mono<Void>
// GET    /api/notas/materia/{idMateria}/estudiante/{idEstudiante}  -> Devuelve Flux<Nota>
// GET    /api/promedio/materia/{idMateria}/estudiante/{idEstudiante} -> Devuelve Mono<Double>
// -----------------------------------------------------------------

const URL_API_NOTAS = '/api/notas';
const URL_API_PROMEDIO = '/api/promedio';

const GestorNotas = ({ listaMaterias, listaEstudiantes }) => {
    // Estados para la selección
    const [idMateriaSel, setIdMateriaSel] = useState('');
    const [idEstudianteSel, setIdEstudianteSel] = useState('');

    // Estados para los datos
    const [notas, setNotas] = useState([]);
    const [promedioFinal, setPromedioFinal] = useState(0.0);
    const [datosFormulario, setDatosFormulario] = useState({ id: null, observacion: '', valor: '', porcentaje: '' });

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
            // Crear (POST)
            await axios.post(URL_API_NOTAS, nota);

            reiniciarFormulario();
            // Recarga notas y promedio para reflejar el cambio (Simula la reactividad)
            obtenerNotasYPromedio();
        } catch (error) {
            console.error("Error al guardar nota:", error.response?.data?.message || error.message);
            // Validaciones de 0-5 o suma > 100%
            alert("Error: " + (error.response?.data?.message || "No se pudo guardar la nota. ¿Suma de porcentaje > 100%?"));
        }
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
                            <h5>Crear Nota</h5>
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
                                    <button type="submit" className="btn btn-primary">Agregar Nota</button>
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
                                        <button className="btn btn-sm btn-warning me-2" disabled>Editar</button>
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