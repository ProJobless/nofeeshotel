//PWeb map wrapper for map in filter

var result_per_page=20;   // Property Per page result

function PWebFilterMap(default_div, lang, default_lat, default_lng)
{
	this.map_lang    = lang;
	this.default_lat = default_lat;
	this.default_lng = default_lng;
	this.enabled     = false;
	this.infow_template = document.getElementById('template-infow').innerHTML;
	this.prop_number_to_focus = -1;
	
	this.gmap = new GoogleMap(default_div, lang, default_lat, default_lng);
}

PWebFilterMap.prototype.reDraw = function ()
{
	if(this.enabled === true)
	{
		this.gmap.drawMap();
	}
	initpaging(result_per_page);
};

PWebFilterMap.prototype.toggle = function ()
{
	if(this.enabled === false)
	{
		this.enableMap();
	}
	else
	{
		this.disableMap();
	}
	initpaging(result_per_page);
};

PWebFilterMap.prototype.enableMap = function() {
	
//	this.updateMap(map_slug);
	this.gmap.drawMap();
	this.enabled = true;
	initpaging(result_per_page);
};

PWebFilterMap.prototype.disableMap = function() {
	
	this.gmap.removeMap();
	this.prop_number_to_focus = -1;
	this.gmap.setFocusMarkerID(-1);
	this.enabled = false;
//	this.pweb_maps[map_slug]  = null;
	initpaging(result_per_page);
};

PWebFilterMap.prototype.isMapEnable = function() {
	return this.enabled;
	initpaging(result_per_page);
};

//UPDATE map data
PWebFilterMap.prototype.updateMarkers = function(markers_data) { 
	
	//clear all previous added marker and focus
	this.gmap.clearMap();
	
	//Add filtered markers to map
//	for (var i = 0; i < markers_data.length; i++) {
	for (var i in markers_data) {
		if(parseFloat(markers_data[i].Geo.Latitude) != 0.00 &&
		   parseFloat(markers_data[i].Geo.Longitude) != 0.00)
		{
			var content = Mustache.to_html(this.infow_template, { "property": markers_data[i]});
			this.gmap.addMarker(i,markers_data[i].Geo.Latitude,markers_data[i].Geo.Longitude,markers_data[i].propertyName, content);
			
			if((this.prop_number_to_focus > 0) && (markers_data[i].propertyNumber == this.prop_number_to_focus))
			{
				//set focus to last insert marker
				this.gmap.setFocusMarkerID(i);
			}
		}
	}
	initpaging(result_per_page);
};

//PWeb filter app
function PWebFilterApp()
{
	this.request;
	
	this.jtable;
	this.jtable_hits;
	this.jtable_hits_sorted;
	this.results_limit;
	
	this.template;
	
	this.$sort_controls_div;
	this.$data_empty_msg;
	this.$data_loading_msg;
	
	//Filter controls
	this.TypeFilterCheckBoxes;
	this.FacilitiesFilterCheckBoxes;
	this.DistrictsCheckBoxes;
	this.LandmarksCheckBoxes;
	
	this.DowntownExtraCheckId;
	this.BreakfastExtraCheckId;
	
	this.FiltersCounts;
	this.FiltersInitValues;
	
	this.PriceFilterMin;
	this.PriceFilterMax;
	this.RatingFilterMin;
	this.RatingFilterMax;
	
	this.PriceCurrencySymbol;
	this.PriceRangeMin;
	this.PriceRangeMax;
	this.RatingRangeMin;
	this.RatingRangeMax;
	
	this.actual_sort_index;
	this.actual_sort_order;
	this.indexes;
	
	this.city_map_toggle;
	this.pweb_maps;
	
	this.init();
	initpaging(result_per_page);
}

//init after document ready

