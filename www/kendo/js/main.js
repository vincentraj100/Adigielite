var host = "http://192.168.2.17:8069/";
//var host = "http://adigielite.ddns.net:8069/";
var baseUrl = host + "mgarage";

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
        customerVehicleTemplate: "./app/Customer/customer_vehicle_template.html",
        ordersViewModel: "./app/Orders/OrdersViewModel",
        ordersTemplate: "./app/Orders/orderslist_template.html",
        ordersTaskTemplate: "./app/Orders/order_task_template.html",
        order_task_view_template: './app/Orders/order_task_view_template.html',
        customer_phone_email_template: './app/Customer/customer_phone_and_email_list_template.html',
        product_list_template: './app/Customer/product_list_template.html',
        subproduct_list_template: './app/Customer/subproduct_list_template.html',
        order_sub_task_template: './app/Orders/order_sub_task_template.html',
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
    user_id: -1,
    user_name: "",
    LoginUser: [],
    garage_id: 0,
    Partner_id: [],
    selected_customer_id: -1,
    selected_order_id: -1,
    customer_vehicle_template: null,
    orders_task_list_template: null,
    customer_phone_email_template: null,
    ordersViewModel: null,
    order_view_loads_from_garage: 0,
    temp_new_customer_phone_list: [],
    temp_new_customer_email_list: [],
    selected_vehicle_id: -1,
    quick_order_id: -1,
    create_job_from_order_edit_page: -1,
    order_view_service_model: null,
    selected_brand_id: 0,
    selected_customer_ddl: 0,
    selected_vehiclebased_order_listurl: 0,
    isAddNewVehiclePage: 0,
};


require(['kendo', 'app'], function (kendo, app) {//['app'], function (app) {
    window.app = app;
    $(function () {
        app.init();
    });
});


function customer_new1(e) {
    //debugger;
};


