define([
    'kendo',
    'text!customerTemplate'
], function (kendo, customerTemplate) {
    return kendo.data.ObservableObject.extend({
        customerDataSource: null,
        init: function (listView) {
            var self = this;

            kendo.data.ObservableObject.fn.init.apply(self, []);
            var dataSource = new kendo.data.DataSource({
                transport: {
                    read: {
                        type: "POST"
                        , url: baseUrl + "/getAllCustomer/"
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
                , template: kendo.template(customerTemplate)
                //,filterable: true 
                , filterable: {
                    field: "name",
                    operator: "startswith"
                },
            });

            self.set("customerDataSource", dataSource);
        },
        customer_edit_load: function (e) {
            var customerid = $(e.button).attr('data-customer-id');
            app.kendoApp.navigate('#customer_form_view', 'slide:right');
            var selectedcustomer = null;
            var customerList = app.customerService.viewModel.customerDataSource;
            for (var i = 0; i < customerList._data.length; i++) {
                if (customerid == customerList._data[i].id) {
                    selectedcustomer = customerList._data[i];
                    break;
                }
            }

            //// view add vehiclebutton
            $(".additemlist").show();

            kendo.bind($("#customer_form_view"), selectedcustomer);
        },
        customer_save: function (e) {

            var model = $("#customer_form_view").find("#email").get(0).kendoBindingTarget.source;
            var url = baseUrl;
            if (model.id == -1)
                url = url + '/customerAdd' + '?name=' + model.name + '&street=' + model.street + '&pobox=' + model.zip + '&city=' + model.city + '&phone=' + model.phone + '&email=' + model.email;
            else
                url = url + '/customerEdit' + '?id=' + model.id + '&name=' + model.name + '&street=' + model.street + '&pobox=' + model.zip + '&city=' + model.city + '&phone=' + model.phone + '&email=' + model.email;
            $.ajax({
                type: "POST",
                url: url,
                cache: false,
                success: function (data, statusText, xhr) {
                    alert("Customer details saved Successfully");
                }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                    alert("Unable to update customer details");
                }
            });
        }, customer_new: function (e) {
            app.kendoApp.navigate('#customer_form_view', 'slide:right');
            var selectedcustomer = {
                id: -1,
                name: $("#name").val(),
                phone: $("#phone").val(),
                email: $("#email").val(),
                poBox: $("#pobox").val(),
                street: $("#street").val(),
                city: $("#city").val()
            };
            kendo.bind($("#customer_form_view"), selectedcustomer);
        },
        add_customer_vehicle: function (e) {
            var getBarndUrl = baseUrl + "/getBrand";

            $("#vehicleBrand").kendoDropDownList({
                optionLabel: "--select--",
                dataTextField: "name",
                dataValueField: "id",
                dataSource: {
                    transport: {
                        read: getBarndUrl,
                        dataType: "json"
                    }
                },
                index: 0,
                change: get_vehicle_model
            }).data("kendoDropDownList");

            getBarndUrl = baseUrl + "/getModel";

            Global.objVehicleModelDropDownList = $("#vehicleModel").kendoDropDownList({
                autoBind: false,
                filter: "startswith",
                optionLabel: "--select--",
                dataTextField: "modelname",
                dataValueField: "id",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: getBarndUrl + "",
                        dataType: "json"
                    }
                },
                index: 0,
            }).data("kendoDropDownList");

            window.app.kendoApp.navigate('#add_customer_vehicle', 'slide:right');

        },
        add_vehicle: function (e) {
            var createVehicleUrl = baseUrl + "/createVehicle";
            var vehicle_plate_numnber = $(".vehicleplatenumber").val();
            var vehicle_brand = $("#vehicleBrand").data("kendoDropDownList").value();
            var vehicle_model = $("#vehicleModel").data("kendoDropDownList").value();
            var vehicle_brand_text = $("#vehicleBrand").data("kendoDropDownList").text();
            var vehicle_model_text = $("#vehicleModel").data("kendoDropDownList").text();
            $("#errorMessage").text("");
            if (vehicle_brand != "" && vehicle_model != "" && vehicle_plate_numnber != "") {
                createVehicleUrl = createVehicleUrl + '?brandId=' + vehicle_brand + '&modelId=' + vehicle_model + '&license_plate=' + vehicle_plate_numnber;

                $.ajax({
                    type: "POST",
                    url: createVehicleUrl,
                    cache: false,
                    success: function (data, statusText, xhr) {
                        var id = data;
                        alert("Vehicle details saved Successfully");
                        $('<div class="vehiclenumber" id="vehicle' + id + '"><div class="vehicleinput"><label>' + vehicle_brand + ' / ' + vehicle_model + '</label></div> <div id="removeVN' + id + '" onclick="javascript: removefunction(this);" class="remScnt vehiclenoremove"><img data-id="' + id + '" onclick="javascript: removefunction(this);" src="./Images/Removebutton2.png" class="removebutton" alt="remove" style=""></div></div>').appendTo('#p_scents');


                    }, error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
                        alert("Unable to update vehicle details");
                    }
                });

                //// sample test binding
                $('<div class="vehiclenumber" id="vehicle' + id + '"><div class="vehicleinput"><label>' + vehicle_brand_text + ' / ' + vehicle_model_text + '</label></div> <div id="removeVN' + id + '" onclick="javascript: removefunction(this);" class="remScnt vehiclenoremove"><img data-id="' + id + '" onclick="javascript: removefunction(this);" src="../../css/images/Removebutton2.png" class="removebutton" alt="remove" style=""></div></div>').appendTo('#p_scents');

                window.app.kendoApp.navigate('#customer_form_view', 'slide:right');
            }
            else {
                $("#errorMessage").text("Please enter vehicle details.");
            }

        }
    });
});

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