PWebFilterApp.prototype.init = function() { 

	this.template           = document.getElementById('template').innerHTML; 
	
	this.$data_div          = $('#property_list');
	this.$sort_controls_div = $('#data_sort_controls');
	this.$data_empty_msg    = $('#no_data_msg');
	this.$data_loading_msg  = $('#loading_data_msg');
	
	//Filter counts init
	this.FiltersCounts = new Array();
	this.FiltersCounts['city_results_count_total'] = 0;
	this.FiltersCounts['city_results_count_total_temp'] = 0;
	this.FiltersInitValues = new Array();
	this.init_counts();
	this.count_st=0;
	
	//Filter controls init
	this.TypeFilterCheckBoxes = new GroupCheckBoxes("cb_group_type_filter",true);
	this.FacilitiesFilterCheckBoxes = new GroupCheckBoxes("cb_group_facilities_filter");
	this.DistrictsCheckBoxes  = new GroupCheckBoxes("cb_group_districts_filter");
	this.LandmarksCheckBoxes  = new GroupCheckBoxes("cb_group_landmarks_filter");

	this.DowntownExtraCheckId  = 'landmark-downtown';
	this.BreakfastExtraCheckId = 'facility-free-breakfast';
	this.hasDowntownFilter  = false;
	this.hasBreakfastFilter = false;
	
	
	//Set these range to not set
	this.PriceRangeMin  = -1;
	this.PriceRangeMax  = -1;
	this.RatingRangeMin = -1;
	this.RatingRangeMax = -1;
	
	this.FiltersCounts['city_results_filtered'] = 0;
	this.FiltersCounts['city_results_filtered_temp'] = 0;
	this.FiltersCounts['prop-types-count-0'] = 0;
	this.FiltersCounts['prop-types-count-1'] = 0;
	this.FiltersCounts['prop-types-count-2'] = 0;
	this.FiltersCounts['prop-types-count-3'] = 0;
	this.FiltersCounts['prop-types-count-4'] = 0;
	this.FiltersCounts['prop-types-count-5'] = 0;
	
	this.PriceCurrencySymbol = '$';
	
	this.indexes = [
						{
							"row": "propertyNumber",
							"grouped": false,
							"ordered": true,
							"type": jOrder.number
						},
						{
							"row": "propertyName",
							"grouped": true,
							"ordered": true,
							"type": jOrder.string
						},
						{
							"row": "propertyType",
							"grouped": true,
							"ordered": true,
							"type": jOrder.string
						},
						{
							"row": "display_price",
							"grouped": true,
							"ordered": true,
							"type": jOrder.number
						},
						{
							"row": "overall_rating",
							"grouped": true,
							"ordered": true,
							"type": jOrder.number
						}
				];
	this.actual_sort_index = this.indexes[3];
	this.actual_sort_order = jOrder.asc;
	
	this.results_limit = 20;
	
	this.pweb_maps = new Array();
	
	initpaging(result_per_page);
	
}; // end init()

PWebFilterApp.prototype.set_init_filters_value = function() {
	this.FiltersInitValues[this.TypeFilterCheckBoxes.$checkall_li[0].firstChild.id] = this.TypeFilterCheckBoxes.$checkall_li[0].firstChild.checked;
	for (var i = 0; i < this.TypeFilterCheckBoxes.$checkboxes_li.length; i++)
	{
		this.FiltersInitValues[this.TypeFilterCheckBoxes.$checkboxes_li[i].firstChild.id] = this.TypeFilterCheckBoxes.$checkboxes_li[i].firstChild.checked;
	}
	
	for (var i = 0; i < this.FacilitiesFilterCheckBoxes.$checkboxes_li.length; i++)
	{
		this.FiltersInitValues[this.FacilitiesFilterCheckBoxes.$checkboxes_li[i].firstChild.id] = this.FacilitiesFilterCheckBoxes.$checkboxes_li[i].firstChild.checked;
	}
	for (var i = 0; i < this.DistrictsCheckBoxes.$checkboxes_li.length; i++)
	{
		this.FiltersInitValues[this.DistrictsCheckBoxes.$checkboxes_li[i].firstChild.id] = this.DistrictsCheckBoxes.$checkboxes_li[i].firstChild.checked;
	}
	for (var i = 0; i < this.LandmarksCheckBoxes.$checkboxes_li.length; i++)
	{
		this.FiltersInitValues[this.LandmarksCheckBoxes.$checkboxes_li[i].firstChild.id] = this.LandmarksCheckBoxes.$checkboxes_li[i].firstChild.checked;
	}
	
	this.FiltersInitValues['breakfast_2nd_filter'] = false;
	this.FiltersInitValues['downtown_2nd_filter'] = false;
	initpaging(result_per_page);
	
};

PWebFilterApp.prototype.reset_filters = function() {
	var that = this;
	this.PriceFilterMin = this.PriceRangeMin;
	this.PriceFilterMax = this.PriceRangeMax;
	this.RatingFilterMin = this.RatingRangeMin;
	this.RatingFilterMax = this.RatingRangeMax;
	
	//Change value without filtering results
	$( "#slider_price" ).slider( {change: null} );
	$( "#slider_price" ).slider({values: [ that.PriceRangeMin, that.PriceRangeMax ]});
	
	document.getElementById('filter_price').innerHTML = 
							that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 0 ) +
								" - "+that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 1 );
	
	$( "#slider_price" ).slider( {
			change: function( event, ui ) {
			that.change_price_filter(event, ui);
		}
	} );
	
	$( "#slider_rating" ).slider( {change: null} );
	$( "#slider_rating" ).slider({values: [ that.RatingRangeMin, that.RatingRangeMax ]});
	
	document.getElementById('filter_rating').innerHTML = 
							$( "#slider_rating" ).slider( "values", 0 ) +
								"% - " + $( "#slider_rating" ).slider( "values", 1 )+"%";
	
	$( "#slider_rating" ).slider( {
			change: function( event, ui ) {
			that.change_rating_filter(event, ui);
		}
	} );
	
	for (var id in this.FiltersInitValues)
	{ 
		$('#'+id).attr('checked',this.FiltersInitValues[id]);
	}
	
	$('#applied_filter_hosting_price').hide();
	$('#applied_filter_hosting_rating').hide();
	$('#applied_filter_hosting_property').hide();
	$('#applied_filter_hosting_facilities').hide();
	$('#applied_filter_hosting_districts').hide();
	$('#applied_filter_hosting_landmarks').hide();
	initpaging(result_per_page);
	
};

