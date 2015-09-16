define([
    'kendo',
    'text!customerTemplate',
    'text!customerVehicleTemplate',
    'text!customer_phone_email_template',
    'text!product_list_template',
    'text!ordersTemplate',
    '../../app/Orders/OrdersViewModel',
    'text!subproduct_list_template',
], function (kendo, customerTemplate, customerVehicleTemplate, customer_phone_email_template, product_list_template, ordersTemplate, ordersViewModel, subproduct_list_template) {
    return kendo.data.ObservableObject.extend({
        customerDataSource: null,
        init: function (listView) {
            var self = this;
            //debugger;
            kendo.data.ObservableObject.fn.init.apply(self, []);

            console.log(baseUrl + "/getCustomerByGarageId?garageId=" + Global.garage_id);

            var dataSource = new kendo.data.DataSource({
                transport: {
                    read: {
                        type: "POST"
                        , url: baseUrl + "/getCustomerByGarageId?garageId=" + Global.garage_id
                        , dataType: "json"
                    }
                },
                schema: {
                    //total: "count" // schema total is required for the server paging to work as expected
                },
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true,
                //pageSize: 15
            });

            listView.kendoMobileListView({
                dataSource: dataSource
                , autoBind: false
                , template: kendo.template(customerTemplate)
                //,filterable: true 
                //,endlessScroll: true
                //,virtualViewSize: 10 
                , filterable: {
                    field: "name",
                    operator: "startswith"
                }, dataBound: function () {
                    $("#customer_list_ul li").bind("click", function (e) {
                        app.customerService.viewModel.customer_edit_load($(this));
                    });
                }
                //endlessScroll: true,
                //virtualViewSize: 15 // needed setting, since local data virtualization does not use paging
            });

            Global.customer_vehicle_template = customerVehicleTemplate;
            Global.customer_phone_email_template = customer_phone_email_template;
            Global.create_job_from_order_edit_page = -1;

            self.set("customerDataSource", dataSource);

        },
        customer_reload_list: function (e) {
            //debugger;
            if (this.customerDataSource != undefined) {
                //app.customerService.viewModel.customerDataSource.fetch();
                var customerList = $('#customer_list_ul').data('kendoMobileListView');
                customerList.dataSource.transport.options.read.url = baseUrl + "/getCustomerByGarageId?garageId=" + Global.garage_id;
                customerList.dataSource.read();   // added line
                customerList.refresh();
            }


        },
        customer_edit_load: function (e) {
            kendo.mobile.application.showLoading();

            var customerid = $(e.button).attr('data-customer-id');

            if (customerid == undefined) {
                customerid = $(e).children("span").attr("data-customer-id");
            }

            app.kendoApp.navigate('#customer_form_view', 'slide:right');
            var selectedcustomer = null;

            Global.temp_new_customer_email_list = [];
            Global.temp_new_customer_phone_list = [];
            Global.create_job_from_order_edit_page = -1;

            var customer_detail_url = baseUrl + "/getCustomerbyId?id=" + customerid;
            console.log(customer_detail_url);

            Global.Customer = [];
            Global.Customer.PhoneLoaded = false;
            Global.Customer.EmailLoaded = false;
            Global.Customer.VehicleLoaded = false;

            $.ajax({
                type: "GET",
                url: customer_detail_url,
                cache: false,
                dataType: "json",
                success: function (data, statusText, xhr) {
                    var customer_detail = data[0];
                    Global.selected_customer_id = customer_detail.id;
                    get_customer_vehicle_list(Global.selected_customer_id);

                    //// view add vehiclebutton
                    $(".additemlist").show();

                    $("#add_customer span.km-icon").removeClass("km-fa-plus");
                    $("#add_customer span.km-icon").addClass("km-fa-ok");
                    $("#add_customer span.km-text").html("Done");

                    //// Load customer phone list detail
                    Global.temp_new_customer_phone_list = customer_detail.phonedata;
                    load_customer_phone_list();

                    //// Load customer email list detail
                    Global.temp_new_customer_email_list = customer_detail.emaildata;
                    load_customer_email_list();

                    kendo.bind($("#customer_form_view"), customer_detail);

                    //// click event
                    //setTimeout(function (e) {
                    //    $("#vehicle_listview li").bind("click", function (e) {
                    //        app.customerService.viewModel.edit_customer_vehicle($(this));
                    //    });
                    //}, 1000);


                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                }
            });
        },
        customer_save: function (e) {
            kendo.mobile.application.showLoading();

            var model = $("#customer_form_view").find("#name").get(0).kendoBindingTarget.source;
            var url = baseUrl;
            if (model.id == -1)
                url = url + '/customerAdd' + '?name=' + model.name + '&street=' + model.street + '&pobox=' + model.zip + '&city=' + model.city + '&phone=' + model.phone + '&email=' + model.email + "&garage_id=" + Global.garage_id;
            else
                url = url + '/customerEdit' + '?id=' + model.id + '&name=' + model.name + '&street=' + model.street + '&pobox=' + model.zip + '&city=' + model.city + '&phone=' + model.phone + '&email=' + model.email + "&garage_id=" + Global.garage_id;

            console.log(url);

            $.ajax({
                type: "POST",
                url: url,
                cache: false,
                success: function (data, statusText, xhr) {

                    var customerid = data.partner_id;
                    if (customerid == undefined && model.id != undefined)
                        customerid = model.id;
                    Global.selected_customer_id = customerid;
                    console.log("customerid:" + customerid);


                    for (var i = 0; i < Global.temp_new_customer_phone_list.length; i++) {
                        var item = Global.temp_new_customer_phone_list[i];
                        if (item.id == -1) {

                            var customer_phone_url = baseUrl;
                            customer_phone_url = customer_phone_url + "/addressAdd?partner_id=" + customerid + "&name=" + item.name + "&value=" + item.value + "&category=phone";
                            console.log(customer_phone_url);
                            $.ajax({
                                type: "POST",
                                url: customer_phone_url,
                                cache: false,
                                success: function (data, statusText, xhr) {

                                    console.log("customer phone added" + xhr.responseText);
                                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                                    console.log("unable to save customer phone number" + item.value);
                                    console.log(customer_phone_url);
                                }
                            });
                        } else {
                            var modelPhone = $("#customer_phone_list").find("input[data-id=" + item.id + "]");
                            var modelPhoneCheckbox = $("#customer_phone_list").find("input[data-id=chk" + item.id + "]");
                            var modelPhoneId = item.id;
                            var modelPhoneCustomerId = $(modelPhone).attr("data-customer-id");
                            var modelPhoneName = $(modelPhone).attr("data-name");
                            var modelPhoneCategory = $(modelPhone).attr("data-type");
                            var modelPhoneValue = $(modelPhone).val();
                            var modelPhoneIsPrimary = $(modelPhoneCheckbox).is(':checked');
                            //var modelPhone = $("#customer_phone_list").find("input").get(0).kendoBindingTarget.source
                            //debugger;                           
                            var customer_phone_url = baseUrl;
                            customer_phone_url = customer_phone_url + "/addressEdit?id=" + modelPhoneId + "&partner_id=" + modelPhoneCustomerId + "&name=" + modelPhoneName + "&value=" + modelPhoneValue + "&category=" + modelPhoneCategory;
                            if (modelPhoneIsPrimary)
                                customer_phone_url = customer_phone_url + "&isprimary=Y"
                            console.log(customer_phone_url);
                            $.ajax({
                                type: "POST",
                                url: customer_phone_url,
                                cache: false,
                                success: function (data, statusText, xhr) {

                                    console.log("customer phone edited" + xhr.responseText);
                                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                                    console.log("unable to save customer phone number" + modelPhoneId + "-" + modelPhoneValue);
                                    console.log(customer_phone_url);
                                }
                            });

                        }
                    }

                    //// save email
                    for (var i = 0; i < Global.temp_new_customer_email_list.length; i++) {
                        var item = Global.temp_new_customer_email_list[i];
                        if (item.id == -1) {

                            var customer_email_url = baseUrl;
                            customer_email_url = customer_email_url + "/addressAdd?partner_id=" + customerid + "&name=" + item.name + "&value=" + item.value + "&category=email";
                            console.log(customer_email_url);
                            $.ajax({
                                type: "POST",
                                url: customer_email_url,
                                cache: false,
                                success: function (data, statusText, xhr) {

                                    console.log("customer email added" + +xhr.responseText);
                                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                                    console.log("unable to save customer email number" + item.value);
                                    console.log(customer_email_url);
                                }
                            });
                        } else {
                            var modelEmail = $("#customer_email_list").find("input[data-id=" + item.id + "]");
                            var modelEmailCheckbox = $("#customer_email_list").find("input[data-id=chk" + item.id + "]");
                            //data-id="chk#=id#"
                            var modelEmailId = item.id;
                            var modelEmailCustomerId = $(modelEmail).attr("data-customer-id");
                            var modelEmailName = $(modelEmail).attr("data-name");
                            var modelEmailCategory = $(modelEmail).attr("data-type");
                            var modelEmailValue = $(modelEmail).val();
                            var modelEmailIsPrimary = $(modelEmailCheckbox).is(':checked');
                            //var modelPhone = $("#customer_phone_list").find("input").get(0).kendoBindingTarget.source
                            //debugger;                           
                            var customer_Email_url = baseUrl;
                            customer_Email_url = customer_Email_url + "/addressEdit?id=" + modelEmailId + "&partner_id=" + modelEmailCustomerId + "&name=" + modelEmailName + "&value=" + modelEmailValue + "&category=" + modelEmailCategory;
                            if (modelEmailIsPrimary)
                                customer_Email_url = customer_Email_url + "&isprimary=Y"
                            console.log(customer_Email_url);
                            //debugger;
                            $.ajax({
                                type: "POST",
                                url: customer_Email_url,
                                cache: false,
                                success: function (data, statusText, xhr) {
                                    //debugger;
                                    console.log("customer email edited" + xhr.responseText);
                                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                                    console.log("unable to save customer email number" + modelEmailId + "-" + modelEmailValue);
                                    console.log(customer_phone_url);
                                }
                            });

                        }
                    }

                    alert("Customer details saved Successfully");
                    $(".additemlist").show();
                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    alert("Unable to update customer details");
                }
            });

            kendo.mobile.application.hideLoading();

        }, customer_new: function (e) {
            app.kendoApp.navigate('#customer_form_view', 'slide:right');
            var selectedcustomer = {
                id: -1,
                name: "",
                phone: "",
                email: "",
                poBox: "",
                street: "",
                city: ""
            };


            $(".additemlist").hide();
            $("#p_scents").empty();
            Global.selected_customer_id = -1;

            kendo.bind($("#customer_form_view"), selectedcustomer);
        },
        add_customer_vehicle: function (e) {
            var getBarndUrl = baseUrl + "/getBrand";

            Global.create_job_from_order_edit_page = -1;
            Global.isAddNewVehiclePage = 0;
            $("#vehicleBrand").val("--select--");
            getBarndUrl = baseUrl + "/getModel";
            $("#vehicleModel").val("--select--");
            window.app.kendoApp.navigate('#add_customer_vehicle', 'slide:right');

            var new_vehicle_model = {
                brand_id: -1,
                model_id: -1,
                cust_id: -1,
                user_id: -1,
                license_plate: "",
            };

            Global.selected_brand_id = 0;

            $("#add_vehicle span.km-text").html("Add");
            $("#remove_vehicle").hide();
            $("#product_based_order_list").empty();
            $('.addProductItems').hide();

            kendo.bind($("#add_customer_vehicle"), new_vehicle_model);
        },
        add_vehicle: function (e) {

            kendo.mobile.application.showLoading();
            var model = $("#add_customer_vehicle").find("#vehiclePlateNumber").get(0).kendoBindingTarget.source;

            console.log(model);
            Global.isAddNewVehiclePage = 0;
            var createVehicleUrl = baseUrl;
            //var vehicle_plate_numnber = $(".vehicleplatenumber").val();
            var vehicle_brand = $("#vehicleBrand").data("itemid");
            var vehicle_model = $("#vehicleModel").data("itemid");
            //var vehicle_brand_text = $("#vehicleBrand").data("kendoDropDownList").text();
            //var vehicle_model_text = $("#vehicleModel").data("kendoDropDownList").text();
            $("#errorMessage").text("");
            if (model.id == undefined || model.id == -1) {
                createVehicleUrl = createVehicleUrl + "/vehicleAdd" + '?brandId=' + vehicle_brand + '&modelId=' + vehicle_model + '&cust_id=' + Global.selected_customer_id + '&user_id=' + Global.user_id + '&license_plate=' + model.license_plate + '&garage_id=' + Global.garage_id;
            } else {
                createVehicleUrl = createVehicleUrl + "/vehicleEdit" + '?id=' + model.id + '&brandId=' + vehicle_brand + '&modelId=' + vehicle_model + '&cust_id=' + Global.selected_customer_id + '&user_id=' + Global.user_id + '&license_plate=' + model.license_plate + '&garage_id=' + Global.garage_id;
            }

            //debugger;

            if (model.oil_change_date != undefined && model.oil_change_date != "false") {
                createVehicleUrl = createVehicleUrl + "&oil_change_date=" + kendo.toString(model.oil_change_date, "yyyy-MM-dd H:mm:ss");
            }

            if (model.service_reminder_date != undefined && model.service_reminder_date != "false") {
                createVehicleUrl = createVehicleUrl + "&service_reminder_date=" + kendo.toString(model.service_reminder_date, "yyyy-MM-dd H:mm:ss");
            }

            if (model.breakpad_change_date != undefined && model.breakpad_change_date != "false") {
                createVehicleUrl = createVehicleUrl + "&breakpad_change_date=" + kendo.toString(model.breakpad_change_date, "yyyy-MM-dd H:mm:ss");
            }

            if (model.tyre_change_date != undefined && model.tyre_change_date != "false") {
                createVehicleUrl = createVehicleUrl + "&tyre_change_date=" + kendo.toString(model.tyre_change_date, "yyyy-MM-dd H:mm:ss");
            }

            console.log(createVehicleUrl);
            $.ajax({
                type: "POST",
                url: createVehicleUrl,
                cache: false,
                success: function (data, statusText, xhr) {
                    var id = data;
                    get_customer_vehicle_list(Global.selected_customer_id)

                    //// click event
                    setTimeout(function (e) {
                        $("#vehicle_listview li").bind("click", function (e) {
                            app.customerService.viewModel.edit_customer_vehicle($(this));
                        });
                    }, 1000);

                    alert("Vehicle details saved Successfully");
                    $('.addProductItems').show();

                    window.app.kendoApp.navigate('#customer_form_view', 'slide:right');
                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    alert("Unable to update vehicle details");
                }
            });

            kendo.mobile.application.hideLoading();

        },
        remove_customer_vehicle: function (e) {

            kendo.mobile.application.showLoading();

            var vehicle_brand = $("#add_customer_vehicle").find("#vehicleBrand").data("itemid");
            var vehicle_model = $("#add_customer_vehicle").find("#vehicleModel").data("itemid");

            //debugger;
            var vehicleId = Global.selected_vehicle_id;
            var remove_vehicle_url = baseUrl + "/customerVehicleDelete?vehicle_id=" + vehicleId + "&cust_id=" + Global.selected_customer_id;

            $.ajax({
                type: "POST",
                url: remove_vehicle_url,
                cache: false,
                success: function (data, statusText, xhr) {
                    var id = data;
                    alert("Vehicle removed");
                    window.app.kendoApp.navigate('#:back', 'slide:right');
                    //get_customer_vehicle_list(Global.selected_customer_id)
                    load_customer_editpage(Global.selected_customer_id);
                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    alert("Unable to remove vehicle");
                }
            });

            kendo.mobile.application.hideLoading();

        },
        edit_customer_vehicle: function (e) {
            var vehicleId = $(e.button).data('vehicle-id');
            if (vehicleId == undefined) {
                vehicleId = $(e).children("span").data('vehicle-id');
            }
            Global.selected_vehicle_id = vehicleId;
            Global.quick_order_id = -1;
            Global.create_job_from_order_edit_page = -1;
            Global.isAddNewVehiclePage = 1;

            var getBarndUrl = baseUrl + "/getBrand";



            var new_vehicle_model = {
                id: -1,
                brand_id: -1,
                model_id: -1,
                cust_id: -1,
                user_id: -1,
                license_plate: "",
            };

            $("#remove_vehicle").show();
            $("#add_vehicle span.km-text").text("Done");

            var get_selected_vehicle_detail = baseUrl + "/getVehiclebyId?id=" + vehicleId;

            console.log(get_selected_vehicle_detail);

            //// gets Vehicle detail
            $.ajax({
                type: "GET",
                url: get_selected_vehicle_detail,
                cache: false,
                dataType: "json",
                success: function (data, statusText, xhr) {
                    var selected_vehicle = data[0];
                    new_vehicle_model.id = selected_vehicle.id;
                    new_vehicle_model.brand_id = selected_vehicle.vehicle_brand_id;
                    new_vehicle_model.model_id = selected_vehicle.model_id[0];
                    new_vehicle_model.license_plate = selected_vehicle.license_plate;
                    new_vehicle_model.oil_change_date = selected_vehicle.oil_change_date;
                    new_vehicle_model.service_reminder_date = selected_vehicle.service_reminder_date;
                    new_vehicle_model.breakpad_change_date = selected_vehicle.breakpad_change_date;
                    new_vehicle_model.tyre_change_date = selected_vehicle.tyre_change_date;



                    //// Set model and brand values
                    $('#vehicleBrand').attr('data-itemid', new_vehicle_model.brand_id);
                    $('#vehicleModel').attr('data-itemid', new_vehicle_model.model_id);
                    $('#vehicleModel').val(selected_vehicle.model_id[1]);
                    $('#vehicleBrand').val(selected_vehicle.vehicle_brand_name);
                    Global.selected_brand_id = new_vehicle_model.brand_id;
                    //vehicle_brand_name



                    var getBarndUrl = baseUrl + "/getModelbyBarand";
                    $('.addProductItems').show();


                    console.log(new_vehicle_model);
                    window.app.kendoApp.navigate('#add_customer_vehicle', 'slide:right');
                    kendo.bind($("#add_customer_vehicle"), new_vehicle_model);

                    //debugger; 
                    var oil_change_dateCtrl = $("#oil_change_date").data("kendoDateTimePicker");
                    oil_change_dateCtrl.value(kendo.parseDate(new_vehicle_model.oil_change_date, 'yyyy-MM-dd H:mm:ss'));

                    var service_reminder_dateCtrl = $("#service_reminder_date").data("kendoDateTimePicker");
                    service_reminder_dateCtrl.value(kendo.parseDate(new_vehicle_model.service_reminder_date, 'yyyy-MM-dd H:mm:ss'));

                    var breakpad_change_dateCtrl = $("#breakpad_change_date").data("kendoDateTimePicker");
                    breakpad_change_dateCtrl.value(kendo.parseDate(new_vehicle_model.breakpad_change_date, 'yyyy-MM-dd H:mm:ss'));

                    var tyre_change_dateCtrl = $("#tyre_change_date").data("kendoDateTimePicker");
                    tyre_change_dateCtrl.value(kendo.parseDate(new_vehicle_model.tyre_change_date, 'yyyy-MM-dd H:mm:ss'));
                    //// Load order by customer vehicle
                    var order_list_url = baseUrl + "/getOrderDetails?garage_id=" + Global.garage_id + "&customer_id=" + Global.selected_customer_id + "&vehicle_id=" + vehicleId;

                    Global.selected_vehiclebased_order_listurl = order_list_url;

                    if (Global.order_view_service_model == null) {
                        app.ordersService.viewModel = new ordersViewModel($("#order_list_ul"));
                        Global.order_view_service_model = app.ordersService.viewModel;
                    } else {
                        app.ordersService.viewModel = Global.order_view_service_model;
                    }

                    var dataSource = new kendo.data.DataSource({
                        transport: {
                            read: {
                                type: "POST"
                                , url: order_list_url
                                , dataType: "json"
                            }
                        },
                        serverPaging: true,
                        serverFiltering: true,
                        serverSorting: true,
                        pageSize: 10
                    });

                    $("#product_based_order_list").kendoMobileListView({
                        dataSource: dataSource,
                        template: kendo.template(ordersTemplate),
                        fixedHeaders: true
                    });

                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                }
            });

        },
        load_orders_by_customer_vehicle: function (e) {
            var vehicleId = $(e.button).data('vehicle-id');
            var order_list_url = baseUrl + "/GetOrdersByCustomerVehicle";

            //// gets Vehicle detail
            $.ajax({
                type: "GET",
                url: get_selected_vehicle_detail,
                cache: false,
                dataType: "json",
                success: function (data, statusText, xhr) {
                    var selected_vehicle = data[0];
                    new_vehicle_model.id = selected_vehicle.id;
                    new_vehicle_model.brand_id = selected_vehicle.vehicle_brand_id;
                    new_vehicle_model.model_id = selected_vehicle.model_id[0];
                    new_vehicle_model.license_plate = selected_vehicle.license_plate;

                    console.log(new_vehicle_model);
                    ////window.app.kendoApp.navigate('#add_customer_vehicle', 'slide:right');
                    ////kendo.bind($("#add_customer_vehicle"), new_vehicle_model);

                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                }
            });
        },
        load_add_customer_phone_form: function (e) {

            var partner_id = Global.selected_customer_id;

            if (!partner_id > 0) {
                partner_id = -1;
            }

            var phone_model = {
                "category": '',
                "isprimary": "N",
                "partner_id": [
                  partner_id,
                  ""
                ],
                "id": -1,
                "value": "",
                "name": ""
            }

            $('#phone_number_type').attr('data-itemid', 'mobile');
            $('#phone_number_type').val('mobile');



            window.app.kendoApp.navigate('#add_customer_phone_form', 'slide:right');
            kendo.bind($("#add_customer_phone_form"), phone_model);
        },
        load_add_customer_email_form: function (e) {

            var partner_id = Global.selected_customer_id;

            if (!partner_id > 0) {
                partner_id = -1;
            }

            var email_model = {
                "category": 'email',
                "isprimary": "N",
                "partner_id": [
                  partner_id,
                  ""
                ],
                "id": -1,
                "value": "",
                "name": "email"
            }

            window.app.kendoApp.navigate('#add_customer_email_form', 'slide:right');
            kendo.bind($("#add_customer_email_form"), email_model);
        },
        add_customer_phone: function (e) {
            kendo.mobile.application.showLoading();

            var model = $("#add_customer_phone_form").find("#number").get(0).kendoBindingTarget.source;
            var phone_number_type = $('#phone_number_type').data('itemid');

            var customer_phone_url = baseUrl;
            $("#errorMessage").text("");

            if (model.partner_id[0] != -1) {

                if (model.id == -1) {
                    customer_phone_url = customer_phone_url + "/addressAdd?partner_id=" + Global.selected_customer_id + "&name=" + phone_number_type + "&value=" + model.value + "&category=phone";
                } else {
                    customer_phone_url = customer_phone_url + "/addressAdd?id=" + model.id + "&partner_id=" + Global.selected_customer_id + "&name=" + phone_number_type + "&value=" + model.value + "&category=phone";
                }

                $.ajax({
                    type: "POST",
                    url: customer_phone_url,
                    cache: false,
                    success: function (data, statusText, xhr) {
                        var id = data;
                        //alert("Detail saved Successfully");
                        model.id = id;                        
                        if (model.isprimary== true)
                            model.isprimary = "Y";
                        else
                            model.isprimary = "N";
                        model.category = "phone";
                        Global.temp_new_customer_phone_list.push(model);
                        load_customer_phone_list();
                        bindCustomerCheckBoxClicked();
                        window.app.kendoApp.navigate('#customer_form_view', 'slide:right');
                    }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                        alert("Unable to save, please try again");
                    }
                });

            } else {
                var phone = {
                    "category": model.category,
                    "isprimary": model.isprimary,
                    "partner_id": [
                      model.partner_id[0],
                      model.partner_id[1]
                    ],
                    "id": -1,
                    "value": model.value,
                    "name": model.name
                };
                Global.temp_new_customer_phone_list.push(phone);
                load_customer_phone_list();
                bindCustomerCheckBoxClicked();
                window.app.kendoApp.navigate('#:back', 'slide:right');
            }

            kendo.mobile.application.hideLoading();

        },
        add_customer_email: function (e) {
            kendo.mobile.application.showLoading();

            var model = $("#add_customer_email_form").find("#mail_id").get(0).kendoBindingTarget.source;

            var customer_phone_url = baseUrl;
            $("#errorMessage").text("");
            if (model.partner_id[0] != -1) {

                if (model.id == -1) {
                    customer_phone_url = customer_phone_url + "/addressAdd?partner_id=" + Global.selected_customer_id + "&name=email&value=" + model.value + "&category=email";
                } else {
                    customer_phone_url = customer_phone_url + "/addressAdd?id=" + model.id + "&partner_id=" + Global.selected_customer_id + "&name=zemail&value=" + model.value + "&category=email";
                }

                $.ajax({
                    type: "POST",
                    url: customer_phone_url,
                    cache: false,
                    success: function (data, statusText, xhr) {
                        var id = data;
                        //alert("Detail saved Successfully");
                        model.id = id;
                        if (model.isprimary == true)
                            model.isprimary = "Y";
                        else
                            model.isprimary = "N";                        
                        model.category = "email";
                        Global.temp_new_customer_email_list.push(model);
                        load_customer_email_list();
                        bindCustomerCheckBoxClicked();
                        window.app.kendoApp.navigate('#customer_form_view', 'slide:right');
                    }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                        alert("Unable to save, please try again");
                    }
                });

            } else {
                //debugger;
                var phone = {
                    "category": model.category,
                    "isprimary": model.isprimary,
                    "partner_id": [
                      model.partner_id[0],
                      model.partner_id[1]
                    ],
                    "id": -1,
                    "value": model.value,
                    "name": model.name
                };
                Global.temp_new_customer_email_list.push(phone);
                load_customer_email_list();
                bindCustomerCheckBoxClicked();
                window.app.kendoApp.navigate('#:back', 'slide:right');
            }

            kendo.mobile.application.hideLoading();
        },
        remove_customer_email_or_phone: function (e) {

            var id = $(e.button).data('id');
            var type = $(e.button).data('type');
            var value = $(e.button).data('value');

            $("#errorMessage").text("");
            remove_customer_address(id, type, value);

        },
        load_product_list: function (e) {

            //// creates new order and job
            Global.quick_order_id = -1;
            Global.create_job_from_order_edit_page = -1;

            load_product_list_common(product_list_template);

        },
        load_product_list_from_order: function (e) {
            //// cretes job for already added order
            Global.quick_order_id = -1;
            load_product_list_common(product_list_template);
        },
        load_sub_product_list: function (e) {
            load_sub_product_list(e, subproduct_list_template);
        },
        Customer_Vehicle_Page_RefreshOrder: function (e) {

            if (Global.isAddNewVehiclePage == 1) {
                var dataSource = new kendo.data.DataSource({
                    transport: {
                        read: {
                            type: "POST"
                            , url: Global.selected_vehiclebased_order_listurl
                            , dataType: "json"
                        }
                    },
                    serverPaging: true,
                    serverFiltering: true,
                    serverSorting: true,
                    pageSize: 10
                });

                $("#product_based_order_list").kendoMobileListView({
                    dataSource: dataSource,
                    template: kendo.template(ordersTemplate),
                    fixedHeaders: true
                });
            }
        },
        Customer_Vehicle_Page_init: function (e) {
            $("#oil_change_date").kendoDateTimePicker({
                value: new Date(), format: "yyyy/MM/dd h:mm tt"

            });
            $("#service_reminder_date").kendoDateTimePicker({
                value: new Date(), format: "yyyy/MM/dd h:mm tt"
            });
            $("#breakpad_change_date").kendoDateTimePicker({
                value: new Date(), format: "yyyy/MM/dd h:mm tt"

            });
            $("#tyre_change_date").kendoDateTimePicker({
                value: new Date(), format: "yyyy/MM/dd h:mm tt"
            });
        },
        Customer_VehicleList_Refresh: function (e) {
            $("#customer_phone_list").find("input[type=radio]").change(function (input) {
                CheckBoxClicked($(this));
            });

            $("#customer_email_list").find("input[type=radio]").change(function (input) {
                CheckBoxClicked($(this));
            });
        },
        Customer_Order_Page_JobRefresh: function (e) {
            get_order_task_list(Global.selected_order_id);
        },
        customer_reload_contacts_list: function (e) {


            // Wait for device API libraries to load
            document.addEventListener("deviceready", onDeviceReady, false);

            // device APIs are available

            function onDeviceReady() {
                // find all contacts with 'Bob' in any name field
                var options = new ContactFindOptions();
                options.filter = "Bob";
                var fields = ["displayName", "name", "phoneNumbers", "emails"];
                navigator.contacts.find(fields, onSuccess, onError, options);
            };

            // onSuccess: Get a snapshot of the current contacts

            function onSuccess(contacts) {
                for (var i = 0; i < contacts.length; i++) {
                    console.log("Display Name = " + contacts[i].displayName);
                }
            };

            // onError: Failed to get the contacts

            function onError(contactError) {
                alert('onError!');
            };

        }
    });
});

