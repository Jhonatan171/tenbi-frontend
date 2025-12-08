import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LineaTiempoService } from '../linea-tiempo.service';
import { Router } from '@angular/router';
import { LineaCacheService } from '../linea-cache.service';

@Component({
  selector: 'app-crear-linea-tiempo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-linea-tiempo.html',
  styleUrls: ['./crear-linea-tiempo.scss']
})
export class CrearLineaTiempoComponent implements OnInit {
  lineaTiempoForm: FormGroup;
  mensaje: string | null = null;
  temas: any[] = [];
  previewPortada: string | ArrayBuffer | null = null;
  portadaFile: File | null = null;

  hitoExpansions: boolean[] = [];

  nombrePortadaActual: string | null = null;


  @Input() lineaEditar: any | null = null;
  @Output() guardarEdicion = new EventEmitter<any>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;


  constructor(private fb: FormBuilder, private lineaService: LineaTiempoService, private cacheService: LineaCacheService, private router: Router) {
    this.lineaTiempoForm = this.fb.group({
      titulo: ['', Validators.required],
      idTema: [null, Validators.required],
      descripcion: [''],
      url: [''],
      palabrasClave: [''],
      imagenPortada: [null],
      hitos: this.fb.array([])
    }, {
      validators: [this.minimoTresHitosValidator.bind(this)]
    });
  }


  ngOnInit() {
    this.lineaService.obtenerTemas().subscribe({
      next: (data) => this.temas = data,
      error: (err) => console.error('Error al cargar temas', err)
    });

    // Si hay datos para editar, los cargamos
    if (this.lineaEditar) {
      this.lineaTiempoForm.patchValue({
        titulo: this.lineaEditar.titulo,
        idTema: this.lineaEditar.idTema,
        descripcion: this.lineaEditar.descripcion,
        url: this.lineaEditar.url,
        palabrasClave: this.lineaEditar.palabrasClave
      });
      // Portada: si existe, mostrar preview (URL absoluta o relativa según tu backend)
      if (this.lineaEditar.imagenPortada) {
        //this.previewPortada = this.lineaEditar.imagenPortada;

        // extraemos nombre del archivo original del backend
        this.nombrePortadaActual = this.extraerNombreArchivo(this.lineaEditar.imagenPortada);

        this.portadaFile = null;
      }


      if (this.lineaEditar.hitos?.length > 0) {
        this.hitos.clear();
        this.lineaEditar.hitos.forEach((h: any) => {
          const hitoForm = this.fb.group({
            idHito: [h.idHito ?? null],   // ← IMPORTANTE
            tituloHito: [h.tituloHito || '', Validators.required],
            descripcionHito: [h.descripcionHito || ''],
            anio: [h.anio || '', Validators.required],
            mes: [h.mes ?? null],
            dia: [h.dia ?? null],
            relevancia: [h.relevancia ?? null],
            imagenHito: [h.imagenHito || null],
            preview: [h.imagenHito],
            nombreImagenActual: [this.extraerNombreArchivo(h.imagenHito)],
            url: [h.url || '']
          });

          this.hitos.push(hitoForm);
          this.hitoExpansions.push(true);
        });
      }
    } else {
      // flujo normal de creación con cache
      const cached = this.cacheService.getDatosLinea();

      if (cached) {
        this.lineaTiempoForm.patchValue({
          titulo: cached.titulo || '',
          idTema: cached.idTema || null,
          descripcion: cached.descripcion || '',
          url: cached.url || '',
          palabrasClave: cached.palabrasClave || '',
        });

        if (cached.hitos && cached.hitos.length > 0) {
          this.hitos.clear();

          cached.hitos.forEach((h: any) => {
            const hitoForm = this.fb.group({
              tituloHito: [h.tituloHito || '', Validators.required],
              descripcionHito: [h.descripcionHito || ''],
              anio: [h.anio || '', Validators.required],
              mes: [h.mes ?? null],
              dia: [h.dia ?? null],
              relevancia: [h.relevancia ?? null],
              imagenHito: [h.imagenHito || null],
              preview: [h.imagenHito || ''],
              nombreImagenActual: [this.extraerNombreArchivo(h.imagenHito)],
              url: [h.url || '']
            });

            this.hitos.push(hitoForm);
            this.hitoExpansions.push(true);
          });
        }
      } else {
        if (this.hitos.length === 0) this.agregarHito();
      }

      // Aquí se normaliza TODO: si mes o dia es '' lo convierte a null
      this.lineaTiempoForm.valueChanges.subscribe(raw => {
        const normalizado = {
          ...raw,
          hitos: raw.hitos.map((h: any) => ({
            ...h,
            mes: h.mes === '' ? null : h.mes,
            dia: h.dia === '' ? null : h.dia,
            relevancia: h.relevancia === '' ? null : h.relevancia
          }))
        };

        this.cacheService.setDatosLinea(normalizado);
      });
    }
  }

  get hitos(): FormArray {
    return this.lineaTiempoForm.get('hitos') as FormArray;
  }