PWebFilterApp.prototype.reset_Pricefilters = function() {
var that = this;
this.PriceFilterMin = this.PriceRangeMin;
this.PriceFilterMax = this.PriceRangeMax;
//Change value without filtering results
$( "#slider_price" ).slider( {change: null} );
$( "#slider_price" ).slider({values: [ that.PriceRangeMin, that.PriceRangeMax ]});
document.getElementById('filter_price').innerHTML =
that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 0 ) +
" - "+that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 1 );

$( "#slider_price" ).slider( {
change: function( event, ui ) {
that.change_price_filter(event, ui);
}
} );
initpaging(result_per_page);
};

PWebFilterApp.prototype.addFilterMap = function(map_slug, city_map_div_id, map_lang, lat, lng) {
	this.pweb_maps[map_slug] = new PWebFilterMap(city_map_div_id, map_lang, lat, lng);
	initpaging(result_per_page);
};

PWebFilterApp.prototype.apply_filters = function() {

	this.results_limit = '';
	
	this.$data_empty_msg.hide();
	this.$sort_controls_div.hide();
	this.$data_div.html("");
	this.$data_loading_msg.show();

	this.init_counts();
	
	this.jtable_hits = this.jtable.filter(this.get_filters());
	
	if(this.count_st==0) {
		this.compute_counts();
		this.update_counts();
		this.count_st++;
	}

	this.update_counts();
	
	this.sort_hits(this.actual_sort_index.row, this.actual_sort_order);

        this.update();

        this.updateMap();

        initpaging(result_per_page);

}; // end apply_filters() 

PWebFilterApp.prototype.updateMap = function() { 
	//Re initiatilize prop_number_to_focus of property map
	this.pweb_maps['property'].prop_number_to_focus = -1;
	
	if(this.pweb_maps['city'].enabled === true)
	{
		this.pweb_maps['city'].updateMarkers(this.jtable_hits);
	}
	this.pweb_maps['city'].reDraw();
};
PWebFilterApp.prototype.update = function() { 
	var that = this;

	//Re initiatilize prop_number_to_focus of property map
	this.pweb_maps['property'].prop_number_to_focus = -1;

	if(this.jtable_hits_sorted.length <= 0)
	{
		this.$data_loading_msg.hide();
		this.$data_empty_msg.show();
		this.$sort_controls_div.hide();
		this.$data_div.html("");
		$('#applied_filter_hosting_property').hide();
		$('#cb_group_type_filter li').find(':input').each(function(){
		 			var type_val = $(this).is(':checked');
		 			var type_input = $(this).attr('id');
		 			 if((type_input == 'type_all') && (type_val == true)){
						 $('#applied_filter_hosting_property').hide();
						 temp =0;
						 return false;
					  }else if(type_val == true){
						 	   $('#applied_filter_hosting_property').show();
						  return false;
						  }
		 			
				});
	}
	else
	{
		var output = Mustache.to_html(this.template, { "properties": this.jtable_hits_sorted});

		this.$data_loading_msg.hide();
		this.$sort_controls_div.show();

		this.$data_div.html(output);

		//Init jquery UI tabs
		$('ul.ui-tabs-nav').tabs();
		
		$('#cb_group_type_filter li').find(':input').each(function(){
		 			var type_val = $(this).is(':checked');
		 			var type_input = $(this).attr('id');
		 			 if((type_input == 'type_all') && (type_val == true)){
						 $('#applied_filter_hosting_property').hide();
						 return false;
					  }else if(type_val == true){
						   $('#applied_filter_hosting_property').show();
						  }
		 		});
		
		//Map tab events
		that.tabs_map_binded = new Array();
		$('a[name=city_map_show_property]').click(function() {
			prop_number = $(this).attr("rel");
			that.changeMapProperty('property',prop_number);
		});

		this.display_extra_filters();
		
		$(".picture_number").each(function(index, value) {
			index = index +1;
			$(this).html(index);
		});
			
	}
	
	//update count
	this.FiltersCounts['city_results_count_current'] = this.jtable_hits_sorted.length;
	this.FiltersCounts['city_results_count_total']   = this.FiltersCounts['city_results_filtered'];
	this.FiltersCounts['city_results_count_total_temp']   = this.FiltersCounts['city_results_filtered_temp'];
	this.update_counts();
	
	
	if(this.FiltersCounts['city_results_count_current'] < this.FiltersCounts['city_results_count_total_temp'])
	{
		$('#show_more_results').show();
	}
	else
	{
		$('#show_more_results').hide();
	}
	//Review tab events
	$('a[name=review_show_property]').click(function()
	{
		var prop_number = this.rel;
		
		$("#city_comments_"+prop_number).html('<p><img src="http://'+window.location.host+'/images/V2/loading-squares.gif" alt="" /></p>');
		$.ajax(
			{
				type:"POST",
				url:"http://"+window.location.host+"/reviews_map/"+prop_number+"/2",
				success:function(data)
						{
							$("#city_comments_"+prop_number).html(data);
						}
			});
	});
	
	$("a.prop_more_info").click(function (){
		var ID = $(this).attr('rel');
		$("#prop_more_info_wrap_"+ID).toggle();
		return false;
	});
	
	$("a.prop_more_info_close").click(function (){
		var ID = $(this).attr('rel');
		$("#prop_more_info_wrap_"+ID).toggle();
		return false;
	});
	
}; // end init() 

