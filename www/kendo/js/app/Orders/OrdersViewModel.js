define([
    'kendo',
    'text!ordersTemplate',
    'text!ordersTaskTemplate',
    'text!order_task_view_template',
    './../../app/Customer/CustomerViewModel',
    'text!order_sub_task_template',
    'text!subproduct_list_template',
     'text!product_list_template',
], function (kendo, ordersTemplate, orderstaskTemplate, order_task_view_template, customerViewModel, order_sub_task_template, subproduct_list_template, product_list_template) {
    return kendo.data.ObservableObject.extend({
        orderDataSource: null,

        init: function (listView) {
            var self = this;
            //debugger;
            //  //app.ordersService.viewModel = new ordersViewModel($("#order_list_ul"));
            if (customerViewModel == undefined) {
                customerViewModel = Global.ordersViewModel;
            }

            if (Global.order_view_loads_from_garage == 0) {
                if (Global.order_view_service_model == null) {
                    listView.kendoMobileListView({
                        template: kendo.template(ordersTemplate)
                    });
                }
            } else {
                Global.order_view_loads_from_garage = 1;
            }


            kendo.data.ObservableObject.fn.init.apply(self, []);
            Global.orders_task_list_template = orderstaskTemplate;

            if (Global.order_view_loads_from_garage == 0) {
                if (Global.order_view_service_model == null) {
                    var getorder_details = baseUrl + "/getOrderDetails?garage_id=" + Global.garage_id + "&state=recommendation";
                    var dataSource = new kendo.data.DataSource({
                        transport: {
                            read: {
                                type: "POST"
                                , url: getorder_details
                                , dataType: "json"
                            }
                        }, change: function (e) {
                            console.log(getorder_details);
                        },
                        serverPaging: true,
                        serverFiltering: true,
                        serverSorting: true,
                        pageSize: 10
                    });

                    listView.kendoMobileListView({
                        dataSource: dataSource,
                        template: kendo.template(ordersTemplate),
                        //,filterable: true 
                        filterable: {
                            field: "name",
                            operator: "startswith"
                        },
                    });
                    self.set("orderDataSource", dataSource);
                }
            } else {
                Global.order_view_loads_from_garage = 0;
            }
        },
        order_detail_view: function (e) {

            var orderId = $(e.target).data("orderid");

            //$(".commondueon").slideUp();
            $(".order_job_list_item").slideUp();
            $(".jobtext").slideUp();


            //edit button hide
            $(".order_item_view").slideDown();
            //debugger;

            if (Global.SelectedOrderView != orderId) {
                $(".orderdownarrow" + orderId).removeClass('imagerotated');
                //$(".orderdownarrow" + orderId).attr(' data-icon','fa-down');
            }

            if (!($(".orderdownarrow" + orderId).hasClass("imagerotated"))) {
                //debugger;
                //// load order job list item
                var jobListUrl = baseUrl + "/getTaskByOrderId?orderId=" + orderId;
                console.log(jobListUrl);
                //debugger;
                $(".order_job_list_item" + orderId).empty();


                //kendo.bind($(".order_job_list_item" + orderId), app.customerService.viewModel);
                var dataSourceJobList = new kendo.data.DataSource({
                    transport: {
                        read: {
                            type: "POST"
                            , url: jobListUrl
                            , dataType: "json"
                        }
                    },
                    serverPaging: true,
                    serverFiltering: true,
                    serverSorting: true,
                    pageSize: 10
                });

                $(".order_job_list_item" + orderId).kendoMobileListView({
                    dataSource: dataSourceJobList,
                    template: kendo.template(order_task_view_template),
                    fixedHeaders: true
                });

                $(".order_job_list_item" + orderId).slideDown();
                $(".jobtext" + orderId).slideDown();
                //$(".dueon" + orderId).slideDown();

                //// hide edit button
                //$("#orderedit" + orderId).slideUp();
                Global.SelectedOrderView = orderId;
                //debugger;
                $(".orderdownarrow" + orderId).addClass('imagerotated');
            } else {

                $(".orderdownarrow" + orderId).removeClass("imagerotated");
                //Global.SelectedOrderView = orderId;
            }


        },
        load_customer_order_form: function (e) {
            var user_id = "";
            var order_id = "";
            var customerUrl = baseUrl + "/getAllCustomer/";
            var vehicleUrl = baseUrl + "";//"/vehicle/";
            var serviceUrl = baseUrl + "/getService?type=service";

            $('#customer_ddl_list').attr('data-itemid', '');
            $('#vehicle_ddl_list').attr('data-itemid', '');
            $('#service_ddl_list').attr('data-itemid', '');
            $('#status_ddl_list').attr('data-itemid', '');

            $("#customer_ddl_list").val("--select--");
            $("#vehicle_ddl_list").val("--select--");
            $("#service_ddl_list").val("--select--");
            $("#status_ddl_list").val("--select--");

            //$("#add_order span.km-text").text("Add");
            //debugger;

            //debugger;
            $("#update_order").hide();
            $("#add_order").show();
            //debugger;
            if (order_id > 0) {
                //// Gets selected order
                kendo.bind($("#order_form_view"), selectedcustomer);
            }


        },
        load_order_job_form: function (e) {
            $("#estimated_finish_date").kendoDateTimePicker({
                value: new Date(), format: "yyyy/MM/dd h:mm tt"

            });
            $("#actual_finish_date").kendoDateTimePicker({
                value: new Date(), format: "yyyy/MM/dd h:mm tt"
            });

            var productTypeUrl = baseUrl + "/getService";

            //// product type list ddl
            $("#product_type_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "-- select --",
                dataTextField: "name",
                dataValueField: "id",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: productTypeUrl,
                        dataType: "json"
                    }
                },
                index: 0,
            }).data("kendoDropDownList");

        },
        Order_Page_JobRefresh: function (e) {
            get_order_task_list(Global.selected_order_id);
        },
        load_sub_product_list: function (e) {
            //debugger;
            load_sub_product_list(e, subproduct_list_template);
        }, order_form_view: function (e) {
            app.kendoApp.navigate('#order_form_view', 'slide:right');
            var new_order = {
                id: -1,
                customer_id: -1,
                vehicle_id: -1,
                service_id: -1,
                status_id: 'recommendation',
                estimation_cost: 0,
                order_description: '',
                order_name :''
            };
            Global.selected_order_id = -1;

            $(".new_task_block").hide();

            //$("#add_order span.km-text").text("Add");

            //debugger;
            $("#update_order").hide();
            $("#add_order").show();

            $('#customer_ddl_list').attr('data-itemid', '');
            $('#vehicle_ddl_list').attr('data-itemid', '');
            $('#service_ddl_list').attr('data-itemid', '');
            $('#status_ddl_list').attr('data-itemid', '');

            $("#customer_ddl_list").val("--select--");
            $("#vehicle_ddl_list").val("--select--");
            $("#service_ddl_list").val("--select--");
            $("#status_ddl_list").val("--select--");

            //debugger;
            kendo.bind($("#order_form_view"), new_order);

        },
        edit_order: function (e) {
            var orderId = $(e.target).data("orderid");
            Global.selected_order_id = orderId;

            load_selected_orderDetail(e);

        },
        add_new_order: function (e) {

            var model = $("#order_form_view").find("#order_name").get(0).kendoBindingTarget.source;

            $("#order_task_list").empty();
            $(".new_task_block").hide();

            var add_new_order = baseUrl;

            model.customer_id = $("#customer_ddl_list").data("itemid");
            model.vehicle_id = $("#vehicle_ddl_list").data("itemid");
            model.service_id = $("#service_ddl_list").data("itemid");
            model.status_id = $("#status_ddl_list").data("itemid");
            var currentdate = new Date();
            var datetime = currentdate.getFullYear() + ""
                        + (currentdate.getMonth() + 1) + ""
                        + currentdate.getDate() + "-"
                        + currentdate.getHours() + ""
                        + currentdate.getMinutes() + ""
                        + currentdate.getSeconds();
            var ordderName = Global.garage_id + "-" + datetime;

            if (model.id == -1) {
                add_new_order = add_new_order + "/orderAdd?name=" + ordderName + "&description=" + model.order_description + "&garageId=" + Global.garage_id + "&userId=" + Global.user_id + "&customerId=" + model.customer_id + "&vehicleId=" + model.vehicle_id + "&estimate=" + model.estimation_cost + "&status=" + model.status_id;
            } else {
                add_new_order = add_new_order + "/orderEdit?id=" + model.id + "&name=" + model.order_name + "&description=" + model.order_description + "&garageId=" + Global.garage_id + "&userId=" + Global.user_id + "&customerId=" + model.customer_id + "&vehicleId=" + model.vehicle_id + "&estimate=" + model.estimation_cost + "&status=" + model.status_id;
            }

            ////productId=" + model.service_id + "&

            console.log(add_new_order);

            $.ajax({
                type: "POST",
                url: add_new_order,
                cache: false,
                success: function (data, statusText, xhr) {
                    var id = data;
                    Global.selected_order_id = id;
                    alert("Order added/updated successfully");
                    $(".new_task_block").show();

                    get_order_task_list(Global.selected_order_id);

                    //debugger;
                    //$("#add_order span.km-text").html("Update");
                    $("#update_order").show();
                    $("#add_order").hide();

                    $("#update_order span.km-text").css('font-family', 'play');

                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    alert("Unable to add order");
                }
            });

            //app.ordersService.viewModel = new ordersViewModel(e.view.element.find("#order_list_ul"));
            //Global.order_view_service_model = app.ordersService.viewModel;
            //kendo.bind($("#order_list"), app.ordersService.viewModel);
            // debugger;
            if (app.ordersService.viewModel == undefined) {
                app.ordersService.viewModel = new ordersViewModel($("#order_list_ul"));
                this.init();
            }

        },
        view_add_new_task_form: function (e) {
            //addNewTask

            var add_new_task = {
                id: -1,
                order_id: -1,
                product_id: -1,
                product_name : '',
                estimated_cost: 0,
                actual_cost: 0,
                estimated_finish_time: "",
                actual_finish_time: "",
            };
            //debugger;
            var productTypeUrl = baseUrl + "/getService?type=product";

            //// product type list ddl
            $("#product_type_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "-- select --",
                dataTextField: "name",
                dataValueField: "id",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: productTypeUrl,
                        dataType: "json"
                    }
                },
                index: 0,
            }).data("kendoDropDownList");

            $("#remove_task").hide();

            //$("#add_task span.km-text").html("Add");

            $("#add_task span.km-text").text("Add");
            $("#add_task span.km-icon").removeClass("km-fa-ok");
            $("#add_task span.km-icon").addClass("km-fa-plus");

            app.kendoApp.navigate('#add_new_task_form', 'slide:right');
            kendo.bind($("#add_new_task_form"), add_new_task);

        },
        add_new_task: function (e) {
            //var model = $("#add_new_task_form").kendoBindingTarget.source;
            var model = $("#add_new_task_form").find("#product_type_ddl_list_name").get(0).kendoBindingTarget.source;
          
            var str_estimated_finish_time = kendo.toString(model.estimated_finish_time, "yyyy-MM-dd H:mm:ss"); 
            var str_actual_finish_time = kendo.toString(model.actual_finish_time, "yyyy-MM-dd H:mm:ss");
            //debugger;
            var add_new_job = baseUrl;
            if (model.id == -1) {
                add_new_job = add_new_job + "/jobAdd?order_id=" + Global.selected_order_id + "&product_id=" + model.product_id + "&estimated_cost=" + model.estimated_cost + "&actual_cost=" + model.actual_cost;
            } else {
                add_new_job = add_new_job + "/jobEdit?id=" + model.id + "&order_id=" + Global.selected_order_id + "&product_id=" + model.product_id + "&estimated_cost=" + model.estimated_cost + "&actual_cost=" + model.actual_cost;
            }

            if (str_estimated_finish_time != null) {
                add_new_job = add_new_job + "&estimated_finish_time=" + str_estimated_finish_time;
            }

            if (str_actual_finish_time != null) {
                add_new_job = add_new_job + "&actual_finish_time=" + str_actual_finish_time;
            }
            console.log(add_new_job);
            //debugger;

            $.ajax({
                type: "POST",
                url: add_new_job,
                cache: false,
                success: function (data, statusText, xhr) {
                    var id = data;
                    alert("job added/updated successfully");
                    Global.SelectedWorkOrder = {};
                    get_order_task_list(Global.selected_order_id);
                    debugger;
                    app.kendoApp.navigate('#order_form_view', 'slide:right');
                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    alert("Unable to add job");
                }
            });
        },
        remove_job_from_order: function (e) {

            Global.SelectedWorkOrder = {};

            var model = $("#add_new_task_form").find("#product_type_ddl_list_name").get(0).kendoBindingTarget.source;

            var job_id = model.id;

            var remove_vehicle_url = baseUrl + "/jobDelete?id=" + job_id;

            $.ajax({
                type: "POST",
                url: remove_vehicle_url,
                cache: false,
                success: function (data, statusText, xhr) {
                    var id = data;
                    alert("Job deleted");
                    //get_order_task_list(Global.selected_order_id)
                    load_order_edit(Global.selected_order_id)
                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    alert("Unable to remove job");
                }
            });

        },
        edit_vehicle_form: function (e) {

            $("#remove_task").show();
            //debugger;
            var job_id = $(e.button).data('job-id');
            var IsSubTask = $(e.button).data('issubtask');
            if (job_id == null)
                job_id = $(e[0]).find('span').attr('data-job-id');
            if (IsSubTask == null)
                IsSubTask = $(e[0]).find('span').attr('data-issubtask');


            if (Global.SelectedWorkOrder == undefined) {
                Global.SelectedWorkOrder = {};
            }

            Global.SelectedWorkOrder.job_id = job_id;
            Global.SelectedWorkOrder.IsSubTask = IsSubTask;

            //// hide sub task button.
            if (IsSubTask == 1) {
                $('.subproductcontent').hide();
            } else {
                $('.subproductcontent').show();
                //debugger;
                var parent_product_id = $(e[0]).find('span').attr('data-product-id');
                $('#link_sub_product_load').attr('data-parent-jobid', job_id);
                $('#link_sub_product_load').attr('data-product-id', parent_product_id);
            }

            var get_selected_job_detail = baseUrl + "/getJobbyId?job_id=" + job_id;

            var add_new_task = {
                id: -1,
                order_id: -1,
                product_id: -1,
                estimated_cost: 0,
                actual_cost: 0,
                estimated_finish_time: "",
                actual_finish_time: "",
            };

            console.log(get_selected_job_detail);

            //// gets Vehicle detail
            $.ajax({
                type: "GET",
                url: get_selected_job_detail,
                cache: false,
                dataType: "json",
                success: function (data, statusText, xhr) {

                    if (data.length > 0) {
                        var selected_job = data[0];
                        //add_new_task.order_id = job_id;
                        add_new_task.id = selected_job.id;
                        add_new_task.product_id = selected_job.product_id[0];
                        add_new_task.product_name = selected_job.product_id[1];
                        add_new_task.estimated_cost = selected_job.estimated_cost;
                        add_new_task.actual_cost = selected_job.actual_cost;
                        add_new_task.estimated_finish_time = selected_job.estimated_finish_time;
                        add_new_task.actual_finish_time = selected_job.actual_finish_time;

                        window.app.kendoApp.navigate('#add_new_task_form', 'slide:right');
                        kendo.bind($("#add_new_task_form"), add_new_task);

                        $("#add_task span.km-text").text("Done");
                        $("#add_task span.km-icon").removeClass("km-fa-plus");
                        $("#add_task span.km-icon").addClass("km-fa-ok");
                        //km-icon km-fa-plus


                        //kendo.parseDate(add_new_task.estimated_finish_time, "dd/MM/yyyy h:mm:ss tt");

                        //var actual_finish_time = kendo.toString(add_new_task.actual_finish_time, 'yyyy-MM-dd H:mm:ss')
                        //kendo.parseDate(add_new_task.actual_finish_time, "dd/MM/yyyy h:mm:ss tt");
                        //var str_actual_finish_time = kendo.toString(actual_finish_time, "yyyy-MM-dd h:mm:ss");
                        //debugger;
                        //estimated_finish_date.value(add_new_task.estimated_finish_time);
                        //$("#estimated_finish_date").val(add_new_task.estimated_finish_time);
                        var estimated_finish_time = kendo.parseDate(add_new_task.estimated_finish_time, 'yyyy-MM-dd H:mm:ss')
                        var estimated_finish_timeCtrl = $("#estimated_finish_date").data("kendoDateTimePicker");
                        estimated_finish_timeCtrl.value(estimated_finish_time);

                        //var actual_finish_date = $("#actual_finish_date").data("kendoDateTimePicker");

                        //actual_finish_date.value(add_new_task.actual_finish_time);
                        //$("#actual_finish_date").val(add_new_task.actual_finish_time);
                        var actual_finish_time = kendo.parseDate(add_new_task.actual_finish_time, 'yyyy-MM-dd H:mm:ss')
                        var actual_finish_timeCtrl = $("#actual_finish_date").data("kendoDateTimePicker");
                        actual_finish_timeCtrl.value(actual_finish_time);
                        //debugger;
                        //// Load sub product list to add sub products.
                        var subtaskurl = baseUrl + "/getTaskByOrderId?orderId=" + Global.selected_order_id + "&parent_task_id=" + job_id;
                        console.log("get sub product list:" + subtaskurl);
                        var dataSource = new kendo.data.DataSource({
                            transport: {
                                read: {
                                    type: "POST"
                                    , url: subtaskurl
                                    , dataType: "json"
                                }
                            },
                            serverPaging: true,
                            serverFiltering: true,
                            serverSorting: true,
                            pageSize: 10
                        });

                        $("#sub_product_list_edit_ul").kendoMobileListView({
                            dataSource: dataSource,
                            template: kendo.template(order_sub_task_template),
                            fixedHeaders: true
                        });
                        //// sub product load end
                    }

                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                }
            });
        },
        load_product_list_from_orders: function (e) {
            Global.create_job_from_order_edit_page = 1;
            //app.customerService.viewModel = new customerViewModel($("#customer_list_ul"));
            //app.customerService.viewModel.load_product_list_from_order(e);
            //// cretes job for already added order
            Global.quick_order_id = -1;
            load_product_list_common(product_list_template);
            //load_product_list();
        },
        regresh_add_new_task_form: function (e) {

            $("#remove_task").show();
            //debugger;
            var job_id = null;
            var IsSubTask = null;
            //debugger;
            if (Global.SelectedWorkOrder != undefined) {
                job_id = Global.SelectedWorkOrder.job_id;
                IsSubTask = Global.SelectedWorkOrder.IsSubTask;


                //// hide sub task button.
                if (IsSubTask == 1) {
                    $('.subproductcontent').hide();
                } else {
                    $('.subproductcontent').show();
                    //debugger;
                    var parent_product_id = $(e[0]).find('span').attr('data-product-id');
                    $('#link_sub_product_load').attr('data-parent-jobid', job_id);
                    $('#link_sub_product_load').attr('data-product-id', parent_product_id);
                }

                var get_selected_job_detail = baseUrl + "/getJobbyId?job_id=" + job_id;

                var add_new_task = {
                    id: -1,
                    order_id: -1,
                    product_id: -1,
                    estimated_cost: 0,
                    actual_cost: 0,
                    estimated_finish_time: "",
                    actual_finish_time: "",
                };

                console.log(get_selected_job_detail);

                //// gets Vehicle detail
                $.ajax({
                    type: "GET",
                    url: get_selected_job_detail,
                    cache: false,
                    dataType: "json",
                    success: function (data, statusText, xhr) {

                        if (data.length > 0) {
                            var selected_job = data[0];
                            //add_new_task.order_id = job_id;
                            add_new_task.id = selected_job.id;
                            add_new_task.product_id = selected_job.product_id[0];
                            add_new_task.product_name = selected_job.product_id[1];
                            add_new_task.estimated_cost = selected_job.estimated_cost;
                            add_new_task.actual_cost = selected_job.actual_cost;
                            add_new_task.estimated_finish_time = selected_job.estimated_finish_time;
                            add_new_task.actual_finish_time = selected_job.actual_finish_time;

                            window.app.kendoApp.navigate('#add_new_task_form', 'slide:right');
                            kendo.bind($("#add_new_task_form"), add_new_task);

                            $("#add_task span.km-text").text("Done");
                            $("#add_task span.km-icon").removeClass("km-fa-plus");
                            $("#add_task span.km-icon").addClass("km-fa-ok");

                            var estimated_finish_time = kendo.parseDate(add_new_task.estimated_finish_time, 'yyyy-MM-dd H:mm:ss')
                            var estimated_finish_timeCtrl = $("#estimated_finish_date").data("kendoDateTimePicker");
                            estimated_finish_timeCtrl.value(estimated_finish_time);

                            var actual_finish_time = kendo.parseDate(add_new_task.actual_finish_time, 'yyyy-MM-dd H:mm:ss')
                            var actual_finish_timeCtrl = $("#actual_finish_date").data("kendoDateTimePicker");
                            actual_finish_timeCtrl.value(actual_finish_time);
                            //debugger;
                            //// Load sub product list to add sub products.
                            var subtaskurl = baseUrl + "/getTaskByOrderId?orderId=" + Global.selected_order_id + "&parent_task_id=" + job_id;
                            console.log("get sub product list:" + subtaskurl);
                            var dataSource = new kendo.data.DataSource({
                                transport: {
                                    read: {
                                        type: "POST"
                                        , url: subtaskurl
                                        , dataType: "json"
                                    }
                                },
                                serverPaging: true,
                                serverFiltering: true,
                                serverSorting: true,
                                pageSize: 10
                            });

                            $("#sub_product_list_edit_ul").kendoMobileListView({
                                dataSource: dataSource,
                                template: kendo.template(order_sub_task_template),
                                fixedHeaders: true
                            });
                            //// sub product load end
                        }

                    }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    }
                });
            }
        }, Order_Page_Hide: function (e) {
            //debugger;
            //Global.order_id = -1;
        }
    });
});


