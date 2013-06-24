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

	this.totalRecords = 0;
	this.hostelCount = 0;
	this.apartmentCount = 0;
	this.guesthouseCount = 0;
	this.hotelCount = 0;
	this.campCount = 0;
	this.allproids;
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
	this.TypeFilterCheckBoxes = new GroupCheckBoxes("cb_group_type_filter");
	this.FacilitiesFilterCheckBoxes = new GroupCheckBoxes("cb_group_facilities_filter");
	this.DistrictsCheckBoxes  = new GroupCheckBoxes("cb_group_districts_filter");
	this.LandmarksCheckBoxes  = new GroupCheckBoxes("cb_group_landmarks_filter");

	this.DowntownExtraCheckId  = 'landmark-downtown';
	this.BreakfastExtraCheckId = 'facility-free-breakfast';
	this.SafestCheckId       = 'safest_filter';
	this.BestLocationCheckId = 'best_location_filter';

	this.hasDowntownFilter  = false;
	this.hasBreakfastFilter = false;
	this.hasSafestFilter       = false;
	this.hasBestLocationFilter = false;
	
	
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
						},
						{
							"row": "ratings_safety",
							"grouped": true,
							"ordered": true,
							"type": jOrder.number
						},
						{
							"row": "ratings_location",
							"grouped": true,
							"ordered": true,
							"type": jOrder.number
						}
				];
	this.actual_sort_index = this.indexes[3];
	this.actual_sort_order = jOrder.asc;
	
	this.results_limit = 20;
	
	this.pweb_maps = new Array();
	
}; // end init()

PWebFilterApp.prototype.apply_filters = function() {

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

	// apply compare checkboxes
	if ($('.selectedPropertyForCompare').length) {
		$('.selectedPropertyForCompare').each(function() {
			var elem = $(this);

			if (elem.val()) {
				var checkbox = $('#pro_compare_' + elem.val());
				if (checkbox.length) {
					checkbox.parent().find('label').css('color', '#3087C9');
					checkbox.attr('checked', 'checked');
				}
			}
		});
	}
};

PWebFilterApp.prototype.set_init_filters_value = function() {	
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
	this.FiltersInitValues['hostels_2nd_filter'] = false;
	this.FiltersInitValues['downtown_2nd_filter'] = false;	
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
};

PWebFilterApp.prototype.reset_Pricefilters = function() 
{
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
};

PWebFilterApp.prototype.addFilterMap = function(map_slug, city_map_div_id, map_lang, lat, lng) {
	this.pweb_maps[map_slug] = new PWebFilterMap(city_map_div_id, map_lang, lat, lng);
};

