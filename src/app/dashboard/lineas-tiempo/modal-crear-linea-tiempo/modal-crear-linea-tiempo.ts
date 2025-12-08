import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CrearLineaTiempoComponent } from '../crear-linea-tiempo/crear-linea-tiempo';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-crear-linea-tiempo',
  standalone: true,
  imports: [CommonModule, CrearLineaTiempoComponent],
  templateUrl: './modal-crear-linea-tiempo.html',
  styleUrls: ['./modal-crear-linea-tiempo.scss']
})
export class ModalCrearLineaTiempoComponent {
  @Input() lineaEditar: any | null = null; // <-- aquí pasas la línea a editar
  @Output() cerrarModal = new EventEmitter<boolean>();
  @Output() abrirPlantilla = new EventEmitter<void>();
  @Output() guardarEdicion = new EventEmitter<any>(); 
  @Output() lineaActualizada = new EventEmitter<any>();

  cerrar(limpiar?: boolean) {
    this.cerrarModal.emit(limpiar ?? false);
  }

  onAbrirPlantilla() {
    this.abrirPlantilla.emit(); 
  }

  onGuardarEdicion(datos: any) {
    this.lineaActualizada.emit(datos);
    this.guardarEdicion.emit(datos);
    this.cerrarModal.emit(true);
  }
  
}
