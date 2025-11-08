// src/componentes/GestorMaterias.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// -----------------------------------------------------------------
// ENDPOINTS DE BACKEND (Spring Boot) REQUERIDOS:
//
// GET    /api/materias         -> Devuelve Flux<Materia>
// POST   /api/materias         -> Recibe Mono<Materia>, Devuelve Mono<Materia>
// PUT    /api/materias/{id}    -> Recibe Mono<Materia>, Devuelve Mono<Materia>
// DELETE /api/materias/{id}    -> Devuelve Mono<Void>
// -----------------------------------------------------------------

const URL_API = '/api/materias';

const GestorMaterias = ({ alSeleccionarMateria }) => {
    // Estado para la lista de materias
    const [materias, setMaterias] = useState([]);
    // Estado para los datos del formulario (crear/editar)
    const [datosFormulario, setDatosFormulario] = useState({ id: null, nombre: '', creditos: '' });

    // Carga inicial de materias
    useEffect(() => {
        obtenerMaterias();
    }, []);

    // Función para cargar la lista de materias (GET)
    const obtenerMaterias = async () => {
        try {
            const respuesta = await axios.get(URL_API);
            setMaterias(respuesta.data);
            alSeleccionarMateria(respuesta.data); // Informa al padre (App.jsx) sobre las materias
        } catch (error) {
            console.error("Error al cargar materias:", error);
        }
    };

    // Maneja cambios en los inputs del formulario
    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setDatosFormulario({ ...datosFormulario, [name]: value });
    };

    // Maneja el envío del formulario (Crear o Actualizar)
    const manejarEnvio = async (e) => {
        e.preventDefault();
        const materia = {
            nombre: datosFormulario.nombre,
            creditos: parseInt(datosFormulario.creditos)
        };

        try {
            if (datosFormulario.id) {
                // Actualizar (PUT)
                await axios.put(`${URL_API}/${datosFormulario.id}`, materia);
            } else {
                // Crear (POST)
                await axios.post(URL_API, materia);
            }
            reiniciarFormulario();
            obtenerMaterias(); // Recarga la lista
        } catch (error) {
            // Captura errores de validación del backend (ej: nombre único)
            console.error("Error al guardar materia:", error.response?.data?.message || error.message);
            alert("Error: " + (error.response?.data?.message || "No se pudo guardar la materia."));
        }
    };

    // Prepara el formulario para editar una materia
    const manejarEditar = (materia) => {
        setDatosFormulario({ id: materia.id, nombre: materia.nombre, creditos: materia.creditos });
    };

    // Maneja la eliminación de una materia
    const manejarEliminar = async (id) => {
        if (window.confirm("¿Seguro que quieres eliminar esta materia?")) {
            try {
                await axios.delete(`${URL_API}/${id}`);
                obtenerMaterias(); // Recarga la lista
            } catch (error) {
                console.error("Error al eliminar materia:", error);
            }
        }
    };

    // Limpia el formulario
    const reiniciarFormulario = () => {
        setDatosFormulario({ id: null, nombre: '', creditos: '' });
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header">
                <h3>Gestión de Materias (Sección 5.1)</h3>
            </div>
            <div className="card-body">
                {/* Formulario (Mockup de la página 3) */}
                <form onSubmit={manejarEnvio} className="mb-3 p-3 border rounded">
                    <h5>{datosFormulario.id ? 'Editar Materia' : 'Crear Materia'}</h5>
                    <div className="row g-2">
                        <div className="col-md-5">
                            <input
                                type="text" name="nombre" value={datosFormulario.nombre}
                                onChange={manejarCambio} placeholder="Nombre de la materia"
                                className="form-control" required
                            />
                        </div>
                        <div className="col-md-3">
                            <input
                                type="number" name="creditos" value={datosFormulario.creditos}
                                onChange={manejarCambio} placeholder="Créditos"
                                className="form-control" required min="1"
                            />
                        </div>
                        <div className="col-md-4">
                            <button type="submit" className="btn btn-primary me-2">
                                {datosFormulario.id ? 'Actualizar' : 'Agregar Materia'}
                            </button>
                            {datosFormulario.id && (
                                <button type="button" onClick={reiniciarFormulario} className="btn btn-secondary">
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Lista de Materias (Mockup de la página 3) */}
                <h5>Lista de Materias</h5>
                <table className="table table-striped table-hover">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Créditos</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {materias.map((materia) => (
                        <tr key={materia.id}>
                            <td>{materia.nombre}</td>
                            <td>{materia.creditos}</td>
                            <td>
                                <button onClick={() => manejarEditar(materia)} className="btn btn-sm btn-warning me-2">Editar</button>
                                <button onClick={() => manejarEliminar(materia.id)} className="btn btn-sm btn-danger me-2">Eliminar</button>
                                <button className="btn btn-sm btn-info" disabled>Ver Estudiantes</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GestorMaterias;