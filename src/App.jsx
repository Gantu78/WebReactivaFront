// src/App.jsx
import { useState } from 'react';
import GestorMaterias from './componentes/GestorMaterias';
import GestorEstudiantes from './componentes/GestorEstudiantes';
import GestorNotas from './componentes/GestorNotas';

function App() {
    // Estados globales para pasar datos entre componentes
    const [listaDeMaterias, setListaDeMaterias] = useState([]);
    const [listaDeEstudiantes, setListaDeEstudiantes] = useState([]);
    const [selectedMateriaId, setSelectedMateriaId] = useState(null);
    const [selectedEstudianteId, setSelectedEstudianteId] = useState(null);

    return (
        <div className="container-fluid">
            <h1 className="my-4 text-center">
                Taller 3: Programación Reactiva (Spring WebFlux + React)
            </h1>
            <p className="text-center text-muted">
                ⚠️ Backend (Spring Boot en puerto 8080) debe estar corriendo para que el frontend funcione.
            </p>

            {/* Pasamos las funciones 'alSeleccionarMateria' y 'alSeleccionarEstudiante'
        para que los componentes hijos (Gestores) puedan actualizar
        la lista global que usará el componente de Notas.
      */}

            <GestorMaterias
                alSeleccionarMateria={setListaDeMaterias}
                onCalificar={(materiaId, estudianteId) => {
                    setSelectedMateriaId(materiaId);
                    setSelectedEstudianteId(estudianteId);
                }}
            />

            <GestorEstudiantes 
                alSeleccionarEstudiante={setListaDeEstudiantes}
                onCalificar={(estudianteId) => {
                    setSelectedEstudianteId(estudianteId);
                }}
            />

            <GestorNotas
                listaMaterias={listaDeMaterias}
                listaEstudiantes={listaDeEstudiantes}
                selectedMateriaId={selectedMateriaId}
                selectedEstudianteId={selectedEstudianteId}
            />

        </div>
    );
}

export default App;