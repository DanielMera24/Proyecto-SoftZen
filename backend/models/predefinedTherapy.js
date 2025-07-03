/**
 * Modelo de terapias predefinidas para SoftZen
 * Catálogo optimizado de tipos de terapia y posturas
 */

const therapyTypes = {
    back_pain: {
        id: 'back_pain',
        name: 'Dolor de Espalda',
        description: 'Secuencias específicas para aliviar dolor de espalda baja y alta',
        duration: 25,
        difficulty: 'beginner',
        postures: [
            { id: 'cat_cow', name: 'Gato-Vaca', duration: 3, difficulty: 'beginner' },
            { id: 'child_pose', name: 'Postura del Niño', duration: 5, difficulty: 'beginner' },
            { id: 'spinal_twist', name: 'Torsión Espinal', duration: 4, difficulty: 'intermediate' },
            { id: 'bridge_pose', name: 'Postura del Puente', duration: 3, difficulty: 'beginner' }
        ]
    },
    neck_pain: {
        id: 'neck_pain',
        name: 'Dolor de Cuello',
        description: 'Ejercicios suaves para aliviar tensión cervical',
        duration: 20,
        difficulty: 'beginner',
        postures: [
            { id: 'neck_rolls', name: 'Rotaciones de Cuello', duration: 2, difficulty: 'beginner' },
            { id: 'shoulder_shrugs', name: 'Elevación de Hombros', duration: 2, difficulty: 'beginner' },
            { id: 'eagle_arms', name: 'Brazos de Águila', duration: 3, difficulty: 'beginner' }
        ]
    },
    stress_relief: {
        id: 'stress_relief',
        name: 'Alivio del Estrés',
        description: 'Secuencias relajantes para reducir estrés y ansiedad',
        duration: 30,
        difficulty: 'beginner',
        postures: [
            { id: 'deep_breathing', name: 'Respiración Profunda', duration: 5, difficulty: 'beginner' },
            { id: 'legs_up_wall', name: 'Piernas en la Pared', duration: 10, difficulty: 'beginner' },
            { id: 'corpse_pose', name: 'Savasana', duration: 15, difficulty: 'beginner' }
        ]
    },
    flexibility: {
        id: 'flexibility',
        name: 'Flexibilidad',
        description: 'Mejora la flexibilidad general del cuerpo',
        duration: 35,
        difficulty: 'intermediate',
        postures: [
            { id: 'forward_fold', name: 'Flexión Hacia Adelante', duration: 5, difficulty: 'intermediate' },
            { id: 'pigeon_pose', name: 'Postura de la Paloma', duration: 8, difficulty: 'intermediate' },
            { id: 'seated_twist', name: 'Torsión Sentada', duration: 6, difficulty: 'beginner' }
        ]
    },
    strength: {
        id: 'strength',
        name: 'Fortalecimiento',
        description: 'Secuencias para desarrollar fuerza corporal',
        duration: 40,
        difficulty: 'intermediate',
        postures: [
            { id: 'plank', name: 'Plancha', duration: 3, difficulty: 'intermediate' },
            { id: 'warrior_poses', name: 'Posturas del Guerrero', duration: 8, difficulty: 'intermediate' },
            { id: 'chair_pose', name: 'Postura de la Silla', duration: 4, difficulty: 'intermediate' }
        ]
    }
};

export function getAllTherapyTypes() {
    return Object.values(therapyTypes);
}

export function getTherapyType(id) {
    return therapyTypes[id] || null;
}

export function getTherapyTypesByDifficulty(difficulty) {
    return Object.values(therapyTypes).filter(t => t.difficulty === difficulty);
}

export function searchTherapyTypes(query) {
    const searchTerm = query.toLowerCase();
    return Object.values(therapyTypes).filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm)
    );
}

export default {
    getAllTherapyTypes,
    getTherapyType,
    getTherapyTypesByDifficulty,
    searchTherapyTypes
};