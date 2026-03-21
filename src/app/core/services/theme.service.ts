import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const THEME_KEY = 'app_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private isDark$ = new BehaviorSubject<boolean>(false);

  readonly isDark = this.isDark$.asObservable();

  constructor(factory: RendererFactory2) {
    this.renderer = factory.createRenderer(null, null);
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.apply(saved === 'dark' || (saved === null && prefersDark));
  }

  toggle() {
    this.apply(!this.isDark$.value);
  }

  setDark(dark: boolean) {
    this.apply(dark);
  }

  get currentTheme(): 'dark' | 'light' {
    return this.isDark$.value ? 'dark' : 'light';
  }

  private apply(dark: boolean) {
    this.isDark$.next(dark);
    if (dark) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }
}