function get_customer_vehicle_list_dll() {


    var selected_customer_value = $("#customer_ddl_list").data("kendoDropDownList");
    var customer_id = selected_customer_value.value()
    var vehicle_url = baseUrl + "/getVehiclebyCustomerId?cust_id=" + customer_id;

    $.ajax({
        type: "GET",
        url: vehicle_url,
        cache: false,
        dataType: "json",
        success: function (data, statusText, xhr) {

            var vehicle_list = [{ 'vehicle_id': -1, 'vehicle_name': '', 'id': -1 }];

            $.each(data, function (index, obj) {
                vehicle_list.push({ 'vehicle_id': obj.vehicle_id[0], 'vehicle_name': obj.vehicle_id[1], 'id': obj.id });
            });

            if (vehicle_list.length > 1) {
                vehicle_list.splice(0, 1);
            }

            //// vehicle list ddl
            $("#vehicle_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "--select--",
                dataTextField: "vehicle_name",
                dataValueField: "vehicle_id",
                dataSource: {
                    serverFiltering: true,
                    data: vehicle_list,
                },
                index: 0,
            }).data("kendoDropDownList");


        }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
        }
    });
}

function get_customer_vehicle_list_edit(customer_id) {
    var vehicle_url = baseUrl + "/getVehiclebyCustomerId?cust_id=" + customer_id;

    console.log(vehicle_url);

    $.ajax({
        type: "GET",
        url: vehicle_url,
        cache: false,
        dataType: "json",
        success: function (data, statusText, xhr) {

            var vehicle_list = [{ 'vehicle_id': -1, 'vehicle_name': '', 'id': -1 }];

            $.each(data, function (index, obj) {
                vehicle_list.push({ 'vehicle_id': obj.vehicle_id[0], 'vehicle_name': obj.vehicle_id[1], 'id': obj.id });
            });

            if (vehicle_list.length > 1) {
                vehicle_list.splice(0, 1);
            }

            //// vehicle list ddl
            $("#vehicle_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "--select--",
                dataTextField: "vehicle_name",
                dataValueField: "vehicle_id",
                dataSource: {
                    serverFiltering: true,
                    data: vehicle_list,
                },
                index: 0,
            }).data("kendoDropDownList");


        }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
        }
    });
}

