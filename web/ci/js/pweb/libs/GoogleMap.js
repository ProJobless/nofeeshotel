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
	
	this.map_lang   = lang || 'en';
	
	this.default_lat   = default_lat || 0;
	this.default_lng   = default_lng || 0;
	this.default_zoom  = default_zoom || 8;
	
	this.gmap       = null;
	this.markers    = Array();
	this.gbounds    = null;
	
	this.marker_id_to_focus  = -1;
	
	this.glib_loaded = false;
	
	//info window should be global too bad!
	window.gInfoWin   = null;

} // end GoogleMap() constructor 

// Function init() is a member function to initialize the Google Map object.
// Make sure this is run after google map script has loaded
// return N/A 
// 
GoogleMap.prototype.init = function() { 

	var myOptions = {
	      zoom:      this.default_zoom,
	      center:    new google.maps.LatLng(this.default_lat, this.default_lng),
	      mapTypeId: google.maps.MapTypeId.ROADMAP
	    };
	
	this.map_div.style.display = "block";
	this.map_div.style.width = "100%";
	this.map_div.style.height = "400px";

	this.gmap    = new google.maps.Map(this.map_div, myOptions);
	this.gbounds = new google.maps.LatLngBounds();
	
	//add infowindow to map
	this.initInfoWin();

	this.drawMarkers();
	
	this.marker_focus();
	
	if((this.marker_id_to_focus < 0) && !this.gbounds.isEmpty())
	{
		this.gmap.setCenter(this.gbounds.getCenter());
	    this.gmap.fitBounds(this.gbounds);
	}	
	
    
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
	if(this.marker_id_to_focus > -1)
	{
		this.gmap.setZoom(18);
		this.gmap.setCenter(this.markers[this.marker_id_to_focus].gmarker.position);
		this.openInfoWindow(this.markers[this.marker_id_to_focus].gmarker,this.markers[this.marker_id_to_focus].gmarker.custom_content);
	}
};
GoogleMap.prototype.drawMap = function()
{
	var script = document.createElement("script"),
	    that   = this;
	
	if(this.glib_loaded === false)
	{
		script.type = "text/javascript";
		script.src = "http://maps.google.com/maps/api/js?sensor=false&language="+this.map_lang+"&callback=gmap_start";
		
		//Create callback function that must be global
		window.gmap_start = function(){
			 that.glib_loaded = true;
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
	this.markers[index] = marker ;
};
GoogleMap.prototype.clearMap = function () //, image, iconshadow)
{
	this.clearMarkers();
	this.gbounds = null;
};
GoogleMap.prototype.clearMarkers = function () //, image, iconshadow)
{
	this.markers = Array();
	this.marker_id_to_focus  = -1;
};

GoogleMap.prototype.drawMarkers = function () //, image, iconshadow)
{
	var that = this;
	
	//TODO support custom image in addMarker function
	for (var i in this.markers) {
		//initialize icon of marker
		var image = new google.maps.MarkerImage("http://"+window.location.host+'/images/map-marker.png',
			        new google.maps.Size(28, 28),
			        new google.maps.Point(0,0),
			        new google.maps.Point(0, 29));
		
		//Add marker to map
		var gmarker = new google.maps.Marker({
	        position: new google.maps.LatLng(this.markers[i].lat,this.markers[i].lng), 
	        map: this.gmap,
	        title:this.markers[i].title,
	        icon: image,
	        custom_content: this.markers[i].content
	        
	    }); 
		
		this.markers[i].gmarker = gmarker;
		
		//On marker click, open info window and set marker content
		google.maps.event.addListener(gmarker, 'click', function() {
			that.openInfoWindow(this,this.custom_content);
	      });
		
		this.gbounds.extend(gmarker.position);
	}
};
GoogleMap.prototype.removeMap = function () //, image, iconshadow)
{
	this.map_div.style.display = "none";
};

GoogleMap.prototype.closeInfoWindow = function() {
	window.gInfoWin.close();
};

GoogleMap.prototype.openInfoWindow = function(marker,content) {
//	var markerLatLng = marker.getPosition();
	
	window.gInfoWin.setContent([content].join(''));
	window.gInfoWin.open(this.gmap, marker);
};

GoogleMap.prototype.initInfoWin = function() {
	// Create single instance of a Google Map.
	window.gInfoWin = new google.maps.InfoWindow({
//		maxWidth: 300
	});
	google.maps.event.addListener(this.gmap, 'click', function () {window.gInfoWin.close();});
};