import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserService } from '../user/user.service';
import roleConfig from '../rolesConfig.json';
import * as _ from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  /**
   * main roles with action
   */
  private mainRoles: Array<string> = [];
  /**
   * all user role
   */
  private userRoles: Array<string> = [];
  /**
   * flag to store permission availability
   */
  permissionAvailable = false;

  public permissionAvailable$ = new BehaviorSubject<string>(undefined);

  /**
   * reference of UserService service.
   */
  public userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }
  public initialize() {
    this.getPermissionsData();
  }
  /**
   * method to fetch roles.
   */
  private getPermissionsData(): void {
    this.setRolesAndPermissions(roleConfig.AvailableRoles);
  }
  /**
   * method to process roles 
   * @param {Array<Roles>} data 
   */
  private setRolesAndPermissions(roles: Array<string>): void {
    _.forEach(roles, (role) => {
      this.mainRoles.push(role);
    });
    this.setCurrentRoleActions();
  }
  /**
   * method to process logged in user roles
   * @param {ServerResponse} data 
   */
  private setCurrentRoleActions(): void {
    this.userRoles = this.userService.getUserRoles;
    if (this.userRoles != undefined && this.userRoles.length > 0) {
      this.permissionAvailable$.next('success');
      this.permissionAvailable = true;
    }
    else {
      this.permissionAvailable$.next('error');
    }

  }
  /**
   * method to validate permission
   * @param {Array<string>}  roles roles to validate.
   */
  public checkRolesPermissions(roles: Array<string>): boolean {
    if ((_.intersection(roles, this.userRoles).length)) {
      return true;
    }
    return false;
  }

  get allRoles(): Array<string> {
    return this.mainRoles;
  }
  getAdminAuthRoles() {
    const authRoles = _.find(roleConfig.ADMINAUTHGARDROLES, (role, key) => {
      if (this.checkRolesPermissions(role.roles)) {
        return role;
      }
    });
    return authRoles;
  }
}
