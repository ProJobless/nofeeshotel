// Function GoogleMap() is a class constructor for the implementation of a Google map widget. 
// GroupCheckBoxes() requires an unordered list structure, with the first list entry being the group 
// checkbox and the remaining entries being the checkboxes controlled by the group. Each list entry 
// must contain an image tag that will be used to display the state of the checkbox. 
// 
// @param() 
// 
// @return N/A 
//
// @author Louis-Michel Raynauld
//
// TODO support multiple infowindow and multiple map in one document
// 
function GoogleMap(map_div_id, lang , default_lat, default_lng, default_zoom) {

    this.map_div = document.getElementById(map_div_id);

    this.map_lang = lang || 'en';

    this.default_lat = default_lat || 0;
    this.default_lng = default_lng || 0;
    this.default_zoom = default_zoom || 8;

    window.gmap = null;
    window.cityCircle = null;
    window.markers = Array();
    window.gmarkers = Array();
    this.gbounds = null;

    this.marker_id_to_focus = -1;

    //info window should be global too bad!
    window.gInfoWin = null;

} // end GoogleMap() constructor 

// Function init() is a member function to initialize the Google Map object.
// Make sure this is run after google map script has loaded
// return N/A 
// 
GoogleMap.prototype.init = function() { 
	
	this.map_div.style.display = "block";
	this.map_div.style.width = "100%";
	this.map_div.style.height = "400px";

    if (this.map_div.id === "filter_map_rightSide"){
        this.map_div.style.height = "100%";
//        this.default_zoom = 10;
    }
        	
    var myOptions = {
	      zoom:      this.default_zoom,
	      center:    new google.maps.LatLng(this.default_lat, this.default_lng),
	      mapTypeId: google.maps.MapTypeId.ROADMAP
	    };
    
        window.gmap    = new google.maps.Map(this.map_div, myOptions);
	this.gbounds = new google.maps.LatLngBounds();
	
	//add infowindow to map
	this.initInfoWin();

	this.drawMarkers();
    
	this.marker_focus();
	
	if((this.marker_id_to_focus < 0) && !this.gbounds.isEmpty())
	{
		window.gmap.setCenter(this.gbounds.getCenter());
	    window.gmap.fitBounds(this.gbounds);
	}	
	
     // first get the property number
        var property_number = this.map_div.id.substr(this.map_div.id.lastIndexOf("_") + 1);

        // check if there is any radio button
        if ($("#frmDistrict_"+property_number+" input:radio:first").length > 0)
            {
                 // make first district checked
                $("#frmDistrict_"+property_number+" input:radio:first").attr('checked', true);
            }
       

        // check if there is a district radio button and checked
        // if yes call the district function to show district boundries
        if($("#frmDistrict_"+property_number+" input:radio:checked").length > 0)
            {
              var district_um_ids =   $("#frmDistrict_"+property_number+" input:radio:checked").val();
              // call the function to show the district
             this.changeDistrictLayer(district_um_ids);
            }
           else
            {
                 $("#frmDistrict_"+property_number).hide();
            }
            
            // Start  Landmark Shows on map
               // check if there is any radio button
        if ($("#divLandmark_"+property_number+" input:radio:first").length > 0)
            {
                 // make first district checked
                $("#divLandmark_"+property_number+" input:radio:first").attr('checked', true);
            }
       

        // check if there is a district radio button and checked
        // if yes call the district function to show district boundries
        if($("#divLandmark_"+property_number+" input:radio:checked").length > 0)
            {
              var landmark_latlng =   $("#divLandmark_"+property_number+" input:radio:checked").val();
              // call the function to show the district
             this.changeLandmarkLayer(landmark_latlng);
            }
           else
            {
                 $("#divLandmark_"+property_number).hide();
            }
          // End  Landmark Shows on map 
}; // end init() 

