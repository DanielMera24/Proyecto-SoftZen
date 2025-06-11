// Predefined therapy types and postures
export const therapyTypes = {
  'anxiety': [
    {
      id: 1,
      name: 'Respiración Profunda',
      sanskrit: 'Pranayama',
      instructions: 'Siéntate cómodamente, inhala por 4 segundos, mantén por 4, exhala por 6 segundos.',
      benefits: 'Calma el sistema nervioso y reduce la ansiedad',
      modifications: 'Ajusta el ritmo según tu comodidad',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    },
    {
      id: 2,
      name: 'Postura del Niño',
      sanskrit: 'Balasana',
      instructions: 'Arrodíllate, siéntate sobre los talones, extiende los brazos hacia adelante.',
      benefits: 'Calma la mente y alivia el estrés',
      modifications: 'Coloca una almohada bajo el torso si es necesario',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    },
    {
      id: 3,
      name: 'Postura de las Piernas en la Pared',
      sanskrit: 'Viparita Karani',
      instructions: 'Acuéstate boca arriba cerca de una pared, sube las piernas contra la pared.',
      benefits: 'Mejora la circulación y calma el sistema nervioso',
      modifications: 'Usa una almohada bajo la zona lumbar',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 4,
      name: 'Torsión Suave Sentado',
      sanskrit: 'Ardha Matsyendrasana',
      instructions: 'Siéntate con las piernas extendidas, dobla una rodilla y gira suavemente.',
      benefits: 'Libera tensión en la columna y calma la mente',
      modifications: 'Usa una almohada para mayor comodidad',
      image: 'https://images.pexels.com/photos/4498647/pexels-photo-4498647.jpeg'
    },
    {
      id: 5,
      name: 'Postura del Gato-Vaca',
      sanskrit: 'Marjaryasana-Bitilasana',
      instructions: 'En cuatro patas, alterna entre arquear y redondear la espalda.',
      benefits: 'Mejora la flexibilidad espinal y reduce el estrés',
      modifications: 'Coloca una manta bajo las rodillas',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    },
    {
      id: 6,
      name: 'Meditación Sentada',
      sanskrit: 'Sukhasana',
      instructions: 'Siéntate cómodamente con la espalda recta, enfócate en la respiración.',
      benefits: 'Calma la mente y reduce la ansiedad',
      modifications: 'Usa un cojín o silla si es necesario',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    }
  ],
  'arthritis': [
    {
      id: 7,
      name: 'Movimientos de Dedos',
      sanskrit: '',
      instructions: 'Abre y cierra las manos suavemente, mueve cada dedo individualmente.',
      benefits: 'Mejora la movilidad de las articulaciones de los dedos',
      modifications: 'Hazlo en agua tibia para mayor alivio',
      image: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg'
    },
    {
      id: 8,
      name: 'Rotaciones de Hombros',
      sanskrit: '',
      instructions: 'Rota los hombros hacia adelante y hacia atrás suavemente.',
      benefits: 'Reduce la rigidez en hombros y cuello',
      modifications: 'Hazlo sentado si te resulta más cómodo',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    },
    {
      id: 9,
      name: 'Postura de la Montaña Sentado',
      sanskrit: 'Tadasana Sentado',
      instructions: 'Siéntate erguido, pies en el suelo, brazos a los lados.',
      benefits: 'Mejora la postura y fortalece el core',
      modifications: 'Usa respaldo si es necesario',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    },
    {
      id: 10,
      name: 'Elevación de Brazos Suave',
      sanskrit: '',
      instructions: 'Levanta los brazos lentamente hacia los lados y hacia arriba.',
      benefits: 'Mejora la movilidad del hombro',
      modifications: 'Limita el rango de movimiento según el dolor',
      image: 'https://images.pexels.com/photos/4498647/pexels-photo-4498647.jpeg'
    },
    {
      id: 11,
      name: 'Flexión de Rodilla Sentado',
      sanskrit: '',
      instructions: 'Sentado, dobla y extiende una rodilla a la vez.',
      benefits: 'Mantiene la movilidad de la rodilla',
      modifications: 'Hazlo lentamente y dentro del rango sin dolor',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 12,
      name: 'Rotación de Tobillos',
      sanskrit: '',
      instructions: 'Rota los tobillos en círculos, en ambas direcciones.',
      benefits: 'Mejora la circulación y movilidad del tobillo',
      modifications: 'Hazlo sentado para mayor estabilidad',
      image: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg'
    }
  ],
  'back_pain': [
    {
      id: 13,
      name: 'Postura del Gato-Vaca',
      sanskrit: 'Marjaryasana-Bitilasana',
      instructions: 'En cuatro patas, alterna entre arquear y redondear la espalda.',
      benefits: 'Mejora la flexibilidad espinal',
      modifications: 'Coloca una manta bajo las rodillas',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    },
    {
      id: 14,
      name: 'Rodillas al Pecho',
      sanskrit: 'Apanasana',
      instructions: 'Acostado boca arriba, abraza las rodillas hacia el pecho.',
      benefits: 'Alivia la tensión en la espalda baja',
      modifications: 'Abraza una rodilla a la vez si es más cómodo',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 15,
      name: 'Torsión Espinal Acostado',
      sanskrit: 'Supta Matsyendrasana',
      instructions: 'Acostado, lleva las rodillas a un lado manteniendo los hombros en el suelo.',
      benefits: 'Libera tensión en la columna vertebral',
      modifications: 'Coloca una almohada entre las rodillas',
      image: 'https://images.pexels.com/photos/4498647/pexels-photo-4498647.jpeg'
    },
    {
      id: 16,
      name: 'Postura del Niño',
      sanskrit: 'Balasana',
      instructions: 'Arrodíllate, siéntate sobre los talones, extiende los brazos hacia adelante.',
      benefits: 'Estira la espalda y calma la mente',
      modifications: 'Separa las rodillas si es necesario',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    },
    {
      id: 17,
      name: 'Postura del Puente',
      sanskrit: 'Setu Bandhasana',
      instructions: 'Acostado boca arriba, dobla las rodillas y levanta las caderas.',
      benefits: 'Fortalece la espalda baja y glúteos',
      modifications: 'Coloca un bloque bajo el sacro para apoyo',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 18,
      name: 'Inclinación Pélvica',
      sanskrit: '',
      instructions: 'Acostado, presiona la espalda baja contra el suelo.',
      benefits: 'Fortalece los músculos abdominales profundos',
      modifications: 'Mantén por menos tiempo si hay molestias',
      image: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg'
    }
  ],
  'headache': [
    {
      id: 19,
      name: 'Masaje de Sienes',
      sanskrit: '',
      instructions: 'Masajea suavemente las sienes con movimientos circulares.',
      benefits: 'Alivia la tensión en la cabeza',
      modifications: 'Ajusta la presión según tu comodidad',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    },
    {
      id: 20,
      name: 'Estiramiento de Cuello',
      sanskrit: '',
      instructions: 'Inclina suavemente la cabeza hacia cada lado.',
      benefits: 'Reduce la tensión en cuello y hombros',
      modifications: 'Hazlo muy lentamente y sin forzar',
      image: 'https://images.pexels.com/photos/4498647/pexels-photo-4498647.jpeg'
    },
    {
      id: 21,
      name: 'Respiración Nasal Alternada',
      sanskrit: 'Nadi Shodhana',
      instructions: 'Tapa una fosa nasal, inhala, cambia de lado, exhala.',
      benefits: 'Equilibra el sistema nervioso',
      modifications: 'Simplifica respirando naturalmente por ambas fosas',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    },
    {
      id: 22,
      name: 'Postura de Relajación',
      sanskrit: 'Savasana',
      instructions: 'Acuéstate cómodamente, relaja todo el cuerpo.',
      benefits: 'Reduce el estrés y alivia dolores de cabeza',
      modifications: 'Usa una almohada bajo las rodillas',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 23,
      name: 'Presión en Puntos de Acupresión',
      sanskrit: '',
      instructions: 'Presiona suavemente el punto entre las cejas y en la base del cráneo.',
      benefits: 'Alivia la tensión y el dolor de cabeza',
      modifications: 'Ajusta la presión según tu tolerancia',
      image: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg'
    },
    {
      id: 24,
      name: 'Rotaciones de Hombros',
      sanskrit: '',
      instructions: 'Rota los hombros hacia atrás lentamente.',
      benefits: 'Libera tensión que puede causar dolores de cabeza',
      modifications: 'Hazlo sentado si prefieres',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    }
  ],
  'insomnia': [
    {
      id: 25,
      name: 'Respiración 4-7-8',
      sanskrit: '',
      instructions: 'Inhala por 4, mantén por 7, exhala por 8 segundos.',
      benefits: 'Activa el sistema nervioso parasimpático',
      modifications: 'Ajusta los tiempos según tu capacidad',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    },
    {
      id: 26,
      name: 'Piernas en la Pared',
      sanskrit: 'Viparita Karani',
      instructions: 'Acuéstate con las piernas extendidas contra la pared.',
      benefits: 'Calma el sistema nervioso y mejora la circulación',
      modifications: 'Usa una almohada bajo la espalda baja',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 27,
      name: 'Relajación Muscular Progresiva',
      sanskrit: '',
      instructions: 'Tensa y relaja cada grupo muscular desde los pies hacia arriba.',
      benefits: 'Prepara el cuerpo para el descanso',
      modifications: 'Enfócate solo en las áreas más tensas',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 28,
      name: 'Postura del Niño Lateral',
      sanskrit: 'Balasana Modificado',
      instructions: 'Acuéstate de lado con las rodillas hacia el pecho.',
      benefits: 'Posición calmante que favorece el sueño',
      modifications: 'Coloca almohadas entre las rodillas',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    },
    {
      id: 29,
      name: 'Meditación Corporal',
      sanskrit: 'Yoga Nidra Breve',
      instructions: 'Escanea mentalmente todo el cuerpo desde los dedos de los pies.',
      benefits: 'Induce relajación profunda',
      modifications: 'Enfócate solo en las partes que sientes tensas',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    },
    {
      id: 30,
      name: 'Estiramiento Suave de Cuello',
      sanskrit: '',
      instructions: 'Gira suavemente la cabeza de lado a lado.',
      benefits: 'Libera tensión acumulada durante el día',
      modifications: 'Hazlo muy lentamente y sin forzar',
      image: 'https://images.pexels.com/photos/4498647/pexels-photo-4498647.jpeg'
    }
  ],
  'poor_posture': [
    {
      id: 31,
      name: 'Estiramiento de Pectorales',
      sanskrit: '',
      instructions: 'Entrelaza las manos detrás de la espalda y levanta los brazos.',
      benefits: 'Abre el pecho y mejora la postura',
      modifications: 'Usa una correa si no puedes entrelazar las manos',
      image: 'https://images.pexels.com/photos/4498647/pexels-photo-4498647.jpeg'
    },
    {
      id: 32,
      name: 'Postura de la Montaña',
      sanskrit: 'Tadasana',
      instructions: 'De pie, pies paralelos, corona hacia el techo, hombros relajados.',
      benefits: 'Mejora la conciencia postural',
      modifications: 'Practica contra una pared para mayor conciencia',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    },
    {
      id: 33,
      name: 'Fortalecimiento del Core',
      sanskrit: '',
      instructions: 'Acostado, levanta ligeramente la cabeza y hombros del suelo.',
      benefits: 'Fortalece los músculos que sostienen la postura',
      modifications: 'Mantén por menos tiempo si hay molestias',
      image: 'https://images.pexels.com/photos/4498266/pexels-photo-4498266.jpeg'
    },
    {
      id: 34,
      name: 'Estiramiento de Flexores de Cadera',
      sanskrit: 'Anjaneyasana Modificado',
      instructions: 'En posición de estocada baja, empuja las caderas hacia adelante.',
      benefits: 'Contrarresta el acortamiento por estar sentado',
      modifications: 'Apoya la rodilla trasera en el suelo',
      image: 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg'
    },
    {
      id: 35,
      name: 'Retracción de Escápulas',
      sanskrit: '',
      instructions: 'Aprieta los omóplatos hacia atrás y hacia abajo.',
      benefits: 'Fortalece los músculos de la espalda media',
      modifications: 'Hazlo sentado si prefieres',
      image: 'https://images.pexels.com/photos/4498647/pexels-photo-4498647.jpeg'
    },
    {
      id: 36,
      name: 'Extensión Torácica',
      sanskrit: '',
      instructions: 'Sentado, entrelaza las manos detrás de la cabeza y arquea hacia atrás.',
      benefits: 'Contrarresta la curvatura hacia adelante',
      modifications: 'Hazlo suavemente y sin forzar',
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    }
  ]
};