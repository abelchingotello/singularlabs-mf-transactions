import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import jwtDecode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly url = `${environment.URL_API_GATEWAY}`;
  private userId: string = '';
  private user: any;
  private roles: any[] = [];

  private readonly permissionsSubject = new BehaviorSubject<any>({});
  permissions$ = this.permissionsSubject.asObservable();
  public permissions: any = {}; public allPermission: Map<string, any> = new Map();
  private lastRolId: string = "";
  constructor(
    private readonly httpClient: HttpClient,
    private readonly cookieService: CookieService
  ) {
    window.addEventListener('roleChanged', async (event: any) => {
      const role = event.detail;

      if (role?.role_id !== this.lastRolId) {
        await this.getPermissions();
      }
    });
  }

  //Verificar si el usuario esta logeado en api gateway
  async isAuth(): Promise<boolean> {
    let credentials = {
      auth: 'validateSession'
    }
    try {
      const res: any = await this.httpClient.post<any>(`${this.url}/oauth`, credentials).toPromise();
      this.decodeToken()
      return res.validSession;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }

  // getToken(): string {
  //   //Buscamos el key que tenga el accessToken, y retornamos el token
  //   for (let i = 0; i < localStorage.length; i++) {


  //       if (localStorage.key(i).endsWith('accessToken')) {
  //         return localStorage.getItem(localStorage.key(i));
  //       }

  //   }
  //   return null;
  // }

  //ALTERNATIVA DE OBTENER TOKEN
  getToken(): string {
    // console.log("INGRESO PARA VALIDAR TOKEN")
    // Buscamos el key que tenga el accessToken, y retornamos el token
    const defaultValue: string = 'ERROR'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Verificamos que key no sea null
      if (key && key.endsWith('accessToken')) {
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
    if (!this.userId) console.error('Identicadr de usuario no encontrado');
  }

  getUser() {
    return this.user;
  }

  getUserId() {
    return this.userId;
  }

  getRoles() {
    return this.roles;
  }

  getRole(): any {
    const role = this.cookieService.get('role');
    return JSON.parse(role) || this.roles[0];
  }

  updateRole(role: any) {
    this.cookieService.set('role', JSON.stringify(role), { expires: 7, path: '/' });
    const event = new CustomEvent('roleChanged', { detail: role });
    window.dispatchEvent(event);
  }

  async hasPermission(permission: string): Promise<boolean> {
    try {
      // Obtener el rol y el userId de las cookies
      const roleId = encodeURIComponent(JSON.parse(this.cookieService.get('role'))?.role_id);
      const userId = this.cookieService.get('userId');

      // Realizar la consulta al backend
      const consult = await firstValueFrom(this.httpClient.get<any>(`${this.url}/users/${userId}/roles/${roleId}/permissions/${encodeURIComponent(permission)}`));
      // Verificar si el usuario tiene el permiso
      return consult?.hasPermission === true;
    } catch (error) {
      console.error('Error al consultar el permiso:', error);
      return false; // Devolver false si ocurre un error
    }
  }

  setCookie(name: string, value: string) {
    this.cookieService.set(name, value, { expires: 7, path: '/' });
  }

  async getUserData(): Promise<void> {

    // Decodificar el token para obtener el userId
    this.decodeToken();

    // Verificar si el userId está presente
    if (!this.userId) {
      return Promise.reject('No se encontró el ID del usuario');
    }

    try {
      const data = await firstValueFrom(this.httpClient.get<any>(`${this.url}/oauth/${this.userId}`));
      // Asignar los datos del usuario y roles
      this.user = data;
      this.roles = data.user_roles || [];
    } catch (err) {
      // Manejo de errores en la consulta HTTP
      console.error('Error al obtener datos del usuario tranas:', err);
      return Promise.reject(err);
    }
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
    let { role_id } = this.getRole();
    if (role_id === this.lastRolId) return;
    await this.getAllPermissions()
    role_id = role_id.split("#")[1]
    const { items } = await firstValueFrom(this.httpClient.get<any>(`${this.url}/roles/${role_id}`));
    let permissions: any = {}
    items.map((item: any) => {
      const permission = this.allPermission.get(item.process_permissionId);
      if (item.process_permissionId != "PERMISO#0" && permission?.master_tag) {
        permissions[permission.master_tag] = true
      }
    });

    this.permissions = { ...permissions };
    this.permissionsSubject.next(this.permissions);
    this.lastRolId = role_id
  }

  getDataIdUSer(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.url}/oauth/${id}`);
  }
}
