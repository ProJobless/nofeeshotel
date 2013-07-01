<?php

class Db_hb_city extends CI_Model
{
  const CITY_TABLE      = 'hb_city';
  const COUNTRY_TABLE   = 'hb_country';
  const CONTINENT_TABLE    = 'continents';

  const CITY_TRANSLATION_TABLE = 'cities2';

  var $CI;

  function Db_hb_city()
  {
      parent::__construct();

      $this->CI =& get_instance();
      $this->CI->load->library('code_tracker');
      $this->CI->load->model('google/Ggeocodeapi');

      $this->db->simple_query("SET NAMES 'utf8'");
  }

  function hb_update_city_country($hb_countries, $lang = "en")
  {
    $hb_countries = $hb_countries["RESPONSE"];

    //disable query history because with multiple query it will cause memory problems
    $this->db->save_queries = false;

    foreach($hb_countries as $country)
    {

      //If country with same iso code is not in DB
      if(is_null($country_id = $this->get_country_by_hb_id(intval($country["ID"]))))
      {
        set_time_limit(30);
        //If country added correctly in DB
        if($this->insert_hb_country($country["NAME"], $country["CONTINENT"], $country["ID"], $country["LNAME"], $lang))
        {
          $this->CI->code_tracker->add_trace("Added country ".$country["NAME"]." (".$country["ID"]."), ".$country["CONTINENT"]." to DB");

          $country_id = $this->db->insert_id();

          //Add all cities of new country also
          foreach($country["LOCATIONS"] as $city)
          {
            $this->set_hb_city_in_db($city, $country, $country_id, $lang);
          }
        }
        else
        {
          $this->CI->code_tracker->add_trace("Error inserting country ".$country["ID"].", ".$country["NAME"]." to DB");
        }
      }
      else
      {
        //If country system name has change update it
        if(($old_country_name = $this->update_hb_country_sname_from_hb_id($country["ID"],$country["NAME"])) !== FALSE)
        {
          $this->CI->code_tracker->add_trace("Updated country system name to ".$country["NAME"]." for ".$old_country_name." (".$country["ID"]."), ".$country["CONTINENT"]);
        }

        //If country language name has change update it
        if(($old_country_lname = $this->update_hb_country_lname_from_hb_id($country["ID"], $country["LNAME"], $lang)) !== FALSE)
        {
          $this->CI->code_tracker->add_trace("Updated country language name ($lang) to ".$country["LNAME"]." for ".$old_country_lname." (".$country["ID"]."), ".$country["CONTINENT"]);
        }

        //if continent of country has changed update it
        if(($old_continent_id = $this->update_hb_continent_from_hb_id($country["ID"],$country["CONTINENT"])) !== FALSE)
        {
          $this->CI->code_tracker->add_trace("Updated country continent to ".$country["CONTINENT"]." for ".$country["NAME"]." (".$country["ID"]."), ".$this->get_continent($old_continent_id));
        }

        //If country already in DB with ID $country_id
        //Verify if cities are up to date and modify if needed
        foreach($country["LOCATIONS"] as $city)
        {
          $this->set_hb_city_in_db($city, $country, $country_id, $lang);
        }

        //check if all cities in DB are valid for this country
        foreach($this->get_all_hb_cities_of_country($country_id) as $db_city)
        {
          //If db city not in xml
          if(!$this->city_in_xml($hb_countries, $country["ID"], $db_city->hb_id))
          {
            //delete city from DB
            //hw_hostel associated with this hw_city_id ate deleted via the ON DELETE CASCADE database mechanism
            $this->db->where('hb_city_id', $db_city->hb_city_id);
            if($this->db->delete(self::CITY_TABLE))
            {
              $this->CI->code_tracker->add_trace("Deleted city ".$db_city->system_name.", ".$country["NAME"]." from DB");
            }
            else
            {
              $this->CI->code_tracker->add_trace("Error deleting city ".$db_city->system_name.", ".$country["NAME"]." from DB");
            }
          }
        }
      }

    }

    //check all country and cities in db and delete if it is not in the list
    if(!is_null($countries_in_db = $this->get_all_countries()))
    {
      foreach($countries_in_db as $db_country)
      {
        //If country not in list delete country and all its cities
        // note: the case where country is in list is taking care above when xml country is in DB
        if(!$this->country_in_xml($hb_countries,$db_country->hb_id))
        {
          $this->db->where('hb_country_id', $db_country->hb_country_id);
          $query = $this->db->get(self::CITY_TABLE);

          foreach($query->result() as $city)
          {
            //hb hostel associated with this hw_city_id are deleted via the ON DELETE CASCADE database mechanism
            $this->db->where('hb_city_id', $city->hb_city_id);
            if($this->db->delete(self::CITY_TABLE))
            {
              $this->CI->code_tracker->add_trace("Deleted city ".$city->system_name.", ".$db_country->system_name." from DB");
            }
            else
            {
              $this->CI->code_tracker->add_trace("Error deleting city ".$city->system_name.", ".$db_country->system_name." from DB");
            }

          }

          $this->db->where('hb_country_id', $db_country->hb_country_id);
          if($this->db->delete(self::COUNTRY_TABLE))
          {
            $this->CI->code_tracker->add_trace("Deleted country ".$db_country->system_name." (".$db_country->hb_id."), ".$db_country->continent_en." from DB");
          }
          else
          {
            $this->CI->code_tracker->add_trace("Error deleting country ".$db_country->system_name." (".$db_country->hb_id."), ".$db_country->continent_en." from DB");
          }
        }
      }
    }

  }

