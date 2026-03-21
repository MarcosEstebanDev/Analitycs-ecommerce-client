import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Editar usuario</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="firstName"/>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Apellido</mat-label>
          <input matInput formControlName="lastName"/>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role">
            <mat-option value="viewer">Viewer</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-slide-toggle formControlName="isActive" color="primary">Usuario activo</mat-slide-toggle>
        @if (error) { <p class="error-text">{{ error }}</p> }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="saving">
        @if (saving) { <mat-progress-spinner mode="indeterminate" diameter="18"/> } @else { Guardar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display:flex; flex-direction:column; gap:12px; padding-top:8px; } .full { width:100%; } .error-text { color:#dc2626; font-size:13px; margin:0; }`],
})
export class EditUserDialogComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private ref = inject(MatDialogRef);

  saving = false;
  error = '';

  form = this.fb.group({
    firstName: [this.data.firstName ?? ''],
    lastName:  [this.data.lastName ?? ''],
    role:      [this.data.role],
    isActive:  [this.data.isActive],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  submit() {
    this.saving = true; this.error = '';
    this.http.put(`${environment.apiUrl}/users/${this.data.id}`, this.form.value).subscribe({
      next: () => { this.saving = false; this.ref.close(true); },
      error: (err) => { this.saving = false; this.error = err?.error?.message ?? 'Error al actualizar'; },
    });
  }
}
