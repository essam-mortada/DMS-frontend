// dashboard-redirect.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  standalone: true,
  template: ''
})
export class DashboardRedirect {
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
