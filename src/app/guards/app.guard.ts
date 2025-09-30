import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppGuard implements CanActivate {
  
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}


  async canActivate(
      route: ActivatedRouteSnapshot,
      state: RouterStateSnapshot): Promise<boolean> {
      const isAuth = await this.authService.isAuth();
      if (!isAuth) {
        this.router.navigate(['/sign-in'])
        return false;
      }
      return true;
    }

  
}
