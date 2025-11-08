// src/componentes/GestorEstudiantes.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// -----------------------------------------------------------------
// ENDPOINTS DE BACKEND (Spring Boot) REQUERIDOS:
//
// GET    /api/estudiantes         -> Devuelve Flux<Estudiante>
// POST   /api/estudiantes         -> Recibe Mono<Estudiante>, Devuelve Mono<Estudiante>
// PUT    /api/estudiantes/{id}    -> Recibe Mono<Estudiante>, Devuelve Mono<Estudiante>
// DELETE /api/estudiantes/{id}    -> Devuelve Mono<Void>
// -----------------------------------------------------------------

const URL_API = '/api/estudiantes';

const GestorEstudiantes = ({ alSeleccionarEstudiante }) => {
    const [estudiantes, setEstudiantes] = useState([]);
    const [datosFormulario, setDatosFormulario] = useState({ id: null, nombre: '', apellido: '', correo: '' });

    useEffect(() => {
        obtenerEstudiantes();
    }, []);

    const obtenerEstudiantes = async () => {
        try {
            const respuesta = await axios.get(URL_API);
            setEstudiantes(respuesta.data);
            alSeleccionarEstudiante(respuesta.data); // Informa al padre (App.jsx)
        } catch (error) {
            console.error("Error al cargar estudiantes:", error);
        }
    };

    const manejarCambio = (e) => {
        setDatosFormulario({ ...datosFormulario, [e.target.name]: e.target.value });
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        try {
            if (datosFormulario.id) {
                // Actualizar (PUT)
                await axios.put(`${URL_API}/${datosFormulario.id}`, datosFormulario);
            } else {
                // Crear (POST)
                await axios.post(URL_API, datosFormulario);
            }
            reiniciarFormulario();
            obtenerEstudiantes();
        } catch (error) {
            console.error("Error al guardar estudiante:", error.response?.data?.message || error.message);
            alert("Error: " + (error.response?.data?.message || "No se pudo guardar el estudiante. (¿Correo duplicado?)"));
        }
    };

    const manejarEditar = (estudiante) => {
        setDatosFormulario(estudiante);
    };

    const manejarEliminar = async (id) => {
        if (window.confirm("¿Seguro que quieres eliminar este estudiante?")) {
            try {
                await axios.delete(`${URL_API}/${id}`);
                obtenerEstudiantes();
            } catch (error) {
                console.error("Error al eliminar estudiante:", error);
            }
        }
    };

    const reiniciarFormulario = () => {
        setDatosFormulario({ id: null, nombre: '', apellido: '', correo: '' });
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header">
                <h3>Gestión de Estudiantes (Sección 5.2)</h3>
            </div>
            <div className="card-body">
                {/* Formulario (Mockup de la página 4) */}
                <form onSubmit={manejarEnvio} className="mb-3 p-3 border rounded">
                    <h5>{datosFormulario.id ? 'Editar Estudiante' : 'Crear Estudiante'}</h5>
                    <div className="row g-2">
                        <div className="col-md-3">
                            <input type="text" name="nombre" value={datosFormulario.nombre} onChange={manejarCambio} placeholder="Nombre" className="form-control" required />
                        </div>
                        <div className="col-md-3">
                            <input type="text" name="apellido" value={datosFormulario.apellido} onChange={manejarCambio} placeholder="Apellido" className="form-control" required />
                        </div>
                        <div className="col-md-3">
                            <input type="email" name="correo" value={datosFormulario.correo} onChange={manejarCambio} placeholder="Correo" className="form-control" required />
                        </div>
                        <div className="col-md-3">
                            <button type="submit" className="btn btn-primary me-2">{datosFormulario.id ? 'Actualizar' : 'Agregar'}</button>
                            {datosFormulario.id && <button type="button" onClick={reiniciarFormulario} className="btn btn-secondary">Cancelar</button>}
                        </div>
                    </div>
                </form>

                {/* Lista de Estudiantes (Mockup de la página 4) */}
                <h5>Lista de Estudiantes</h5>
                <table className="table table-striped table-hover">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Correo</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {estudiantes.map((est) => (
                        <tr key={est.id}>
                            <td>{est.nombre}</td>
                            <td>{est.apellido}</td>
                            <td>{est.correo}</td>
                            <td>
                                <button onClick={() => manejarEditar(est)} className="btn btn-sm btn-warning me-2">Editar</button>
                                <button onClick={() => manejarEliminar(est.id)} className="btn btn-sm btn-danger me-2">Eliminar</button>
                                <button className="btn btn-sm btn-info" disabled>Calificar</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GestorEstudiantes;