  function set_hb_city_in_db($city, $country, $country_id, $lang)
  {
    //If city is not there add it
    if(is_null($dbcity = $this->get_hb_city_from_hbid(intval($city["ID"]))))
    {
      if($this->insert_hb_city($city["NAME"], $city["ID"], $country_id, $country["LNAME"], $city["LNAME"], $lang))
      {
        $this->CI->code_tracker->add_trace("Added city ".$city["NAME"].", ".$country["NAME"]." to DB");
      }
      else
      {
        $this->CI->code_tracker->add_trace("Error inserting city ".$city["NAME"].", ".$country["NAME"]." to DB");
      }
    }
    else
    {
      //update city in DB
      if($this->update_hb_city($city, $dbcity, $lang))
      {
        $this->CI->code_tracker->add_trace("Updated system name, lname_$lang of city ".$city["NAME"]." (".$city["ID"]."), ".$country["NAME"]." to DB");
      }
    }
  }
  function cityCountryList_DB($continent = NULL, $country = NULL, $lang = "en")
  {
    $this->CI->load->helper('xml');

    $citylistobject = new SimpleXMLElement("<?xml version='1.0' ?>\n<CityCountryList></CityCountryList>");

    $last_country_id = 0;
    $cities = NULL;
    $city   = NULL;

    $cities_in_db = $this->get_hb_cities_of_country_name($continent, $country, $lang);

    if(!empty($cities_in_db))
    {
      foreach($cities_in_db AS $hb_city)
      {

        if(($last_country_id != $hb_city->hb_country_id) ||
            ($last_country_id == 0))
        {

          $country_object = new SimpleXMLElement("<Country></Country>");
          $country_object = $citylistobject->addChild("Country", $country_object);

          $country_object->addChild("countryContinent", $hb_city->continent_name);
          $country_object->addChild("countryContinentTranslated", $hb_city->continent_name_translated);
          //Need to escape & caharacters
          $country_object->addChild("countryName",      xml_convert($hb_city->hb_country_name));
          $country_object->addChild("countryNameTranslated",     xml_convert($hb_city->hb_country_name_translated));
          $country_object->addChild("countryCode",      $hb_city->country_iso_code_2);
          $country_object->addChild("countryLatitude",      $hb_city->country_geo_latitude);
          $country_object->addChild("countryLongitude",     $hb_city->country_geo_longitude);

          $cities = new SimpleXMLElement("<Cities></Cities>");
          $cities = $country_object->addChild("Cities", $cities);

          $cities->addChild("cityName", xml_convert($hb_city->city_lname_en_stripped));
          if(!empty($hb_city->hb_city_name_translated))
          {
            $cities->addChild("cityNameTranslated", xml_convert($hb_city->hb_city_name_translated));
          }
          else
          {
            $cities->addChild("cityNameTranslated", NULL);
          }

          if(!empty($hb_city->city_geo_latitude) && !empty($hb_city->city_geo_longitude))
          {
            $cities->addChild("cityLatitude", $hb_city->city_geo_latitude);
            $cities->addChild("cityLongitude", $hb_city->city_geo_longitude);
          }
          else
          {
            $cities->addChild("cityLatitude", NULL);
            $cities->addChild("cityLongitude", NULL);
          }

        }
        else
        {
          $cities = new SimpleXMLElement("<Cities></Cities>");
          $cities = $country_object->addChild("Cities", $cities);

          //Add city to actual country
          $cities->addChild("cityName", xml_convert($hb_city->city_lname_en_stripped));
          if(!empty($hb_city->hb_city_name_translated))
          {
            $cities->addChild("cityNameTranslated", xml_convert($hb_city->hb_city_name_translated));
          }
          else
          {
            $cities->addChild("cityNameTranslated", NULL);
          }

          if(!empty($hb_city->city_geo_latitude) && !empty($hb_city->city_geo_longitude))
          {
            $cities->addChild("cityLatitude", $hb_city->city_geo_latitude);
            $cities->addChild("cityLongitude", $hb_city->city_geo_longitude);
          }
          else
          {
            $cities->addChild("cityLatitude", NULL);
            $cities->addChild("cityLongitude", NULL);
          }
        }

        $last_country_id = $hb_city->hb_country_id;
      }
    }
    return $citylistobject;
  }

