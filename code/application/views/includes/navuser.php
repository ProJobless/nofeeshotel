<div class="box_content box_round side_entry">
	<span class="title"><strong><?php echo _("Options de Votre Compte");?></strong></span>
	<ul>
		<li><a href="<?php echo site_url($this->Db_links->get_link("user"));?>"><?php echo _("Page d'accueil");?></a></li>
		<li><a href="<?php echo site_url($this->Db_links->get_link("user_bookings"));?>"><?php echo _("Mes réservations");?></a></li>
		<li><a href="<?php echo site_url($this->Db_links->get_link("user_comments"));?>"><?php echo _("Mes évaluations");?></a></li>
		<li><a href="<?php echo site_url($this->Db_links->get_link("user_profile"));?>"><?php echo _("Mon profil");?></a></li>
		<li><a href="<?php echo site_url($this->Db_links->get_link("user_change_pass"));?>"><?php echo _("Changer de mot de passe");?></a></li>
	</ul>
</div>