function load_product_list_common(product_list_template) {
    //debugger;
    //// Load products list
    var product_list_url = "";
    if (Global.create_job_from_order_edit_page != -1) {
        var orderid = 0;
        if (Global.selected_customer_id > 0) {
            orderid = Global.selected_customer_id;
        } else if (Global.quick_order_id > 0) {
            orderid = Global.quick_order_id;
        } else if (Global.order_id > 0) {
            orderid = Global.order_id;
        }

        if (orderid > 0) {
            product_list_url = baseUrl + "/getService?type=maincategory&order_id=" + orderid;
        } else {
            product_list_url = baseUrl + "/getService?type=maincategory";
        }
    } else {
        product_list_url = baseUrl + "/getService?type=maincategory";
    }

    console.log(product_list_url);

    window.app.kendoApp.navigate('#product_list', 'slide:right');

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: "POST"
                , url: product_list_url
                , dataType: "json"
            }
        },
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,
        pageSize: 10
    });

    Global.quick_order_id = -1;

    $("#product_list_ul").kendoMobileListView({
        dataSource: dataSource,
        template: kendo.template(product_list_template),
        fixedHeaders: true,
        dataBound: function () {
            $(".products_change_event").change(function () {
                create_new_order($(this));
            });
        }
    });

    //products_change_event
    //setTimeout(function (e) {
    //    $(".products_change_event").change(function () {
    //        create_new_order($(this));
    //    });
    //}, 1000);
}

