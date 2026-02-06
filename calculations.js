/**
 * calculations.js - Motor de cálculos de líneas de transmisión RF
 * Universidad de Oriente - Facultad de Ingenierías
 */

class TransmissionLineCalculator {
    /**
     * Validar parámetros de entrada
     */
    static validateParams(params) {
        const { Z0, R, X, frequency, length } = params;

        if (Z0 < 25 || Z0 > 150) {
            throw new Error(ERROR_MESSAGES.calculation.z0);
        }
        if (R < 0) {
            throw new Error(ERROR_MESSAGES.calculation.r);
        }
        if (frequency <= 0) {
            throw new Error(ERROR_MESSAGES.calculation.frequency);
        }
        if (length <= 0) {
            throw new Error(ERROR_MESSAGES.calculation.length);
        }
    }

    /**
     * Realizar todos los cálculos de la línea de transmisión
     */
    static calculate(params) {
        const { Z0, R, X, frequency, length } = params;

        // Impedancia de carga compleja
        const ZL = { real: R, imag: X };
        
        // Impedancia normalizada
        const zL = {
            real: R / Z0,
            imag: X / Z0
        };

        // Coeficiente de reflexión (Γ)
        const gamma = this.calculateReflectionCoefficient(ZL, Z0);
        
        // Magnitud y ángulo del coeficiente de reflexión
        const gammaMag = Math.sqrt(gamma.real ** 2 + gamma.imag ** 2);
        const gammaAngleRad = Math.atan2(gamma.imag, gamma.real);
        const gammaAngleDeg = (gammaAngleRad * 180 / Math.PI + 360) % 360;

        // ROE (VSWR)
        const vswr = this.calculateVSWR(gammaMag);

        // Pérdida de retorno (Return Loss)
        const returnLoss = gammaMag > 0 ? -20 * Math.log10(gammaMag) : Infinity;

        // Longitud de onda (asumiendo velocidad de propagación = c, línea ideal)
        const wavelength = PHYSICAL_CONSTANTS.c / frequency;

        // Posiciones de máximos y mínimos de voltaje
        const { dMax, dMin, vMaxPositions, vMinPositions } = 
            this.calculateVoltageExtrema(gammaAngleRad, wavelength, length);

        return {
            Z0,
            ZL,
            zL,
            gamma,
            gammaMag,
            gammaAngleRad,
            gammaAngleDeg,
            vswr,
            returnLoss,
            wavelength,
            dMax,
            dMin,
            vMaxPositions,
            vMinPositions,
            len: length,
            frequency
        };
    }

    /**
     * Calcular coeficiente de reflexión
     * Γ = (ZL - Z0) / (ZL + Z0)
     */
    static calculateReflectionCoefficient(ZL, Z0) {
        const numeratorReal = ZL.real - Z0;
        const numeratorImag = ZL.imag;
        const denominatorReal = ZL.real + Z0;
        const denominatorImag = ZL.imag;

        // División de números complejos
        const denomMagSq = denominatorReal ** 2 + denominatorImag ** 2;
        
        return {
            real: (numeratorReal * denominatorReal + numeratorImag * denominatorImag) / denomMagSq,
            imag: (numeratorImag * denominatorReal - numeratorReal * denominatorImag) / denomMagSq
        };
    }

    /**
     * Calcular VSWR (Voltage Standing Wave Ratio)
     * VSWR = (1 + |Γ|) / (1 - |Γ|)
     */
    static calculateVSWR(gammaMag) {
        if (gammaMag >= 1) return Infinity;
        return (1 + gammaMag) / (1 - gammaMag);
    }

    /**
     * Calcular posiciones de máximos y mínimos de voltaje
     */
    static calculateVoltageExtrema(gammaAngleRad, wavelength, lineLength) {
        // La onda estacionaria tiene período λ/2
        const halfWavelength = wavelength / 2;
        
        // Posición del primer máximo desde la carga
        // Los máximos ocurren cuando la fase de la reflexión es 0 (2πn)
        let dMax = -gammaAngleRad * wavelength / (4 * Math.PI);
        
        // Ajustar a posición positiva más cercana a la carga
        while (dMax < 0) dMax += halfWavelength;
        while (dMax >= halfWavelength) dMax -= halfWavelength;

        // Posición del primer mínimo desde la carga (λ/4 después del máximo)
        let dMin = dMax + halfWavelength / 2;
        if (dMin >= halfWavelength) dMin -= halfWavelength;

        // Generar todas las posiciones de máximos y mínimos a lo largo de la línea
        const vMaxPositions = [];
        const vMinPositions = [];

        // Máximos
        let pos = dMax;
        while (pos <= lineLength) {
            if (pos >= 0) vMaxPositions.push(pos);
            pos += halfWavelength;
        }

        // Mínimos
        pos = dMin;
        while (pos <= lineLength) {
            if (pos >= 0) vMinPositions.push(pos);
            pos += halfWavelength;
        }

        return { dMax, dMin, vMaxPositions, vMinPositions };
    }

    /**
     * Calcular distribución de voltaje y corriente a lo largo de la línea
     * Para visualización en canvas
     */
    static calculateDistribution(data, numPoints = 200) {
        const { Z0, ZL, gamma, wavelength, len } = data;
        const beta = 2 * Math.PI / wavelength; // Constante de fase
        
        const voltage = [];
        const current = [];
        const positions = [];

        for (let i = 0; i <= numPoints; i++) {
            const z = (i / numPoints) * len; // Posición desde el generador
            const d = len - z; // Distancia desde la carga
            
            // Voltaje en la línea (onda incidente + reflejada)
            // V(z) = V+ * (e^(-jβz) + Γ * e^(jβz))
            const Vincident = 1; // Amplitud normalizada de onda incidente
            const phase = beta * d;
            
            const Vreal = Math.cos(phase) + gamma.real * Math.cos(phase) - gamma.imag * Math.sin(phase);
            const Vim = -Math.sin(phase) + gamma.real * Math.sin(phase) + gamma.imag * Math.cos(phase);
            const Vmag = Math.sqrt(Vreal ** 2 + Vim ** 2);

            // Corriente en la línea
            // I(z) = (V+ / Z0) * (e^(-jβz) - Γ * e^(jβz))
            const Ireal = Math.cos(phase) - gamma.real * Math.cos(phase) + gamma.imag * Math.sin(phase);
            const Iim = -Math.sin(phase) - gamma.real * Math.sin(phase) - gamma.imag * Math.cos(phase);
            const Imag = Math.sqrt(Ireal ** 2 + Iim ** 2);

            positions.push(z);
            voltage.push(Vmag);
            current.push(Imag);
        }

        // Normalizar para visualización
        const maxV = Math.max(...voltage);
        const maxI = Math.max(...current);
        
        return {
            positions,
            voltage: voltage.map(v => v / maxV),
            current: current.map(i => i / maxI),
            maxVoltage: maxV,
            maxCurrent: maxI
        };
    }

    /**
     * Formatear número complejo como string
     */
    static formatComplex(complex, decimals = 2) {
        const real = complex.real.toFixed(decimals);
        const imag = Math.abs(complex.imag).toFixed(decimals);
        const sign = complex.imag >= 0 ? '+' : '-';
        return `${real} ${sign} j${imag}`;
    }

    /**
     * Formatear en forma polar (magnitud y ángulo)
     */
    static formatPolar(mag, angleDeg, decimals = 3) {
        const magStr = mag.toFixed(decimals);
        const angleStr = angleDeg.toFixed(2);
        return `|Γ| = ${magStr} ∠ ${angleStr}°`;
    }
}
