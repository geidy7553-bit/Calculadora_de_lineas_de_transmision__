/**
 * config.js - Configuración global y constantes de la aplicación
 * Universidad de Oriente - Facultad de Ingenierías
 */

// Valores predeterminados para el formulario
const DEFAULT_VALUES = {
    z0: 50,
    r: 75,
    x: 30,
    frequency: 100,
    freqUnit: '1e6', // MHz
    length: 2,
    lenUnit: '1' // metros
};

// Mensajes de éxito
const SUCCESS_MESSAGES = {
    calculation: 'Cálculo completado exitosamente',
    copy: 'Resultados copiados al portapapeles',
    reset: 'Valores restablecidos a predeterminados'
};

// Mensajes de error
const ERROR_MESSAGES = {
    calculation: {
        general: 'Error en el cálculo. Verifique los parámetros ingresados.',
        z0: 'La impedancia característica debe estar entre 25Ω y 150Ω',
        r: 'La parte real de la impedancia debe ser ≥ 0',
        x: 'Ingrese un valor numérico válido para la reactancia',
        frequency: 'La frecuencia debe ser mayor a 0',
        length: 'La longitud debe ser mayor a 0'
    },
    validation: {
        required: 'Este campo es obligatorio',
        numeric: 'Ingrese un valor numérico válido',
        range: 'El valor está fuera del rango permitido'
    }
};

// Constantes físicas
const PHYSICAL_CONSTANTS = {
    c: 299792458, // Velocidad de la luz en m/s
    mu0: 4 * Math.PI * 1e-7, // Permeabilidad del vacío
    epsilon0: 8.854187817e-12 // Permitividad del vacío
};

// Configuración de visualizaciones
const VISUALIZATION_CONFIG = {
    canvas: {
        width: 800,
        height: 300,
        padding: { top: 40, right: 60, bottom: 50, left: 70 },
        colors: {
            voltage: '#4361ee',
            current: '#06d6a0',
            grid: '#2a3447',
            text: '#8a94a6',
            background: '#0a0e17'
        }
    },
    smithChart: {
        defaultZoom: 1,
        minZoom: 0.5,
        maxZoom: 3,
        colors: {
            circle: '#4361ee',
            axis: '#8a94a6',
            vswr: '#3f8efc',
            loadPoint: '#ffd166',
            resistance: '#ef476f',
            reactance: '#4361ee'
        }
    },
    standingWave: {
        pointRadius: 6,
        colors: {
            max: '#4361ee',
            min: '#ef476f',
            line: '#2a3447'
        }
    }
};

// Configuración de unidades
const UNITS = {
    frequency: {
        '1': { label: 'Hz', factor: 1 },
        '1e3': { label: 'kHz', factor: 1e3 },
        '1e6': { label: 'MHz', factor: 1e6 },
        '1e9': { label: 'GHz', factor: 1e9 }
    },
    length: {
        '1': { label: 'm', factor: 1 },
        '0.01': { label: 'cm', factor: 0.01 },
        '0.001': { label: 'mm', factor: 0.001 }
    }
};

// Exportar para uso en otros módulos (si se usa ES6 modules)
// En caso de scripts tradicionales, las variables están en el scope global