function remove_customer_address(id, type, value) {
    if (id != -1) {
        var customer_phone_email_remove_url = baseUrl;
        customer_phone_email_remove_url = customer_phone_email_remove_url + "/partnerAddressDelete?id=" + id;

        $.ajax({
            type: "POST",
            url: customer_phone_email_remove_url,
            cache: false,
            success: function (data, statusText, xhr) {
                var id = data;

                console.log("item removed");
                ////alert("Phone number deleted Successfully");
                reload_customer_phone_and_email_list(type, value)
                ////load_customer_phone_list(Global.selected_customer_id)

                ////window.app.kendoApp.navigate('#:back', 'slide:right');
            }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                alert("Unable to delete, please try again");
            }
        });

    } else {
        reload_customer_phone_and_email_list(type, value)
    }
}

function reload_customer_phone_and_email_list(type, value) {
    if (type == "phone") {
        for (var i = 0; i < Global.temp_new_customer_phone_list.length; i++) {
            var item = Global.temp_new_customer_phone_list[i];
            if (item.value == value) {
                Global.temp_new_customer_phone_list.splice(i, 1);
                break;
            }
        }

        load_customer_phone_list();
    } else {
        for (var i = 0; i < Global.temp_new_customer_email_list.length; i++) {
            var item = Global.temp_new_customer_email_list[i];
            if (item.value == value) {
                Global.temp_new_customer_email_list.splice(i, 1);
                break;
            }
        }

        load_customer_email_list();
    }

    ////window.app.kendoApp.navigate('#:back', 'slide:right');
}

