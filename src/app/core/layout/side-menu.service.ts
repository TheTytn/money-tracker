import { Injectable, signal } from '@angular/core';

/** Open state of the app's side menu. */
@Injectable({ providedIn: 'root' })
export class SideMenuService {
  private readonly openState = signal(false);

  readonly isOpen = this.openState.asReadonly();

  open(): void {
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }
}
