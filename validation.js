/**
 * validation.js - Sistema de validación de formularios
 * Implementa validación HTML5 personalizada con setCustomValidity()
 * Universidad de Oriente - Facultad de Ingenierías
 */

class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.inputs = {
            z0: document.getElementById('z0'),
            r: document.getElementById('r'),
            x: document.getElementById('x'),
            frequency: document.getElementById('frequency'),
            length: document.getElementById('length')
        };
        this.errorElements = {
            z0: document.getElementById('z0Error'),
            r: document.getElementById('rError'),
            x: document.getElementById('xError'),
            frequency: document.getElementById('freqError'),
            length: document.getElementById('lenError')
        };
        
        this.init();
    }

    init() {
        // Configurar validación en tiempo real
        Object.entries(this.inputs).forEach(([key, input]) => {
            if (input) {
                input.addEventListener('blur', () => this.validateField(key));
                input.addEventListener('input', () => this.clearError(key));
            }
        });
    }

    /**
     * Validar un campo específico
     */
    validateField(fieldName) {
        const input = this.inputs[fieldName];
        const errorElement = this.errorElements[fieldName];
        
        if (!input) return false;

        // Resetear custom validity
        input.setCustomValidity('');

        // Validación nativa HTML5
        if (!input.checkValidity()) {
            const message = this.getValidationMessage(input, fieldName);
            input.setCustomValidity(message);
            this.showError(input, errorElement, message);
            return false;
        }

        // Validaciones personalizadas adicionales
        const value = parseFloat(input.value);
        
        switch (fieldName) {
            case 'z0':
                if (value < 25 || value > 150) {
                    const msg = ERROR_MESSAGES.calculation.z0;
                    input.setCustomValidity(msg);
                    this.showError(input, errorElement, msg);
                    return false;
                }
                break;
            case 'r':
                if (value < 0) {
                    const msg = ERROR_MESSAGES.calculation.r;
                    input.setCustomValidity(msg);
                    this.showError(input, errorElement, msg);
                    return false;
                }
                break;
            case 'frequency':
                if (value <= 0) {
                    const msg = ERROR_MESSAGES.calculation.frequency;
                    input.setCustomValidity(msg);
                    this.showError(input, errorElement, msg);
                    return false;
                }
                break;
            case 'length':
                if (value <= 0) {
                    const msg = ERROR_MESSAGES.calculation.length;
                    input.setCustomValidity(msg);
                    this.showError(input, errorElement, msg);
                    return false;
                }
                break;
        }

        // Campo válido
        this.clearError(fieldName);
        return true;
    }

    /**
     * Obtener mensaje de validación personalizado
     */
    getValidationMessage(input, fieldName) {
        if (input.validity.valueMissing) {
            return ERROR_MESSAGES.validation.required;
        }
        if (input.validity.typeMismatch || input.validity.badInput) {
            return ERROR_MESSAGES.validation.numeric;
        }
        if (input.validity.rangeUnderflow || input.validity.rangeOverflow) {
            return ERROR_MESSAGES.validation.range;
        }
        return input.validationMessage;
    }

    /**
     * Mostrar error en campo
     */
    showError(input, errorElement, message) {
        input.setAttribute('aria-invalid', 'true');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    /**
     * Limpiar error de campo
     */
    clearError(fieldName) {
        const input = this.inputs[fieldName];
        const errorElement = this.errorElements[fieldName];
        
        if (input) {
            input.setAttribute('aria-invalid', 'false');
            input.setCustomValidity('');
        }
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    /**
     * Validar todo el formulario
     */
    validateAll() {
        let isValid = true;
        Object.keys(this.inputs).forEach(key => {
            if (!this.validateField(key)) {
                isValid = false;
            }
        });
        return isValid;
    }

    /**
     * Obtener valores validados del formulario
     */
    getValidatedValues() {
        if (!this.validateAll()) {
            throw new Error('Hay errores de validación en el formulario');
        }

        const freqUnit = parseFloat(document.getElementById('freqUnit').value);
        const lenUnit = parseFloat(document.getElementById('lenUnit').value);

        return {
            Z0: parseFloat(this.inputs.z0.value),
            R: parseFloat(this.inputs.r.value),
            X: parseFloat(this.inputs.x.value),
            frequency: parseFloat(this.inputs.frequency.value) * freqUnit,
            length: parseFloat(this.inputs.length.value) * lenUnit
        };
    }

    /**
     * Resetear validación
     */
    reset() {
        Object.keys(this.inputs).forEach(key => {
            this.clearError(key);
        });
    }
}
