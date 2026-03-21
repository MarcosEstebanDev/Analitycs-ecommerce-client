import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../core/services/user.service';
import { InviteUserDialogComponent } from './invite-user-dialog.component';
import { EditUserDialogComponent } from './edit-user-dialog.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
})
export class TeamComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users: User[] = [];
  loading = false;
  currentUserId: string | null = null;

  displayedColumns = ['avatar', 'email', 'role', 'status', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  private loadCurrentUser(): void {
    this.userService.getMe().subscribe({
      next: (user) => { this.currentUserId = user.id; },
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => { this.users = users; this.loading = false; },
      error: () => { this.loading = false; this.notify('Error al cargar los usuarios', true); },
    });
  }

  openInviteDialog(): void {
    const ref = this.dialog.open(InviteUserDialogComponent, {
      width: '480px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) { this.loadUsers(); this.notify('Usuario invitado correctamente'); }
    });
  }

  openEditDialog(user: User): void {
    const ref = this.dialog.open(EditUserDialogComponent, {
      width: '480px',
      disableClose: true,
      data: { user },
    });
    ref.afterClosed().subscribe((updated: boolean) => {
      if (updated) { this.loadUsers(); this.notify('Usuario actualizado'); }
    });
  }

  confirmDelete(user: User): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '420px',
      data: { user },
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.userService.deleteUser(user.id).subscribe({
        next: () => { this.loadUsers(); this.notify('Usuario eliminado'); },
        error: () => this.notify('Error al eliminar el usuario', true),
      });
    });
  }

  getInitials(user: User): string {
    const f = (user.firstName ?? '').charAt(0).toUpperCase();
    const l = (user.lastName ?? '').charAt(0).toUpperCase();
    if (f || l) return `${f}${l}`;
    return user.email.charAt(0).toUpperCase();
  }

  isOwnAccount(user: User): boolean {
    return user.id === this.currentUserId;
  }

  private notify(msg: string, error = false): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: error ? ['snack-error'] : ['snack-success'],
    });
  }
}
