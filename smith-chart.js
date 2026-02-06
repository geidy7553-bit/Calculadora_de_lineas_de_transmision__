/**
 * smith-chart.js - Diagrama de Smith interactivo con SVG
 * Universidad de Oriente - Facultad de Ingenierías
 */

class SmithChart {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        if (!this.svg) {
            throw new Error(`SVG con id '${svgId}' no encontrado`);
        }
        
        this.config = VISUALIZATION_CONFIG.smithChart;
        this.zoom = this.config.defaultZoom;
        this.panX = 0;
        this.panY = 0;
        
        // Configurar controles de zoom
        this.setupZoomControls();
        
        // Configurar interacción de pan
        this.setupPanInteraction();
    }

    /**
     * Configurar controles de zoom
     */
    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => this.resetZoom());
        }
    }

    /**
     * Configurar interacción de pan (arrastrar)
     */
    setupPanInteraction() {
        let isDragging = false;
        let startX, startY;
        
        this.svg.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - this.panX;
            startY = e.clientY - this.panY;
            this.svg.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.panX = e.clientX - startX;
            this.panY = e.clientY - startY;
            this.updateTransform();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.svg.style.cursor = 'grab';
        });
        
        this.svg.style.cursor = 'grab';
    }

    /**
     * Aumentar zoom
     */
    zoomIn() {
        if (this.zoom < this.config.maxZoom) {
            this.zoom *= 1.2;
            this.updateTransform();
        }
    }

    /**
     * Disminuir zoom
     */
    zoomOut() {
        if (this.zoom > this.config.minZoom) {
            this.zoom /= 1.2;
            this.updateTransform();
        }
    }

    /**
     * Resetear zoom
     */
    resetZoom() {
        this.zoom = this.config.defaultZoom;
        this.panX = 0;
        this.panY = 0;
        this.updateTransform();
    }

    /**
     * Actualizar transformación del SVG
     */
    updateTransform() {
        // Aplicar transformación al grupo principal si existe
        const mainGroup = this.svg.querySelector('.smith-main-group');
        if (mainGroup) {
            mainGroup.setAttribute('transform', 
                `translate(${this.panX / 100}, ${this.panY / 100}) scale(${this.zoom})`
            );
        }
    }

    /**
     * Dibujar diagrama de Smith completo
     */
    draw(gammaReal, gammaImag, gammaMag, vswr) {
        // Limpiar SVG
        this.svg.innerHTML = '';
        
        // Crear grupo principal
        const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        mainGroup.setAttribute('class', 'smith-main-group');
        this.svg.appendChild(mainGroup);
        
        // Dibujar círculos de resistencia constante
        this.drawResistanceCircles(mainGroup);
        
        // Dibujar arcos de reactancia constante
        this.drawReactanceArcs(mainGroup);
        
        // Dibujar eje horizontal (resistencia pura)
        this.drawHorizontalAxis(mainGroup);
        
        // Dibujar círculo de VSWR si es válido
        if (vswr !== Infinity && !isNaN(vswr)) {
            this.drawVSWRCircle(mainGroup, vswr);
        }
        
        // Dibujar punto de carga
        this.drawLoadPoint(mainGroup, gammaReal, gammaImag);
        
        // Dibujar etiquetas
        this.drawLabels(mainGroup);
        
        // Aplicar transformación actual
        this.updateTransform();
    }

    /**
     * Dibujar círculos de resistencia constante
     */
    drawResistanceCircles(group) {
        const resistances = [0, 0.2, 0.5, 1, 2, 5];
        
        resistances.forEach(r => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            
            if (r === 0) {
                // Círculo unitario para r = 0
                circle.setAttribute('cx', 0);
                circle.setAttribute('cy', 0);
                circle.setAttribute('r', 1);
            } else {
                // Círculos de resistencia constante
                const center = r / (r + 1);
                const radius = 1 / (r + 1);
                circle.setAttribute('cx', center);
                circle.setAttribute('cy', 0);
                circle.setAttribute('r', radius);
            }
            
            circle.setAttribute('class', 'smith-circle');
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', this.config.colors.circle);
            circle.setAttribute('stroke-width', '0.008');
            circle.setAttribute('stroke-dasharray', '0.03, 0.03');
            
            group.appendChild(circle);
        });
    }

    /**
     * Dibujar arcos de reactancia constante
     */
    drawReactanceArcs(group) {
        const reactances = [-5, -2, -1, -0.5, 0.5, 1, 2, 5];
        
        reactances.forEach(x => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Centro y radio del círculo de reactancia
            const centerY = 1 / x;
            const radius = Math.abs(1 / x);
            
            // Arco dentro del círculo unitario
            // Intersección con círculo unitario
            const a = 1 + centerY ** 2;
            const b = -2 * centerY ** 2;
            const c = centerY ** 2 - 1;
            const discriminant = b ** 2 - 4 * a * c;
            
            if (discriminant >= 0) {
                const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                
                const y1 = centerY + Math.sqrt(radius ** 2 - (x1 - 1) ** 2) * (x > 0 ? 1 : -1);
                const y2 = centerY + Math.sqrt(radius ** 2 - (x2 - 1) ** 2) * (x > 0 ? 1 : -1);
                
                // Dibujar arco
                const largeArc = 0;
                const sweep = x > 0 ? 1 : 0;
                
                const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
                
                path.setAttribute('d', d);
                path.setAttribute('class', 'smith-circle');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', this.config.colors.circle);
                path.setAttribute('stroke-width', '0.008');
                path.setAttribute('stroke-dasharray', '0.03, 0.03');
                
                group.appendChild(path);
            }
        });
    }

    /**
     * Dibujar eje horizontal
     */
    drawHorizontalAxis(group) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', -1);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', 1);
        line.setAttribute('y2', 0);
        line.setAttribute('class', 'smith-axis');
        line.setAttribute('stroke', this.config.colors.axis);
        line.setAttribute('stroke-width', '0.01');
        
        group.appendChild(line);
        
        // Eje vertical
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', 0);
        vLine.setAttribute('y1', -1);
        vLine.setAttribute('x2', 0);
        vLine.setAttribute('y2', 1);
        vLine.setAttribute('class', 'smith-axis');
        vLine.setAttribute('stroke', this.config.colors.axis);
        vLine.setAttribute('stroke-width', '0.005');
        vLine.setAttribute('stroke-dasharray', '0.02, 0.02');
        
        group.appendChild(vLine);
    }

    /**
     * Dibujar círculo de VSWR
     */
    drawVSWRCircle(group, vswr) {
        // El círculo de VSWR es un círculo centrado en el origen
        // Radio = (VSWR - 1) / (VSWR + 1)
        const radius = (vswr - 1) / (vswr + 1);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', radius);
        circle.setAttribute('class', 'vswr-circle');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', this.config.colors.vswr);
        circle.setAttribute('stroke-width', '0.015');
        circle.setAttribute('stroke-dasharray', '0.04, 0.04');
        
        group.appendChild(circle);
        
        // Etiqueta de VSWR
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', radius * 0.7);
        text.setAttribute('y', -radius * 0.7);
        text.setAttribute('class', 'smith-label');
        text.setAttribute('fill', this.config.colors.vswr);
        text.setAttribute('font-size', '0.08');
        text.textContent = `VSWR = ${vswr.toFixed(2)}`;
        
        group.appendChild(text);
    }

    /**
     * Dibujar punto de carga
     */
    drawLoadPoint(group, gammaReal, gammaImag) {
        // Verificar que el punto está dentro del círculo unitario
        const mag = Math.sqrt(gammaReal ** 2 + gammaImag ** 2);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', gammaReal);
        circle.setAttribute('cy', -gammaImag); // Invertir eje Y para coordenadas matemáticas
        circle.setAttribute('r', '0.035');
        circle.setAttribute('class', 'load-point');
        circle.setAttribute('fill', this.config.colors.loadPoint);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '0.015');
        
        // Tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `Γ = ${gammaReal.toFixed(3)} ${gammaImag >= 0 ? '+' : ''}${gammaImag.toFixed(3)}j\n|Γ| = ${mag.toFixed(3)}`;
        circle.appendChild(title);
        
        group.appendChild(circle);
        
        // Línea desde el origen al punto
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', gammaReal);
        line.setAttribute('y2', -gammaImag);
        line.setAttribute('stroke', this.config.colors.loadPoint);
        line.setAttribute('stroke-width', '0.008');
        line.setAttribute('stroke-dasharray', '0.02, 0.02');
        line.setAttribute('opacity', '0.6');
        
        group.insertBefore(line, circle);
    }

    /**
     * Dibujar etiquetas del diagrama
     */
    drawLabels(group) {
        // Etiquetas de resistencia
        const rLabels = [
            { r: 0, x: -1.05, y: 0 },
            { r: 0.5, x: 0.33, y: 0.08 },
            { r: 1, x: 0.5, y: 0.08 },
            { r: 2, x: 0.67, y: 0.08 }
        ];
        
        rLabels.forEach(({ r, x, y }) => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('class', 'smith-label resistance-label');
            text.setAttribute('font-size', '0.07');
            text.textContent = r.toString();
            group.appendChild(text);
        });
        
        // Título
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('x', 0);
        title.setAttribute('y', -1.1);
        title.setAttribute('class', 'smith-title');
        title.textContent = 'Diagrama de Smith';
        group.appendChild(title);
        
        // Etiqueta de impedancia normalizada
        const zLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        zLabel.setAttribute('x', 0);
        zLabel.setAttribute('y', 1.15);
        zLabel.setAttribute('class', 'smith-label load-label');
        zLabel.setAttribute('font-size', '0.07');
        zLabel.textContent = 'zL = impedancia normalizada';
        group.appendChild(zLabel);
    }
}
