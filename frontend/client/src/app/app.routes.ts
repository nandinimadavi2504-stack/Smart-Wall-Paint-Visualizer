import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';

import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UploadImageComponent } from './features/upload-image/upload-image.component';
import { PaintWorkspaceComponent } from './features/paint-workspace/paint-workspace.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,

    children: [
      {
        path: '',
        component: HomeComponent,
      },

      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
      },

      {
        path: 'upload-image',
        component: UploadImageComponent,
        canActivate: [authGuard],
      },

      {
        path: 'paint-workspace',
        component: PaintWorkspaceComponent,
        canActivate: [authGuard],
      },
    ],
  },

  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: 'register',
    component: RegisterComponent,
  },

  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },

  {
    path: '**',
    redirectTo: '',
  },
];