PWebFilterApp.prototype.changeMapProperty = function(map_slug, prop_number) {
	
	if(this.pweb_maps[map_slug].prop_number_to_focus !== prop_number)
	{
		//close last opened map tab & clear map from that div
		if(this.pweb_maps[map_slug].prop_number_to_focus > 0)
		{
			$("#first_tab_"+this.pweb_maps[map_slug].prop_number_to_focus).click();
			this.pweb_maps[map_slug].gmap.clearMapDiv();
		}
		
		//Change div to display map
		if(prop_number > 0)
		{
			this.pweb_maps[map_slug].gmap.setMapDivId("city_map_view_"+prop_number);
		}
		
		//Set markers and focus
		this.pweb_maps[map_slug].prop_number_to_focus = prop_number;
		this.pweb_maps[map_slug].updateMarkers(this.jtable_hits);
		
		//Enable and draw map
		this.pweb_maps[map_slug].enableMap();
		
	}
};

PWebFilterApp.prototype.fetch_index = function(rowname) {
	var index = false;
	jQuery.each(this.indexes, function() {
		if(rowname.toString() === this.row.toString())
		{
			index = this;
		}
	});
	return index;
};

PWebFilterApp.prototype.sort_hits = function(indexname,dir,update) { 

	this.actual_sort_index = this.fetch_index(indexname);
	this.actual_sort_order = dir;

	if(this.actual_sort_index === false)
	{
		//log error in console
		return false;
	}

	this.jtable_hits_sorted = jOrder( this.jtable_hits )
	    .index('propertyNumber', ['propertyNumber'], { grouped: false, ordered: true, type: jOrder.number })
	    .index(this.actual_sort_index.row, [this.actual_sort_index.row], {grouped: true, ordered: true, type: this.actual_sort_index.type})
//	    .orderby([this.actual_sort_index.row], this.actual_sort_order);
	    .orderby([this.actual_sort_index.row], this.actual_sort_order,{ indexName: this.actual_sort_index.row,offset: 0, limit: this.results_limit });
	    
	if(update !== undefined)
	{
		this.update();
	}
	initpaging(result_per_page);
	
};// end sort_hits

PWebFilterApp.prototype.init_counts = function() {
	this.FiltersCounts['city_results_count_current'] = 0;
	this.FiltersCounts['city_results_count_total_temp'] =0;
    this.FiltersCounts['city_results_filtered_temp'] = 0;

	/*this.FiltersCounts['city_results_filtered']      = 0;
	this.FiltersCounts['prop-types-count-0'] = 0;
	this.FiltersCounts['prop-types-count-1'] = 0;
	this.FiltersCounts['prop-types-count-2'] = 0;
	this.FiltersCounts['prop-types-count-3'] = 0;
	this.FiltersCounts['prop-types-count-4'] = 0;
	this.FiltersCounts['prop-types-count-5'] = 0;*/
	initpaging(result_per_page);
};

//Compute counts
PWebFilterApp.prototype.display_extra_filters = function() {

	this.hasDowntownFilter  = false;
	this.hasBreakfastFilter = false;
	
	for (var index in this.jtable_hits)
	{
		if(this.hasDowntownFilter === false)
		{
			for (var i = 0; i < this.jtable_hits[index].landmarks.length; i++) {
				
				if(this.jtable_hits[index].landmarks[i].slug  === "City-Center")
				{
					this.hasDowntownFilter = true;
				}
			}
		}
		
		if(this.hasBreakfastFilter === false)
		{
			for (var i = 0; i < this.jtable_hits[index].amenities.length; i++) {
				
				if(this.jtable_hits[index].amenities[i].slug == 'free-breakfast')
				{
					this.hasBreakfastFilter = true;
				}
			}
		}
		
		if((this.hasDowntownFilter === true) &&
		  (this.hasBreakfastFilter === true))
		{
			break;
		}
	}
	
	if(this.hasDowntownFilter === true)
	{
		$('#downtown_2nd_filter').parent().show();
	}
	else
	{
		$('#downtown_2nd_filter').parent().hide();
	}
	
	if(this.hasBreakfastFilter === true)
	{
		$('#breakfast_2nd_filter').parent().show();
	}
	else
	{
		$('#breakfast_2nd_filter').parent().hide();
	}
	initpaging(result_per_page);
};

//Compute counts
PWebFilterApp.prototype.compute_counts = function() {
	//compute counts
	this.compute_district_counts();
	initpaging(result_per_page);
};