function get_order_task_list(order_id) {

    var get_order_task_list_url = baseUrl + "/getJobbyOrderId?order_id=" + order_id;
    Global.order_id = order_id;
    Global.SelectedWorkOrder = {};
    $("#order_task_list").empty();
    //debugger;
    console.log(get_order_task_list_url);
    //console.log(Global.orders_task_list_template);
    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: "POST"
                , url: get_order_task_list_url
                , dataType: "json"
            }
        },
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,
        pageSize: 10
    });

    $("#order_task_list").kendoMobileListView({
        dataSource: dataSource,
        template: kendo.template(Global.orders_task_list_template),
        fixedHeaders: true,
        dataBound: function () {
            //app.ordersService.viewModel.edit_vehicle_form
            $("#order_task_list li").bind("click", function (e) {
                app.ordersService.viewModel.edit_vehicle_form($(this));
            });
        }
    });

}

function load_order_edit(orderId) {
    Global.selected_order_id = orderId;
    var editOrderUrl = baseUrl + "/getOrderDetailsbyOrderId?order_id=" + Global.selected_order_id;

    //// Gets Order to Edit
    $.ajax({
        type: "GET",
        url: editOrderUrl,
        cache: false,
        dataType: "json",
        success: function (data, statusText, xhr) {
            //alert("getcustomer");
            app.kendoApp.navigate('#order_form_view', 'slide:right');
            var item = data[0];
            $(".new_task_block").show();

            var edit_order = {
                id: item.id,
                order_name: item.name,
                order_description: item.description,
                customer_id: item.customer_id[0],
                vehicle_id: item.vehicle_id[0],
                service_id: item.product_id[0],
                estimation_cost: item.estimated_cost,
                status_id: item.state,
            };

            Global.selected_customer_ddl = edit_order.customer_id;

            $('#customer_ddl_list').attr('data-itemid', edit_order.customer_id);
            $('#vehicle_ddl_list').attr('data-itemid', edit_order.vehicle_id);
            $('#service_ddl_list').attr('data-itemid', edit_order.service_id);
            $('#status_ddl_list').attr('data-itemid', edit_order.status_id);

            $('#customer_ddl_list').val(item.customer_id[1]);
            $('#vehicle_ddl_list').val(item.vehicle_id[1]);
            $('#service_ddl_list').val(item.product_id[1]);
            $('#status_ddl_list').val(item.state);

            //load customer vehicle
            //get_customer_vehicle_list_edit(edit_order.customer_id);

            get_order_task_list(orderId);

            //$("#add_order span.km-text").html("Update");

            //debugger;
            $("#update_order").show();
            $("#add_order").hide();
            //if ($("#update_order span.km-text").hasClass('fa') == false)
            $("#update_order span.km-text").css('font-family', 'play');
            //debugger;
            kendo.bind($("#order_form_view"), edit_order);

            //kendo.bind($("#order_form_view"), new_order);
        }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response

        }
    });
}