function get_vehicle_model(e) {
    var getBarndUrl = baseUrl + "/getModelbyBarand";
    var vehicle_brand_list = $("#vehicleBrand").data("kendoDropDownList");
    var brand_id = vehicle_brand_list.value()

    $("#vehicleModel").kendoDropDownList({
        autoBind: true,
        filter: "startswith",
        optionLabel: "--select--",
        dataTextField: "modelname",
        dataValueField: "id",
        dataSource: {
            serverFiltering: true,
            transport: {
                read: getBarndUrl + "?brand_id=" + brand_id,
                dataType: "json"
            }
        },
        index: 0,
    }).data("kendoDropDownList");

}

function get_customer_vehicle_list(customer_id) {

    var get_vehicle_list_by_customerid_url = baseUrl + "/getVehiclebyCustomerId?cust_id=" + customer_id;

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: "POST"
                , url: get_vehicle_list_by_customerid_url
                , dataType: "json"
            }
        },
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,
        pageSize: 10
    });

    $("#vehicle_listview").kendoMobileListView({
        dataSource: dataSource,
        template: kendo.template(Global.customer_vehicle_template),
        fixedHeaders: true,
        dataBound: function () {
            $("#vehicle_listview li").bind("click", function (e) {
                app.customerService.viewModel.edit_customer_vehicle($(this));
            });
            Global.Customer.VehicleLoaded = true;
            hideLoadIcon();
        }
    });
}

