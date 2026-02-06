/**
 * visualizations.js - Renderización de visualizaciones con Canvas
 * Universidad de Oriente - Facultad de Ingenierías
 */

class CanvasVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas con id '${canvasId}' no encontrado`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.config = VISUALIZATION_CONFIG.canvas;
        
        // Ajustar tamaño del canvas considerando el DPR para pantallas retina
        this.setupCanvas();
        
        // Manejar resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (window.currentCalculationData) {
                this.drawDistribution(window.currentCalculationData);
            }
        });
    }

    /**
     * Configurar canvas con alta resolución
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        this.padding = this.config.padding;
        this.chartWidth = this.width - this.padding.left - this.padding.right;
        this.chartHeight = this.height - this.padding.top - this.padding.bottom;
    }

    /**
     * Dibujar distribución de voltaje y corriente
     */
    drawDistribution(data) {
        // Calcular distribución
        const distribution = TransmissionLineCalculator.calculateDistribution(data);
        
        // Limpiar canvas
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Dibujar grid
        this.drawGrid();
        
        // Dibujar ejes
        this.drawAxes(data.len);
        
        // Dibujar curvas
        this.drawCurve(distribution.positions, distribution.voltage, data.len, this.config.colors.voltage, 'Voltaje');
        this.drawCurve(distribution.positions, distribution.current, data.len, this.config.colors.current, 'Corriente');
        
        // Dibujar leyenda
        this.drawLegend();
        
        // Dibujar marcadores de máximos y mínimos
        this.drawMarkers(data);
    }

    /**
     * Dibujar grid de fondo
     */
    drawGrid() {
        this.ctx.strokeStyle = this.config.colors.grid;
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([5, 5]);
        
        // Líneas verticales
        const numVLines = 10;
        for (let i = 0; i <= numVLines; i++) {
            const x = this.padding.left + (i / numVLines) * this.chartWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.padding.top);
            this.ctx.lineTo(x, this.padding.top + this.chartHeight);
            this.ctx.stroke();
        }
        
        // Líneas horizontales
        const numHLines = 5;
        for (let i = 0; i <= numHLines; i++) {
            const y = this.padding.top + (i / numHLines) * this.chartHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding.left, y);
            this.ctx.lineTo(this.padding.left + this.chartWidth, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }

    /**
     * Dibujar ejes
     */
    drawAxes(maxLength) {
        this.ctx.strokeStyle = this.config.colors.text;
        this.ctx.lineWidth = 1.5;
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = '12px Segoe UI, sans-serif';
        this.ctx.textAlign = 'center';
        
        // Eje X
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, this.padding.top + this.chartHeight);
        this.ctx.lineTo(this.padding.left + this.chartWidth, this.padding.top + this.chartHeight);
        this.ctx.stroke();
        
        // Etiquetas eje X
        const numLabels = 5;
        for (let i = 0; i <= numLabels; i++) {
            const x = this.padding.left + (i / numLabels) * this.chartWidth;
            const value = (i / numLabels) * maxLength;
            this.ctx.fillText(value.toFixed(2) + ' m', x, this.padding.top + this.chartHeight + 20);
        }
        
        // Título eje X
        this.ctx.fillText('Posición a lo largo de la línea (m)', 
            this.padding.left + this.chartWidth / 2, 
            this.height - 10
        );
        
        // Eje Y
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, this.padding.top);
        this.ctx.lineTo(this.padding.left, this.padding.top + this.chartHeight);
        this.ctx.stroke();
        
        // Etiquetas eje Y (magnitud normalizada)
        this.ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = this.padding.top + this.chartHeight - (i / 5) * this.chartHeight;
            const value = i / 5;
            this.ctx.fillText(value.toFixed(1), this.padding.left - 10, y + 4);
        }
        
        // Título eje Y
        this.ctx.save();
        this.ctx.translate(20, this.padding.top + this.chartHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Magnitud normalizada', 0, 0);
        this.ctx.restore();
    }

    /**
     * Dibujar curva de datos
     */
    drawCurve(positions, values, maxLength, color, label) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2.5;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        
        positions.forEach((pos, i) => {
            const x = this.padding.left + (pos / maxLength) * this.chartWidth;
            const y = this.padding.top + this.chartHeight - values[i] * this.chartHeight;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // Sombra suave
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = 0.1;
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * Dibujar leyenda
     */
    drawLegend() {
        const legendX = this.padding.left + this.chartWidth - 120;
        const legendY = this.padding.top + 20;
        
        // Fondo de leyenda
        this.ctx.fillStyle = 'rgba(10, 14, 23, 0.8)';
        this.ctx.fillRect(legendX - 10, legendY - 10, 110, 50);
        this.ctx.strokeStyle = this.config.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(legendX - 10, legendY - 10, 110, 50);
        
        // Voltaje
        this.ctx.strokeStyle = this.config.colors.voltage;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY);
        this.ctx.lineTo(legendX + 20, legendY);
        this.ctx.stroke();
        
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.textAlign = 'left';
        this.ctx.font = '12px Segoe UI, sans-serif';
        this.ctx.fillText('Voltaje', legendX + 25, legendY + 4);
        
        // Corriente
        this.ctx.strokeStyle = this.config.colors.current;
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY + 20);
        this.ctx.lineTo(legendX + 20, legendY + 20);
        this.ctx.stroke();
        
        this.ctx.fillText('Corriente', legendX + 25, legendY + 24);
    }

    /**
     * Dibujar marcadores de máximos y mínimos
     */
    drawMarkers(data) {
        const { vMaxPositions, vMinPositions, len } = data;
        
        // Máximos (triángulos azules arriba)
        this.ctx.fillStyle = this.config.colors.voltage;
        vMaxPositions.forEach(pos => {
            if (pos <= len) {
                const x = this.padding.left + (pos / len) * this.chartWidth;
                this.drawTriangle(x, this.padding.top - 5, 6, 'up');
            }
        });
        
        // Mínimos (triángulos rojos abajo)
        this.ctx.fillStyle = '#ef476f';
        vMinPositions.forEach(pos => {
            if (pos <= len) {
                const x = this.padding.left + (pos / len) * this.chartWidth;
                this.drawTriangle(x, this.padding.top + this.chartHeight + 5, 6, 'down');
            }
        });
    }

    /**
     * Dibujar triángulo
     */
    drawTriangle(x, y, size, direction) {
        this.ctx.beginPath();
        if (direction === 'up') {
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x - size, y + size);
            this.ctx.lineTo(x + size, y + size);
        } else {
            this.ctx.moveTo(x, y + size);
            this.ctx.lineTo(x - size, y - size);
            this.ctx.lineTo(x + size, y - size);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
}

/**
 * Diagrama de ondas estacionarias (DOM)
 */
class StandingWaveDiagram {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Contenedor con id '${containerId}' no encontrado`);
        }
        this.config = VISUALIZATION_CONFIG.standingWave;
    }

    /**
     * Dibujar diagrama de ondas estacionarias
     */
    draw(vMaxPositions, vMinPositions, lineLength) {
        // Limpiar contenedor
        this.container.innerHTML = '<div class="transmission-line" aria-hidden="true"></div>';
        
        // Crear línea de transmisión visual
        const line = this.container.querySelector('.transmission-line');
        
        // Agregar puntos de máximo voltaje
        vMaxPositions.forEach((pos, index) => {
            const point = document.createElement('div');
            point.className = 'max-point';
            point.style.left = `${(pos / lineLength) * 100}%`;
            point.title = `Vₘₐₓ en ${pos.toFixed(3)} m`;
            point.setAttribute('role', 'img');
            point.setAttribute('aria-label', `Máximo de voltaje ${index + 1} a ${pos.toFixed(3)} metros de la carga`);
            this.container.appendChild(point);
        });
        
        // Agregar puntos de mínimo voltaje
        vMinPositions.forEach((pos, index) => {
            const point = document.createElement('div');
            point.className = 'min-point';
            point.style.left = `${(pos / lineLength) * 100}%`;
            point.title = `Vₘᵢₙ en ${pos.toFixed(3)} m`;
            point.setAttribute('role', 'img');
            point.setAttribute('aria-label', `Mínimo de voltaje ${index + 1} a ${pos.toFixed(3)} metros de la carga`);
            this.container.appendChild(point);
        });
    }
}
