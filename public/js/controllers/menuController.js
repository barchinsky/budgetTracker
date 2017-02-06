angular.
module("budgetTrackerApp").
controller("menuController", menuController).
factory("ds", DataService);

menuController.$inject = ["$scope", "$ionicModal", "ds", "$ionicLoading", "$rootScope", "$filter", "$state"];

function menuController($scope, $ionicModal, ds, $ionicLoading, $rootScope, $filter, $state){
	local = $scope;
	vm = this;

	local.authorized = ds.getAuthorization(); // used to manage app resources access
	local.menuItems = [config.homePage, config.addPage, config.transactionsPage, config.categoriesPage, config.budgetsPage, config.settingsPage]; // keep page titles with path
	local.loginData = {}; // login and pass info
	local.alerts= config.alerts; // alerts style
	local.barHeaderTitle = config.homePage.title; // header title
	local.currentUser={name:"unknown", surname:"unknown"}; // current user name and surname
	local.regData = {name:"", surname:"", login:"", passConf:{value:"", valid:false}}; // registration data

	/*
	* Broadcast authorization status change event
	*/
	local.changeAuthEvent = function(event, value){
		$rootScope.$broadcast("change.auth.event", ds.getAuthorization());
	}

	/*
	* Watch on authorized var
	* Notify other controlles about authorization status change
	*/
	local.$watch("authorized", function(newValue, oldValue){
		ds.setAuthorization(newValue);
		local.changeAuthEvent();

	});

	local.$on("change.auth.event", function(event, value){
		local.authorized = value;
	});

	local.prepareModals = function(){
		// Create the login modal
		/*$ionicModal.fromTemplateUrl('templates/login.html', {
			scope: local
		}).then(function(modal) {
			local.loginModal = modal;
		});
		*/

		$ionicModal.fromTemplateUrl('templates/registration.htm', {
			scope: local
		}).then(function(modal) {
			local.registrationModal = modal;
		});
	}

	/*
	* Perform user authorization verification
	* If user data stored, authorize in silent mode
	*/
	local.isauth = function(){
		console.log("isauth()");
		local.showLoading();

		ds.isAuthorized().then(function(r){
			console.log("isAuthorized response recieved");
			if(+r.status){ // if user already authorized
				// update app data
				local.authorized = true;
				ds.setCurrentUser(r.user);
				local.currentUser = ds.getCurrentUser();
				local.notify("Authorizated!",1);
				local.hideLoading();
			}
			else{ // else perform
				// perform authorization using stored data
				//console.log('not authorized');
				local.loginData = ds.getLoginData();

				if( local.loginData.login && local.loginData.pass ){
					console.log("login data found, try to authorize in silent mode:", local.loginData);
					local.authorize();
				}
				else{
					console.log("login data not found, manual authorization is required");
				}
				//local.authorize();
				local.notify("Not authorized!", 2);
				local.hideLoading();
			}
		}, local.errorHandler);

		console.log("~isauth()");
	}

	/* 
	* Authorize user
	*/
	local.authorize = function(){
		console.log("authorize()");
		//local.closeLoginModal();
		local.showLoading();

		ds.authorize(local.loginData).then(function(r){
			console.log("r.status:"+r.status);
			if(+r.status){
				local.authorized = true; // update authorization status
				ds.setCurrentUser(r.user); // save recieved user info
				ds.setToken(r.token); // save recieved token
				ds.setLoginData(local.loginData); // save login data for futher use
				local.currentUser = ds.getCurrentUser();
				console.log("local.currentUser:", local.currentUser);

				local.notify(r.msg, 0);
				$state.go("app.home"); // go to the main page

				local.hideLoading();
			}
			else {
				local.hideLoading();
				local.notify(r.msg, 2);
			}
		}, local.errorHandler);
		console.log("~authorize()");
	}

	local.register = function(){
		console.log("register()");
		//return;

		local.showLoading();
		local.formatRegData(local.regData);
		//return;

		ds.register(local.regData).then(function(r){
			if( r.status ){
				local.notify("Registration is successfull",0);
				var token = r.token;
				console.log("token recieved:",token);
				ds.setToken(token);
				ds.setLoginData(local.regData);
				local.regData={};
			}
			else local.notify(r.msg, 3);
			
			local.hideLoading();
			local.closeRegistrationModal();
		}, local.errorHandler);

		console.log("~register()");
	}

	local.validatePass = function(){
		console.log("validatePass()");
		console.log(local.regData);

		if( local.regData.pass !== local.regData.passConf.value){
			local.notify("Password confirmation missmatch!",2);
			local.regData.passConf.valid=false;
		}else
			local.regData.passConf.valid = true;

		console.log("validatePass()");
	}

	local.formatRegData = function(el){
		console.log("validateRegData()");

		//var name = data.name;
		//var surname = data.surname;
		//var login = data.login;
		//data = $filter("titleCase")(data);

		switch(el){
			case "n": local.regData.name = $filter("titleCase")(local.regData.name);
			case 'sn': local.regData.surname = $filter("titleCase")(local.regData.surname);
			case 'l': local.regData.login = local.regData.login.split(' ')[0].toLowerCase();
			default: console.log("Registration element not recognized.");
		}
		//local.regData.name = $filter("titleCase")(local.regData.name);
		//console.log("new name:", local.regData.name);

		//local.regData.surname = $filter("titleCase")(local.regData.surname);
		//console.log("new surname:",local.regData.surname);




		//console.log(name, surname, login);
	}

	local.logout = function(){
			ds.logout().then(function(r){
				if(+r.status){
					local.authorized = false;
					console.log("Logged out.");
				}
			}, local.errorHandler);
		}

	local.showRegistrationModal = function(){
		local.registrationModal.show();
	}

	local.closeRegistrationModal = function(){
		local.registrationModal.hide();
	}

	local.showLoginModal = function(){
		//console.log("showLoginModal");
		local.loginModal.show();
	}

	local.closeLoginModal = function(){
		local.loginModal.hide();
		//console.log("closeLoginModal");
	}

	local.showLoading = function() {
	    $ionicLoading.show({
			template: 'Loading...',
			duration: 5000,
			scope: local
		}).then(function(){
			//console.log("The loading indicator is now displayed");
		});
	  }

	local.hideLoading = function(){
		$ionicLoading.hide().then(function(){
			//console.log("The loading indicator is now hidden");
		});
	}

	local.notify = function(text,id){
		//console.log("controller::notify()");
		console.log(text);

		//local.notification.text = text;
		//$("#notification").html(text);
		//var nType = local.alerts[id]; // notification type

		//local.alertType = nType;

		//$("#notification").slideDown(800);
		//$("#notification").slideUp(1200);
		
		//console.log("~controller::notify()");
	}

	local.updateBarHeaderTitle = function(menuItem){
		local.barHeaderTitle = menuItem.title;
	}

	local.prepareModals();
	local.isauth();

}