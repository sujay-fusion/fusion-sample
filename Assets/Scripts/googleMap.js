var infoWindow;
var map;
var markers = [];
var drawPolygon;
var selectedMarkers = [];
var cityCollection = [];
var shopDetails = [];
var shopCollForMarking = [];
var areaDetails = [];

$(document).ready(function () {
    initialize();
    populateCityCollection();
    populateDropDown();
    populateAreaDetails();
    populateShopDetails();
    changeEvent();
});

var initialize = function () {
    markers = [];

    //extendForPolygonSelection();

    var mapOptions = {
        center: new google.maps.LatLng(12.976401, 77.569337),
        zoom: 8,
        maxZoom: 15,
        panControl: true,
        zoomControl: true,
        scaleControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);

    //var customControlDiv = document.createElement('div');
    //customControlDiv.setAttribute('class', 'legendButtons');
    //var polygonControl = new PolygonControl(customControlDiv);
    //var autoZoomControl = new AutoZoomControl(customControlDiv);
    //map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(customControlDiv);

    google.maps.event.addListener(map, "click", function (event) {
        placeMarker(event.latLng);
    });
    //enablePolygon();
    //showMarkers();
};
var index = 1;
var marker;

function placeMarker(location) {
    //if (marker) { //on vérifie si le marqueur existe
    //marker.setPosition(location); //on change sa position
    //} else {
    //marker = new google.maps.Marker({ //on créé le marqueur
    //   position: location,
    //  map: map
    //});
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: index.toString(),
    });

    //document.getElementById('lat').value = location.lat();
    //document.getElementById('lng').value = location.lng();
    getAddress(location);
}

function getAddress(latLng) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'latLng': latLng },
      function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {

              if (results[0]) {
                  //document.getElementById("address").value = results[0].formatted_address;
                  $('#ulCustomerAddresses').append('<li>>> ' + index.toString() + ') ' + results[0].formatted_address + '</li>');
              }
              else {
                  //document.getElementById("address").value = "No results";
                  alert(' No results');
              }
              index++;
          }
          //else {
          //document.getElementById("address").value = status;
          //}
      });
}

var showMarkers = function () {
    $('#chkPlaces option').each(function () {
        if (($(this).is(':selected'))) {
            var str = $(this).val().split(";");
            codeAddress(str[0], str[1]);
        }
    });
};

var codeAddress = function (address, icon) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            addMarkers(results[0].geometry.location, results[0].formatted_address, icon);
            enableAutoZoom();//Default enable auto zoom 
        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
};

var addMarkers = function (latlog, address, icon) {
    //var image = 'http://icons.iconarchive.com/icons/aha-soft/perfect-city/48/' + icon;
    var image = 'Assets/images/' + icon;
    var energyMarker = new google.maps.Marker({
        position: latlog,
        map: map,
        icon: image,
        title: address,
    });
    markers.push(energyMarker);

    //    google.maps.event.addListener(energyMarker, 'click', function () {
    //    });
};

var enableAutoZoom = function () {
    if (markers.length > 0) {
        var bounds = new google.maps.LatLngBounds();
        //  Go through each...
        $.each(markers, function (index, marker) {
            bounds.extend(marker.position);
        });
        //  Fit these bounds to the map
        map.fitBounds(bounds);
    }
    $('#pnlZoomOn').css('background-color', '#004976').css('cursor', 'default');
    $('#pnlZoomOff').css('background-color', '#747378').css('cursor', 'pointer');
};

var disableAutoZoom = function () {
    map.setCenter(new google.maps.LatLng(55.7577, -110.4196));
    map.setZoom(4);
    $('#pnlZoomOn').css('background-color', '#747378').css('cursor', 'pointer');
    $('#pnlZoomOff').css('background-color', '#004976').css('cursor', 'default');
};

var disablePolygon = function () {
    if (drawPolygon)
        drawPolygon.setMap(null);
    $('#pnlPolyOn').css('background-color', '#747378').css('cursor', 'pointer');
    $('#pnlPolyOff').css('background-color', '#004976').css('cursor', 'default');
};

var enablePolygon = function () {
    disablePolygon();
    map.setOptions({ draggableCursor: 'pointer' });
    drawPolygon = new google.maps.Polygon({
        strokeColor: '#51A8A2',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#51A8A2',
        fillOpacity: 0.35
    });
    drawPolygon.setMap(map);

    $('#pnlPolyOn').css('background-color', '#004976').css('cursor', 'default');
    $('#pnlPolyOff').css('background-color', '#747378').css('cursor', 'pointer');

    google.maps.event.addListener(map, 'click', fixPoint);

};