PWebFilterApp.prototype.compute_district_counts = function() {
	for (var index in this.jtable_hits)
	{
		for (var di = 0; di < this.DistrictsCheckBoxes.$checkboxes_li.length; di++)
		{
			var current_district_id = this.DistrictsCheckBoxes.$checkboxes_li[di].firstChild.value;
			if(current_district_id == undefined)
			current_district_id = 0;
			if(this.FiltersCounts['district-count-'+current_district_id]==undefined)
			this.FiltersCounts['district-count-'+current_district_id]=0;
			for (var pdi = 0; pdi < this.jtable_hits[index].districts.length; pdi++)
			{
				if( current_district_id == this.jtable_hits[index].districts[pdi].district_id)
				{
					this.FiltersCounts['district-count-'+current_district_id]++;
				}
			}
		}
		for (var di = 0; di < this.LandmarksCheckBoxes.$checkboxes_li.length; di++)
		{
			var current_landmark_id = this.LandmarksCheckBoxes.$checkboxes_li[di].firstChild.value;
			if(current_landmark_id == undefined)
			current_landmark_id = 0;
			if(this.FiltersCounts['landmark-count-'+current_landmark_id]==undefined)
			this.FiltersCounts['landmark-count-'+current_landmark_id]=0;
			for (var pdi = 0; pdi < this.jtable_hits[index].landmarks.length; pdi++)
			{
				if( current_landmark_id === this.jtable_hits[index].landmarks[pdi].landmark_id)
				{
					this.FiltersCounts['landmark-count-'+current_landmark_id]++;
				}
			}
		}
		
		for (var di = 0; di < this.FacilitiesFilterCheckBoxes.$checkboxes_li.length; di++)
		{
			var current_facility_id = this.FacilitiesFilterCheckBoxes.$checkboxes_li[di].firstChild.value;
			if(this.FiltersCounts['facility-count-'+current_facility_id]==undefined)
			this.FiltersCounts['facility-count-'+current_facility_id]=0;
			for (var pdi = 0; pdi < this.jtable_hits[index].amenities_filter.length; pdi++)
			{
				if( current_facility_id === this.jtable_hits[index].amenities_filter[pdi])
				{
					this.FiltersCounts['facility-count-'+current_facility_id]++;
				}
			}
		}
	}
	initpaging(result_per_page);
};