  function get_continent_en_id($continent_code)
  {
    $continent_code = $this->db->escape_str($continent_code);
    $this->db->where("LOWER(continent_hb_code) LIKE LOWER('$continent_code')");
    $query = $this->db->get(self::CONTINENT_TABLE);

    if($query->num_rows() == 1)
    {
      $row = $query->row();
      return $row->continent_id;
    }
    log_message('error',"db_hw_data error -> continent $continent_code not found or found more than once.");
    return NULL;
  }

  function get_continent($continent_id)
  {
    $this->db->where("continent_id",$continent_id);
    $query = $this->db->get(self::CONTINENT_TABLE);

    if($query->num_rows() == 1)
    {
      $row = $query->row();
      return $row->continent_en;
    }
    log_message('error',"db_hw_data error -> continent ID $continent_id not found or found more than once.");
    return NULL;
  }

  function get_country_by_hb_id($country_hb_id)
  {
    $this->db->where("hb_id",$country_hb_id);
    $query = $this->db->get(self::COUNTRY_TABLE);

    if($query->num_rows() > 0)
    {
      $row = $query->row();
      return $row->hb_country_id;
    }
    return NULL;
  }


  function get_all_countries()
  {
    $this->db->join(self::CONTINENT_TABLE, self::CONTINENT_TABLE.'.continent_hb_code = '.self::COUNTRY_TABLE.'.continent_hb_code', "left");
    $query = $this->db->get(self::COUNTRY_TABLE);

    if($query->num_rows() > 0)
    {
      return $query->result();
    }
    return NULL;
  }


  function get_hb_city_from_hbid($city_hb_id)
  {
    $this->db->where("hb_id",$city_hb_id);
    $query = $this->db->get(self::CITY_TABLE);

    if($query->num_rows() > 0)
    {
      $row = $query->row();
      return $row;
    }
    return NULL;
  }

