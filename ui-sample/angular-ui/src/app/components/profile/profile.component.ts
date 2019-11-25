import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data/data.service';
import { ResourceService } from '../../services/resource/resource.service';
import { ActivatedRoute, Router } from '@angular/router'
import appConfig from '../../services/app.config.json'
import { DomSanitizer } from '@angular/platform-browser'
import { CacheService } from 'ng2-cache-service';
import { UserService } from '../../services/user/user.service';
import _ from 'lodash-es';
import { PermissionService } from 'src/app/services/permission/permission.service';
import { DefaultTemplateComponent } from '../default-template/default-template.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('formData') formData: DefaultTemplateComponent;

  dataService: DataService;
  resourceService: ResourceService;
  router: Router;
  activatedRoute: ActivatedRoute;
  userId: String;
  userProfile: any = {};
  downloadJsonHref: any;
  userService: UserService;
  public formFieldProperties: any;
  public showLoader = false;
  public viewOwnerProfile: string;
  adminConsoleRole: Array<string>;
  public permissionService: PermissionService;


  constructor(dataService: DataService, resourceService: ResourceService, activatedRoute: ActivatedRoute, private sanitizer: DomSanitizer, router: Router, userService: UserService, public cacheService: CacheService,
    permissionService: PermissionService) {
    this.dataService = dataService
    this.resourceService = resourceService;
    this.router = router
    this.activatedRoute = activatedRoute;
    this.userService = userService;
    this.permissionService = permissionService;
  }

  ngOnInit() {
    this.adminConsoleRole = appConfig.rolesMapping.adminPageViewRole;
    this.activatedRoute.params.subscribe((params) => {
      console.log("role", params)
      this.userId = params.userId;
      this.viewOwnerProfile = params.role
    });
    this.getUserDetails();
  }

  getFormTemplate() {
    let token = this.cacheService.get(appConfig.cacheServiceConfig.cacheVariables.UserToken);
    if (_.isEmpty(token)) {
      token = this.userService.getUserToken;
    }
    const requestData = {
      url: appConfig.URLS.FORM_TEPLATE,
      header: {
        userToken: token,
        role: this.viewOwnerProfile
      }
    }
    this.dataService.get(requestData).subscribe(res => {
      if (res.responseCode === 'OK') {
        this.formFieldProperties = res.result.formTemplate.data.fields;
        if (this.userProfile.isActive === true) {
          this.disableEditMode()
        } else if (this.userProfile.isActive === false) {
          this.enableApprove();
        }
      }
    });
  }

  disableEditMode() {
    _.map(this.formFieldProperties, field => {
      if (field.hasOwnProperty('editable')) {
        field['editable'] = false;
        field['required'] = false;
      }
    });
    this.showLoader = false;
  }

  enableApprove() {
    _.map(this.formFieldProperties, field => {
      if (field.code !='isActive' && field.hasOwnProperty('editable')) {
        field['editable'] = false;
        field['required'] = false;
      }
    });
    this.showLoader = false;
  }

  approve() {
    this.updateInfo();
  }


  updateInfo() {
    this.formData.formInputData['osid'] = this.userId;
    const requestData = {
      data: {
        "id": "open-saber.registry.update",
        "request": {
          "Employee": this.formData.formInputData
        }
      },
      url: appConfig.URLS.UPDATE
    };
    this.dataService.post(requestData).subscribe(response => {
      console.log(response)
      if (response.responseCode == 'OK') {
        this.userProfile = {}
        this.navigateToProfilePage();
      }
    }, err => {
    });
  }
  navigateToProfilePage() {
    this.ngOnInit();
  }



  getUserDetails() {
    let token = this.cacheService.get(appConfig.cacheServiceConfig.cacheVariables.UserToken);
    if (_.isEmpty(token)) {
      token = this.userService.getUserToken;
    }
    const requestData = {
      header: {
        userToken: token,
        role: this.viewOwnerProfile
      },
      data: {
        "id": "open-saber.registry.read",
        'request': {
          "Employee": {
            "osid": this.userId
          },
          "includeSignatures": true
        }
      },
      url: appConfig.URLS.READ,
    }
    this.dataService.post(requestData).subscribe(response => {
      if(response.responseCode == 'OK') {
        this.getFormTemplate();
        this.userProfile = response.result.Employee;
      }
    });
  }
  dowloadJson() {
    var theJSON = JSON.stringify(this.userProfile);
    var uri = this.sanitizer.bypassSecurityTrustUrl("data:text/json;charset=UTF-8," + encodeURIComponent(theJSON));
    this.downloadJsonHref = uri;
  }
  navigateToEditPage() {
    if(this.viewOwnerProfile)
    this.router.navigate(['/edit', this.userId, this.viewOwnerProfile])
    else
    this.router.navigate(['/edit', this.userId])

  }
}