PWebFilterApp.prototype.update_counts = function() {
	if($('#applied_filter_hosting_price').css('display')=='none' && $('#applied_filter_hosting_rating').css('display')=='none' && $('#applied_filter_hosting_property').css('display')=='none' && $('#applied_filter_hosting_facilities').css('display')=='none' && $('#applied_filter_hosting_districts').css('display')=='none' && $('#applied_filter_hosting_landmarks').css('display')=='none'  ){
	$('#filters_text').hide();
	}else{
		$('#filters_text').show();
	}
	
	for (var id in this.FiltersCounts)
	{ 
		
		$('#'+id).html(this.FiltersCounts[id]);
	}
//	$('#city_results_count_current').html(this.jtable_hits.count());
	//city_results_count_current
	initpaging(result_per_page);
};
PWebFilterApp.prototype.get_filters = function() {

	//All filters values selected
	var that = this,
	types_filter      = this.TypeFilterCheckBoxes.getCheckedValues(),
	facilities_filter = this.FacilitiesFilterCheckBoxes.getCheckedValues(),
	districts_filter  = this.DistrictsCheckBoxes.getCheckedValues(),
	landmarks_filter  = this.LandmarksCheckBoxes.getCheckedValues(),
	pricemin_filter   = this.PriceFilterMin || -1,
	pricemax_filter   = this.PriceFilterMax || -1,
	ratingmin_filter  = this.RatingFilterMin || -1,
	ratingmax_filter  = this.RatingFilterMax || -1,
	minnight_filter   = true;
	
	//Get data values matching filters
	//Set appropriate counts
	return function(property) {
	
		var match_type = false,
		    match_facility = false,
		    match_all_facility = true,
		    match_district = false,
		    match_landmark = false,
		    match_price = false,
		    match_rating = false;
		
		//Filter out property that requires more night than user asked
		if((minnight_filter === true) && (property.minNights >= that.request.numnights_selected))
		{
			return false;
		}
		
		// compute Min avail price
		if(that.PriceRangeMin === -1)
		{
			that.PriceRangeMin = property.display_price;
		}
		else if(that.PriceRangeMin > property.display_price)
		{
			that.PriceRangeMin = property.display_price;
		}	

		//compute max avail price
		if(that.PriceRangeMax === -1)
		{
			that.PriceRangeMax = property.display_price;
		}
		else if(that.PriceRangeMax < property.display_price)
		{
			that.PriceRangeMax = property.display_price;
		}

		//compute min avail rating
		if(that.RatingRangeMin === -1)
		{
			that.RatingRangeMin = property.overall_rating;
		}
		else if(that.RatingRangeMin > property.overall_rating)
		{
			that.RatingRangeMin = property.overall_rating;
		}

		//compute max avail rating
		if(that.RatingRangeMax === -1)
		{
			that.RatingRangeMax = property.overall_rating;
		}
		else if(that.RatingRangeMax < property.overall_rating)
		{
			that.RatingRangeMax = property.overall_rating;
		}

		//property type filter	
		jQuery.each(types_filter, function() { 

			if((this.toString() === "type_hostels")&&
			  (property.propertyType === "Hostel"))
			{
				match_type =  true;
				return true;
			}
			else if((this.toString() === "type_hotels")&&
			  (property.propertyType === "Hotel"))
			{
				match_type =  true;
				return true;
			}
			else if((this.toString() === "type_apartments")&&
			  (property.propertyType === "Apartment"))
			{
				match_type =  true;
				return true;
			}
			
			else if((this.toString() === "type_bbs")&&
			  (property.propertyType === "Guesthouse"))	
			{
				match_type =  true;
				return true;
			}
			else if((this.toString() === "type_campings")&&
			  ((property.propertyType === "Camping")||((property.propertyType === "Campsite"))))
			{
				match_type =  true;
				return true;
			}
			
		});
		
		//If no district filter is selected match all
		//Else match only the checked filter		
		if(facilities_filter.length === 0)
		{
			$('#applied_filter_hosting_facilities').hide();
			match_facility = true;			
		}
		else
		{
			//Property district filter
			jQuery.each(facilities_filter, function() {
				
				var target_filter_id = this.toString();
				
				//if array property.amenities_filter is not empty
				// and contains ALL of the facilities filter match it and return
				for (var i = 0; i < property.amenities_filter.length; i++) {
					if(target_filter_id === property.amenities_filter[i].toString())
					{
						match_all_facility = match_all_facility && true;
						return true;
					}
				}
				//When the loop did 
				match_all_facility = false;
			});
			
			$('#cb_group_facilities_filter li').find(':input').each(function(){
		 			var type_val = $(this).is(':checked');
		 			var type_input = $(this).attr('id');
		 			 if((type_input == 'facility_all') && (type_val == true)){
						 $('#applied_filter_hosting_facilities').hide();
						 return false;
					  }else if(type_val == true){
						   $('#applied_filter_hosting_facilities').show();
						  }
		 		});
		 		
			//$('#applied_filter_hosting_facilities').show();
			match_facility = match_all_facility;
		}


		//If no district filter is selected match all and compute count
		//Else match only the checked filter
		if(districts_filter.length === 0)
		{
			$('#applied_filter_hosting_districts').hide();
			match_district = true;			
		}
		else
		{
			//Property district filter
			jQuery.each(districts_filter, function() {
				
				var target_filter_id = parseInt(this);
				//if array property.distritcts is not empty
				// and contains one of the district filter match it and return
				for (var i = 0; i < property.districts.length; i++) {
					
					if(target_filter_id === parseInt(property.districts[i].district_id))
					{
						match_district =  true;
						return true;
					}
				}
			});
			
			$('#cb_group_districts_filter li').find(':input').each(function(){
		 			var type_val = $(this).is(':checked');
		 			var type_input = $(this).attr('id');
		 			 if((type_input == 'districts_all') && (type_val == true)){
						 $('#applied_filter_hosting_districts').hide();
						 return false;
					  }else if(type_val == true){
						   $('#applied_filter_hosting_districts').show();
						  }
		 		});
			//$('#applied_filter_hosting_districts').show();
		}
	
		//If no landmark filter is selected match all
		//Else match only the checked filter
		if(landmarks_filter.length === 0)
		{
			$('#applied_filter_hosting_landmarks').hide();
			match_landmark = true;			
		}
		else
		{
			//Property district filter
			jQuery.each(landmarks_filter, function() {
				
				var target_filter_id = parseInt(this);
				//if array property.distritcts is not empty
				// and contains one of the district filter match it and return
				for (var i = 0; i < property.landmarks.length; i++) {
					
					if(target_filter_id === parseInt(property.landmarks[i].landmark_id))
					{
						match_landmark =  true;
						return true;
					}
					
				}
			});
			$('#cb_group_landmarks_filter li').find(':input').each(function(){
		 			var type_val = $(this).is(':checked');
		 			var type_input = $(this).attr('id');
		 			 if((type_input == 'landmark_all') && (type_val == true)){
						 $('#applied_filter_hosting_landmarks').hide();
						 return false;
					  }else if(type_val == true){
						   $('#applied_filter_hosting_landmarks').show();
						  }
		 		});
			//$('#applied_filter_hosting_landmarks').show();
		}

		//Property price filter
		//if filter is not set automatically match
		if(pricemax_filter === -1)
		{
			match_price = true;
		}
		//filter is set AND and filter match
		else if((property.display_price <= pricemax_filter) &&
				(property.display_price >= pricemin_filter))
		{
			match_price = true;
		}
		
		//Property rating filter
		//if filter is not set automatically match
		if(ratingmax_filter === -1)
		{
			match_rating = true;
		}
		else if((property.overall_rating <= ratingmax_filter) &&
				(property.overall_rating >= ratingmin_filter))
		{
			match_rating = true;
		}

		if((match_type && match_facility && match_price && match_rating && match_district && match_landmark) === true)
		{	
			if(match_type) {
				that.FiltersCounts['city_results_filtered_temp']++;
				if(that.count_st==0)
				{
					that.FiltersCounts['city_results_filtered']++;
					that.FiltersCounts['prop-types-count-0']++;
			 	}
			}

			if((property.propertyType === "Hostel"))
			{ 
				if(that.count_st==0) that.FiltersCounts['prop-types-count-1']++;
				return true;
			}
			else if((property.propertyType === "Hotel"))
			{
				if(that.count_st==0) that.FiltersCounts['prop-types-count-2']++;
				return true;
			}
			else if((property.propertyType === "Apartment"))
			{
				if(that.count_st==0) that.FiltersCounts['prop-types-count-3']++;
				return true;
			}
			else if((property.propertyType === "Guesthouse"))
			{
				if(that.count_st==0) that.FiltersCounts['prop-types-count-4']++;
				return true;
			}
			else if((property.propertyType === "Camping")||((property.propertyType === "Campsite")))
			{
				if(that.count_st==0) that.FiltersCounts['prop-types-count-5']++;
				return true;
			}
			
		}
		
	};
	initpaging(result_per_page);
};


