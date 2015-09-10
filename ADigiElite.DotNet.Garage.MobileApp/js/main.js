var host = "http://192.168.2.17:8069/";
//var host = "http://adigielite.ddns.net:8069/";
var baseUrl = host + "openacademy/OpenacademyCustomer";

require.config({
    paths: {
        kendo: "./lib/kendo.all.min",
        jquery: "./lib/jquery.min",
        text: "./lib/text",
        templateLoader: "./lib/kendo-template-loader",
        garageViewModel: "./app/Garage/GarageViewModel",
        garageTemplate: "./app/Garage/garagelist_template.html",
        customerViewModel: "./app/Customer/CustomerViewModel",
        customerTemplate: "./app/Customer/customerlist_template.html",
        ordersViewModel: "./app/Orders/OrdersViewModel",
        ordersTemplate: "./app/Orders/orderslist_template.html",
    },

    shim: {
        kendo: {
            deps: ['jquery'],
            exports: 'kendo'
        }
    }
});


var Global = {
    SelectedOrderView: 0,
    SelectedGarageView: 0,
};

////NewVehicleBrand: "",
////NewVehicleBrandId: 0,
////NewVehicleModel: "",
////NewVehicleModelId: 0,
////NewVehiclePlateNumber: "",
////CustomersVehicle: [],
////objVehicleModelDropDownList: "",
////objVehicleBrandDropDownList: "",
////VehicleDropdownloaded: false,
////user_id: -1,
////user_name: ""

require(['kendo', 'app'], function (kendo, app) {//['app'], function (app) {
    window.app = app;
    $(function () {
        app.init();
    });

});



function customer_new1(e) {
    debugger;

};
