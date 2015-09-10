define([
    'kendo',
    'text!ordersTemplate'
], function (kendo, ordersTemplate) {
    return kendo.data.ObservableObject.extend({
        orderDataSource: null,

        init: function (listView) {
            var self = this;
            listView.kendoMobileListView({
                template: kendo.template(ordersTemplate)
            });

            kendo.data.ObservableObject.fn.init.apply(self, []);

            //var dataSource = new kendo.data.DataSource({
            //    //transport: {
            //    //    read: {
            //    //        url: "http://demos.telerik.com/kendo-ui/service/Northwind.svc/Products",
            //    //        dataType: "json"
            //    //    }
            //    //}
            //    type: "odata",
            //    transport: {
            //        read: {
            //            url: "http://demos.telerik.com/kendo-ui/service/Northwind.svc/Products"
            //        }
            //    },
            //    sort: {
            //        field: "ProductName",
            //        dir: "desc"
            //    },
            //    serverPaging: true,
            //    serverFiltering: true,
            //    serverSorting: true,
            //    pageSize: 50
            //});
            //var dataSource = new kendo.data.DataSource({
            //    data: [
            //        { "ID": "1", "brand": "Audi", "status": "I", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
            //        { "ID": "2", "brand": "Volkswagen", "status": "I", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
            //        { "ID": "3", "brand": "Jaguar", "status": "R", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
            //        { "ID": "4", "brand": "Ford", "status": "R", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
            //        { "ID": "5", "brand": "Audi", "status": "R", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
            //    ],
            //});

            var dataSource = new kendo.data.DataSource({
                //transport: {
                //    read: {
                //        type: "POST"
                //        , url: baseUrl + "/getAllCustomer/"
                //        , dataType: "json"
                //    }
                //},
                data: [
                    { "ID": "1", "brand": "Audi", "status": "I", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
                    { "ID": "2", "brand": "Volkswagen", "status": "I", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
                    { "ID": "3", "brand": "Jaguar", "status": "R", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
                    { "ID": "4", "brand": "Ford", "status": "R", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
                    { "ID": "5", "brand": "Audi", "status": "R", "Job": ["Change Type", "Change Oil"], "Date": "31.03.15", "Estimation": "2000 AED" },
                ],
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true,
                pageSize: 10
            });

            listView.kendoMobileListView({
                dataSource: dataSource,
                template: kendo.template(ordersTemplate),
                filterable: {
                    field: "brand",
                    operator: "startswith"
                },
            });


            self.set("orderDataSource", dataSource);

            $(".expandorder").bind("click", function (e) {
                self.order_detail_view($(this));
            });

        },
        order_detail_view: function (e) {

            var orderId = $(e).data("orderid");

            $(".commondueon").slideUp();

            $(".ordersubmit").slideDown();

            if (Global.SelectedOrderView != orderId) {
                $(".orderdownarrow").removeClass('imagerotated');
            }

            if (!($(e).hasClass("imagerotated"))) {
                $(".dueon" + orderId).slideDown();

                //// hide edit button
                $("#orderedit" + orderId).slideUp();

                Global.SelectedOrderView = orderId;

                $(e).addClass('imagerotated');
            } else {
                $(e).removeClass("imagerotated");
            }
        },
        load_customer_order_form: function (e) {
            var user_id = "";
            var order_id="";
            var customerUrl = baseUrl + "getCustomerbyId";
            var vehicleUrl = baseUrl + "vehicle/";
            var serviceUrl = baseUrl + "";


            //// customer list ddl
            $("#customer_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "--select--",
                dataTextField: "name",
                dataValueField: "id",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: customerUrl + "?id=" + user_id,
                        dataType: "json"
                    }
                },
                index: 0,
            }).data("kendoDropDownList");

            //// vehicle list ddl
            $("#vehicle_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "--select--",
                dataTextField: "name",
                dataValueField: "id",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: vehicleUrl,
                        dataType: "json"
                    }
                },
                index: 0,
            }).data("kendoDropDownList");

            //// service list ddl
            $("#service_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "--select--",
                dataTextField: "name",
                dataValueField: "id",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: serviceUrl,
                        dataType: "json"
                    }
                },
                index: 0,
            }).data("kendoDropDownList");

            
            //// status list ddl
            $("#status_ddl_list").kendoDropDownList({
                autoBind: true,
                filter: "startswith",
                optionLabel: "Recommendation",
                dataTextField: "name",
                dataValueField: "id",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: serviceUrl,
                        dataType: "json"
                    }
                },
                index: 0,
            }).data("kendoDropDownList");


            if (order_id > 0) {

                //// Gets selected order

                kendo.bind($("#order_form_view"), selectedcustomer);
            }
        },
        load_order_job_form: function (e) {
            $("#estimated_finish_date").kendoDatePicker();
            $("#actual_finish_date").kendoDatePicker();

            var productTypeUrl = "";

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

        }
    });
});