function load_selected_orderDetail(e) {
    var orderId = $(e).data("orderid");

    if (orderId != undefined) {
        Global.selected_order_id = orderId;
    }

    var editOrderUrl = baseUrl + "/getOrderDetailsbyOrderId?order_id=" + Global.selected_order_id;

    //// Gets Order to Edit
    $.ajax({
        type: "GET",
        url: editOrderUrl,
        cache: false,
        dataType: "json",
        success: function (data, statusText, xhr) {

            window.app.kendoApp.navigate('#order_form_view', 'slide:right');

            var item = data[0];
            $(".new_task_block").show();

            var edit_order = {
                id: item.id,
                order_name: item.name,
                order_description: item.description,
                customer_id: item.customer_id[0],
                vehicle_id: item.vehicle_id[0],
                service_id: item.product_id[0],
                estimation_cost: item.estimated_cost,
                status_id: item.state,
            };

            Global.selected_customer_ddl = edit_order.customer_id;

            $('#customer_ddl_list').attr('data-itemid', edit_order.customer_id);
            $('#vehicle_ddl_list').attr('data-itemid', edit_order.vehicle_id);
            $('#service_ddl_list').attr('data-itemid', edit_order.service_id);
            $('#status_ddl_list').attr('data-itemid', edit_order.status_id);

            $('#customer_ddl_list').val(item.customer_id[1]);
            $('#vehicle_ddl_list').val(item.vehicle_id[1]);
            $('#service_ddl_list').val(item.product_id[1]);
            $('#status_ddl_list').val(item.state);

            //load customer vehicle
            //get_customer_vehicle_list_edit(edit_order.customer_id);

            get_order_task_list(Global.selected_order_id);

            //$("#add_order span.km-text").html("Update");

            //debugger;

            $("#update_order").show();
            $("#add_order").hide();

            $("#update_order span.km-text").css('font-family', 'play');
            //debugger;
            kendo.bind($("#order_form_view"), edit_order);

            //kendo.bind($("#order_form_view"), new_order);
        }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response

        }
    });
};


