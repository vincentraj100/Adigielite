define([
    'kendo',
    './app/Garage/GarageViewModel',
    './app/Customer/CustomerViewModel',
    './app/Orders/OrdersViewModel',
], function (kendo, garageViewModel, customerViewModel, ordersViewModel) {
    var os = kendo.support.mobileOS;
    var statusBarStyle = os.ios && os.flatVersion >= 700 ? "black-translucent" : "black";
    //debugger;
    var customerList = [];
    Global.ordersViewModel = ordersViewModel;
    return {
        kendoApp: null,
        garageService: {
            viewModel: null
        },
        customerService: {
            viewModel: null
        },
        ordersService: {
            viewModel: null
        },
        init: function () {
            this.kendoApp = new kendo.mobile.Application(document.body, { platform: "ios", layout: "layout", statusBarStyle: statusBarStyle });
            //loadInGarage();
        },
        load_Customer: function (e) {
            app.customerService.viewModel = new customerViewModel(e.view.element.find("#customer_list_ul"));
            kendo.bind($("#customer_list"), app.customerService.viewModel);
        },
        loadInGarage: function (e) {
            app.garageService.viewModel = new garageViewModel(e.view.element.find("#garage_list_ul"));
            kendo.bind($("#garage_list"), app.garageService.viewModel);
        },
        showInGarage: function (e) {
            //debugger;
            if (app.garageService.viewModel.garageDataSource != undefined)
                app.garageService.viewModel.garageDataSource.fetch();
        },
        showCustomer: function (e) {
            if (app.customerService.viewModel != undefined)
                app.customerService.viewModel.customer_reload_list();
        },
        showOrder: function (e) {
            if (app.ordersService.viewModel.orderDataSource != undefined)
                app.ordersService.viewModel.orderDataSource.fetch();
        },
        loadOrder: function (e) {
            Global.order_view_loads_from_garage = 0;
            app.ordersService.viewModel = new ordersViewModel(e.view.element.find("#order_list_ul"));
            Global.order_view_service_model = app.ordersService.viewModel;
            kendo.bind($("#order_list"), app.ordersService.viewModel);
        },
        log_click: function (e) {
            kendo.mobile.application.showLoading();
            var form = $(e.button).closest('#login');
            var usr_name = $(form).find("#usr_name");
            var usr_password = $(form).find("#usr_password");
            var loginUrl = baseUrl + "/login?user=" + $(usr_name).val() + "&pass=" + $(usr_password).val();
            var userUrl = baseUrl + "/getUsers/";
            console.log(loginUrl);
            $.ajax({
                url: loginUrl,
                type: "GET", //This is what you should chage                  
                success: function (data) {
                    Global.user_id = data[0].id;
                    Global.user_name = data[0].login;
                    Global.garage_id = data[0].garage_id;
                    Global.Partner_id = data[0].partner_id;

                    //debugger;
                    //// store user credential in local
                    if ($('#usr_rememberme').is(':checked')) {
                        localStorage.inGarageUsrName = $(usr_name).val();
                        localStorage.inGarageUsrPassword = $(usr_password).val();
                    } else {
                        localStorage.inGarageUsrName = "";
                        localStorage.inGarageUsrPassword = "";
                    }

                    resetforgetpass();
                    kendo.mobile.application.hideLoading();
                    //debugger;
                    window.app.kendoApp.navigate('#garage_list', 'slide:right');
                },
                error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    Global.user_id = -1;
                    Global.user_name = "";
                    alert("Authentication failure");
                    kendo.mobile.application.hideLoading();
                },
            });
            //alert(this.element.prop("id") + " was clicked!");
        },
        login_load: function (e) {
            $('#usr_name').val(localStorage.inGarageUsrName);
            $('#usr_password').val(localStorage.inGarageUsrPassword);
        },
        remember_me: function (e) {
            if ($("#isRemember").val() == "0") {
                $("#imgremb").attr("src", "images/on.png");
                $("#isRemember").val("1");
            } else {
                $("#imgremb").attr("src", "images/off.png");
                $("#isRemember").val("0");
            }
        }, showproduct: function (e) {

        },
        load_sub_product_list: function (e) {
            //debugger;
            if (app.customerService != undefined && app.customerService.viewModel != null) {
                app.customerService.viewModel.load_sub_product_list(e);
            } else if (app.ordersService != undefined && app.ordersService.viewModel != null) {
                app.ordersService.viewModel.load_sub_product_list(e);
            } else if (app.garageService != undefined && app.garageService.viewModel != null) {
                app.garageService.viewModel.load_sub_product_list(e);
            }
        },
        forgot_password: function (e) {
            kendo.mobile.application.showLoading();
            var form = $(e.button).closest('#login');
            var usr_name = $(form).find("#usr_name");
            var loginUrl = baseUrl + "/resetpassword?user=" + $(usr_name).val();

            $.ajax({
                type: "POST",
                url: loginUrl,
                cache: false,
                corssdomain: true,
                dataType: "json",
                success: function (data, statusText, xhr) {
                    resetforgetpass();
                    $("#divforgetpass").html("Your password reset link has been sent to your registered email");
                    $("#divforgetpass").addClass("passwordreset");
                    $("#divforgetpass").addClass("sucess");
                    kendo.mobile.application.hideLoading();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    resetforgetpass();
                    $("#divforgetpass").html("Error while generating the password link");
                    $("#divforgetpass").addClass("passwordreset");
                    $("#divforgetpass").addClass("error");
                    kendo.mobile.application.hideLoading();
                },
            });
        },
        load_Customer_contacts: function (e) {
            if (app.customerService == undefined) {
                app.customerService.viewModel = new customerViewModel($("#customer_list_ul"));
                //kendo.bind($("#customer_list"), app.customerService.viewModel);
                app.customerService.viewModel.customer_reload_contacts_list();
            } else
                app.customerService.viewModel.customer_reload_contacts_list();
        },
        showCustomer_contacts: function (e) {
            if (app.customerService.viewModel != undefined) {
                app.customerService.viewModel.customer_reload_contacts_list();
            }
        }, Productlist_Page_Hide: function (e) {
            //debugger;
            Global.order_id = -1;
        }
    };
});



function resetforgetpass() {
    $("#divforgetpass").html('');
    $("#divforgetpass").removeClass("passwordreset");
    $("#divforgetpass").removeClass("sucess");
    $("#divforgetpass").removeClass("error");
};
