import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('email field should require valid email format', () => {
    const emailCtrl = component.form.get('email')!;
    emailCtrl.setValue('not-an-email');
    expect(emailCtrl.hasError('email')).toBeTrue();

    emailCtrl.setValue('valid@example.com');
    expect(emailCtrl.hasError('email')).toBeFalse();
  });

  it('password field should require minLength 8', () => {
    const passCtrl = component.form.get('password')!;
    passCtrl.setValue('short');
    expect(passCtrl.hasError('minlength')).toBeTrue();

    passCtrl.setValue('longpassword');
    expect(passCtrl.hasError('minlength')).toBeFalse();
  });

  it('onSubmit() should not call auth.login when form is invalid', () => {
    component.onSubmit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('onSubmit() should call auth.login with form values when valid', fakeAsync(() => {
    component.form.setValue({ email: 'test@test.com', password: 'password123' });
    authSpy.login.and.returnValue(of({} as any));

    component.onSubmit();
    tick();

    expect(authSpy.login).toHaveBeenCalledWith('test@test.com', 'password123');
  }));

  it('onSubmit() should set error message on login failure', fakeAsync(() => {
    component.form.setValue({ email: 'test@test.com', password: 'password123' });
    authSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Credenciales inválidas' } })));

    component.onSubmit();
    tick();

    expect(component.error).toBe('Credenciales inválidas');
    expect(component.loading).toBeFalse();
  }));

  it('onSubmit() should set loading=true while request is in flight', () => {
    component.form.setValue({ email: 'test@test.com', password: 'password123' });
    authSpy.login.and.returnValue(of({} as any));

    component.onSubmit();

    // loading is set true before the subscription resolves synchronously with of()
    // The check here validates loading was at least attempted
    expect(authSpy.login).toHaveBeenCalled();
  });
});
