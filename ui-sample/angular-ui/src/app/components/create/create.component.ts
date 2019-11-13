import { Component, OnInit, ViewChild } from '@angular/core';
import { ResourceService } from '../../services/resource/resource.service';
import { FormService } from '../../services/forms/form.service'
import { DefaultTemplateComponent } from '../default-template/default-template.component';
import urlConfig from '../../services/urlConfig.json';
import { DataService } from '../../services/data/data.service';
import { Router, ActivatedRoute } from '@angular/router'
import { UserService } from 'src/app/services/user/user.service';
import { CacheService } from 'ng2-cache-service';
import appConfig from '../../services/app.config.json';


@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {

  @ViewChild('formData') formData: DefaultTemplateComponent;

  resourceService: ResourceService;
  formService: FormService;
  public formFieldProperties: any;
  dataService: DataService;
  router: Router;

  constructor(resourceService: ResourceService, formService: FormService, dataService: DataService, route: Router, public userService: UserService, private cacheService: CacheService) {
    this.resourceService = resourceService;
    this.formService = formService;
    this.dataService = dataService;
    this.router = route;
  }

  ngOnInit() {
    this.formService.getFormConfig("person").subscribe(res => {
      this.formFieldProperties = res.fields;
    })
  }

  validate() {
    if (!!this.formData) {
      console.log("please fill the form");
    } else {
      this.createUser();
    }
  }

  createUser() {

    const requestData = {
      data: {
        id: "open-saber.registry.create",
        request: {
          Employee: this.formData.formInputData
        }
      },
      url: urlConfig.URLS.ADD
    };
    console.log("request data :", requestData)
    this.dataService.post(requestData).subscribe(response => {
      this.navigateToProfilePage(response.result.Employee.osid);
    }, err => {
      console.log("error", err);
    });
  }

  registerNewUser() {
    let token;
    if (this.cacheService.get(appConfig.cacheServiceConfig.cacheVariables.UserToken)) {
      token = this.cacheService.get(appConfig.cacheServiceConfig.cacheVariables.UserToken);
    } else {
      token = this.userService.getUserToken
    }
    const request = {
      data: {
        username: "",
        enabled: true,
        emailVerified: false,
        firstName: this.formData.formInputData['name'],
        email: this.formData.formInputData['email'],
        clientRoles: {
          portal: ["owner"]
        },
        requiredActions: [
          "UPDATE_PASSWORD"
        ]
      },
      header: {
        Authorization: token
      },
      url: urlConfig.URLS.REGISTER
    }
    this.dataService.postKeyCloak(request).then(res =>{
      console.log(res)
    })
  }

  navigateToProfilePage(id: String) {
    this.router.navigate(['/profile', id])
  }
}
