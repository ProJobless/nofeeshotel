<?php 
  
  if($reviews_translation_available)
  {
    $selectlang = "<select class=\"select-translate\"><option value=\"translate\">". _("Voir la version traduite")."</option><option value=\"original\">". _("Voir l'original")."</option></select>";
    ?>
    
    <script type="text/javascript">
      $(function()
        {   
          $('#comment-translate-menu').html('<?php echo $selectlang; ?>');
          $('#comment-translate-menu .select-translate').change(function() {
            
              var api = $(this).data('jsp');            
              var version = $(this).val();
              if (version =='translate'){
                $(".comment-list .original").hide();
                $(".comment-list .translated").show();
              }
              if (version =='original'){
                $(".comment-list .translated").hide();
                $(".comment-list .original").show();             
              }
            });         
        });
    </script>
    <?php 
  }
  else
  {
    ?>
    <script type="text/javascript">
      $(function()
        {   
          $('#comment-translate-menu').html('');
        });
    </script>
    <?php
  }
    
  $hw = false;
  foreach($user_reviews as $review)
  {
    $this->load->view("hw/review_list",$review);
  	
    if ($review["review_source"] == 'HW')
  	{
  	  $hw = true;
  	}
  }
  
  if ($hw)
  {
  	//echo '<p align="right" style="margin-right:10px;padding-top:30px;">* '._("Hostelworld customer review").'</p>';
  }
?>