function load_customer_phone_list() {

    ////if (Global.temp_new_customer_phone_list.length > 0) {
    var dataSource = new kendo.data.DataSource({
        data: Global.temp_new_customer_phone_list,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,
        //pageSize: 10
    });

    $("#customer_phone_list").kendoMobileListView({
        dataSource: dataSource,
        template: kendo.template(Global.customer_phone_email_template),
        fixedHeaders: true,
        dataBound: function () {
            Global.Customer.PhoneLoaded = true;
            hideLoadIcon();
        }
    });
    ////}

}


function load_customer_email_list() {
    //debugger;
    ////if (Global.temp_new_customer_email_list.length > 0) {
    var dataSource = new kendo.data.DataSource({
        data: Global.temp_new_customer_email_list,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,
        //pageSize: 10
    });

    $("#customer_email_list").kendoMobileListView({
        dataSource: dataSource,
        template: kendo.template(Global.customer_phone_email_template),
        fixedHeaders: true,
        dataBound: function () {
            Global.Customer.EmailLoaded = true;
            hideLoadIcon();
        }
    });

}

//// load 
function load_customer_editpage(customerid) {
    app.kendoApp.navigate('#customer_form_view', 'slide:right');
    var selectedcustomer = null;

    var customer_detail_url = baseUrl + "/getCustomerbyId?id=" + customerid;
    $.ajax({
        type: "GET",
        url: customer_detail_url,
        cache: false,
        dataType: "json",
        success: function (data, statusText, xhr) {
            var customer_detail = data[0];
            Global.selected_customer_id = customer_detail.id;
            get_customer_vehicle_list(Global.selected_customer_id);

            //// view add vehiclebutton
            $(".additemlist").show();
            $("#add_customer span.km-text").html("Done");

            kendo.bind($("#customer_form_view"), customer_detail);

        }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
        }
    });
}