GoogleMap.prototype.clearMapDiv = function()
{
	var parentDiv = this.map_div.parentNode;
	parentDiv.removeChild(this.map_div);
	this.map_div.setAttribute("style","");
	this.map_div.innerHTML = "";
	parentDiv.appendChild(this.map_div);
};
GoogleMap.prototype.setMapDivId = function(map_div_id)
{
	this.map_div = document.getElementById(map_div_id);
};
GoogleMap.prototype.setFocusMarkerID = function(id)
{
	this.marker_id_to_focus = id;
};
GoogleMap.prototype.marker_focus = function()
{
    if (this.marker_id_to_focus > -1)
    {
        window.gmap.setZoom(14);
        window.gmap.setCenter(window.markers[this.marker_id_to_focus].gmarker.position);
        this.openInfoWindow(window.markers[this.marker_id_to_focus].gmarker, window.markers[this.marker_id_to_focus].gmarker.custom_content);
    }
};
GoogleMap.prototype.drawMap = function()
{
	  var  that   = this;
	
  var script_id = "google_map_api_script";
    
    if ($("#" + script_id).length <= 0)
    {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.id = script_id;
        script.src = "https://maps.google.com/maps/api/js?sensor=false&language=" + this.map_lang + "&callback=gmap_start";

        //Create callback function that must be global
        window.gmap_start = function() {
            that.init();
        };

        document.body.appendChild(script);
    }
    else
    {
        this.init();
    }
};

GoogleMap.prototype.addMarker = function (index, lat, lng, title, content) //, image, iconshadow)
{
    var marker = {
        title: title,
        lat: lat,
        lng: lng,
        content: content,
        gmarker: null
    };
    window.markers[index] = marker;
};
GoogleMap.prototype.clearMap = function() //, image, iconshadow)
{
	this.clearMarkers();
	this.gbounds = null;
};
GoogleMap.prototype.clearMarkers = function() //, image, iconshadow)
{
    window.markers = Array();
    this.marker_id_to_focus = -1;

    if (window.gmarkers) {
        for (i in window.gmarkers) {
            window.gmarkers[i].setMap(null);
        }
        window.gmarkers.length = 0;
    }

};

GoogleMap.prototype.drawMarkers = function() //, image, iconshadow)
{
    this.fillMakersArray();
    
    // draw markers 
    this.addMarkersToMap();
};
GoogleMap.prototype.getItemsInPage = function() //, image, iconshadow)
{
    var that = this;
    // number of hostels to show per page
    var show_per_page = parseInt($('#show_per_page').val());
    // number of hostels currently shown
    var page_num = parseInt($('#page_navigation .active_page').attr("longdesc"));

    // start hostel number like from 1 to 20
    var start_from = page_num * show_per_page;
    // end hostel number like from 1 to 20
    var end_on = start_from + show_per_page;

    return $('#property_list').children().slice(start_from, end_on);
};
GoogleMap.prototype.fillMakersArray = function() //, image, iconshadow)
{
//    this.clearMarkers();

    var that = this;
    // clear markers on the map
    // includes that.clearMarkers();
    that.clearMap();
    
    var property_list = that.getItemsInPage();

    $.each(property_list, function(index, value) {
// fill the window.markers array to be used to draw markers
var property_number = $(value).attr("rel");
    $("#city_map_view_"+property_number).html("");

        GoogleMap.prototype.addMarker(index
                , $("#input_geo_latitude_"+property_number).val()
                , $("#input_geo_longitude_"+property_number).val()
                , $.trim($("#hostel_title_"+property_number).text())
                , $.trim($("#map_InfoWindow_"+property_number).html())
                , property_number
                );
    });

return window.markers;
};
GoogleMap.prototype.addMarkersToMap = function() //, image, iconshadow)
{
    if ( window.markers.length < 1 )
        {
            window.markers = this.fillMakersArray();
        }
//        console.log(window.markers);
    var that = this;

    var image = new google.maps.MarkerImage("http://" + window.location.host + '/images/map-marker.png',
            new google.maps.Size(28, 28),
            new google.maps.Point(0, 0),
            new google.maps.Point(0, 29));
            
    if (this.gbounds === null)
    {
        this.gbounds = new google.maps.LatLngBounds();
    }
    //TODO support custom image in addMarker function
    for (var i in window.markers) {

        //Add marker to map
        window.gmarkers[i] = new google.maps.Marker({
            position: new google.maps.LatLng(window.markers[i].lat, window.markers[i].lng),
            map: window.gmap,
            title: window.markers[i].title,
            icon: image,
            custom_content: window.markers[i].content
        });


        window.markers[i].gmarker = window.gmarkers[i];

        //On marker click, open info window and set marker content
        google.maps.event.addListener(window.gmarkers[i], 'click', function() {

            that.openInfoWindow(this, this.custom_content);
        });


        google.maps.event.addListener(window.gmarkers[i], 'mouseover', function() {

            var image_selected = new google.maps.MarkerImage("http://" + window.location.host + '/images/map-marker_selected.png',
                    new google.maps.Size(28, 28),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(0, 29));

            this.setIcon(image_selected);
            this.setZIndex(100000);
            that.changeHostelBackground(this, "mouseover");

        });

        google.maps.event.addListener(window.gmarkers[i], 'mouseout', function() {

            this.setIcon(image);
            this.setZIndex(0);
            that.changeHostelBackground(this, "mouseout");
        });

        this.gbounds.extend(window.gmarkers[i].position);

    }

};
GoogleMap.prototype.removeMap = function() //, image, iconshadow)
{
    this.map_div.style.display = "none";
};