var fixPoint = function (e) {

    if (drawPolygon != null && drawPolygon.map != null) {
        var vertices = drawPolygon.getPath();
        vertices.push(e.latLng);

        selectedMarkers = [];

        $.each(markers, function (index, marker) {
            if (drawPolygon.Contains(marker.position) == true) {
                selectedMarkers.push(marker);
            }
        });

        $('#ulCustomerAddresses').empty();
        $('#ulProspectAddresses').empty();

        $.each(selectedMarkers, function (index, selectedMarker) {
            if (selectedMarker.icon.indexOf('pointer_green03.') >= 0) {
                $('#ulCustomerAddresses').append('<li>>> ' + selectedMarker.title + '</li>');
            }

            if (selectedMarker.icon.indexOf('pointer_red03.') >= 0) {
                $('#ulProspectAddresses').append('<li>>>  ' + selectedMarker.title + '</li>');
            }
        });
    }

};

var extendForPolygonSelection = function () {
    google.maps.Polygon.prototype.Contains = function (point) {
        // ray casting alogrithm http://rosettacode.org/wiki/Ray-casting_algorithm
        var crossings = 0,
            path = this.getPath();

        for (var i = 0; i < path.getLength() ; i++) {
            var a = path.getAt(i),
                j = i + 1;
            if (j >= path.getLength()) {
                j = 0;
            }
            var b = path.getAt(j);
            if (rayCrossesSegment(point, a, b)) {
                crossings++;
            }
        }

        // odd number of crossings?
        return (crossings % 2 == 1);

        function rayCrossesSegment(point, a, b) {
            var px = point.lng(),
                py = point.lat(),
                ax = a.lng(),
                ay = a.lat(),
                bx = b.lng(),
                by = b.lat();
            if (ay > by) {
                ax = b.lng();
                ay = b.lat();
                bx = a.lng();
                by = a.lat();
            }
            if (py == ay || py == by) py += 0.00000001;
            if ((py > by || py < ay) || (px > Math.max(ax, bx))) return false;
            if (px < Math.min(ax, bx)) return true;

            var red = (ax != bx) ? ((by - ay) / (bx - ax)) : Infinity;
            var blue = (ax != px) ? ((py - ay) / (px - ax)) : Infinity;
            return (blue >= red);
        }
    };
};

function AutoZoomControl(controlDiv) {
    controlDiv.style.padding = '5px';

    var labelControlUI = document.createElement('div');
    labelControlUI.innerHTML = '<label style="width: 120px;float: left;margin-left: -48px;clear: both;margin-top: 6px;">Auto Zoom</label>';
    controlDiv.appendChild(labelControlUI);

    var onControlUI = document.createElement('div');
    onControlUI.id = 'pnlZoomOn';
    onControlUI.style.backgroundColor = '#004976';
    onControlUI.style.float = 'left';
    onControlUI.style.border = '1px solid #000000';
    onControlUI.style.cursor = 'default';
    onControlUI.style.textAlign = 'center';
    onControlUI.style.width = '36px';
    onControlUI.style.marginTop = '-10px';
    onControlUI.style.marginLeft = '18px';
    onControlUI.style.marginLeft = '26px\0/IE9';
    onControlUI.title = 'Auto Zoom On';

    controlDiv.appendChild(onControlUI);
    var onControlText = document.createElement('div');
    onControlText.style.fontFamily = 'Arial,sans-serif';
    onControlText.style.fontSize = '12px';
    onControlText.style.color = '#ffffff';
    onControlText.style.paddingLeft = '4px';
    onControlText.style.paddingRight = '4px';

    onControlText.innerHTML = '<b>On<b>';
    onControlUI.appendChild(onControlText);

    var offControlUI = document.createElement('div');
    offControlUI.id = 'pnlZoomOff';
    offControlUI.style.backgroundColor = '#747378';
    offControlUI.style.float = 'right';
    offControlUI.style.border = '1px solid #000000';
    offControlUI.style.cursor = 'pointer';
    offControlUI.style.textAlign = 'center';
    offControlUI.style.width = '36px';
    offControlUI.style.marginTop = '-16px';
    offControlUI.style.marginTop = '-10px\0/IE9';
    offControlUI.style.marginLeft = '16px';
    offControlUI.style.marginLeft = '0px\0/IE9';
    offControlUI.title = 'Auto Zoom Off';

    controlDiv.appendChild(offControlUI);
    var offControlText = document.createElement('div');
    offControlText.style.fontFamily = 'Arial,sans-serif';
    offControlText.style.fontSize = '12px';
    offControlText.style.color = '#ffffff';
    offControlText.style.paddingLeft = '4px';
    offControlText.style.paddingRight = '4px';
    offControlText.innerHTML = '<b>Off<b>';
    offControlUI.appendChild(offControlText);

    google.maps.event.addDomListener(onControlUI, 'click', function () {
        enableAutoZoom();
    });

    google.maps.event.addDomListener(offControlUI, 'click', function () {
        disableAutoZoom();
    });
};