function create_new_order(e) {

    kendo.mobile.application.showLoading();
    //debugger;
    console.log("create order");
    var productid = e.data("id");
    var product_checked = e.is(":checked");
    if (product_checked == true) {
        //// Create Quick Order
        if (Global.create_job_from_order_edit_page == -1) {
            if (Global.quick_order_id == -1) {

                var currentdate = new Date();
                var datetime = currentdate.getFullYear() + ""
                            + (currentdate.getMonth() + 1) + ""
                            + currentdate.getDate() + "-"
                            + currentdate.getHours() + ""
                            + currentdate.getMinutes() + ""
                            + currentdate.getSeconds();
                var ordderName = Global.garage_id + "-" + datetime;
                var add_new_order = baseUrl;

                add_new_order = add_new_order + "/orderAdd?name=" + ordderName + "&description=&garageId=" + Global.garage_id + "&userId=" + Global.user_id + "&customerId=" + Global.selected_customer_id + "&vehicleId=" + Global.selected_vehicle_id + "&estimate=0&status=recommendation";
                console.log(add_new_order);
                $.ajax({
                    type: "POST",
                    url: add_new_order,
                    cache: false,
                    success: function (data, statusText, xhr) {
                        var id = data;
                        //debugger;
                        Global.quick_order_id = id;
                        console.log("order created");

                        //// create task to the quick order
                        var add_new_job = baseUrl;
                        add_new_job = add_new_job + "/jobAdd?order_id=" + Global.quick_order_id + "&product_id=" + productid + "&estimated_cost=0&actual_cost=0&estimated_finish_time=&actual_finish_time=";
                        console.log(add_new_job);
                        $.ajax({
                            type: "POST",
                            url: add_new_job,
                            cache: false,
                            success: function (data, statusText, xhr) {
                                //debugger;
                                var id = data;
                                $(e).attr("data-taskid", id);
                                var link = $(e).parent().find('a');
                                if(link.length>0)
                                    $(link).attr("data-parent-jobid", id);
                                $(e).attr("data-parent-jobid", id);
                                kendo.mobile.application.hideLoading();
                                console.log("job added successfully");
                            }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                                kendo.mobile.application.hideLoading();
                                console.log("Unable to add job");
                            }
                        });

                    }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                        kendo.mobile.application.hideLoading();
                        console.log("Unable to add order");
                    }
                });
            } else {
                console.log("order created");
                //// create task to the quick order
                var add_new_job = baseUrl;
                add_new_job = add_new_job + "/jobAdd?order_id=" + Global.quick_order_id + "&product_id=" + productid + "&estimated_cost=0&actual_cost=0&estimated_finish_time=&actual_finish_time=";
                console.log(add_new_job);
                $.ajax({
                    type: "POST",
                    url: add_new_job,
                    cache: false,
                    success: function (data, statusText, xhr) {
                        //debugger;
                        var id = data;
                        $(e).attr("data-taskid", id);
                        $(e).attr("data-parent-jobid", id);                       
                        var link = $(e).parent().find('a');
                        if (link.length > 0)
                            $(link).attr("data-parent-jobid", id);
                        kendo.mobile.application.hideLoading();
                        console.log("job added/updated successfully");
                    }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                        kendo.mobile.application.hideLoading();
                        console.log("Unable to add job");
                    }
                });
            }
        } else {
            //// create task to the quick order
            var add_new_job = baseUrl;
            add_new_job = add_new_job + "/jobAdd?order_id=" + Global.selected_order_id + "&product_id=" + productid + "&estimated_cost=0&actual_cost=0&estimated_finish_time=&actual_finish_time=";
            console.log(add_new_job);
            $.ajax({
                type: "POST",
                url: add_new_job,
                cache: false,
                success: function (data, statusText, xhr) {
                    //debugger;
                    var id = data;
                    $(e).attr("data-taskid", id);
                    $(e).attr("data-parent-jobid", id);
                    var link = $(e).parent().find('a');
                    if (link.length > 0)
                        $(link).attr("data-parent-jobid", id);
                    kendo.mobile.application.hideLoading();
                    console.log("job added/updated successfully");
                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    kendo.mobile.application.hideLoading();
                    console.log("Unable to add job");
                }
            });
        }
        console.log("selected product id:" + productid);
        $("#load_sub_products" + productid).show();
    } else {
        kendo.mobile.application.hideLoading();
        //// remove task
        //var model = $("#add_new_task_form").find("#product_type_ddl_list").get(0).kendoBindingTarget.source;
        var modelTarget = null;
        modelTarget = $("#add_new_task_form").find("#product_type_ddl_list");
        //debugger;
        if (modelTarget.length > 0)
            modelTarget = modelTarget.get(0).kendoBindingTarget;
        else
            modelTarget = null;
        var job_id = -1;
        var model = null;

        if (modelTarget != null) {
            model = modelTarget.source;
            job_id = model.id;
        }
        else {
            //debugger;
            var taskid = e.data("taskid");
            job_id = taskid;
        }

        var remove_vehicle_url = baseUrl + "/jobDelete?id=" + job_id;
        console.log(remove_vehicle_url);
        $.ajax({
            type: "POST",
            url: remove_vehicle_url,
            cache: false,
            success: function (data, statusText, xhr) {
                var id = data;
                //alert("Job deleted");
                //get_order_task_list(Global.selected_order_id)
                //Global.quick_order_id = -1;
                //load_order_edit(Global.selected_order_id)

            }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                alert("Unable to remove job");
            }
        });
    }
}

