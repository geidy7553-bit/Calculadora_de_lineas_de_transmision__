/**
 * main.js - Controlador principal de la aplicación
 * Integra todos los módulos y maneja la interacción del usuario
 */

class TransmissionLineApp {
    constructor() {
        // Inicializar componentes
        this.validator = new FormValidator('transmissionLineForm');
        this.canvasViz = new CanvasVisualizer('distributionCanvas');
        this.smithChart = new SmithChart('smithChart');
        this.standingWave = new StandingWaveDiagram('standingWaveDiagram');
        
        // Referencias a elementos del DOM
        this.calculateBtn = document.getElementById('calculateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Elementos de resultados
        this.resultElements = {
            normImpedance: document.getElementById('normImpedance'),
            gamma: document.getElementById('gamma'),
            gammaMagAngle: document.getElementById('gammaMagAngle'),
            vswr: document.getElementById('vswr'),
            returnLoss: document.getElementById('returnLoss'),
            wavelength: document.getElementById('wavelength'),
            firstMax: document.getElementById('firstMax'),
            firstMin: document.getElementById('firstMin'),
            loss: document.getElementById('loss'),
        };
        
        // Datos actuales del cálculo
        this.currentData = null;
        
        // Inicializar
        this.init();
    }

    /**
     * Inicializar aplicación
     */
    init() {
        // Configurar event listeners
        this.setupEventListeners();
        
        // Realizar cálculo inicial
        this.calculate();
        
        // Configurar navegación por teclado
        this.setupKeyboardNavigation();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón calcular
        this.calculateBtn.addEventListener('click', () => this.calculate());
        
        // Botón copiar
        this.copyBtn.addEventListener('click', () => this.copyResults());
        
        // Botón resetear
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Enter en campos de entrada
        Object.values(this.validator.inputs).forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.calculate();
                }
            });
        });
        
        // Cambios en selects de unidades
        document.getElementById('freqUnit').addEventListener('change', () => {
            if (this.currentData) this.calculate();
        });
        
        document.getElementById('lenUnit').addEventListener('change', () => {
            if (this.currentData) this.calculate();
        });
    }

    /**
     * Configurar navegación por teclado
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter para calcular
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.calculate();
            }
            
            // Ctrl/Cmd + C para copiar (cuando no hay texto seleccionado)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !window.getSelection().toString()) {
                e.preventDefault();
                this.copyResults();
            }
            
            // Ctrl/Cmd + R para resetear
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.reset();
            }
        });
    }

    /**
     * Realizar cálculos y actualizar visualizaciones
     */
    calculate() {
        try {
            // Obtener valores validados
            const params = this.validator.getValidatedValues();
            
            // Validar parámetros
            TransmissionLineCalculator.validateParams(params);
            
            // Realizar cálculos
            this.currentData = TransmissionLineCalculator.calculate(params);
            
            // Guardar datos globalmente para resize
            window.currentCalculationData = this.currentData;
            
            // Actualizar resultados numéricos
            this.updateResults();
            
            // Actualizar visualizaciones
            this.updateVisualizations();
            
            // Mostrar mensaje de éxito
            this.showToast(SUCCESS_MESSAGES.calculation, 'success');
            
        } catch (error) {
            console.error('Error en cálculo:', error);
            this.showToast(error.message || ERROR_MESSAGES.calculation.general, 'error');
            
            // Mostrar estados de error en inputs relevantes
            this.handleCalculationError(error);
        }
    }

    /**
     * Actualizar resultados numéricos
     */
    updateResults() {
        const data = this.currentData;
        
        // Impedancia normalizada
        this.resultElements.normImpedance.textContent = 
            TransmissionLineCalculator.formatComplex(data.zL, 2);
        
        // Coeficiente de reflexión
        this.resultElements.gamma.textContent = 
            TransmissionLineCalculator.formatComplex(data.gamma, 3);
        
        // Magnitud y ángulo
        this.resultElements.gammaMagAngle.textContent = 
            TransmissionLineCalculator.formatPolar(data.gammaMag, data.gammaAngleDeg);
        
        // VSWR
        this.resultElements.vswr.textContent = 
            data.vswr === Infinity ? '∞' : data.vswr.toFixed(2);
        
        // Pérdida de retorno
        this.resultElements.returnLoss.textContent = 
            data.returnLoss === Infinity ? '∞ dB' :
            (isNaN(data.returnLoss) ? 'Error' : data.returnLoss.toFixed(1) + ' dB');
        
        // Longitud de onda
        this.resultElements.wavelength.textContent = data.wavelength.toFixed(2) + ' m';
        
        // Primer máximo
        this.resultElements.firstMax.textContent = data.dMax.toFixed(3) + ' m';
        
        // Primer mínimo
        this.resultElements.firstMin.textContent = data.dMin.toFixed(3) + ' m';
    }

    /**
     * Actualizar todas las visualizaciones
     */
    updateVisualizations() {
        const data = this.currentData;
        
        // Gráfico de distribución
        this.canvasViz.drawDistribution(data);
        
        // Diagrama de Smith
        this.smithChart.draw(
            data.gamma.real,
            data.gamma.imag,
            data.gammaMag,
            data.vswr
        );
        
        // Diagrama de ondas estacionarias
        this.standingWave.draw(
            data.vMaxPositions,
            data.vMinPositions,
            data.len
        );
    }

    /**
     * Copiar resultados al portapapeles
     */
    async copyResults() {
        if (!this.currentData) {
            this.showToast('No hay resultados para copiar', 'error');
            return;
        }
        
        try {
            // Obtener valores de entrada
            const params = this.validator.getValidatedValues();
            const freqUnit = document.getElementById('freqUnit');
            const lenUnit = document.getElementById('lenUnit');
            
            const freqUnitLabel = freqUnit.options[freqUnit.selectedIndex].text;
            const lenUnitLabel = lenUnit.options[lenUnit.selectedIndex].text;
            
            // Formatear texto de resultados
            const resultsText = this.formatResultsText(params, freqUnitLabel, lenUnitLabel);
            
            // Copiar al portapapeles
            await navigator.clipboard.writeText(resultsText);
            
            // Feedback visual
            this.showCopySuccess();
            this.showToast(SUCCESS_MESSAGES.copy, 'success');
            
        } catch (error) {
            console.error('Error al copiar:', error);
            this.showToast('Error al copiar los resultados', 'error');
        }
    }

    /**
     * Formatear texto de resultados para copiar
     */
    formatResultsText(params, freqUnitLabel, lenUnitLabel) {
        const data = this.currentData;
        
        return `ANÁLISIS DE LÍNEA DE TRANSMISIÓN
==================================================

Parámetros de Entrada:
- Impedancia Característica (Z₀): ${params.Z0} Ω
- Impedancia de Carga: ${params.R} ${params.X >= 0 ? '+' : ''}${params.X}j Ω
- Frecuencia de Operación: ${params.frequency} ${freqUnitLabel}
- Longitud de Línea: ${params.length} ${lenUnitLabel}

Resultados Calculados:
- Impedancia Normalizada: ${this.resultElements.normImpedance.textContent}
- Coeficiente de Reflexión (Γ): ${this.resultElements.gamma.textContent}
  ${this.resultElements.gammaMagAngle.textContent}
- ROE (VSWR): ${this.resultElements.vswr.textContent}
- Pérdida de Retorno: ${this.resultElements.returnLoss.textContent}
- Longitud de Onda: ${this.resultElements.wavelength.textContent}
- Primer Máximo de Voltaje desde Carga: ${this.resultElements.firstMax.textContent}
- Primer Mínimo de Voltaje desde Carga: ${this.resultElements.firstMin.textContent}

Posiciones de Máximos (Vₘₐₓ):
${data.vMaxPositions.map((pos, i) => `  ${i + 1}. ${pos.toFixed(3)} m`).join('\n')}

Posiciones de Mínimos (Vₘᵢₙ):
${data.vMinPositions.map((pos, i) => `  ${i + 1}. ${pos.toFixed(3)} m`).join('\n')}

Nota: Esta línea de transmisión se considera ideal (sin pérdidas).

==================================================
Generado con Analizador de Líneas de Transmisión
Universidad de Oriente - Facultad de Ingenierías
Fecha: ${new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}
`;
    }

    /**
     * Mostrar feedback de copia exitosa
     */
    showCopySuccess() {
        this.copyBtn.classList.add('copied');
        this.copyBtn.innerHTML = '<span aria-hidden="true">✓</span> ¡Copiado!';
        this.copyBtn.setAttribute('aria-label', 'Resultados copiados al portapapeles');
        
        setTimeout(() => {
            this.copyBtn.classList.remove('copied');
            this.copyBtn.innerHTML = '<span aria-hidden="true">📋</span> Copiar Resultados';
            this.copyBtn.setAttribute('aria-label', 'Copiar resultados al portapapeles');
        }, 2500);
    }

    /**
     * Resetear formulario a valores predeterminados
     */
    reset() {
        // Restablecer valores
        document.getElementById('z0').value = DEFAULT_VALUES.z0;
        document.getElementById('r').value = DEFAULT_VALUES.r;
        document.getElementById('x').value = DEFAULT_VALUES.x;
        document.getElementById('frequency').value = DEFAULT_VALUES.frequency;
        document.getElementById('freqUnit').value = DEFAULT_VALUES.freqUnit;
        document.getElementById('length').value = DEFAULT_VALUES.length;
        document.getElementById('lenUnit').value = DEFAULT_VALUES.lenUnit;
        
        // Resetear validación
        this.validator.reset();
        
        // Recalcular
        this.calculate();
        
        // Mostrar mensaje
        this.showToast(SUCCESS_MESSAGES.reset, 'success');
    }

    /**
     * Manejar errores de cálculo
     */
    handleCalculationError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('impedancia característica')) {
            this.validator.showError(
                this.validator.inputs.z0,
                this.validator.errorElements.z0,
                error.message
            );
        } else if (message.includes('parte real')) {
            this.validator.showError(
                this.validator.inputs.r,
                this.validator.errorElements.r,
                error.message
            );
        } else if (message.includes('frecuencia')) {
            this.validator.showError(
                this.validator.inputs.frequency,
                this.validator.errorElements.frequency,
                error.message
            );
        } else if (message.includes('longitud')) {
            this.validator.showError(
                this.validator.inputs.length,
                this.validator.errorElements.length,
                error.message
            );
        }
    }

    /**
     * Mostrar notificación toast
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TransmissionLineApp();
});