function PolygonControl(controlDiv) {
    controlDiv.style.padding = '5px';

    var labelControlUI = document.createElement('div');
    labelControlUI.style.width = 'auto';
    labelControlUI.style.float = 'left';
    labelControlUI.style.whiteSpace = 'nowrap';
    labelControlUI.innerHTML = '<label>Polygon Tool</label>';
    controlDiv.appendChild(labelControlUI);

    var onControlUI = document.createElement('div');
    onControlUI.id = 'pnlPolyOn';
    onControlUI.style.backgroundColor = '#004976';//'#E7E4EB';
    onControlUI.style.float = 'left';
    onControlUI.style.border = '1px solid #000000';
    onControlUI.style.cursor = 'default';
    onControlUI.style.textAlign = 'center';
    onControlUI.style.width = '36px';
    onControlUI.style.marginTop = '-15px';
    onControlUI.style.marginLeft = '40px';
    onControlUI.style.marginLeft = '48px\0/IE9';
    onControlUI.title = 'Polygon On';
    controlDiv.appendChild(onControlUI);
    var onControlText = document.createElement('div');
    onControlText.style.fontFamily = 'Arial,sans-serif';
    onControlText.style.fontSize = '12px';
    onControlText.style.color = '#ffffff';
    onControlText.style.paddingLeft = '4px';
    onControlText.style.paddingRight = '4px';
    onControlText.innerHTML = '<b>On<b>';
    onControlUI.appendChild(onControlText);

    var offControlUI = document.createElement('div');
    offControlUI.id = 'pnlPolyOff';
    offControlUI.style.backgroundColor = '#747378';
    offControlUI.style.float = 'right';
    offControlUI.style.border = '1px solid #000000';
    offControlUI.style.cursor = 'pointer';
    offControlUI.style.textAlign = 'center';
    offControlUI.style.width = '36px';
    offControlUI.style.marginTop = '-15px';
    offControlUI.style.marginLeft = '3px';
    offControlUI.title = 'Polygon Off';

    controlDiv.appendChild(offControlUI);
    var offControlText = document.createElement('div');
    offControlText.style.fontFamily = 'Arial,sans-serif';
    offControlText.style.fontSize = '12px';
    offControlText.style.color = '#ffffff';
    offControlText.style.paddingLeft = '4px';
    offControlText.style.paddingRight = '4px';
    offControlText.innerHTML = '<b>Off<b>';
    offControlUI.appendChild(offControlText);

    google.maps.event.addDomListener(onControlUI, 'click', function () {
        enablePolygon();
        map.setOptions({ draggableCursor: 'pointer' });
    });

    google.maps.event.addDomListener(offControlUI, 'click', function () {
        disablePolygon();
        map.setOptions({ draggableCursor: null });
    });
};




var populateCityCollection = function () {

    cityCollection[0] = {
        "city": "Bangalore",
        "lang": "77.569337",
        "lat": "12.976401",
        "latlang": "12.976401,77.569337",
        "areas": "South,North"
    };

    cityCollection[1] =
    {
        "city": "Mysore",
        "lang": "76.655281",
        "lat": "12.303840",
        "latlang": "12.303840,76.655281"
    };

};

var populateAreaDetails = function () {
    areaDetails[0] = {
        "name": "South",
        "areaId": "1",
        "shopId": "1,2,3,4"
    };
    areaDetails[1] = {
        "name": "North",
        "areaId": "2",
        "shopId": "5,6"
    };

};

