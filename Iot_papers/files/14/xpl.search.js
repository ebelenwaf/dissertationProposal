!function(){"use strict";angular.module("templates.xpl.search",[]),angular.module("xpl.search",["xpl","templates.xpl.search"]).config(["$httpProvider","$locationProvider","tealiumPrvdrProvider",function($httpProvider,$locationProvider,tealiumPrvdrProvider){$locationProvider.html5Mode(!0).hashPrefix("!"),$httpProvider.defaults.cache=!1,$httpProvider.defaults.headers.get||($httpProvider.defaults.headers.get={}),$httpProvider.defaults.headers.get["If-Modified-Since"]="0"}]).run(["$rootScope","netInsightsService","tealiumService","tealiumPrvdr","tealiumDataPrvdr",function($rootScope,netInsightsService,tealiumService,tealiumPrvdr,tealiumDataPrvdr){$rootScope.$on("$stateChangeStart",function(event,toState,toParams,fromState,fromParams,options){$rootScope.stateIsLoading=!0,netInsightsService.retract()}),$rootScope.$on("$stateChangeSuccess",function(event,toState,toParams,fromState,fromParams){$rootScope.stateIsLoading=!1,netInsightsService.inject()})}])}(),function(){"use strict";angular.module("xpl.search").constant("searchConstants",{facets:{query:"queryText",refinements:"refinements",range:"ranges",sort:"sortType",combineQuery:"combineQuery",matchBoolean:"matchBoolean",page:"pageNumber",rowsPerPage:"rowsPerPage",within:"searchWithin",openAccess:"openAccess",subscribed:"subscribed",fileCabinet:"fileCabinet",newsearch:"newsearch",punumber:"punumber",searchField:"searchField",promo:"promo",history:"history",selectedValue:"selectedValue",selectActive:"showActiveTitlesOnly"},searchFieldKey:"key",defaultResultsLayout:"title-citation"})}(),function(){"use strict";function searchRoutes($stateProvider,$urlRouterProvider,queryConstants){function decodeURIRule($injector,$location){$location.url().toString().indexOf("history=no")>0&&$location.replace().url(_decodePathExcludingCombineQuery($location.url()))}function searchResultsRoute(){return{onEnter:function(){document.title="IEEE Xplore Search Results"},params:PARAMETERS,url:"/searchresult.jsp"+APPEND_ROUTE_URL,template:"<xpl-cmpt-search-results></xpl-cmpt-search-results>"}}var APPEND_ROUTE_URL=queryConstants.appendRouteUrl(),PARAMETERS=queryConstants.parameters();$urlRouterProvider.rule(decodeURIRule),$stateProvider.state("results",searchResultsRoute())}function _slicePath4qp(_path,_qp){var _ret={},_indexOfQM=null,_urlOfPath=null,_queryStrOfPath=null,_qsWithoutQp=null,_qsWithQp=null,_pathContainsQp=!1;return _.isUndefined(_path)||_.isEmpty(_path)?_ret={errorInParsing:!0}:(_indexOfQM=_path.indexOf("?"),_indexOfQM>=0?(_urlOfPath=_.words(_path,/[^?]+/g)[0],_queryStrOfPath=_path.substring(_indexOfQM+1),!_.isUndefined(_queryStrOfPath)&&!_.isEmpty(_queryStrOfPath)&&!_.isEmpty(_qp)&&_queryStrOfPath.indexOf(_qp)>=0?(_qsWithoutQp=_.filter(_.words(_queryStrOfPath,/[^&]+/g),function(qse){return!_.includes(qse,_qp)}).join("&"),_qsWithQp=_.filter(_.words(_queryStrOfPath,/[^&]+/g),function(qse){return _.includes(qse,_qp)}).join("&"),_pathContainsQp=!0):_qsWithoutQp=_queryStrOfPath):_urlOfPath=_path,_ret={errorInParsing:!1,pathContainsQp:_pathContainsQp,urlOfPath:_urlOfPath,qsWithoutQp:_qsWithoutQp,qsWithQp:_qsWithQp}),_ret}function _decodePathExcludingCombineQuery(_path){var _pathDec=null,_CQ="combineQuery",_slicedPath=_slicePath4qp(_path,_CQ);return!_slicedPath.errorInParsing&&_slicedPath.pathContainsQp?(_pathDec=decodeURIComponent(_slicedPath.qsWithoutQp),_pathDec=_slicedPath.urlOfPath.concat("?",_pathDec,"&",_slicedPath.qsWithQp)):_pathDec=decodeURIComponent(_path),_pathDec}angular.module("xpl.search").config(searchRoutes),searchRoutes.$inject=["$stateProvider","$urlRouterProvider","queryConstants"]}(),function(){"use strict";function searchService($http,userService,api,breadcrumbService,facetService,utilService,tealiumService,$stateParams){function getQueryResult(query){return $http.post(api.search,sanitizeQuery(query)).success(getQueryResultSuccess).error(getQueryResultFailure)}function getBreadcrumbs(subtype){if(searchService.queryResult.breadCrumbs){if(!subtype)return searchService.queryResult.breadCrumbs;var breadCrumbs=_.filter(searchService.queryResult.breadCrumbs,{type:subtype});return breadCrumbs.length?(_.forEach(breadCrumbs[0].children,function(bc){bc.reference=utilService.brackets2customHtmlEntity(bc.reference),bc.value=utilService.brackets2customHtmlEntity(bc.value)}),breadCrumbs[0].children):void 0}}function getQueryResultSuccess(data){searchService.selected=[],searchService.queryResult=data,searchService.searchBreadcrumb=getBreadcrumbs("search"),userService.setUser(data.userInfo),breadcrumbService.breadcrumbs=data.breadCrumbs,setBreadCrumbRefinementsToStateParams(data.breadCrumbs),facetService.facets=data.facets}function getQueryResultFailure(error){}function setBreadCrumbRefinementsToStateParams(crumbs){crumbs&&_.forEach(crumbs,function(value){"refinement"===value.type&&_.forEach(value.children,function(obj){push("refinements",new Array(obj.value))})})}function push(facet,value){return $stateParams[facet]&&$stateParams[facet].constructor===Array?$stateParams[facet]=_.union($stateParams[facet],value):$stateParams[facet]=value,this}function sanitizeQuery(query){return _.isUndefined(query.refinements)||(query.refinements=_.words(query.refinements)),query}function removeFacet(value){return facetService.removeFacet(value)}function removeBreadcrumb(value){return breadcrumbService.removeBreadcrumb(value)}function setAlert(name){var uri="/rest/search/alert/?label="+encodeURIComponent(name);return $http.get(uri)}var searchService={queryResult:void 0,selected:[],getBreadcrumbs:getBreadcrumbs,getQueryResult:getQueryResult,searchBreadcrumb:void 0,removeBreadcrumb:removeBreadcrumb,removeFacet:removeFacet,setAlert:setAlert};return searchService}angular.module("xpl.search").factory("searchService",searchService),searchService.$inject=["$http","userService","api","breadcrumbService","facetService","utilService","tealiumService","$stateParams"]}(),function(){"use strict";function searchState($stateParams,$state,searchConstants,searchService){function clear(facet){return $stateParams[facet]&&delete $stateParams[facet],this}function clearAll(){return _.forEach($facets,function(facet){clear(facet)}),this}function go(to,params,options){$state.go(to,params,options)}function page(value){$stateParams[$facets.page]=value,$state.go($state.$current,$stateParams)}function pop(facet,value){return $stateParams[facet].constructor===Array?$stateParams[facet]=_.difference($stateParams[facet],[value]):clear(facet),this}function push(facet,value){return $stateParams[facet]&&$stateParams[facet].constructor===Array?$stateParams[facet]=_.union($stateParams[facet],value):$stateParams[facet]=value,this}function sort(_currentSort){_currentSort.isDefault?$stateParams[$facets.sort]=void 0:$stateParams[$facets.sort]=_currentSort.value,update()}function update(){clear($facets.page),clear($facets.newsearch),$state.go($state.$current,$stateParams)}function refresh(){$state.go($state.$current,$stateParams)}var $facets=searchConstants.facets,$properties=searchConstants.properties,$rows=searchConstants.rows,$sortBy=searchConstants.sortBy,$showTypes=searchConstants.showTypes,$defaultShowTypeArrayIndex=searchConstants.defaultShowTypeArrayIndex,$subscribedShowTypeArrayIndex=searchConstants.subscribedShowTypeArrayIndex,$searchFieldKey=searchConstants.searchFieldKey,$defaultResultsLayout=searchConstants.defaultResultsLayout,$defaultRows2renderInitially=searchConstants.defaultRows2renderInitially,searchState={$facets:$facets,$properties:$properties,$rows:$rows,$sortBy:$sortBy,$showTypes:$showTypes,$defaultShowTypeArrayIndex:$defaultShowTypeArrayIndex,$subscribedShowTypeArrayIndex:$subscribedShowTypeArrayIndex,$defaultResultsLayout:$defaultResultsLayout,$defaultRows2renderInitially:$defaultRows2renderInitially,$params:$stateParams,$searchFieldKey:$searchFieldKey,clear:clear,clearAll:clearAll,go:go,page:page,pop:pop,push:push,sort:sort,update:update,refresh:refresh};return searchState}angular.module("xpl.search").service("searchState",searchState),searchState.$inject=["$stateParams","$state","searchConstants","searchService"]}(),function(){"use strict";function xplResult(searchService){function link(scope){function pdfPopup(url,name){var width=650,height=400,left=screen.width/2-width/2,top=screen.height/2-height/2;return window.open(url,name,"location=no,toolbar=no,directories=no,status=no, menubar=no,scrollbars=yes,resizable=yes,top="+top+"px,left="+left+"px,width="+width+"px,height="+height+"px"),!1}function isSelected(){return _.indexOf(scope.selectedItems,scope.record.articleNumber)>-1}function toggleSelect(){isSelected()?scope.selectedItems=_.without(scope.selectedItems,scope.record.articleNumber):scope.selectedItems.push(scope.record.articleNumber)}scope.queryString="",location.search&&(scope.queryString=location.search.substring(1,location.search.length)),scope.multimediaLink="/xpl/abstractMultimedia.jsp?arnumber="+scope.record.articleNumber+"&isnumber="+scope.record.isNumber,scope.user.showMeta="title-only"!==scope.user.preferences.resultsLayout,scope.user.openAbstract="title-citation-abstract"===scope.user.preferences.resultsLayout,scope.pdfPopup=pdfPopup,scope.isSelected=isSelected,scope.toggleSelect=toggleSelect}var directive={link:link,restrict:"E",scope:{record:"=",selectedItems:"=",user:"="},templateUrl:"search/results/result.html"};return directive}angular.module("xpl.search").directive("xplResult",xplResult),xplResult.$inject=["searchService"]}(),function(){"use strict";function xplCmptSearchResults(){return{controller:ResultsComponent,controllerAs:"vm",replace:!0,restrict:"E",scope:{},templateUrl:"search/results/results-component.html"}}function ResultsComponent($log,$state,$stateParams,searchService,userService,tealiumService){function initialize(){searchService.getQueryResult($state.params).then(queryResultSuccess)["catch"](catchPromiseFailure)}function queryResultSuccess(response){vm.rowCount=$state.params.rowsPerPage||25,vm.page=$state.params.pageNumber||1,vm.user=userService.getUser(),$log.info("response.data",response.data),vm.data=response.data,vm.standardsDictionaryTerms=searchService.removeFacet("Standards Dictionary Terms"),vm.searchTerms=searchService.removeBreadcrumb("search"),vm.facets=vm.data.facets,vm.breadcrumbs=vm.data.breadCrumbs,$stateParams.refinements&&($stateParams.refinements=_.pluck(_.flatten(_.pluck(vm.breadcrumbs,"children")),"value")),vm.data.subscribedContentApplied&&!$stateParams.subscribed&&($stateParams.subscribed="true"),angular.copy(response.data.records,cache.data.records),appendRecords(),vm.loading=!1,vm.tealiumCall()}function catchPromiseFailure(error){$log.error(error),vm.error=!0,vm.loading=!1}function tealiumCall(){if(tealiumService.isTealiumEnabled()){var tealiumUtagData={publisher:tealiumService.getPublisher(),search_keyword:_.get($state.params,"queryText",""),search_refinements:tealiumService.getRefinements(vm.data),search_search_within:tealiumService.getSearchWithin(),search_results_count:vm.data.totalRecords,search_type:vm.data.searchType,sheet_name:_.get(tealiumTagsData,"data.data4angular.pageTags.serp.sheet_name","notFound"),sheet_type:_.get(tealiumTagsData,"data.data4angular.pageTags.serp.sheet_type","notFound")};tealiumService.view(tealiumUtagData)}}function appendRecords(){(vm.records.length<1||cache.data.records.length)&&(vm.records=vm.records.concat(cache.data.records.splice(0,10)))}function changePage(){$state.go($state.current.name,{pageNumber:vm.page})}var cache={data:{records:[]}},vm=this;vm.error=!1,vm.records=[],vm.loading=!0,vm.user={},vm.selectedItems=[],vm.standardsDictionaryTerms={children:[]},vm.appendRecords=appendRecords,vm.changePage=changePage,vm.tealiumCall=tealiumCall,initialize()}angular.module("xpl.search").directive("xplCmptSearchResults",xplCmptSearchResults),ResultsComponent.$inject=["$log","$state","$stateParams","searchService","userService","tealiumService"]}(),function(){"use strict";function xplStandardsDictionary(){var directive={restrict:"E",scope:{listing:"="},templateUrl:"search/standards-dictionary/standards-dictionary.html"};return directive}angular.module("xpl.search").directive("xplStandardsDictionary",xplStandardsDictionary)}();