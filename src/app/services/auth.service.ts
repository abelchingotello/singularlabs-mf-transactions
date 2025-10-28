/**
 * File: auth.service.ts
 * Description: Servicio Angular para autenticación y gestión de usuarios.
 *              Funcionalidades:
 *                - Validar sesión con API Gateway.
 *                - Obtener y decodificar token JWT.
 * 
 * Maintenance:
 *  - Last modified: 21-Oct-2025
 */

import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import jwtDecode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly url = `${environment.URL_API_GATEWAY}`;
  private userId: string = '';
  private user: any;
  private roles: any[] = [];

  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  //Verificar si el usuario esta logeado en api gateway
  async isAuth(): Promise<boolean> {
    const credentials = {
      auth: 'validateSession'
    }
    try {
      const res: any = await firstValueFrom(this.httpClient.post<any>(`${this.url}/oauth`, credentials));
      this.decodeToken()
      return res.validSession;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }

  //ALTERNATIVA DE OBTENER TOKEN
  getToken(): string {
    // Buscamos el key que tenga el accessToken, y retornamos el token
    const defaultValue: string = 'ERROR'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Verificamos que key no sea null
      if (key?.endsWith('accessToken')) {
        return localStorage.getItem(key) || defaultValue;
      }
    }
    return defaultValue;
  }

  //Decodificación del access token para obtener el identificador del usuario
  decodeToken() {
    const token = this.getToken();
    const decoded: any = jwtDecode(token);
    this.userId = decoded.sub
    if (!this.userId) { console.error('Identicadr de usuario no encontrado'); };
  }
}