var populateShopDetails = function () {

    shopDetails[0] = {
        "name": "Jayanagar",
        "owner": "",
        "address": "Center of the city Jayanagar",
        "id": "1",
        "lat": "12.9267636",
        "lang": "77.5890781",
        "latlang": "12.9267636,77.5890781",
        "areaId": "1"
    };
    shopDetails[1] = {
        "name": "Girinagar",
        "owner": "",
        "address": "at the center of Girinagar",
        "id": "2",
        "lat": "12.938004",
        "lang": "77.5444135",
        "latlang": "12.938004,77.5444135",
        "areaId": "1"
    };
    shopDetails[2] = {
        "name": "RR-Nagar",
        "owner": "",
        "address": "located in RR Nagar",
        "id": "3",
        "lat": "12.9010269",
        "lang": "77.53921654",
        "latlang": "12.9010269,77.53921654",
        "areaId": "1"
    };
    shopDetails[3] = {
        "name": "Gavipuram",
        "owner": "",
        "address": "from Gavipuram",
        "id": "4",
        "lat": "12.94754988",
        "lang": "77.5632066",
        "latlang": "12.94754988 ,77.5632066",
        "areaId": "1"
    };
    shopDetails[4] = {
        "name": "SanjayNagar",
        "owner": "",
        "address": "in Sanjay nagar",
        "id": "5",
        "lat": "13.03248836",
        "lang": "77.55383949",
        "latlang": "13.03248836, 77.55383949",
        "areaId": "2"
    };
    shopDetails[5] = {
        "name": "Hebbal",
        "owner": "",
        "address": "this comes near Hebbal circle",
        "id": "6",
        "lat": "13.01709513",
        "lang": "77.55762291",
        "latlang": "13.01709513, 77.55762291",
        "areaId": "2"
    };
    shopDetails[6] = {
        "name": "Banaswadi",
        "owner": "",
        "address": "this comes Banaswadi",
        "id": "7",
        "lat": "13.01256593",
        "lang": "77.65018903",
        "latlang": "13.01256593,77.65018903",
        "areaId": "2"
    };

};


var populateDropDown = function () {

    $.each(cityCollection, function (index, item) {
        $("#City").append($("<option></option>").val(item.latlang).html(item.city));
    });
};

var changeEvent = function () {

    $("#City").change(function () {

        var selectLocation = this.value;
        var latlang = selectLocation.split(',');

        //alert(latlang[0]); alert(latlang[1]);

        markers = [];

        var mapOptions = {
            center: new google.maps.LatLng(latlang[0], latlang[1]),
            zoom: 8,
            maxZoom: 15,
            panControl: true,
            zoomControl: true,
            scaleControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);

        //var customControlDiv = document.createElement('div');
        //customControlDiv.setAttribute('class', 'legendButtons');
        //var polygonControl = new PolygonControl(customControlDiv);
        //var autoZoomControl = new AutoZoomControl(customControlDiv);
        //map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(customControlDiv);

        google.maps.event.addListener(map, "click", function (event) {
            placeMarker(event.latLng);
        });

        var selectedCity = this.value;

        $.each(cityCollection, function (index, value) {
            if (value.latlang == selectedCity) {
                //alert(value.city);
                $("#Area").empty();
                $("#Area").append($("<option></option>").val("0").html("-----Select------"));
                var belongingAreas = value.areas.split(",");
                $.each(belongingAreas, function (index, item) {
                    //alert(item);                  
                    $("#Area").append($("<option></option>").val(item).html(item));
                });
            }
        });
    });

    $("#Area").change(function () {
        var selectedArea = this.value;
        $.each(areaDetails, function (index, value) {

            // alert(value.name);
            if (value.name == selectedArea) {

                var areaId = value.areaId;
                shopCollForMarking = [];

                $.each(shopDetails, function (ind, item) {

                    //alert(item.latlang);
                    //placeMarker(item.latlang);

                    if (item.areaId == areaId) {
                        shopCollForMarking.push(item);
                    }
                });

                //alert(shopCollForMarking.length);
            }
        });

        ShowShopOnMap();
    });
};

var ShowShopOnMap = function () {

    var selectedCitylatlang = $("#City option:selected").val();

    var map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 12,
        maxZoom: 15,
        panControl: true,
        zoomControl: true,
        scaleControl: true,
        center: new google.maps.LatLng(selectedCitylatlang.split(",")[0], selectedCitylatlang.split(",")[1]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();

    var marker, i;

    //alert(shopCollForMarking.length);
    for (i = 0; i < shopCollForMarking.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(shopCollForMarking[i].lat, shopCollForMarking[i].lang),
            map: map
        });

        //alert(shopCollForMarking[i].lat);
        //alert(shopCollForMarking[i].lang);

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {

                infowindow.setContent(shopCollForMarking[i].address);
                infowindow.open(map, marker);
            }
        })(marker, i));
    }
};

var formatVarString = function () {
    var args = [].slice.call(arguments);
    if (this.toString() != '[object Object]') {
        args.unshift(this.toString());
    }

    var pattern = new RegExp('{([1-' + args.length + '])}', 'g');
    return String(args[0]).replace(pattern, function (match, index) { return args[index]; });
};


//"areas":"['Jayanagar','Gavipuram','RR-Nagar','Girinagar']"