  mensajeLimite: string | null = null;
  agregarHito() {

    // Máximo 15 hitos
    if (this.hitos.length >= 15) {
      this.mensajeLimite = "Has alcanzado el límite máximo de 15 hitos.";
      setTimeout(() => this.mensajeLimite = null, 3000);
      return;
    }

    const hitoForm = this.fb.group({
      tituloHito: ['', Validators.required],
      descripcionHito: [''],
      anio: ['', Validators.required],
      mes: [null],
      dia: [null],
      relevancia: [null],
      imagenHito: [null],
      preview: [''],
      url: ['']
    });

    this.hitos.push(hitoForm);

    // Manejo de expansiones
    this.hitoExpansions.fill(false);
    this.hitoExpansions.push(true);
  }


  eliminarHito(index: number) {
    this.hitos.removeAt(index);
    this.hitoExpansions.splice(index, 1);

    if (this.hitos.length > 0) {
      if (!this.hitoExpansions.some(e => e === true)) {
        this.hitoExpansions[this.hitos.length - 1] = true;
      }
    }
  }

  toggleHitoExpansion(index: number, event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('button')) {
      return;
    }

    const isExpanded = this.hitoExpansions[index];

    if (isExpanded) {
      this.hitoExpansions[index] = false;
    } else {
      this.hitoExpansions.fill(false);
      this.hitoExpansions[index] = true;
    }
  }

  onPortadaSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.portadaFile = file;
    this.nombrePortadaActual = file.name;

    // generar preview del file
    const reader = new FileReader();
    reader.onload = () => this.previewPortada = reader.result;
    reader.readAsDataURL(file);

    // actualizar cache si usas cacheService
    this.cacheService.setArchivos(this.portadaFile, this.cacheService.imagenesHitos);
  }

  onFileSelected(event: any, index: number) {
    const file = event.target.files?.[0];
    if (!file) return;
    const hito = this.hitos.at(index);
    hito.patchValue({
      imagenHito: file,
      nombreImagenActual: file.name // ← NOMBRE DEL NUEVO ARCHIVO
    });

    // Guardamos el File en el FormGroup del hito para que el service lo encuentre al enviar
    this.hitos.at(index).patchValue({ imagenHito: file });

    // Generar preview para mostrar inmediatamente
    const reader = new FileReader();
    reader.onload = () => {
      this.hitos.at(index).patchValue({ preview: reader.result });
    };
    reader.readAsDataURL(file);

    // Guardamos en cacheService si lo usas (mantener consistencia)
    const currentHitos = this.cacheService.imagenesHitos;
    currentHitos[index] = file;
    this.cacheService.setArchivos(this.portadaFile, currentHitos);
  }
  extraerNombreArchivo(ruta: string | null): string | null {
    if (!ruta) return null;

    // si es dataURL
    if (ruta.startsWith('data:')) return 'imagen seleccionada';

    // si es URL normal, extraer el final
    return ruta.split('/').pop() || ruta;
  }


  onSubmit() {
    if (this.lineaTiempoForm.invalid) {
      this.mensaje = 'Por favor, completa los campos requeridos y asegúrate de que haya al menos un hito válido.';
      setTimeout(() => this.mensaje = null, 3000);
      return;
    }
    const datosLinea = this.lineaTiempoForm.value;

    if (this.lineaEditar) {
      // Preparar datos con archivos
      const datosConArchivos = { ...datosLinea, imagenPortada: this.portadaFile };

      datosConArchivos.hitos = datosLinea.hitos.map((h: any, i: number) => ({
        ...h,
        imagenHito: this.cacheService.imagenesHitos[i] || null
      }));

      this.lineaService.actualizarLinea(this.lineaEditar.idLineaTiempo, datosConArchivos).subscribe({
        next: () => {
          this.guardarEdicion.emit(datosConArchivos);
          this.cerrarModal.emit(true);
        },
        error: err => console.error(err)
      });

    }
    else {

      this.cacheService.setDatosLinea(this.lineaTiempoForm.value);

      this.cerrarModal.emit(false);
      this.abrirPlantilla.emit();
    }

  }

  @Output() cerrarModal = new EventEmitter<boolean>();

  cerrar() {
    this.cerrarModal.emit(true);
  }

  @Output() abrirPlantilla = new EventEmitter<void>();

  mostrarConfirmacion: boolean = false;

  onCancelarClick() {
    this.mostrarConfirmacion = true;
  }

  cancelarAccion() {
    this.mostrarConfirmacion = false;
  }

  confirmarCancelacion() {
    this.cacheService.clearDatosLinea();
    this.cerrarModal.emit(true);
    this.mostrarConfirmacion = false;
  }
  // Validador personalizado: requiere mínimo 3 hitos válidos
  minimoTresHitosValidator(form: FormGroup) {
    const hitos = form.get('hitos') as FormArray;
    if (!hitos) return null;

    // Contar SOLO hitos válidos que tienen tituloHito y el año 
    const hitosValidos = hitos.controls.filter(h =>
      h.get('tituloHito')?.valid && h.get('anio')?.valid
    );

    return hitosValidos.length >= 3 ? null : { minimoTresHitos: true };
  }
  /** Devuelve nombre de archivo si preview es URL; si es dataURL devuelve "imagen seleccionada" */
  getFileNameFromPreview(preview: any): string {
    if (!preview) return '';
    const str = String(preview);
    if (str.startsWith('data:')) {
      return 'imagen seleccionada';
    }
    try {
      const url = new URL(str, window.location.origin);
      // extraer última parte después de '/'
      const parts = url.pathname.split('/');
      return parts[parts.length - 1] || 'imagen';
    } catch (e) {
      // fallback
      return str.split('/').pop() || 'imagen';
    }
  }


}