PWebFilterApp.prototype.setData = function(json_data) {
	jOrder.logging = null;
	this.jtable = jOrder(json_data)
				    .index('propertyNumber', ['propertyNumber'], { grouped: false, ordered: true, type: jOrder.number })
				    .index('propertyType', ['propertyType'], { grouped: true , ordered: true, type: jOrder.string });
	this.FiltersCounts['city_results_count_total'] = json_data.length;
	
};

PWebFilterApp.prototype.setRequestData = function(json_request_data) {
	this.request = json_request_data;
	this.PriceCurrencySymbol = this.request.display_currency;
};

PWebFilterApp.prototype.change_price_filter = function(event, ui) {
	this.PriceFilterMin = ui.values[ 0 ];
	this.PriceFilterMax = ui.values[ 1 ];
		if((pweb_filter.PriceRangeMin == this.PriceFilterMin && pweb_filter.PriceRangeMax == this.PriceFilterMax))
		{
		$('#applied_filter_hosting_price').hide();
		}else{
		$('#applied_filter_hosting_price').show();
		}

	this.apply_filters();
	initpaging(result_per_page);
};

PWebFilterApp.prototype.change_rating_filter = function(event, ui) {
	this.RatingFilterMin = ui.values[ 0 ];
	this.RatingFilterMax = ui.values[ 1 ];
		if((pweb_filter.RatingRangeMin == this.RatingFilterMin && pweb_filter.RatingRangeMax == this.RatingFilterMax))
		{
		$('#applied_filter_hosting_rating').hide();
		}else{
		$('#applied_filter_hosting_rating').show();
		}
	this.apply_filters();
	initpaging(result_per_page);
};

PWebFilterApp.prototype.init_action_filters = function() {
	var that = this;
	this.PriceRangeMin = Math.floor(this.PriceRangeMin);
	this.PriceRangeMax = Math.ceil(this.PriceRangeMax);
	
	$( "#slider_price" ).slider({
		range: true,
		min: that.PriceRangeMin,
		max: that.PriceRangeMax,
		values: [ that.PriceRangeMin, that.PriceRangeMax ],
		slide: function( event, ui ) {
			document.getElementById('filter_price').innerHTML = that.PriceCurrencySymbol + ui.values[ 0 ] + " - "+that.PriceCurrencySymbol + ui.values[ 1 ] ;
		},
		change: function( event, ui ) {
			that.change_price_filter(event, ui);
		}
	});
	document.getElementById('filter_price').innerHTML = that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 0 ) +
		" - "+that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 1 );
	//$( "#filter_price" ).text( that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 0 ) + " - "+that.PriceCurrencySymbol + $( "#slider_price" ).slider( "values", 1 ) );
	
	$( "#slider_rating" ).slider({
		range: true,
		min: that.RatingRangeMin,
		max: that.RatingRangeMax,
		values: [ that.RatingRangeMin, that.RatingRangeMax ],
		slide: function( event, ui ) {
			document.getElementById('filter_rating').innerHTML = ui.values[ 0 ] + "% - " + ui.values[ 1 ] + "%";
			that.RatingFilterMin = ui.values[ 0 ];
			that.RatingFilterMax = ui.values[ 1 ];
		},
		change: function( event, ui ) {
			that.change_rating_filter(event, ui);
		} 
	});
	document.getElementById('filter_rating').innerHTML = $( "#slider_rating" ).slider( "values", 0 ) +
		"% - " + $( "#slider_rating" ).slider( "values", 1 )+"%";
	
	$('#breakfast_2nd_filter').click(function ()
			{
				if($('#breakfast_2nd_filter').is(':checked'))
				{
					$('#'+that.BreakfastExtraCheckId).attr('checked', true);
				}
				else
				{
					$('#'+that.BreakfastExtraCheckId).attr('checked', false);
				}
				that.apply_filters();
			});
	
	$('#downtown_2nd_filter').click(function ()
			{
				if($('#downtown_2nd_filter').is(':checked'))
				{
					$('#'+that.DowntownExtraCheckId).attr('checked', true);
				}
				else
				{
					$('#'+that.DowntownExtraCheckId).attr('checked', false);
				}
				that.apply_filters();
			});
	
	//synchronize checkboxes
	$('#'+this.BreakfastExtraCheckId).click(function ()
			{
				if($('#'+that.BreakfastExtraCheckId).is(':checked'))
				{
					$('#breakfast_2nd_filter').attr('checked', true);
				}
				else
				{
					$('#breakfast_2nd_filter').attr('checked', false);
				}
					
			});
	$('#'+this.DowntownExtraCheckId).click(function ()
			{
				if($('#'+that.DowntownExtraCheckId).is(':checked'))
				{
					$('#downtown_2nd_filter').attr('checked', true);
				}
				else
				{
					$('#downtown_2nd_filter').attr('checked', false);
				}
			});
	
	this.TypeFilterCheckBoxes.clickAction(function (){
		that.apply_filters();
 	});
	this.FacilitiesFilterCheckBoxes.clickAction(function (){
		that.apply_filters();
	});
	this.DistrictsCheckBoxes.clickAction(function (){
		that.apply_filters();
	});
	this.LandmarksCheckBoxes.clickAction(function (){
		that.apply_filters();
	});
	initpaging(result_per_page);
};
PWebFilterApp.prototype.setClickSort = function(divID, DOMNodeID, rowname) {
	var that = this;
	
	$('#'+DOMNodeID).click(function(){

		$('#'+divID+' .sorting').removeClass('activesort');
		$(this).addClass('activesort');

		if($(this).children().hasClass('asc'))
	{
			$(this).children().removeClass('asc');
			$(this).children().addClass('desc');
			that.sort_hits(rowname,jOrder.desc,true);
	}
		else
		{
			$(this).children().removeClass('desc');
			$(this).children().addClass('asc');

			that.sort_hits(rowname,jOrder.asc,true);
		}
		return false;
	});
	initpaging(result_per_page);
};

