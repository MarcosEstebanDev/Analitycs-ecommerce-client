import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPw = group.get('newPassword')?.value;
  const confirmPw = group.get('confirmNewPassword')?.value;
  return newPw === confirmPw ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  notificationsForm!: FormGroup;
  thresholdsForm!: FormGroup;

  loadingProfile = true;
  savingProfile = false;
  savingPassword = false;
  savingNotifications = false;
  savingThresholds = false;

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );

    this.notificationsForm = this.fb.group({
      webhookUrl: [''],
      slackUrl: [''],
      emailNotifications: [false],
    });

    this.thresholdsForm = this.fb.group({
      revenueDropThreshold: [20],
      ordersDropThreshold: [15],
      aovDeviationThreshold: [10],
    });
  }

  private loadData(): void {
    this.loadingProfile = true;
    this.userService.getMe().subscribe({
      next: (user) => {
        this.profileForm.patchValue({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
        });
        this.loadingProfile = false;
      },
      error: () => {
        this.loadingProfile = false;
        this.notify('Error al cargar el perfil', true);
      },
    });

    this.userService.getTenantSettings().subscribe({
      next: ({ settings }) => {
        this.notificationsForm.patchValue({
          webhookUrl: (settings['webhookUrl'] as string) ?? '',
          slackUrl: (settings['slackUrl'] as string) ?? '',
          emailNotifications: (settings['emailNotifications'] as boolean) ?? false,
        });
        this.thresholdsForm.patchValue({
          revenueDropThreshold: (settings['revenueDropThreshold'] as number) ?? 20,
          ordersDropThreshold: (settings['ordersDropThreshold'] as number) ?? 15,
          aovDeviationThreshold: (settings['aovDeviationThreshold'] as number) ?? 10,
        });
      },
      error: () => { /* tenant settings are optional */ },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    this.userService.updateMe(this.profileForm.value as { firstName: string; lastName: string }).subscribe({
      next: () => { this.savingProfile = false; this.notify('Perfil actualizado'); },
      error: () => { this.savingProfile = false; this.notify('Error al actualizar el perfil', true); },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.value as {
      currentPassword: string;
      newPassword: string;
    };
    this.savingPassword = true;
    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.notify('Contraseña actualizada');
      },
      error: () => { this.savingPassword = false; this.notify('Error al cambiar la contraseña', true); },
    });
  }

  saveNotifications(): void {
    this.savingNotifications = true;
    this.userService.updateTenantSettings(
      this.notificationsForm.value as Record<string, unknown>
    ).subscribe({
      next: () => { this.savingNotifications = false; this.notify('Notificaciones guardadas'); },
      error: () => { this.savingNotifications = false; this.notify('Error al guardar', true); },
    });
  }

  saveThresholds(): void {
    this.savingThresholds = true;
    this.userService.updateTenantSettings(
      this.thresholdsForm.value as Record<string, unknown>
    ).subscribe({
      next: () => { this.savingThresholds = false; this.notify('Umbrales guardados'); },
      error: () => { this.savingThresholds = false; this.notify('Error al guardar', true); },
    });
  }

  private notify(msg: string, error = false): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: error ? ['snack-error'] : ['snack-success'],
    });
  }
}
