import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/home').then((m) => m.HomeComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('@features/settings').then((m) => m.SettingsComponent),
  },
  {
    path: 'add/:type',
    loadComponent: () => import('@features/add-entry').then((m) => m.AddEntryComponent),
  },
  { path: '**', redirectTo: '' },
];