function create_sub_task_for_order(e) {

    kendo.mobile.application.showLoading();

    console.log("create sub task for product");
    var productid = e.data("id");
    var product_checked = e.is(":checked");
    var product_parent_job = e.attr("data-parent-jobid");
    if (product_checked == true) {

        var selected_order_id = "";
        //debugger;
        if (Global.selected_order_id > 0) {
            selected_order_id = Global.selected_order_id;
            //selected_order_id = Global.selected_order_id;
        }
        else {
            selected_order_id = Global.quick_order_id;
        }



        //// create task to the quick order
        var add_new_job = baseUrl;
        add_new_job = add_new_job + "/jobAdd?order_id=" + selected_order_id + "&product_id=" + productid + "&estimated_cost=0&actual_cost=0&estimated_finish_time=&actual_finish_time=";
        if (product_parent_job != undefined && product_parent_job != null) {
            add_new_job = add_new_job + "&parent_task_id=" + product_parent_job;
        }

        console.log(add_new_job);
        $.ajax({
            type: "POST",
            url: add_new_job,
            cache: false,
            success: function (data, statusText, xhr) {
                var id = data;
                $(e).attr("data-taskid", id);
                console.log("job added/updated successfully");
            }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                console.log("Unable to add job");
            }
        });
    } else {
        //// remove task
        var model = $("#add_new_task_form").find("#product_type_ddl_list").get(0).kendoBindingTarget.source;

        var job_id = model.id;

        var remove_vehicle_url = baseUrl + "/jobDelete?id=" + job_id;

        $.ajax({
            type: "POST",
            url: remove_vehicle_url,
            cache: false,
            success: function (data, statusText, xhr) {
                var id = data;
                alert("Job deleted");
                //Global.quick_order_id = null;
                //get_order_task_list(Global.selected_order_id)
                load_order_edit(Global.selected_order_id)
            }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                alert("Unable to remove job");
            }
        });
    }

    kendo.mobile.application.hideLoading();

}