GoogleMap.prototype.closeInfoWindow = function() {
    window.gInfoWin.close();
};

GoogleMap.prototype.openInfoWindow = function(marker, content) {
//	var markerLatLng = marker.getPosition();

    window.gInfoWin.setContent([content].join(''));
    window.gInfoWin.open(window.gmap, marker);
};

GoogleMap.prototype.initInfoWin = function() {
    // Create single instance of a Google Map.
    window.gInfoWin = new google.maps.InfoWindow({
//		maxWidth: 300
    });
    google.maps.event.addListener(window.gmap, 'click', function() {
        window.gInfoWin.close();
    });
};
GoogleMap.prototype.changeDistrictLayer = function(district_um_ids){

    // working with mapinfulence
    // Initialize Mapfluence with your API key.
    MF.initialize({
        apiKey: urbanmapping_key
    });
    // remove any old districts
    window.gmap.overlayMapTypes.setAt(0, null);

    if ($.isArray(district_um_ids)) {

        // loop through districts um_ids
        var counter;
        for (counter = 0; counter < district_um_ids.length; ++counter) {
            this.addDistrictsBorder(MF, district_um_ids[counter], counter);
        }
    }
    else {
        this.addDistrictsBorder(MF, district_um_ids, 0);
    }

};
GoogleMap.prototype.addDistrictsBorder = function(MF, pDistricts_umIds, counter)
{
    // change map Zoom 
    window.gmap.setZoom(13);
    
    // do something with `pDistricts_umIds[counter]`

    var filter = MF.filter.Data({
        column: 'umi.neighborhoods.attributes.hood_id',
        operator: '=',
        value: parseInt(pDistricts_umIds)

    });

    var hoodsLayer = MF.layer.tile.Simple({
        from: 'umi.neighborhoods.geometry',
        style: {
            color: 'feba02'
        },
        border: {
            color: 'black',
            size: 1.0
        },
        where: filter,
        opacity: .40
    });

    // Create the Mapfluence adapter for Google Maps
    var googleAdapter = MF.map.google.Adapter();

    // Adapt a Mapfluence layer for use with the Google Maps API
    var adaptedLayer = googleAdapter.adaptLayer(hoodsLayer);

    // Overlay the Mapfluence layer
//    map.overlayMapTypes.insertAt(0, adaptedLayer);
    window.gmap.overlayMapTypes.setAt((counter + 1), adaptedLayer);

};
GoogleMap.prototype.changeLandmarkLayer = function(landmark_LatLng) {

    if (window.cityCircle !== null)
    {
        window.cityCircle.setMap(null);
    }

    if ($.isArray(landmark_LatLng)) {

        // loop through districts um_ids
        var counter;
        for (counter = 0; counter < landmark_LatLng.length; ++counter) {
            this.addLandmarkLayer(landmark_LatLng[counter]);
        }
    }
    else {
        this.addLandmarkLayer(landmark_LatLng);
    }

};
GoogleMap.prototype.addLandmarkLayer = function(landmark_LatLng) {

    // change map Zoom 
    window.gmap.setZoom(13);
    
    var point = landmark_LatLng.split("###");
    var lat = point[0];
    var Lng = point[1];

//alert("lat="+lat+"::::Lng="+Lng+"::::");

    var citymap = {
        center: new google.maps.LatLng(lat, Lng)
    };

    var LandmarkOptions = {
        strokeColor: "#4E89C9",
        strokeOpacity: 0.8,
        strokeWeight: 2,
//      fillColor: "#FF0000",
        fillColor: "#4E89C9",
        fillOpacity: 0.35,
        map: window.gmap,
        center: citymap.center,
        radius: 2000
    };
    window.cityCircle = new google.maps.Circle(LandmarkOptions);

//landmark_marker_blue.png
var image = new google.maps.MarkerImage("http://"+window.location.host+'/images/map_landmark_marker_blue.png',
			        new google.maps.Size(28, 28),
			        new google.maps.Point(0,0),
			        new google.maps.Point(0, 29));
                                
	var gmarker = new google.maps.Marker({
	        position: new google.maps.LatLng(lat, Lng), 
	        map: window.gmap,
//	        title:this.markers[i].title,
	        icon: image	        
	    }); 
            
};
GoogleMap.prototype.changeMarkerIconToSelected = function(pDiv) {

    this.changeMarkerIcon(pDiv, "selected");

};
GoogleMap.prototype.setMarkerIconToOriginal = function(pDiv) {

    this.changeMarkerIcon(pDiv, "original");
};
GoogleMap.prototype.changeMarkerIcon = function(pDiv, pIconType) {

    var property_number = $(pDiv).attr("rel");
    var hostel_title = $.trim($("#hostel_title_"+property_number).text());

    var image = null;

    if (pIconType === "selected")
    {
        image = "map-marker_selected.png";
    }
    else
    {
        image = "map-marker.png";
    }

    $("#city_info_" + property_number).removeClass('property_info_hover');

    if (pIconType === "selected")
    {
        $("#city_info_" + property_number).addClass('property_info_hover');
    }


    if (window.markers.length !== 0) {

        for (var i in window.markers) {

            if (window.markers[i].gmarker !== null)
            {
                if (window.markers[i].gmarker.getZIndex() === 100000) {
                    window.markers[i].gmarker.setZIndex(0);
                }

                if (hostel_title === $.trim(window.markers[i].gmarker.getTitle()))
                {
                    var image = new google.maps.MarkerImage("http://" + window.location.host + '/images/' + image,
                            new google.maps.Size(28, 28),
                            new google.maps.Point(0, 0),
                            new google.maps.Point(0, 29));
                    window.markers[i].gmarker.setZIndex(100000);
                    window.markers[i].gmarker.setIcon(image);

                }
            }

        }
    }
};
GoogleMap.prototype.changeHostelBackground = function(pMarker, pDivEventToTrigger) {

    var that = this;
    var property_list = that.getItemsInPage();

    $.each(property_list, function(index, value) {

        if ($.trim($(value).find(".hostel_title").text()) === pMarker.getTitle())
        {
            $(value).trigger(pDivEventToTrigger);
        }
    });

};