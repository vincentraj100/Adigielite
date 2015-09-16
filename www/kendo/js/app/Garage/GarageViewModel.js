define([
    'kendo',
    'text!garageTemplate',
    'text!order_task_view_template',
    'text!subproduct_list_template',
], function (kendo, garageTemplate, order_task_view_template, subproduct_list_template) {
    return kendo.data.ObservableObject.extend({
        garageDataSource: null,
        init: function (listView) {
            var self = this;

            //listView.kendoMobileListView({
            //    template: kendo.template(garageTemplate)
            //});

            kendo.data.ObservableObject.fn.init.apply(self, []);
            var baseImageUrl = "http://192.168.2.14:8201"

            var garageDetail = baseUrl + "/getOrderDetails?garage_id=" + Global.garage_id + "&state=ingarage";

            console.log(garageDetail);

            var dataSource = new kendo.data.DataSource({
                transport: {
                    read: {
                        type: "POST"
                        , url: garageDetail
                        , dataType: "json"
                    }
                },
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true,
                pageSize: 10
            });

            listView.kendoMobileListView({
                dataSource: dataSource
                , template: kendo.template(garageTemplate)
                //,filterable: true 
                , filterable: {
                    field: "vehicle_model_name",
                    operator: "startswith"
                },
            });

            self.set("garageDataSource", dataSource);
        },
        view_garage_detail: function (e) {

            var id = $(e.target).data("garageid");
            $(".garage-detail").slideUp();
            $(".jobtext").slideUp();
            $(".downarrow").removeClass('imagerotated');

            if (Global.SelectedGarageView != id) {


                //// get job list and bind to view
                var jobListUrl = baseUrl + "/getTaskByOrderId?orderId=" + id;

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

                $(".job_list_item" + id).kendoMobileListView({
                    dataSource: dataSourceJobList,
                    template: kendo.template(order_task_view_template),
                    fixedHeaders: true
                });


                Global.SelectedGarageView = id;
                $('#garage-detail' + id).slideDown();
                $(".jobtext" + id).slideDown();
                $(e).addClass('imagerotated');
            } else {
                Global.SelectedGarageView = 0;
                $('#garage-detail' + id).slideUp();
            }
        }, load_sub_product_list: function (e) {
            load_sub_product_list(e, subproduct_list_template);
        }
    });
});

function load_garage_edit(e) {
    var orderId = $(e).data("orderid");

    Global.selected_order_id = orderId;
    var editOrderUrl = baseUrl + "/getOrderDetailsbyOrderId?order_id=" + orderId;

    //// Gets Order to Edit
    $.ajax({
        type: "GET",
        url: editOrderUrl,
        cache: false,
        dataType: "json",
        success: function (data, statusText, xhr) {
            //alert("getcustomer");
            //Window.location = '#order_form_view';
            Global.order_view_loads_from_garage = 1;

            var ordersviewmodel = Global.ordersViewModel;
            app.ordersService.viewModel = new ordersviewmodel($("#order_list_ul"));
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

            get_order_task_list(orderId);

            $("#add_order span.km-text").html("Done");

            kendo.bind($("#order_form_view"), edit_order);

            //kendo.bind($("#order_form_view"), new_order);
        }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response

        }
    });
}