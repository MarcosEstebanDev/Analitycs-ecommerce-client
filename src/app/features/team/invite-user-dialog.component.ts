import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-invite-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Invitar usuario</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email"/>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre (opcional)</mat-label>
          <input matInput formControlName="firstName"/>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Apellido (opcional)</mat-label>
          <input matInput formControlName="lastName"/>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Contrasena temporal</mat-label>
          <input matInput formControlName="password" type="password"/>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role">
            <mat-option value="viewer">Viewer</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
        @if (error) { <p class="error-text">{{ error }}</p> }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
        @if (saving) { <mat-progress-spinner mode="indeterminate" diameter="18"/> } @else { Invitar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display:flex; flex-direction:column; gap:8px; padding-top:8px; } .full { width:100%; } .error-text { color:#dc2626; font-size:13px; margin:4px 0 0; }`],
})
export class InviteUserDialogComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private ref = inject(MatDialogRef);

  saving = false;
  error = '';

  form = this.fb.group({
    email:     ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName:  [''],
    password:  ['', [Validators.required, Validators.minLength(6)]],
    role:      ['viewer', Validators.required],
  });

  submit() {
    this.saving = true; this.error = '';
    this.http.post(`${environment.apiUrl}/users`, this.form.value).subscribe({
      next: () => { this.saving = false; this.ref.close(true); },
      error: (err) => { this.saving = false; this.error = err?.error?.message ?? 'Error al crear usuario'; },
    });
  }
}