  function get_hb_cities_of_country_name($continent_name = NULL, $country_name = NULL, $lang = "en")
  {
    log_message('debug', "get_hb_cities_of_country_name ".$continent_name." ".$country_name." ".$lang);

    $this->CI->load->model('Db_country');

    $lang = $this->CI->Db_country->lang_code_convert($lang);

    if(!empty($country_name))
    {
      $where_continent = "";
      $where_country   = "WHERE ";

      $country_name = strtolower(addslashes($country_name));

      $where_country .= "LOWER(co.system_name) = '$country_name'";
      $where_country .= " OR LOWER(co.lname_en) = '$country_name'";

      foreach($this->CI->Db_country->get_country_fields() as $country_field)
      {
        $where_country .= " OR LOWER(ci2.`$country_field`) = '$country_name'";
      }
    }
    elseif(!empty($continent_name))
    {
      $where_continent = "WHERE ";

      $continent_name = strtolower($continent_name);

      $where_continent .= "cn.continent_en = '".$continent_name."'";
      foreach($this->CI->Db_country->get_continent_fields() as $continent_field)
      {
        $where_continent .= " OR LOWER(`$continent_field`) = '".$continent_name."'";
      }
      $where_country = "";
    }
    else
    {
      $where_continent = "";
      $where_country   = "";
    }


    $sql   = "SELECT
		   co.continent_hb_code,
		   ci.system_name AS city_system_name,
		   co.system_name AS country_system_name,
		   ci.hb_city_id,
		   co.hb_country_id,
		   ci.geo_longitude AS city_geo_longitude,
		   ci.geo_latitude AS city_geo_latitude,
		   co.geo_longitude AS country_geo_longitude,
		   co.geo_latitude AS country_geo_latitude,
		   ci.lname_en AS hb_city_name,
		   TRIM(SUBSTRING_INDEX(ci.lname_en, ',', 1)) AS city_lname_en_stripped,
		   co.lname_en AS hb_country_name,
		   IFNULL(ci2.city_$lang, ci.lname_en) AS hb_city_name_translated,
		   co2.country_$lang AS hb_country_name_translated,
		   cn.continent_en AS continent_name,
		   cn.continent_$lang AS continent_name_translated,
		   co.country_iso_code_2

	  FROM hb_city ci
		JOIN hb_country co ON co.hb_country_id = ci.hb_country_id
		JOIN continents cn ON cn.continent_hb_code = co.continent_hb_code
		LEFT JOIN cities2 ci2 ON co.lname_en = ci2.country_en AND ci2.city_en = TRIM(SUBSTRING_INDEX(ci.lname_en, ',', 1))
		LEFT JOIN (SELECT DISTINCT country_$lang FROM cities2) co2 ON co.lname_en = co2.country_en

      $where_continent
      $where_country

	  ORDER BY hb_country_name_translated, hb_city_name_translated;";

    log_message('debug', "sql: ".$sql);

    $query = $this->db->query($sql);
    if($query->num_rows() > 0)
    {
      return $query->result();
    }
    return NULL;
  }

  function get_all_hb_cities_of_country($country_id)
  {
    $this->db->where("hb_country_id",$country_id);
    $query = $this->db->get(self::CITY_TABLE);
    if($query->num_rows() > 0)
    {
      return $query->result();
    }
    return NULL;
  }

  /**
   * @param $country_hb_id
   * @param $country_name
   * @return old country name if country name has been updated, False otherwise
   */
  function update_hb_country_sname_from_hb_id($country_hb_id, $system_name)
  {
    $this->db->where("hb_id",$country_hb_id);
    $query = $this->db->get(self::COUNTRY_TABLE);

    if($query->num_rows() == 1)
    {
      $row = $query->row();
      //if country name has changed update it
      if(strcasecmp($row->system_name,$system_name)!=0)
      {
        //update
        $this->db->set('system_name', (string)$system_name);
        $this->db->where('hb_id', $country_hb_id);
        if($this->db->update(self::COUNTRY_TABLE))
        {
          return $row->system_name;
        }
        log_message('error',"db_hb_data error -> Unable to update country system name of country with HB ID $country_hb_id.");
      }
      return FALSE;
    }

    log_message('error',"db_hb_data error -> country with HB ID $country_hb_id not found or found more than once. Unable to update country system name.");

    return FALSE;
  }

  /**
   * @param $country_hb_id
   * @param $lname
   * @param $lang
   * @return old country name if country name has been updated, False otherwise
   */
  function update_hb_country_lname_from_hb_id($country_hb_id, $lname, $lang = "en")
  {
    $this->db->where("hb_id",$country_hb_id);
    $query = $this->db->get(self::COUNTRY_TABLE);

    if($query->num_rows() == 1)
    {
      $row = $query->row();

      $lname_field = "lname_".$lang;
      //if country name has changed update it
      if(strcasecmp($row->$lname_field,$lname)!=0)
      {
        //update
        $this->db->set($lname_field, (string)$lname);
        $this->db->where('hb_id', $country_hb_id);
        if($this->db->update(self::COUNTRY_TABLE))
        {
          return $row->$lname_field;
        }
        log_message('error',"db_hb_data error -> Unable to update country $lname_field of country with HB ID $country_hb_id.");
      }
      return FALSE;
    }

    log_message('error',"db_hb_data error -> country with HB ID $country_hb_id not found or found more than once. Unable to update country $lname_field.");

    return FALSE;
  }