function load_sub_product_list(e, subproduct_list_template) {
    //debugger;

    var parent_job_id = $(e.button).attr('data-parent-jobid');
    var parent_product_id = $(e.button).attr('data-product-id');


    if (parent_job_id == undefined)
        parent_job_id = $(e.button).attr('data-taskid');

    //var parent_job_id = $(e.button).data('parent-jobid');
    //var parent_product_id = $(e.button).data('product-id');
    if (parent_product_id == undefined)
        parent_product_id = $(e.button).attr('data-id');

    if (parent_product_id == undefined)
        parent_product_id = $('#link_sub_product_load').attr('data-product-id');
    //// Load products list
    var product_list_url = "";

    if (Global.create_job_from_order_edit_page != -1) {
        product_list_url = baseUrl + "/getService?type=subcategory&parent_product_id=" + parent_product_id;
    } else {
        product_list_url = baseUrl + "/getService?type=subcategory&parent_product_id=" + parent_product_id;
    }

    console.log(product_list_url);

    window.app.kendoApp.navigate('#sub_products_list', 'slide:right');

    Global.quick_order_id = -1;

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

    $("#sub_product_list_ul").kendoMobileListView({
        dataSource: dataSource,
        template: kendo.template(subproduct_list_template),
        fixedHeaders: true,
        dataBound: function () {
            //debugger;
            if (parent_job_id != undefined) {
                $(".subproducts_change_event").attr('data-parent-jobid', parent_job_id);
                $(".subproducts_change_event").attr('data-product-id', parent_product_id);
            }

            $(".subproducts_change_event").change(function () {
                create_sub_task_for_order($(this));
            });
        }

    });



};



