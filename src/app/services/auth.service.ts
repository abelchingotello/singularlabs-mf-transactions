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
import { HttpClient, HttpParams } from '@angular/common/http';
import jwtDecode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly url = `${environment.URL_API_GATEWAY}`;
  private userId: string = '';
  private user: any;
  private roles: any[] = [];
  public permissions: any = [];
  public allPermission: Map<string, any> = new Map();
  private lastRolId!: string
  constructor(
    private readonly httpClient: HttpClient,
    private readonly cookieService: CookieService,
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
  getRole(): any {
    const role = this.cookieService.get('role');
    return JSON.parse(role) || this.roles[0];
  }

  hasPermissionFromTag(tag: string) {
    const permiso = this.permissions[tag]
    return permiso === true
  }

  async getAllPermissions() {
    let params = new HttpParams().set('group', '5');
    const items = await firstValueFrom(this.httpClient.get<any>(`${this.url}/master/group`, { params: params }))
    items.forEach((permiso: any) => {
      this.allPermission.set(permiso.SK, permiso);
    });
  }

  async getPermissions() {
    let { role_id } = this.getRole()
    await this.getAllPermissions()
    this.lastRolId = role_id
    role_id = role_id.split("#")[1]
    const { items } = await firstValueFrom(this.httpClient.get<any>(`${this.url}/roles/${role_id}`));
    let permissions: any = {}
    items.map((item: any) => {
      const permission = this.allPermission.get(item.process_permissionId);
      if (item.process_permissionId != "PERMISO#0" && permission?.master_tag) {
        permissions[permission.master_tag] = true
      }
    });

    this.permissions = { ...permissions }
  }
}