function load_ddl_item(type, controlId) {
    var url = baseUrl;
    var htmlTemplate = '<span data-id="#=id#" data-value="#=name#" data-controlid="' + controlId + '">#=name#</span>';

    app.kendoApp.navigate('#dropdownListView', 'slide:right');
    

    var isStatic = 0;
    var orderStatus = null;
    var filterField = false;
    if (type == 'brand') {
        url += "/getBrand";
        filterField = {
            field: "name",
            operator: "startswith"
        };
        $("#dropdownListView").find('span[data-role="view-title"]').html("Brand");
    } else if (type == 'model') {
        $("#dropdownListView").find('span[data-role="view-title"]').html("Model");
        $("#dropdown_list_item_list_ul").empty();
        var brandId = Global.selected_brand_id;

        if (brandId == undefined)
            return;

        if (brandId == '' || brandId == '0')
            return;
        filterField = {
            field: "modelname",
            operator: "startswith"
        };
        htmlTemplate = '<span data-id="#=id#" data-value="#=modelname#" data-controlid="' + controlId + '">#=modelname#</span>';
        url += "/getModelbyBarand?brand_id=" + brandId;
    } else if (type == 'customer') {
        url += "/getCustomerByGarageId?garageId="+Global.garage_id;
        $("#dropdownListView").find('span[data-role="view-title"]').html("Customer");
        isStatic = 4;
    } else if (type == 'vehicle') {
        if (Global.selected_customer_ddl == '0') {
            return;
        }
        htmlTemplate = '<span data-id="#=vehicle_id[0]#" data-value="#=vehicle_id[1]#" data-controlid="' + controlId + '">#=vehicle_id[1]#</span>';
        url += "/getVehiclebyCustomerId?cust_id=" + Global.selected_customer_ddl;
        $("#dropdownListView").find('span[data-role="view-title"]').html("Vehicle");
        
    } else if (type == 'service') {
        url += "/getService?type=service";
        isStatic = 3;
    } else if (type == 'status') {
        isStatic = 1;
        $("#dropdownListView").find('span[data-role="view-title"]').html("Status");
    } else if (type == 'phone') {
        isStatic = 2;
    }

    console.log(url);
    console.log(isStatic);
    var dataSource = null;
    //debugger;
    var list = $("#dropdown_list_item_list_ul").data("kendoMobileListView");
    if (list != undefined) {
        list.destroy();

        $("#dropdown_list_item_list_ul").remove();
        $("#dropdown_list_item_list_ul_parent").empty();
    }

    if (isStatic == 0) {
        dataSourceSelect = new kendo.data.DataSource({
            transport: {
                read: {
                    type: "POST"
                    , url: function (options) {
                        return url;
                    }
                    , dataType: "json"
                }
            },
            serverPaging: false,
            serverFiltering: false,
            serverSorting: false,
            pageSize: 10
        });

        //$("#dropdown_list_item_list_ul_parent").append()
        $('<ul id="dropdown_list_item_list_ul"></ul>').appendTo("#dropdown_list_item_list_ul_parent").kendoMobileListView({
            dataSource: dataSourceSelect,
            template: kendo.template(htmlTemplate),
            fixedHeaders: true,
            filterable: filterField
            , dataBound: function () {
                $("#dropdown_list_item_list_ul li").bind("click", function (e) {
                    BindDropdownList($(this));
                });
            }
        });

    } else if (isStatic == 1) {
        var data = [{ "id": "recommendation", "name": "Recommendation" },
                    { "id": "ingarage", "name": "In Garage" },
                    { "id": "cancelled", "name": "Cancelled" },
                    { "id": "deleted", "name": "Deleted" },
                    { "id": "done", "name": "Done" }];

        //$("#dropdown_list_item_list_ul").empty();

        $('<ul id="dropdown_list_item_list_ul"></ul>').appendTo("#dropdown_list_item_list_ul_parent").kendoMobileListView({
            dataSource: kendo.data.DataSource.create({ data: data }),
            template: kendo.template(htmlTemplate)
            , dataBound: function (e) {
                //debugger;
                $("#dropdown_list_item_list_ul li").bind("click", function (e) {
                    BindDropdownList($(this));
                });
            }
        });

    } else if (isStatic == 2) {
        var data = [
                { "id": "office", "name": "Office" },
                { "id": "landline", "name": "Landline" },
                { "id": "mobile", "name": "Mobile" }
        ];

        //$("#dropdown_list_item_list_ul").empty();

        $('<ul id="dropdown_list_item_list_ul"></ul>').appendTo("#dropdown_list_item_list_ul_parent").kendoMobileListView({
            dataSource: kendo.data.DataSource.create({ data: data }),
            template: kendo.template(htmlTemplate),
        });

    } else if (isStatic == 3) {
        

    }else  if (isStatic == 4) {
        dataSourceSelect = new kendo.data.DataSource({
            transport: {
                read: {
                    type: "POST"
                    , url: function (options) {
                        return url;
                    }
                    , dataType: "json"
                }
            },
            serverPaging: false,
            serverFiltering: false,
            serverSorting: false,
            //pageSize: 10
        });

        /*
        //$("#dropdown_list_item_list_ul_parent").append()
        $('<ul id="dropdown_list_item_list_ul"></ul>').appendTo("#dropdown_list_item_list_ul_parent").kendoMobileListView({
            dataSource: dataSourceSelect,
            template: kendo.template(htmlTemplate),
            fixedHeaders: true,
            filterable: filterField
            , dataBound: function () {
                $("#dropdown_list_item_list_ul li").bind("click", function (e) {
                    BindDropdownList($(this));
                });
            }
        });
       */
       
        $('<ul id="dropdown_list_item_list_ul"></ul>').appendTo("#dropdown_list_item_list_ul_parent").kendoMobileListView({
                dataSource: dataSourceSelect              
              , template: kendo.template(htmlTemplate)
              ,fixedHeaders: true
              , filterable: {
                  field: "name",
                  operator: "startswith"
              }, dataBound: function () {
                  $("#dropdown_list_item_list_ul li").bind("click", function (e) {
                      BindDropdownList($(this));
                  });
              } 
        });
        
    }

};

function BindDropdownList(e) {
    var id = $(e).children("span").data('id');
    var control = $(e).children("span").data('controlid');
    var Value = $(e).children("span").data('value');

    if (control == 'vehicleBrand') {
        $('#vehicleModel').val("--select--");
        $('#vehicleModel').attr('data-itemid', '');
        Global.selected_brand_id = id;
    } else if (control == 'customer_ddl_list') {
        $('#vehicle_ddl_list').val("--select--");
        $('#vehicle_ddl_list').attr('data-itemid', '');
        Global.selected_customer_ddl = id;
    } else if (control == 'status_ddl_list') {
        $('#status_ddl_list').val("ingarage");
        $('#status_ddl_list').attr('data-itemid', 'ingarage');
        Global.selected_customer_ddl = id;
    }
    $('#' + control).attr('data-itemid', id);
    $('#' + control).val(Value);
    app.kendoApp.navigate('#:back', 'slide:right');
};