  /**
   * @param $country_hb_id
   * @param $continent
   * @return old continent id if countinent has been updated, False otherwise
   */
  function update_hb_continent_from_hb_id($country_hb_id, $continent)
  {
    $this->db->where("hb_id",$country_hb_id);
    $query = $this->db->get(self::COUNTRY_TABLE);

    if($query->num_rows() == 1)
    {
      $row = $query->row();
      //if continent has changed update it
      if(strcasecmp($row->continent_hb_code,$continent)!=0)
      {
        //update
        $this->db->set('continent_hb_code', $continent);
        $this->db->where('hb_id', $country_hb_id);
        if($this->db->update(self::COUNTRY_TABLE))
        {
          return $row->continent_hb_code;
        }
        log_message('error',"db_hw_data error -> Unable to update continent of country with HB ID $country_hb_id.");
      }
      return FALSE;
    }

    log_message('error',"db_hw_data error -> country with HB ID $country_hb_id not found or found more than once. Unable to update continent.");

    return FALSE;
  }

  function update_hb_city($hb_city, $db_city, $lang = "en")
  {
    $changed = false;
    $lname_field = "lname_".$lang;

    if($hb_city["ID"] != $db_city->hb_id)
    {
      log_message('error',"update_hb_city error -> Trying to update HB city data with different ID -> remote ID ".$hb_city["ID"]." , local DB ID ".$db_city->hb_id);
      return false;
    }

    if(strcasecmp($db_city->system_name,$hb_city["NAME"])!=0)
    {
      $this->db->set('system_name', $hb_city["NAME"]);
      $changed = true;
    }

    if(strcasecmp($db_city->$lname_field,$hb_city["LNAME"])!=0)
    {
      $this->db->set($lname_field, (string)$hb_city["LNAME"]);
      $changed = true;
    }

    if($changed === true)
    {
      $this->db->where('hb_id', $hb_city["ID"]);
      if($this->db->update(self::CITY_TABLE))
      {
        return true;
      }
      log_message('error',"db_hb_data error -> Unable to update city date for city ".$hb_city["NAME"]." of HB ID ".$hb_city["ID"].".");

    }

    return false;

  }

  function insert_hb_country($country_system_name, $continent_hb_code, $country_hb_id, $lname, $lang = "en")
  {
    $geo = $this->Ggeocodeapi->geocode($lname);

    if(!empty($geo) && !empty($geo->lng) && !empty($geo->lat))
    {
       $this->db->set('geo_longitude', $geo->lng);
       $this->db->set('geo_latitude', $geo->lat);
    }

    if(!empty($geo) && !empty($geo->countryCode))
    {
      $this->db->set('country_iso_code_2', $geo->countryCode);
    }

    $this->db->set('system_name', (string)$country_system_name);
    $this->db->set('lname_'.$lang, (string)$lname);
    $this->db->set('continent_hb_code', (string)$continent_hb_code);
    $this->db->set('hb_id', $country_hb_id);
    return $this->db->insert(self::COUNTRY_TABLE);
  }

  function insert_hb_city($city_system_name, $city_hb_id, $country_id, $country_lname, $lname, $lang = "en")
  {
    $geo = $this->Ggeocodeapi->geocode($lname.", ".$country_lname);

    if(!empty($geo) && !empty($geo->lng) && !empty($geo->lat))
    {
       $this->db->set('geo_longitude', $geo->lng);
       $this->db->set('geo_latitude', $geo->lat);
    }

    $this->db->set('system_name', (string)$city_system_name);
    $this->db->set('lname_'.$lang, (string)$lname);
    $this->db->set('hb_id', $city_hb_id);
    $this->db->set('hb_country_id', $country_id);
    return $this->db->insert(self::CITY_TABLE);
  }

  function country_in_xml($xml_countries,$country_hb_id_lookup)
  {
    foreach($xml_countries as $country)
    {
      if($country["ID"] == $country_hb_id_lookup)
      {
        return TRUE;
      }
    }

    return FALSE;
  }

  function city_in_xml($hb_countries, $country_hb_id_lookup ,$city_hb_id_lookup)
  {
    foreach($hb_countries as $xmlcountry)
    {
      if($xmlcountry["ID"] == $country_hb_id_lookup)
      {
        foreach($xmlcountry["LOCATIONS"] as $xmlcity)
        {
          if($xmlcity["ID"] == $city_hb_id_lookup)
          {
            return TRUE;
          }
        }
        return FALSE;
      }
    }

    return FALSE;
  }

  function set_logfile($filename)
  {
    $this->CI->code_tracker->set_logfile($filename);
  }

  function add_trace_to_report($text)
  {
    $this->CI->code_tracker->add_trace($text);
  }

  function modification_html_report()
  {
    return $this->CI->code_tracker->html_report();
  }

  function is_cities_modified()
  {
    return $this->CI->code_tracker->is_mod_added();
  }

}
