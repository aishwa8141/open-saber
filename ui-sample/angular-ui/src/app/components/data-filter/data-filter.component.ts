import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, OnDestroy } from '@angular/core';
import { of, throwError, Subscription } from 'rxjs';
import { first, mergeMap, map, tap, catchError, filter } from 'rxjs/operators';
import * as _ from 'lodash-es';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CacheService } from 'ng2-cache-service';
import { PermissionService } from 'src/app/services/permission/permission.service';
import { UserService } from 'src/app/services/user/user.service';
import { FormService } from 'src/app/services/forms/form.service';

@Component({
  selector: 'app-data-filter',
  templateUrl: './data-filter.component.html',
  styleUrls: ['./data-filter.component.scss']
})
export class DataFilterComponent implements OnInit {
  @Input() filterEnv: string;
  @Input() accordionDefaultOpen: boolean;
  @Input() isShowFilterLabel: boolean;
  @Input() hashTagId: string;
  @Input() ignoreQuery = [];
  @Input() showSearchedParam = true;
  @Input() enrichFilters: object;
  @Input() viewAllMode = false;
  @Input() pageId: string;
  @Input() frameworkName: string;
  @Input() formAction: string;
  @Output() dataDrivenFilter = new EventEmitter();

  public showFilters = false;

  public formFieldProperties: Array<any>;

  public filtersDetails: Array<any>;

  public categoryMasterList: Array<any>;

  public framework: string;
  public channelInputLabel: any;

  public formInputData: any;

  public refresh = true;

  public isShowFilterPlaceholder = true;
  telemetryCdata: Array<{}>;
  resourceDataSubscription: Subscription;

  constructor(public resourceService: ResourceService, public router: Router, public formService: FormService,
    private activatedRoute: ActivatedRoute, private cacheService: CacheService, private cdr: ChangeDetectorRef,
    public userService: UserService, public permissionService: PermissionService) {
    this.router.onSameUrlNavigation = 'reload';
  }

  ngOnInit() {
    this.formService.getFormConfig("filter").subscribe(formFieldProperties => {
      this.formFieldProperties = formFieldProperties.fields;
      this.filtersDetails = _.cloneDeep(formFieldProperties.fields);
      this.dataDrivenFilter.emit(formFieldProperties.fields);
      console.log(this.filtersDetails)

      this.subscribeToQueryParams();
    })
  }
  ngOnChanges() {
    if (this.formFieldProperties) {
      this.enrichFiltersOnInputChange();
    }
  }
  private enrichFiltersOnInputChange() {
    this.filtersDetails = _.map(this.formFieldProperties, (eachFields) => {
      const enrichField = _.cloneDeep(eachFields);
      enrichField.range = _.filter(this.enrichFilters[enrichField.code],
        (field) => {
          return _.find(eachFields.range, { name: _.get(field, 'name') });
        });
      return enrichField;
    });
    this.hardRefreshFilter();
  }
  private hardRefreshFilter() {
    this.refresh = false;
    this.cdr.detectChanges();
    this.refresh = true;
  }
  private subscribeToQueryParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.formInputData = {};
      _.forIn(params, (value, key) => this.formInputData[key] = typeof value === 'string' && key !== 'key' ? [value] : value);
      this.showFilters = true;
      this.hardRefreshFilter();
    });
  }

  public applyFilters() {
    const queryParams: any = {};
    _.forIn(this.formInputData, (eachInputs: Array<any | object>, key) => {
      const formatedValue = typeof eachInputs === 'string' ? eachInputs :
        _.compact(_.map(eachInputs, value => typeof value === 'string' ? value : _.get(value, 'identifier')));
      if (formatedValue.length) {
        queryParams[key] = formatedValue;
      }
    });
    let redirectUrl; 
    if (this.activatedRoute.snapshot.params.pageNumber) { 
      redirectUrl = this.router.url.split('?')[0].replace(/[^\/]+$/, '1');
    } else {
      redirectUrl = this.router.url.split('?')[0];
    }
    redirectUrl = decodeURI(redirectUrl);
    if (!_.isEmpty(queryParams)) {
      queryParams['appliedFilters'] = true;
      this.router.navigate([redirectUrl], { queryParams: queryParams });
    }
  }
  private setFilterInteractData() {
  }

  public removeFilterSelection(field, item) {
    const itemIndex = this.formInputData[field].indexOf(item);
    if (itemIndex !== -1) {
      this.formInputData[field].splice(itemIndex, 1);
      this.formInputData = _.pickBy(this.formInputData);
      this.hardRefreshFilter();
    }
  }

  public resetFilters() {
    this.formInputData = _.pick(this.formInputData, this.ignoreQuery);
    if (this.viewAllMode) {
      const data = this.cacheService.get('viewAllQuery');
      _.forIn(data, (value, key) => this.formInputData[key] = value);
    }
    let redirectUrl; // if pageNumber exist then go to first page every time when filter changes, else go exact path
    if (this.activatedRoute.snapshot.params.pageNumber) { // when using dataDriven filter should this should be verified
      redirectUrl = this.router.url.split('?')[0].replace(/[^\/]+$/, '1');
    } else {
      redirectUrl = this.router.url.split('?')[0];
    }
    redirectUrl = decodeURI(redirectUrl);
    this.router.navigate([redirectUrl], { relativeTo: this.activatedRoute.parent, queryParams: this.formInputData });
    this.hardRefreshFilter();
    this.setFilterInteractData();
  }
}