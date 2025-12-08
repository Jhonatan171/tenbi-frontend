import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillaClasicaComponent } from '../../plantillas/plantilla-clasica/plantilla-clasica';
import { PlantillaMinimalistaComponent } from '../../plantillas/plantilla-minimalista/plantilla-minimalista';
import { PlantillaModernaComponent } from '../../plantillas/plantilla-moderna/plantilla-moderna';
import { LineaTiempoService } from '../linea-tiempo.service';

@Component({
  selector: 'app-render-plantilla',
  standalone: true,
  imports: [
    CommonModule,
    PlantillaClasicaComponent,
    PlantillaMinimalistaComponent,
    PlantillaModernaComponent
  ],
  templateUrl: './render-plantilla.html',
  styleUrls: ['./render-plantilla.scss']
})
export class RenderPlantillaComponent implements OnInit {

  @Input() linea: any = null;           // <-- si viene desde la vista pública
  @Input() plantillaId!: number;
  @Input() lineaId!: number | null;     // <-- solo la vista privada lo envía
  
  cargando = true;

  constructor(
    private lineaService: LineaTiempoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {

    // Si viene desde la vista pública → YA TENGO LA LÍNEA
    if (this.linea && !this.lineaId) {
      this.cargando = false;
      return;
    }

    // Si viene desde la vista del usuario → SÍ CARGAMOS POR ID
    if (this.lineaId) {
      this.lineaService.obtenerLineaPorId(this.lineaId).subscribe({
        next: (data) => {
          this.linea = data;
          this.plantillaId = Number(data.plantilla);
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
        }
      });
    }
  }
  ngOnChanges(changes: SimpleChanges) {

  // Cambio de línea externa (vista pública)
  if (changes['linea'] && this.linea) {
    this.cargando = false;

    // SOLO actualizar plantilla si NO la envió el padre
    if (!changes['plantillaId']) {
      this.plantillaId = Number(this.linea.plantilla);
    }

    this.cdr.detectChanges();
  }

  // Cambio de ID (vista privada)
  if (changes['lineaId'] && this.lineaId) {
    this.cargando = true;

    this.lineaService.obtenerLineaPorId(this.lineaId).subscribe({
      next: (data) => {
        this.linea = data;

        // Igual aquí, no sobrescribas si el padre quiere cambiar plantilla
        if (!changes['plantillaId']) {
          this.plantillaId = Number(data.plantilla);
        }

        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  if (changes['plantillaId'] && !changes['plantillaId'].firstChange) {
    this.cdr.detectChanges();
  }
}


  
}