//function load_ddl_item(type,controlId) {
//    var url = baseUrl;

//    var htmlTemplate = '<span data-id="#=id#" data-value="#=name#" data-controlid="' + controlId + '">#=name#</span>';

//    ////'<span>#=name#</span><a data-id="#=id#" data-role="detailbutton" data-controlid="' + controlId + '" data-style="detaildisclose" data-rel="actionsheet"></a>  ';

//    app.kendoApp.navigate('#dropdownListView', 'slide:right');


//    if (type == 'brand') {
//        url += "/getBrand";
//    } else {

//        $("#dropdown_list_item_list_ul").empty();

//        var brandId = Global.selected_brand_id;

//        if (brandId == undefined)
//            return;

//        if (brandId == '' || brandId == '0')
//            return;

//        htmlTemplate = '<span data-id="#=id#" data-value="#=modelname#" data-controlid="' + controlId + '">#=modelname#</span>';

//        url += "/getModelbyBarand?brand_id=" + brandId
//    }

//    console.log(url);

//    var dataSource = new kendo.data.DataSource({
//        transport: {
//            read: {
//                type: "POST"
//                , url: url
//                , dataType: "json"
//            }
//        },
//        serverPaging: true,
//        serverFiltering: true,
//        serverSorting: true,
//        pageSize: 10
//    });

//    $("#dropdown_list_item_list_ul").kendoMobileListView({
//        dataSource: dataSource,
//        template: kendo.template(htmlTemplate),
//        fixedHeaders: true
//    });

//    $("#dropdown_list_item_list_ul").empty();

//    //// click event
//    setTimeout(function (e) {
//        $("#dropdown_list_item_list_ul li").bind("click", function (e) {
//            BindDropdownList($(this));
//        });
//    }, 1000);
//}

//function BindDropdownList(e) {
//    var id = $(e).children("span").data('id');
//    var control = $(e).children("span").data('controlid');
//    var Value = $(e).children("span").data('value');

//    if (control == 'vehicleBrand') {
//        $('#vehicleModel').val("--select--");
//        $('#vehicleModel').attr('data-itemid', '');
//        Global.selected_brand_id = id;
//    }

//    $('#'+control).attr('data-itemid', id);
//    $('#' + control).val(Value);
//    app.kendoApp.navigate('#:back', 'slide:right');
//}


function hideLoadIcon() {
    if (Global.Customer != undefined) {
        if (Global.Customer.PhoneLoaded == true && Global.Customer.EmailLoaded == true && Global.Customer.VehicleLoaded == true) {
            kendo.mobile.application.hideLoading();
        }
    }
};


function bindCustomerCheckBoxClicked() {
    $("#customer_phone_list").find("input[type=radio]").change(function (input) {
        CheckBoxClicked($(this));
    });

    $("#customer_email_list").find("input[type=radio]").change(function (input) {
        CheckBoxClicked($(this));
    });
};

function CheckBoxClicked(e) {
    //debugger;
    var IsChecked = $(e).is(':checked');
    //km-widget km-icon km-check    
    if ($(e).hasClass("km-check") == false)
        $(e).addClass("km-check");
    if ($(e).hasClass("km-icon") == false)
        $(e).addClass("km-icon");
    $(e).removeClass("km-widget");
    if (IsChecked) {
        $(e).addClass("km-widget");
    }
};