PWebFilterApp.prototype.updateMap = function() { 
	//Re initiatilize prop_number_to_focus of property map
	this.pweb_maps['property'].prop_number_to_focus = -1;
	
	if(this.pweb_maps['city'].enabled === true)
	{
		this.pweb_maps['city'].updateMarkers(this.jtable_hits);
	}
        this.pweb_maps['city'].reDraw();
        
        if(this.pweb_maps['cityFilterMap'].enabled === true)
	{
            this.pweb_maps['cityFilterMap'].updateMarkers(this.jtable_hits);
            this.pweb_maps['cityFilterMap'].reDraw();
            this.pweb_maps['cityFilterMap'].showfilteredDistrict();
            this.pweb_maps['cityFilterMap'].showfilteredLandmark();
            
        }
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
		
                $('#cb_group_type_filter li').find(':input').each(function() {
                    var type_val = $(this).is(':checked');
                    var type_input = $(this).attr('id');
                    
                    if(type_val === false){
                        $('#applied_filter_hosting_property').show();
                        return false;
                    }
                });
	}
	else
	{
		// display ratings based on sorting
		if (this.actual_sort_index) {
			for (var i = 0; i < this.jtable_hits_sorted.length; i++) {
				var currentData = this.jtable_hits_sorted[i];

				this.jtable_hits_sorted[i]['display_alternate_rating'] = false;

				if (this.actual_sort_index.row == 'ratings_safety' || this.actual_sort_index.row == 'ratings_location') {
					if (this.actual_sort_index.row == 'ratings_location') {
						this.jtable_hits_sorted[i]['ratings_safety_safe']      = false;
						this.jtable_hits_sorted[i]['ratings_safety_very_safe'] = false;
						this.jtable_hits_sorted[i]['ratings_safety_under']     = false;

						if (currentData['ratings']['location'] >= 70 && currentData['ratings']['location'] < 80) {
							this.jtable_hits_sorted[i]['display_alternate_rating'] = true;
							this.jtable_hits_sorted[i]['ratings_location_good']    = true;
						}
						else {
							if (currentData['ratings']['location'] >= 80) {
								this.jtable_hits_sorted[i]['display_alternate_rating'] = true;
								this.jtable_hits_sorted[i]['ratings_location_great']   = true;
							}
							else {
								this.jtable_hits_sorted[i]['display_alternate_rating'] = true;
								this.jtable_hits_sorted[i]['ratings_location_under']   = true;
							}
						}
					}
					else {
						this.jtable_hits_sorted[i]['ratings_location_good']  = false;
						this.jtable_hits_sorted[i]['ratings_location_great'] = false;
						this.jtable_hits_sorted[i]['ratings_location_under'] = false;

						if (currentData['ratings']['safety'] >= 70 && currentData['ratings']['safety'] < 80) {
							this.jtable_hits_sorted[i]['display_alternate_rating'] = true;
							this.jtable_hits_sorted[i]['ratings_safety_safe']      = true;
						}
						else {
							if (currentData['ratings']['safety'] >= 80) {
								this.jtable_hits_sorted[i]['display_alternate_rating'] = true;
								this.jtable_hits_sorted[i]['ratings_safety_very_safe'] = true;
							}
							else {
								this.jtable_hits_sorted[i]['display_alternate_rating'] = true;
								this.jtable_hits_sorted[i]['ratings_safety_under'] = true;
							}
						}
					}
				}
			}
		}

		var output = Mustache.to_html(this.template, { "properties": this.jtable_hits_sorted});

		this.$data_loading_msg.hide();
		this.$sort_controls_div.show();

		this.$data_div.html(output);

//                //Init jquery UI tabs
                  $('ul.ui-hostels_tabs-nav').tabs();
//

        $('#applied_filter_hosting_property').hide();
        $('#cb_group_type_filter li').find(':input').each(function() {
            var type_val = $(this).is(':checked');
            var type_input = $(this).attr('id');
                    if(type_val === false){
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
                
                // change the marker that appears between the property image and the property name 
                 // for now always show markers from 1 to 20
                 var tempIndex = 0;
                $(".property_marker_number").each(function(index, value) {
                   
                    if ( tempIndex === 20 ){
                        tempIndex = 0;
                    }
			tempIndex = tempIndex +1;
                        // get image src
                    	var imageSrc = $(this).attr('src');
//                      replace it with image index
                        imageSrc = imageSrc.replace("marker_1.png", "marker_"+tempIndex+".png"); 
                        $(this).attr("src", imageSrc);    
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
	
        this.cleanupDistrcitsAndLandmarks();
	
	this.initpaging();

	var freeHtml = $('.free').html();
	$(freeHtml).prependTo('#property_list .icon_facility_extra3');
	
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
//	    .orderby([this.actual_sort_index.row], this.actual_sort_order,{ indexName: this.actual_sort_index.row,offset: 0, limit: this.results_limit });
	    .orderby([this.actual_sort_index.row], this.actual_sort_order,{ indexName: this.actual_sort_index.row});

	if(update !== undefined)
	{
		this.update();
	}
	
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
};

//Compute counts
PWebFilterApp.prototype.display_extra_filters = function() {

	this.hasDowntownFilter  = false;
	this.hasBreakfastFilter = false;
	this.hasHostelsFilter   = false;
	
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

		if (this.hasHostelsFilter === false) {
			if (this.jtable_hits[index].propertyType == 'Hostel') {
				this.hasHostelsFilter = true;
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

	if (parseInt($('#type_hostels').parent().find('span').html(), 10) > 0) {
		$('#hostels_2nd_filter').parent().show();
	}
	else {
		$('#hostels_2nd_filter').parent().hide();
	}
};

//Compute counts
PWebFilterApp.prototype.compute_counts = function() {
	//compute counts
	this.compute_district_counts();
};

PWebFilterApp.prototype.compute_district_counts = function() {
	for (var index in this.jtable_hits) {
		for (var di = 0; di < this.DistrictsCheckBoxes.$checkboxes_li.length; di++) {
			var current_district_id = $(this.DistrictsCheckBoxes.$checkboxes_li[di]).find('[name="districts"]').val();

			if(current_district_id == undefined)
				current_district_id = 0;

			if(this.FiltersCounts['district-count-'+current_district_id]==undefined)
				this.FiltersCounts['district-count-'+current_district_id]=0;

			for (var pdi = 0; pdi < this.jtable_hits[index].districts.length; pdi++) {
				if( current_district_id.toString() === this.jtable_hits[index].districts[pdi].district_id.toString()) {
					this.FiltersCounts['district-count-'+current_district_id.toString()]++;
				}
			}
		}

		for (var di = 0; di < this.LandmarksCheckBoxes.$checkboxes_li.length; di++) {
			var current_landmark_id = $(this.LandmarksCheckBoxes.$checkboxes_li[di]).find('[name="landmarks"]').val();

			if(current_landmark_id == undefined)
				current_landmark_id = 0;

			if(this.FiltersCounts['landmark-count-'+current_landmark_id]==undefined)
				this.FiltersCounts['landmark-count-'+current_landmark_id]=0;

			for (var pdi = 0; pdi < this.jtable_hits[index].landmarks.length; pdi++) {
				if( current_landmark_id.toString() === this.jtable_hits[index].landmarks[pdi].landmark_id.toString()) {
					this.FiltersCounts['landmark-count-'+current_landmark_id.toString()]++;
				}
			}
		}
		
		for (var di = 0; di < this.FacilitiesFilterCheckBoxes.$checkboxes_li.length; di++) {
			var current_facility_id = this.FacilitiesFilterCheckBoxes.$checkboxes_li[di].getElementsByTagName("input")[0].value;

			if(this.FiltersCounts['facility-count-'+current_facility_id]==undefined) {
                            this.FiltersCounts['facility-count-'+current_facility_id]=0;
                        }
			
			for (var pdi = 0; pdi < this.jtable_hits[index].amenities_filter.length; pdi++) {
				if( current_facility_id === this.jtable_hits[index].amenities_filter[pdi]) {
					this.FiltersCounts['facility-count-'+current_facility_id]++;
				}
			}
		}
	}
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
	//city_results_count_current
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
			
			$('#cb_group_districts_filter li').find("input[type='checkbox']").each(function(){
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
			$('#cb_group_landmarks_filter li').find("input[type='checkbox']").each(function(){
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
};


PWebFilterApp.prototype.setData = function(json_data) {
	jOrder.logging = null;

	// add necessary info
	for (var i = 0; i < json_data.length; i++) {
		var currentData = json_data[i];

		json_data[i]['ratings_safety']   = 0;
		json_data[i]['ratings_location'] = 0;

		json_data[i]['ratings_safety_safe']      = false;
		json_data[i]['ratings_safety_very_safe'] = false;
		json_data[i]['ratings_location_good']    = false;
		json_data[i]['ratings_location_great']   = false;

		json_data[i]['display_alternate_rating'] = false;

		if (typeof(currentData['ratings']) != 'undefined' && typeof(currentData['ratings']) == 'object') {
			if (typeof(currentData['ratings']['safety']) != 'undefined') {
				json_data[i]['ratings_safety'] = currentData['ratings']['safety'];
			}

			if (typeof(currentData['ratings']['location']) != 'undefined') {
				json_data[i]['ratings_location'] = currentData['ratings']['location'];
			}
		}
	}
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
		min: that.RatingRangeMin || 0,
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
	
	$('#breakfast_2nd_filter').click(function () {
		var obj = $(this);

		var breakfast = $('#facility-extra3, #facility-26');

		if($('#breakfast_2nd_filter').is(':checked')) {
			breakfast.attr('checked', 'ckecked');
		}
		else {
			breakfast.attr('checked', false);
		}

		breakfast.triggerHandler('click');

//		$('#facility-extra3').attr('checked', obj.attr('ckecked'));
//		$('#facility-extra3').click();
/*
				if($('#breakfast_2nd_filter').is(':checked'))
				{
					$('#'+that.BreakfastExtraCheckId).attr('checked', true);
				}
				else
				{
					$('#'+that.BreakfastExtraCheckId).attr('checked', false);
				}
				that.apply_filters();
*/
	});

	$('#hostels_2nd_filter').click(function () {
		var obj = $(this);

		if (obj.attr('checked')) {
			$('#cb_group_type_filter input[type="checkbox"]').attr('checked', false);
			$('#type_hostels').attr('checked', 'checked');
			$('#cb_group_type_filter input[type="checkbox"]').triggerHandler('click');
		}
		else {
			$('#cb_group_type_filter input[type="checkbox"]').attr('checked', 'checked').triggerHandler('click');
		}
	});

	$('#type_hostels').click(function() {
		var obj = $(this);
		
		if (!obj.attr('checked')) {
			$('#hostels_2nd_filter').attr('checked', false);
		}
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
    this.DistrictsCheckBoxes.clickAction(function() {
        that.apply_filters();
    });
    
    this.LandmarksCheckBoxes.clickAction(function() {
        that.apply_filters();
    });
};
PWebFilterApp.prototype.setClickSort = function(divID, DOMNodeID, rowname) {
	var that = this;

	$('#'+DOMNodeID).click(function(){
		var obj = $(this);

		$('#'+divID+' .sorting').removeClass('activesort');

		$(this).addClass('activesort');

		pweb_setCookie('city_sort_field', obj.attr('id'), 24);

		if ($(this).children().hasClass('asc') || $(this).hasClass('desc')) {
			pweb_setCookie('city_sort_direction', 'desc', 24);

			$(this).children().removeClass('asc');
			$(this).children().addClass('desc');

			that.sort_hits(rowname, jOrder.desc, true);
		}
		else {
			pweb_setCookie('city_sort_direction', 'asc', 24);

			$(this).children().removeClass('desc');
			$(this).children().addClass('asc');

			that.sort_hits(rowname, jOrder.asc, true);
		}
              // refresh map markers after sorting
              that.pweb_maps["city"].reDrawMarkers();

		return false;
	});
};
PWebFilterApp.prototype.updateMarkers = function(map_slug)
{
    if (this.pweb_maps[map_slug].enabled === true)
    {
        this.pweb_maps[map_slug].reDrawMarkers();
    }
};
PWebFilterApp.prototype.refresh = function(more_results) {
	more_results   = more_results || 0;
	
	this.results_limit = this.results_limit + more_results;
	this.sort_hits(this.actual_sort_index.row, this.actual_sort_order,true);
};
PWebFilterApp.prototype.toggleMap = function(map_slug) {
	this.pweb_maps[map_slug].toggle();

    //	if(this.pweb_maps[map_slug].isMapEnable() === true)
    //	{
    //		this.pweb_maps[map_slug].updateMarkers(this.jtable_hits);
    //	}
};

PWebFilterApp.prototype.setup = function(data) 
{
    var that = this;
	data = jQuery.parseJSON(data);

	totalRecords = data.property_list.length;

	// remove from search list
	for (var i = 0; i < data.property_list.length; i++) {
		if (data.property_list[i] && typeof(data.property_list[i]['propertyNumber'] != 'undefined') && getCookie('remove_' + data.property_list[i]['propertyNumber'])) {
			data.property_list.splice(i, 1);

			// go back one element
			i -= 1;
		}
	}

	// right about here load the QuickView
	if (typeof(data.property_list) != 'undefined') {
		if (typeof(data.property_list) == 'object') {
			for (var i in data.property_list) {
				QuickView.addProperty(data.property_list[i]);
			}
		}

		if (data.property_list.length) {
			for (var i = 0; i < data.property_list.length; i++) {
				QuickView.addProperty(data.property_list[i]);
			}
		}
	}

	this.setRequestData(data.request);
	this.setData(data.property_list);
	

	this.addFilterMap('city', 'city_side_map_container', 'en', data.city_info.city_geo_lat, data.city_info.city_geo_lng);
	this.addFilterMap('property', "will_set_on_tab_click", 'en', data.city_info.city_geo_lat, data.city_info.city_geo_lng);
        this.addFilterMap('cityFilterMap', "filter_map_rightSide", 'en', data.city_info.city_geo_lat, data.city_info.city_geo_lng);
       
	this.setClickSort('data_sort_controls','sortname-tous','propertyName');
	this.setClickSort('data_sort_controls','sortprice-tous','display_price');
	this.setClickSort('data_sort_controls','sortcote-tous','overall_rating');
	this.setClickSort('data_sort_controls','sortsafest-tous','ratings_safety');
	this.setClickSort('data_sort_controls','sortbestlocation-tous','ratings_location');

	$('#data_sort_controls').show();

	this.apply_filters();

//	this.set_init_filters_value();
	
	this.init_action_filters();

      $('#ul_map_filter_tabs').tabs();
      $('#ul_map_filter_tabs').bind('tabsselect', function(event, ui) {

        $('#ul_map_filter_tabs li').each(function() {

            if ($(this).hasClass("ui-tabs-selected")) {
                // li that holds the tabs
                var li_id = $(this).find("a").attr("href");
                li_id = li_id.split('#')[1];
                // ul that holds checkboxes
                var ul_id = "cb_group_landmarks_filter";

                if (li_id === "filter_content_districts_popup") {
                    ul_id = "cb_group_districts_filter";
                }

                var applyfilter_flag = false;

                //  clear all Districts options before applying filter on Landmark
                $("#" + ul_id + " li").each(function() {
                    var inputcheck = $(this).find("input[type='checkbox']");
                    if (inputcheck.is(':checked')) {
                        applyfilter_flag = true;
                        var checkbox_id = inputcheck.attr("id");
                        $('#' + checkbox_id).prop('checked', false);
                    }
                });
                if (applyfilter_flag === true) {
                    // apply filter again to rest the map
                    that.apply_filters();
                }

            }
        });
    });

    $('.city_map_filter').click(function() {
       
        // click on filter by Districts and Landmarks will trigger fancy box 
        // on div map_filter_popup
        $('#map_filter_popup').trigger('click',[this.id]);
    });

    $('#map_filter_popup').click(function(event, link_id) {
        // for some reason div reloads when ckicked inside it
        if ($('#map_filter_popup').is(":visible")) {
            return false;
        }
        else {

            if ($('#filter_map_leftSide').length < 1) {
                $('#filter_map_rightSide_container').removeClass("tabs_exist");
                $('#filter_map_rightSide_container').addClass("no_tabs");

            }
            else {
                $('#filter_map_rightSide_container').addClass("tabs_exist");
                $('#filter_map_rightSide_container').removeClass("no_tabs");
   
                $("#ul_map_filter_tabs").tabs('select', -1);
                $(".ui-tabs-selected").removeClass("ui-state-active").removeClass("ui-tabs-selected");
                // trigger tab according to the link that fire the fancybox
                if (link_id === "city_map_filter_districts") {
                    // trigger the district tab
                    $("#ul_map_filter_tabs").tabs('select', 0);
                    $("#filter_content_districts_popup").show();
                    $("#filter_content_landmarks_popup").hide();
                }
                else {
                    // trigger the landmark tab
                    $("#ul_map_filter_tabs").tabs('select', 1);
                    $("#filter_content_districts_popup").hide();
                    $("#filter_content_landmarks_popup").show();
                }

            }
            
            $("#map_filter_popup").fancybox({
                'transitionIn': 'elastic',
                'transitionOut': 'elastic',
                'showLoading': true,
                beforeShow: function() {
                    pweb_filter.toggleMap('cityFilterMap');
                    pweb_filter.toggleMap('city');
                },
                beforeClose: function() {
                    pweb_filter.toggleMap('cityFilterMap');
                    pweb_filter.toggleMap('city');
                }
            });//fancybox
            var filterByDistricts = false;
            var filterByLandmarks = false;

            if ($("#applied_filter_hosting_districts").is(":visible")) {
                filterByDistricts = true;
            }

            if ($("#applied_filter_hosting_landmarks").is(":visible")) {
                filterByLandmarks = true;
            }

            if (filterByDistricts === true || filterByLandmarks === true) {
                // clear landmark and districts filter
                pweb_filter.closeFilter('landmarks');
                pweb_filter.closeFilter('districts');
                // apply filter again to rest the map
                that.apply_filters();

            }
        }
    });

        // check if this city has latitude and longitude to display the right side map
    if ($("#city_geo_lat").val() !== "" && $("#city_geo_lng").val() !== "") {
        pweb_filter.toggleMap('city');
    }
    
    $('#reset_filters').click(function()
    {
        pweb_filter.reset_filters();
        pweb_filter.apply_filters();
        return false;
    });

	// handle the delete links
	this.handle_delete();

	// keep the prev sorting
	var sortCookie = getCookie('city_sort_field');
	if (sortCookie) {
		var elem = $('#' + sortCookie);

		if (elem.length) {
			var dir = getCookie('city_sort_direction');

			if (elem.find('.asc').length) {
				if (dir == 'asc') {
					elem.find('.asc').removeClass('asc').addClass('desc');
				}
			}

			if (elem.find('.desc').length) {
				if (dir == 'desc') {
					elem.find('.desc').removeClass('desc').addClass('asc');
				}
			}

			elem.trigger('click');
		}
	}

}

PWebFilterApp.prototype.closeFilter = function(type)
{
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
};

PWebFilterApp.prototype.cleanupDistrcitsAndLandmarks = function()  {
	$('.hostel_list').each(function() {
		if ($(this).find(".city_hostel_districts_values .content").html() == "") {
			$(this).find(".city_hostel_districts").hide();
			$(this).find(".city_hostel_districts_values .show_more").hide();
		}
		else {
			// remove last "," from districts
			var strDistricts = $(this).find(".city_hostel_districts_values .content").html();
			strDistricts = strDistricts.slice(0,-2);
			$(this).find(".city_hostel_districts_values .content").html(strDistricts + ".");
			$(this).find(".city_hostel_districts_values .show_more").attr('title', $(this).find(".city_hostel_districts_values .show_more").attr('title').replace(/,\s*$/, '.'));

			if (
				!$(this).find(".city_hostel_districts_values .content").html()
				|| $(this).find(".city_hostel_districts_values .content").html().length + $(this).find(".city_hostel_districts_district").html().length < 60
			) {
				$(this).find(".city_hostel_districts_values .show_more").hide();
			}
		}

		// remove landmarks if there are no landmarks
		// remove extra "," from the end of the values
		if ($(this).find(".city_hostel_landmarks_values .content").html() == "") {
			$(this).find(".city_hostel_landmarks").hide();
			$(this).find(".city_hostel_landmarks_values .show_more").hide();
		}
		else {
			// remove last "," from landmarks
			var strDistricts = $(this).find(".city_hostel_landmarks_values .content").html();
			strDistricts = strDistricts.slice(0,-2);
			$(this).find(".city_hostel_landmarks_values .content").html(strDistricts+".");
			$(this).find(".city_hostel_landmarks_values .show_more").attr('title', $(this).find(".city_hostel_landmarks_values .show_more").attr('title').replace(/,\s*$/, '.'));

			if (
				!$(this).find(".city_hostel_landmarks_values .content").html()
				|| ($(this).find(".city_hostel_landmarks_values .content").html().length + $(this).find(".city_hostel_landmarks_landmark").html().length) < 130
			) {
				$(this).find(".city_hostel_landmarks_values .show_more").hide();
			}
		}

		$(this).find(".city_hostel_landmarks_values .show_more").cluetip({
			width: '350px',
			local:true,
			cursor: 'pointer',
			arrows: false,
			dropShadow: false,
			sticky: false,
			positionBy: 'auto',
			cluetipClass: 'mcweb',
			tracking: true,
			splitTitle: '|',
			onShow: function(ct, ci) {
	//			ci.css('color', '#3087C9');
			}
		});

		$(this).find(".city_hostel_districts_values .show_more").cluetip({
			width: '350px',
			local:true,
			cursor: 'pointer',
			arrows: false,
			dropShadow: false,
			sticky: false,
			positionBy: 'auto',
			cluetipClass: 'mcweb',
			tracking: true,
			splitTitle: '|',
			onShow: function(ct, ci) {
	//			ci.css('color', '#3087C9');
			}
		});
	});
};

PWebFilterApp.prototype.initpaging = function() 
{
    var show_per_page = this.results_limit;  
    var number_of_items = this.jtable_hits_sorted.length; 
    var number_of_pages = Math.ceil(number_of_items/show_per_page);

    $('#current_page').val(0);  
    $('#show_per_page').val(show_per_page);

    var navigation_html = '<a class="previous_link" href="javascript:pweb_filter.previous();"><</a>';  
    var current_link = 0;  
    while(number_of_pages > current_link) {  
        navigation_html += '<a class="page_link" id="page_link_'+current_link+'" href="javascript:pweb_filter.go_to_page(' + current_link +')" longdesc="' + current_link +'">'+ (current_link + 1) +'</a>';  
        current_link++;  
    }  
    navigation_html += '<a class="next_link" href="javascript:pweb_filter.next();">></a>';  

    if (number_of_pages>1) {
      $('.resultcount').html('1-'+show_per_page);
      $('#resu').css('display', 'block'); 
      $('#page_navigation').html(navigation_html); 
    } else {
      $('.resultcount').html(number_of_items);
      $('#page_navigation').html(''); 
    } 
    $('.resulttotal').html(number_of_items);
    
    if(number_of_pages>0){
      $('#navi').css('display', 'inline-block');
      $('#resu').css('display', 'block'); 
    } else {
      $('#navi').css('display', 'none');
      $('#resu').css('display', 'none');
    }
  
    $('#page_navigation .page_link:first').addClass('active_page');  
    $('#property_list').children().css('display', 'none');  
    $('#property_list').children().slice(0, show_per_page).css('display', 'block');  
    $('.previous_link').css({"pointer-events":"none","color":"#ccc"});
    $('#page_link_0').css({"pointer-events":"none","color":"#ccc"});
};

PWebFilterApp.prototype.previous = function() 
{    
    new_page = parseInt($('#current_page').val()) - 1;  
    if($('.active_page').prev('.page_link').length==true){  
        this.go_to_page(new_page);  
    }  
};
                                       
PWebFilterApp.prototype.next = function() 
{   
    new_page = parseInt($('#current_page').val()) + 1;  
    if($('.active_page').next('.page_link').length==true){  
        this.go_to_page(new_page);  
    }  
};

PWebFilterApp.prototype.go_to_page = function(page_num) 
{   
  $("html, body").animate({ scrollTop: 200 }, 400);
  var show_per_page = parseInt($('#show_per_page').val());
  var number_of_items = $('#property_list').children().size(); 
  var number_of_pages = Math.ceil(number_of_items/show_per_page);  
  $('.page_link').css({"pointer-events":"visible ","color":"#227BBD"});
  $('#page_link_'+page_num).css({"pointer-events":"none","color":"#ccc"});
  if(page_num>0){
    $('.previous_link').css({"pointer-events":"visible ","color":"#227BBD"});
  }
  else {
    $('.previous_link').css({"pointer-events":"none","color":"#ccc"});
  }
  if(page_num==number_of_pages-1){
    $('.next_link').css({"pointer-events":"none","color":"#ccc"});
    var startfrom=show_per_page*parseFloat(number_of_pages-1);
    $('.resultcount').html(startfrom+'-'+number_of_items);
  } else {
    if(page_num==0) {
      var startfrom=1;
    }
    else if(page_num==1) { 
      var startfrom=show_per_page+1;
    }
    else {
      var startfrom=(show_per_page*parseFloat(page_num))+1;
    }
    var endto=show_per_page*parseFloat(page_num+1);
    $('.resultcount').html(startfrom+'-'+endto);
    $('.next_link').css({"pointer-events":"visible ","color":"#227BBD"});
  }      
  start_from = page_num * show_per_page;  
  end_on = start_from + show_per_page;                          
  
  $('#property_list').children().css('display', 'none').slice(start_from, end_on).css('display', 'block');  
  $('.page_link[longdesc=' + page_num +']').addClass('active_page').siblings('.active_page').removeClass('active_page');  
  $('#current_page').val(page_num).change();  
};
PWebFilterApp.prototype.changeMarkerIcon = function(map_slug, pDiv, pIcon) {
    if (this.pweb_maps[map_slug].enabled === true)
    {
        this.pweb_maps[map_slug].changeMarkerIcon(pDiv, pIcon);
    }
};


//PWeb map wrapper for map in filter

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
};
PWebFilterMap.prototype.reDrawMarkers = function ()
{
	if(this.enabled === true)
	{
	this.gmap.drawMarkers();
	}
};
PWebFilterMap.prototype.removeMarker = function(property_number)
{
    if (this.enabled === true)
    {
        this.gmap.removeMarker(property_number);
    }
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
};

PWebFilterMap.prototype.enableMap = function() 
{
	this.gmap.drawMap();
	this.enabled = true;
};

PWebFilterMap.prototype.disableMap = function() 
{	
	this.gmap.removeMap();
	this.prop_number_to_focus = -1;
	this.gmap.setFocusMarkerID(-1);
	this.enabled = false;
};

PWebFilterMap.prototype.isMapEnable = function() 
{
	return this.enabled;
};

//UPDATE map data
PWebFilterMap.prototype.updateMarkers = function(markers_data) 
{
	//clear all previous added marker and focus
	this.gmap.clearMap();

	//Add filtered markers to map
//	for (var i = 0; i < markers_data.length; i++) {
	for (var i in markers_data) {
		if(parseFloat(markers_data[i].Geo.Latitude) != 0.00 &&
		   parseFloat(markers_data[i].Geo.Longitude) != 0.00)
		{
//			var content = Mustache.to_html(this.infow_template, { "property": markers_data[i]});
			this.gmap.addMarker(i,markers_data[i].Geo.Latitude,markers_data[i].Geo.Longitude,markers_data[i].propertyName, '');
			
			if((this.prop_number_to_focus > 0) && (markers_data[i].propertyNumber == this.prop_number_to_focus))
			{
				//set focus to last insert marker
				this.gmap.setFocusMarkerID(i);
			}
		}
	}
};
PWebFilterMap.prototype.showfilteredDistrict = function() { 

         var values = [];
        
    $("#cb_group_districts_filter li").each(function() {


            var inputcheck = $(this).find("input[type='checkbox']");
            if (inputcheck.is(':checked')) {
                var district_id = inputcheck.val();
                var district_um_id = $("#hidden_district_"+district_id).val();
                values.push(district_um_id);
            }

     });

       this.gmap.changeDistrictLayer(values);
       	
};
PWebFilterMap.prototype.showfilteredLandmark = function() { 

                 var values = [];
        $("#cb_group_landmarks_filter li").each(function() {

           var inputcheck = $(this).find("input[type='checkbox']");
            if (inputcheck.is(':checked')) {
                var landmark_id = inputcheck.val();
                var landmark_id_lnglat = $("#hidden_landmarks_"+landmark_id).val();
                values.push(landmark_id_lnglat);
            }

     });
       this.gmap.changeLandmarkLayer(values);
       	
};
PWebFilterMap.prototype.changeMarkerIcon = function( pDiv, pIcon ) { 
       this.gmap.changeMarkerIcon( pDiv, pIcon );
       	
};
PWebFilterMap.prototype.changeDistrictLayer = function( district_um_ids ) { 
       this.gmap.changeDistrictLayer( district_um_ids );     	
};
PWebFilterMap.prototype.changeLandmarkLayer = function( landmark_LatLng ) { 
       this.gmap.changeLandmarkLayer( landmark_LatLng );     	
};


$(document).ready(function() { 
	
	if($.cookie('back_search') == 'false') {
			$('#city_load').hide();
			$.removeCookie('back_search', { path: '/' });
	} else {
			$('#city_load').show();
			$('#city_load').css('visibility','visible');
	}

  pweb_filter = new PWebFilterApp();
  pweb_filter.init();
  
    $("#current_page").live("change", function()
    {
        pweb_filter.updateMarkers("city");
        return false;
    });
    
  $("ul.rating li").live('mouseover', function(){
    var container = getPropertyRatingsContainer(this);
    container.show();
  });

  $("ul.rating li").live('mouseout', function(){
    var container = getPropertyRatingsContainer(this);
    container.hide();
  });

  function getPropertyRatingsContainer(that) {
    var propertyNumber = $(that).attr("data-propertyNumber");
    return $("#property_ratings_" + propertyNumber + " .propertyRatingsContainer");
  }

  $.ajax(
  {
    type:"GET",
    url:availibility_url,
    cache: true,
    success:function(data)
    {
      pweb_filter.setup(data);

      $('#search_load').show();
      $('#city_results_count').show();
      $('#city_load').hide();
      $('#wrap').show();
	  
	   $(".display_preview").fancybox({
            'titlePosition' : 'inside',
            'transitionIn'	: 'none',
            'transitionOut'	: 'none',
             beforeClose: function() {
                    pweb_filter.toggleMap('city');
                    pweb_filter.toggleMap('hostel_quickview');
                    pweb_filter.updateMarkers("city");
                }
	  });
	
	  $(".box_content").live({
		mouseenter: function(){   
	    	    $(this).find('.quick_view_bg').slideDown(500);   
		},
		mouseleave: function(){
		    $(this).find('.quick_view_bg').slideUp(300);      
	        }
	   });
		
	  var cookie_value = getCookie('compare');
	  var total_property =    cookie_value.split(",");
	  var property_selected = total_property.length;

	  if (total_property != '') {
		for (i = 0; i < property_selected; i++) {
			  $("#pro_compare_"+total_property[i]).attr('checked',true); 
			  $("#pro_compare_"+total_property[i]).parent().find('label').css('color', '#3087C9');
		}

		$('.compare_count').html(parseInt(property_selected, 10));
	  }
	  else {
		$('.compare_count').html('0');
	  }
    }
  });

  $('a#change-dates').click(function() 
  {
    $("#side_search_box_city").toggle();
    return false;
  });
  
});
/*code by deep*/

//$(".quick_view_bg_link,.pre_next_arrows").live('click', function(event){
$(".quick_view_bg_link").live('click', function(event){
	event.preventDefault();

//	pweb_filter = new PWebFilterApp();
//	pweb_filter.pweb_maps = new Array();
	pweb_filter.showQuickView(this);
//	pweb_map = new GoogleMap();
});
  
PWebFilterApp.prototype.getAllPropertyIds = function() {
var allproids = '';
   $("div[id^='prop_tab_box_']").each(function() {	
		allproids += $(this).attr('rel')+',';
	});
	pweb_filter.allproids = allproids.slice(0,-1);
    return pweb_filter.allproids;
};
  
PWebFilterApp.prototype.showQuickView = function(that) {
	var proid      =   $(that).attr('value');

	var wait_message = $('#wait_message').val();
	var nextid     =   $('#prop_tab_box_'+proid ).next().attr('rel');
	var preid      =   $('#prop_tab_box_'+proid ).prev().attr('rel');
	var numnight   =   $('#city_results_numnights_selected').html();
	var procur     =   $('#propertycur_'+proid ).val();

	var quickView = QuickView.getObject(proid);

	if (!quickView) {
		this.property_compare_detail(that);

		return;
	}

	quickView.getContent();
};

PWebFilterApp.prototype.property_compare_detail = function(that) {
var proid      =   $(that).attr('value');
var wait_message = $('#wait_message').val();
var nextid     =   $('#prop_tab_box_'+proid ).next().attr('rel');
var preid      =   $('#prop_tab_box_'+proid ).prev().attr('rel');
var numnight   =   $('#city_results_numnights_selected').html();
var procur     =   $('#propertycur_'+proid ).val();
var allproid   =   pweb_filter.getAllPropertyIds();
 
	if(preid!='' && preid!=null)
	{
		var preurl='<a href="javascript:void(0)" value="'+preid+'" class="pre_next_arrows"><img src="http://'+window.location.host+'/images/left.png"/></a>'
	}
	else{
		var preurl='';
	}
	if(nextid!='' && nextid!=null)
	{
		var nexturl='<a href="javascript:void(0)" value="'+nextid+'" class="pre_next_arrows"><img src="http://'+window.location.host+'/images/right.png"/></a>'
	}else{
		var nexturl='';
	}
	var text =  '<div class="loading-dispo-city loading-quick-preview" id="loading-pics"><p>'+wait_message+'</p></div>';	
	$('#quick_preview_div').empty().append(text);

    var ajaxrequest =  $.ajax({
		type:'GET',
		dataType: "json",
                cache: true,
		url: 'http://'+window.location.host+'/cmain/ajax_property_detail/'+proid+'/'+numnight+'/'+allproid+'/'+procur,
		success:function(data){ 

			$('#quick_preview_div').empty().html(data['html']);
			$('#preurl').html(preurl);
			$('#nexturl').html(nexturl);
			
			pweb_filter.addFilterMap('compare_property', 'map_canvas_compareProperty', 'en', data.map_data[0].Geo.Latitude,data.map_data[0].Geo.Longitude);
			 
                        
                        pweb_filter.toggleMap('compare_property');
                        pweb_filter.toggleMap('city'); 
                        
                        

	if($("#distrinct:radio:checked").length > 0)
           { 
            pweb_map.changeDistrictLayer($("#distrinct:radio:checked").val());
           }
             if($("#landmark:radio:checked").length > 0)
           { 
            pweb_map.changeLandmarkLayer($("#landmark:radio:checked").val());
           }
		}
	});
	
		$('.fancybox-close,.fancybox-overlay').live('click', function(){ 
			ajaxrequest.abort();
		});
	
};

PWebFilterApp.prototype.handle_delete = function() {
    var that = this;
    
	$(document).click(function(event) { 
		var clickedElement = $(event.target);

		if (
			clickedElement.attr('class') != 'remove_from_search_options'
			&& clickedElement.attr('class') != 'remove_from_search_option'
			&& clickedElement.attr('class') != 'remove_from_search'
			&& clickedElement.attr('class') != 'remove_from_search_icon'
			&& clickedElement.attr('class') != 'remove_from_search_trigger'
			&& clickedElement.attr('class') != 'remove_from_search_trigger_icon'
		) {
			$('.remove_from_search_options').hide();
		}
	});

	var me = this;

	$('.remove_from_search_options .remove_from_search').live('click', function(event) {
		event.preventDefault();

		var css = {
			position  : 'absolute',
			'z-index' : 300
		};
                
                var obj = $(this);
		var id = obj.attr('id');
                // split id to get property Number
                var arr_id_str = id.split("_");
                // get property number
                var property_number = arr_id_str.pop();
                // add class to main property to indicated as a removed property
                $("#prop_tab_box_"+property_number).addClass("clsRemoveFromSearch");
                
		var animate = {bottom: '-=350', marginLeft: '-=140'};
		var timer   = 1000;

		var number = null;

		if (obj.hasClass('remove_property_permanentely')) {
			number = id.replace('remove_property_permanentely_', '');

			pweb_setCookie('remove_' + number, number, 8765);

			css['bottom'] = '-' + $('#prop_tab_box_' + number).offset().top + 'px';

			$('#prop_tab_box_' + number).css(css).animate(animate, timer, function() { $('#prop_tab_box_' + number).hide(); $('#prop_tab_box_' + number).remove(); } );
		}
		else {
			if (obj.hasClass('remove_property_one_day')) {
				number = id.replace('remove_property_one_day_', '');

				pweb_setCookie('remove_' + number, number, 24);

				css['bottom'] = '-' + $('#prop_tab_box_' + number).offset().top + 'px';
				$('#prop_tab_box_' + number).css(css).animate(animate, timer, function() { $('#prop_tab_box_' + number).hide(); $('#prop_tab_box_' + number).remove(); });
			}
			else {
				if (obj.hasClass('remove_property_one_week')) {
					number = id.replace('remove_property_one_week_', '');

					pweb_setCookie('remove_' + number, number, 168);

					css['bottom'] = '-' + $('#prop_tab_box_' + number).offset().top + 'px';
					$('#prop_tab_box_' + number).css(css).animate(animate, timer, function() { $('#prop_tab_box_' + number).hide(); $('#prop_tab_box_' + number).remove(); });
				}
			}
		}

		if (number != null) {
			QuickView.remove(number);

			for (var i = 0; i < me.jtable_hits.length; i++) {
				if (me.jtable_hits[i] && me.jtable_hits[i]['propertyNumber'] && me.jtable_hits[i]['propertyNumber'] == number) {
					me.jtable_hits.splice(i, 1);

					// go back one element
					i -= 1;
				}
			}
		}

                // clear marker after removing property
                var n = this.id.lastIndexOf('_');
                var property_number = this.id.substring(n + 1);
                
                that.removeMarker("city", property_number);
                that.removeMarker("cityFilterMap", property_number);  
	});
};
PWebFilterApp.prototype.removeMarker = function(map_slug, property_number)
{
    if (this.pweb_maps[map_slug].enabled === true)
    {
        this.pweb_maps[map_slug].removeMarker(property_number);
    }
};
PWebFilterApp.prototype.changeDistrictLayer = function(map_slug, district_um_ids) {
    if (this.pweb_maps[map_slug].enabled === true)
    {
        this.pweb_maps[map_slug].changeDistrictLayer(district_um_ids);
    }
};
PWebFilterApp.prototype.changeLandmarkLayer = function(map_slug, landmark_LatLng) {
    if (this.pweb_maps[map_slug].enabled === true)
    {
        this.pweb_maps[map_slug].changeLandmarkLayer(landmark_LatLng);
    }
};