PWebFilterApp.prototype.refresh = function(more_results) {
	more_results   = more_results || 0;
	
	this.results_limit = this.results_limit + more_results;
	this.sort_hits(this.actual_sort_index.row, this.actual_sort_order,true);
	initpaging(result_per_page);
};
PWebFilterApp.prototype.toggleMap = function(map_slug) {
	this.pweb_maps[map_slug].toggle();
	
	if(this.pweb_maps[map_slug].isMapEnable() === true)
	{
		this.pweb_maps[map_slug].updateMarkers(this.jtable_hits);
	}
	initpaging(result_per_page);
};


var totalRecords = 0;
var hostelCount = 0;
var apartmentCount = 0;
var guesthouseCount = 0;
var hotelCount = 0;
var campCount = 0;

//Put setup filter in PWebFilterApp prototypes?
function setup_filters(data)
{
	data = jQuery.parseJSON(data);
	pweb_filter.setRequestData(data.request);
	pweb_filter.setData(data.property_list);
	
	totalRecords = data.property_list.length;

	pweb_filter.addFilterMap('city', 'city_map_container', 'en', data.city_info.city_geo_lat, data.city_info.city_geo_lng);
	pweb_filter.addFilterMap('property', "will_set_on_tab_click", 'en', data.city_info.city_geo_lat, data.city_info.city_geo_lng);

	pweb_filter.setClickSort('data_sort_controls','sortname-tous','propertyName');
	pweb_filter.setClickSort('data_sort_controls','sortprice-tous','display_price');
	pweb_filter.setClickSort('data_sort_controls','sortcote-tous','overall_rating');
	$('#data_sort_controls').show();

	pweb_filter.apply_filters();

	pweb_filter.set_init_filters_value();
	
	pweb_filter.init_action_filters();
	
	$('#city_map_show_1').click(function()
	{
		pweb_filter.toggleMap('city');
		$('#map_button_side').hide();
		$('#city_map_show_2').hide();
		$('#city_map_hide').show();
		return false;
	});
	$('#city_map_show_2').click(function()
	{
		pweb_filter.toggleMap('city');
		$(this).hide();
		$('#map_button_side').hide();
		$('#city_map_hide').show();
		return false;
	});
	$('#city_map_hide').click(function()
	{
		pweb_filter.toggleMap('city');
		$(this).hide();
		$('#city_map_show_2').show();
		$('#map_button_side').show();
		return false;
	});
	
	$('#reset_filters').click(function()
			{
				pweb_filter.reset_filters();
				pweb_filter.apply_filters();
				return false;
			});
	initpaging(result_per_page);		
	
}

function closeFilter(type) {
	that = this;
	switch(type)
	{
		case 'price':
			$( "#slider_price" ).slider({values: [ pweb_filter.PriceRangeMin, pweb_filter.PriceRangeMax ]});
			break;
		case 'rating':
			$( "#slider_rating" ).slider({values: [ pweb_filter.RatingRangeMin, pweb_filter.RatingRangeMax ]});
			break;
		case 'prop_types':
			$('input[name^='+type+']').each(function(){
				$(this).attr('checked',true);
			});
			break;
		default:	
			$('input[name^='+type+']').each(function(){
				$(this).attr('checked',false);
			});
			if (type == 'facilities') $("#breakfast_2nd_filter").attr('checked',false);
			if (type == 'landmarks') $("#downtown_2nd_filter").attr('checked',false);
			break;
	}
	pweb_filter.apply_filters();
}

$(document).ready(function() { 

  pweb_filter = new PWebFilterApp();
  initpaging(result_per_page);

  $("ul.rating li").bind('mouseover', function(){
    var container = getPropertyRatingsContainer(this);
    container.show();
  });

  $("ul.rating li").bind('mouseout', function(){
    var container = getPropertyRatingsContainer(this);
    container.hide();
  });

  function getPropertyRatingsContainer(that) {
    var propertyNumber = $(that).attr("data-propertyNumber");
    return $("#property_ratings_" + propertyNumber + " .propertyRatingsContainer");
  }
});