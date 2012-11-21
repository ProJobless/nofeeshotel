function checkPropertyRoomsAvail(base_url, propertyNumber, dateId, n, propertyName, currency, dateWarning,minNights, avail_table_id)
{
	$("#avail-overview-"+propertyNumber).hide();
	$("#loading-dispo-"+propertyNumber).show();
	if (minNights > n){
		n = minNights;
	}
	var cards = "";
	if(document.getElementById('book-property-cards') != null)
	{
		cards = document.getElementById('book-property-cards').value;
	}

//	var c=obj.currency.options[obj.currency.selectedIndex].value;
//	var l=obj.language.value;
	var todayDate = new Date();
  todayDate.setHours(0);
  todayDate.setMinutes(0);
  todayDate.setSeconds(0);
  
  var searchDate 	=  $("#"+dateId).datepicker( "getDate" );
  var d = siteDateString(searchDate);
  
  searchDate.setHours(23);
  searchDate.setMinutes(59);
  searchDate.setSeconds(59);
  
	if(isValidDate(d) == false)
	{
	  triggerWarning(dateWarning);
    $("#loading-dispo-"+propertyNumber).hide();
	}
	else if(todayDate > searchDate)
  {
	  triggerWarning(dateWarning);
   $("#loading-dispo-"+propertyNumber).hide();
  }
	else
	{
	  closeWarning();
	$("#"+avail_table_id).html('');
	$.ajax({type:"post",
			url:base_url+"rooms_avail/",
			data: { propertyNumber: propertyNumber, dateStart: d, numNights: n, propertyName: propertyName, currency:currency, propertyCards: cards },
			timeout:10000,
			error:function(XMLHttpRequest, textStatus, errorThrown)
			{
				$("#"+avail_table_id).html("<ul class=\"error\"><li>Erreur.<li>"+textStatus+"</li><li>"+errorThrown+"</li></li></ul>");
				$("#loading-dispo-"+propertyNumber).hide();
			},
			success:function(data)
			{
				$("#"+avail_table_id).html(data);
				$("#loading-dispo-"+propertyNumber).hide();
				
			}
		});
	}
	
}