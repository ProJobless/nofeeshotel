<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

class Auth extends I18n_site
{

	function Auth()
	{
		parent::I18n_site();

		$this->load->config('tank_auth', TRUE);

		$this->load->helper(array('form', 'url','misc_tools'));
		$this->load->library('form_validation');
		$this->load->library('tank_auth');

		$this->load->model('Db_model');
		$this->load->model('Db_country');

		$this->lang->load('tank_auth','multi');

		//Currency initialization
		$this->load->library('get_config');
		$this->load->model('Db_currency');

		$currency_validated = $this->input->get("currency", TRUE);
		if(!empty($currency_validated))
		{
			$currency_validated = $this->Db_currency->validate_currency($currency_validated);
		}
		else
		{
			$currency_validated = $this->config->item('site_currency_default');
		}
		$this->get_config->set_config_from_get("currency","site_currency_selected",TRUE,'currency_selected',$currency_validated);

		//Load JS for search box
		if($this->user_agent_mobile && !$this->user_agent_mobile_bypass)
		{
			$this->carabiner->load_group_assets('mobile_main_menu');
		}
		else
		{
			$this->carabiner->load_group_assets('search_box_scripts');
		}
	}

	function index()
	{
		redirect($this->Db_links->get_link("connect"));
	}

	/**
	 * Login user on the site
	 *
	 * @return void
	 */
	function login() {
		$is_ajax = $this->input->is_ajax_request();

		if ($this->tank_auth->is_logged_in()) {									// logged in
			redirect('');

		} elseif ($this->tank_auth->is_logged_in(FALSE)) {						// logged in, not activated
			redirect('/auth/send_again/');

		} else {
			$data['login_by_username'] = ($this->config->item('login_by_username', 'tank_auth') AND $this->config->item('use_username', 'tank_auth'));
			$data['login_by_email'] = $this->config->item('login_by_email', 'tank_auth');

			$login_field = $this->lang->line('auth_field_email');
			if($data['login_by_username']) {
				$login_field = $this->lang->line('auth_field_login');
			}

			$this->form_validation->set_rules('login', $login_field, 'trim|required|xss_clean');
			$this->form_validation->set_rules('password', $this->lang->line('auth_field_password'), 'trim|required|xss_clean');
			$this->form_validation->set_rules('remember', $this->lang->line('auth_field_remember_me'), 'integer');

			// Get login for counting attempts to login
			if ($this->config->item('login_count_attempts', 'tank_auth') AND ($login = $this->input->post('login'))) {
				$login = $this->input->xss_clean($login);
			} else {
				$login = '';
			}

			$data['use_recaptcha'] = $this->config->item('use_recaptcha', 'tank_auth');
			if ($this->tank_auth->is_max_login_attempts_exceeded($login)) {
				if ($data['use_recaptcha'])
					$this->form_validation->set_rules('recaptcha_response_field', $this->lang->line('auth_field_confirmation_code'), 'trim|xss_clean|required|callback__check_recaptcha');
				else
					$this->form_validation->set_rules('captcha', $this->lang->line('auth_field_confirmation_code'), 'trim|xss_clean|required|callback__check_captcha');
			}
			$data['errors'] = array();

			if ($this->form_validation->run()) {								// validation ok
				if ($this->tank_auth->login(
							$this->form_validation->set_value('login'),
							$this->form_validation->set_value('password'),
							$this->form_validation->set_value('remember'),
							$data['login_by_username'],
							$data['login_by_email'])) {								// success
					delete_cookie('currency_selected');

					if ($is_ajax) {
						header('Content-type: application/json');
						echo json_encode(array(
							'ok' => true
						));
						exit();
					}
					else {
						redirect($this->Db_links->get_link("user"));
					}

				} else {
					$errors = $this->tank_auth->get_error_message();
					if (isset($errors['banned'])) {								// banned user
						$this->_show_message($this->lang->line('auth_message_banned').' '.$errors['banned']);
						return;

					} elseif (isset($errors['not_activated'])) {				// not activated user
						redirect('/auth/send_again/');

					} else {													// fail
						foreach ($errors as $k => $v)	$data['errors'][$k] = $this->lang->line($v);
					}
				}
			}

			$data['show_captcha'] = FALSE;
			if ($this->tank_auth->is_max_login_attempts_exceeded($login)) {
				$data['show_captcha'] = TRUE;
				if ($data['use_recaptcha']) {
					$data['recaptcha_html'] = $this->_create_recaptcha();
				} else {
					$data['captcha_html'] = $this->_create_captcha();
				}
			}

			//$this->load->view('auth/login_form', $data);

			if($this->user_agent_mobile && !$this->user_agent_mobile_bypass)
			{
				$data['current_view'] = "mobile/auth/login_form";
				$this->load->view('mobile/includes/template', $data);
			}
			else
			{
				$data['current_view'] = "auth/login_form";
				if ($this->input->is_ajax_request()) {
					$data['is_ajax'] = true;
					$this->load->view('includes/template-no-wrapper', $data);
				}
				else {
					$data['is_ajax'] = false;
					$this->load->view('includes/template', $data);
				}
			}
		}
	}

	/**
	 * Logout user
	 *
	 * @return void
	 */
	function logout()
	{
		$this->tank_auth->logout();

		$this->_show_message($this->lang->line('auth_message_logged_out'));

	}

	/**
	 * Register user on the site
	 *
	 * @return void
	 */
	function register(){
		$ajax_request = $this->input->is_ajax_request();

		if ($this->tank_auth->is_logged_in()) {									// logged in
			redirect('');

		} elseif ($this->tank_auth->is_logged_in(FALSE)) {						// logged in, not activated
			redirect('/auth/send_again/');

		} elseif (!$this->config->item('allow_registration', 'tank_auth')) {	// registration is off
			$this->_show_message($this->lang->line('auth_message_registration_disabled'));

			return;
		} else {
			$use_username = $this->config->item('use_username', 'tank_auth');

			if ($use_username) {
				$this->form_validation->set_rules('username', 'Username', 'trim|required|xss_clean|min_length['.$this->config->item('username_min_length', 'tank_auth').']|max_length['.$this->config->item('username_max_length', 'tank_auth').']|alpha_dash');
			}

			$choose_password = $ajax_request ? true : $this->config->item('user_choose_pass_on_registration', 'tank_auth');

			if($choose_password == TRUE) {
				$this->form_validation->set_rules('password', $this->lang->line('auth_field_password'), 'trim|required|xss_clean|min_length['.$this->config->item('password_min_length', 'tank_auth').']|max_length['.$this->config->item('password_max_length', 'tank_auth').']|alpha_dash');
				$this->form_validation->set_rules('confirm_password', 'lang:auth_field_confirm_new_password', 'trim|required|xss_clean|matches[password]');
			}

			$this->form_validation->set_rules('email', 'lang:auth_field_email', 'trim|required|xss_clean|valid_email');

			$captcha_registration	= $this->config->item('captcha_registration', 'tank_auth');
			$use_recaptcha		= $this->config->item('use_recaptcha', 'tank_auth');

			if ($captcha_registration) {
				if ($use_recaptcha) {
					$this->form_validation->set_rules('recaptcha_response_field', 'Confirmation Code', 'trim|xss_clean|required|callback__check_recaptcha');
				}
				else {
					$this->form_validation->set_rules('captcha', 'Confirmation Code', 'trim|xss_clean|required|callback__check_captcha');
				}
			}

			$data['errors'] = array();

			$email_activation = $ajax_request ? false : $this->config->item('email_activation', 'tank_auth');

			if ($this->form_validation->run()) {								// validation ok
				if ($choose_password == TRUE) {
					$pass = $this->form_validation->set_value('password');
				}
				else {
					$pass = random_string('alnum', $this->config->item('generate_password_length', 'tank_auth'));
				}

				if (!is_null($data = $this->tank_auth->create_user(
								$use_username ? $this->form_validation->set_value('username') : '',
								$this->form_validation->set_value('email'),
								$pass,
								$email_activation
				))) { // success
                                        // update with first name and last name
                                        if (!empty($data['user_id']) && $ajax_request) {
                                                $this->load->model('tank_auth/user_profiles');

                                                $this->user_profiles->set_profile_data(
                                                    $data['user_id'],
                                                    array(
                                                        'first_name'        => $_POST['first_name'],
                                                        'last_name'         => $_POST['last_name'],
                                                        'mail_subscription' => $_POST['mail_subscription'] ? 1 : 0
                                                    ),
                                                    false
                                                );
                                        }

					$data['site_name'] = $this->config->item('site_name');

					if ($email_activation) {									// send "activate" email
						$data['activation_period'] = $this->config->item('email_activation_expire', 'tank_auth') / 3600;

						$this->_send_email('activate', $data['email'], $data);

						unset($data['password']); // Clear password (just for any case)
						unset($pass);

						if ($ajax_request) {
							header('Content-type: application/json');

							echo json_encode(array('ok' => true));

							exit();
						}

						$this->_show_message($this->lang->line('auth_message_registration_completed_1'));
						return;
					} else {
						if ($this->config->item('email_account_details', 'tank_auth')) {	// send "welcome" email
							$this->_send_email('welcome', $data['email'], $data);
						}

						unset($data['password']); // Clear password (just for any case)
						unset($pass);

						if ($ajax_request) {
							header('Content-type: application/json');

							echo json_encode(array('ok' => true));

							exit();
						}

						$warning = NULL;
						if ($choose_password == FALSE) {
							$warning = $this->lang->line('auth_warning_password_sent');
						}

						$this->_show_message($this->lang->line('auth_message_registration_completed_2').' '.anchor($this->Db_links->get_link("connect"), $this->lang->line('auth_link_login')),$warning);
						return;
					}
				}
				else {
					$errors = $this->tank_auth->get_error_message();
					foreach ($errors as $k => $v)	$data['errors'][$k] = $this->lang->line($v);
				}
			}

			if ($captcha_registration) {
				if ($use_recaptcha) {
					$data['recaptcha_html'] = $this->_create_recaptcha();
				} else {
					$data['captcha_html'] = $this->_create_captcha();
				}
			}

			$data['use_username'] = $use_username;
			$data['choose_password'] = $choose_password;
			$data['captcha_registration'] = $captcha_registration;
			$data['use_recaptcha'] = $use_recaptcha;

			//$this->load->view('auth/register_form', $data);

			$data['is_ajax'] = $ajax_request;

			if($this->user_agent_mobile && !$this->user_agent_mobile_bypass)
			{
				$data['current_view'] = "mobile/auth/register_form";
				$this->load->view('mobile/includes/template',$data);
			}
			else
			{
				$data['current_view'] = "auth/register_form";

				if ($ajax_request) {
					$this->load->view('includes/template-no-wrapper', $data);
				}
				else {
					$this->load->view('includes/template', $data);
				}
			}
		}
	}

	/**
	 * Send activation email again, to the same or new email address
	 *
	 * @return void
	 *//*
	      function send_again()
	      {
	      if (!$this->tank_auth->is_logged_in(FALSE)) {							// not logged in or activated
	      redirect('/connexion/');

	      } else {
	      $this->form_validation->set_rules('email', 'Email', 'trim|required|xss_clean|valid_email');

	      $data['errors'] = array();

	      if ($this->form_validation->run()) {								// validation ok
	      if (!is_null($data = $this->tank_auth->change_email(
	      $this->form_validation->set_value('email')))) {			// success

	      $data['site_name']	= $this->config->item('site_name');
	      $data['activation_period'] = $this->config->item('email_activation_expire', 'tank_auth') / 3600;

	      $this->_send_email('activate', $data['email'], $data);

	      $this->_show_message(sprintf($this->lang->line('auth_message_activation_email_sent'), $data['email']));
	      return;
	      } else {
	      $errors = $this->tank_auth->get_error_message();
	      foreach ($errors as $k => $v)	$data['errors'][$k] = $this->lang->line($v);
	      }
	      }
	      $this->load->view('auth/send_again_form', $data);
	      }
	      }
	    */
	/**
	 * Activate user account.
	 * User is verified by user_id and authentication code in the URL.
	 * Can be called by clicking on link in mail.
	 *
	 * @return void
	 *//*
	      function activate()
	      {
	      $user_id		= $this->uri->segment(3);
	      $new_email_key	= $this->uri->segment(4);

	// Activate user
	if ($this->tank_auth->activate_user($user_id, $new_email_key)) {		// success
	$this->tank_auth->logout();
	$this->_show_message($this->lang->line('auth_message_activation_completed').' '.anchor('/connexion/', 'Login'));

	} else {																// fail
	$this->_show_message($this->lang->line('auth_message_activation_failed'));
	}
	}
	    */
	/**
	 * Generate reset code (to change password) and send it to user
	 *
	 * @return void
	 */
	function forgot_password()
	{

		if ($this->tank_auth->is_logged_in()) {									// logged in
			redirect('');

		} elseif ($this->tank_auth->is_logged_in(FALSE)) {						// logged in, not activated
			redirect('/auth/send_again/');

		} else {

			$data['login_by_username'] = ($this->config->item('login_by_username', 'tank_auth') AND
					$this->config->item('use_username', 'tank_auth'));

			$login_field = $this->lang->line('auth_field_email');
			if($data['login_by_username'])
			{
				$login_field = $this->lang->line('auth_field_login');
				$this->form_validation->set_rules('login', $login_field, 'trim|required|xss_clean');
			}
			else
			{
				$this->form_validation->set_rules('login', $login_field, 'trim|required|xss_clean|valid_email');
			}


			$data['errors'] = array();

			if ($this->form_validation->run()) {								// validation ok
				if (!is_null($data = $this->tank_auth->forgot_password(
								$this->form_validation->set_value('login')))) {

					$data['site_name'] = $this->config->item('site_name');

					// Send email with password activation link
					$this->_send_email('forgot_password', $data['email'], $data);

					$this->_show_message($this->lang->line('auth_message_new_password_sent'));
					return;

				} else {
					$errors = $this->tank_auth->get_error_message();
					foreach ($errors as $k => $v)	$data['errors'][$k] = $this->lang->line($v);
				}
				//else warning and after X tentatives ban and put captcha
			}
			//			$this->load->view('auth/forgot_password_form', $data);

			if($this->user_agent_mobile && !$this->user_agent_mobile_bypass)
			{
				$data['current_view'] = "mobile/auth/forgot_password_form";
				$this->load->view('mobile/includes/template',$data);
			}
			else
			{
				$data['current_view'] = "auth/forgot_password_form";
				$this->load->view('includes/template',$data);
			}
		}
	}

	/**
	 * Replace user password (forgotten) with a new one (set by user).
	 * User is verified by user_id and authentication code in the URL.
	 * Can be called by clicking on link in mail.
	 *
	 * @return void
	 */
	function reset_password()
	{

		$user_id		= $this->uri->segment(3);
		$new_pass_key	= $this->uri->segment(4);

		$this->form_validation->set_rules('new_password', $this->lang->line('auth_field_new_password'), 'trim|required|xss_clean|min_length['.$this->config->item('password_min_length', 'tank_auth').']|max_length['.$this->config->item('password_max_length', 'tank_auth').']|alpha_dash');
		$this->form_validation->set_rules('confirm_new_password', 'lang:auth_field_confirm_new_password', 'trim|required|xss_clean|matches[new_password]');

		$data['errors'] = array();

		if ($this->form_validation->run()) {								// validation ok
			if (!is_null($data = $this->tank_auth->reset_password(
							$user_id, $new_pass_key,
							$this->form_validation->set_value('new_password')))) {	// success

				$data['site_name'] = $this->config->item('site_name');

				// Send email with new password
				$this->_send_email('reset_password', $data['email'], $data);

				$this->_show_message($this->lang->line('auth_message_new_password_activated').' '.anchor($this->Db_links->get_link("connect"), $this->lang->line('auth_link_login')));
				return;

			} else {														// fail
				$this->_show_message($this->lang->line('auth_message_new_password_failed'));
				return;
			}
		} else {
			// Try to activate user by password key (if not activated yet)
			if ($this->config->item('email_activation', 'tank_auth')) {
				$this->tank_auth->activate_user($user_id, $new_pass_key, FALSE);
			}

			if (!$this->tank_auth->can_reset_password($user_id, $new_pass_key)) {
				$this->_show_message($this->lang->line('auth_message_new_password_failed'));
				return;
			}
		}

		if($this->user_agent_mobile && !$this->user_agent_mobile_bypass)
		{
			$data['current_view'] = "mobile/auth/reset_password_form";
			$this->load->view('mobile/includes/template',$data);
		}
		else
		{
			$data['current_view'] = "auth/reset_password_form";
			$this->load->view('includes/template',$data);
		}
	}

	/**
	 * Change user password
	 *
	 * @return void
	 */
	function change_password()
	{

		if (!$this->tank_auth->is_logged_in()) {								// not logged in or not activated
			redirect($this->Db_links->get_link("connect"));

		} else {
			$this->form_validation->set_rules('old_password', $this->lang->line('auth_field_old_password'), 'trim|required|xss_clean');
			$this->form_validation->set_rules('new_password', $this->lang->line('auth_field_new_password'), 'trim|required|xss_clean|min_length['.$this->config->item('password_min_length', 'tank_auth').']|max_length['.$this->config->item('password_max_length', 'tank_auth').']|alpha_dash');
			$this->form_validation->set_rules('confirm_new_password', $this->lang->line('auth_field_confirm_new_password'), 'trim|required|xss_clean|matches[new_password]');

			$data['errors'] = array();

			if ($this->form_validation->run()) {								// validation ok
				if ($this->tank_auth->change_password(
							$this->form_validation->set_value('old_password'),
							$this->form_validation->set_value('new_password'))) {	// success
					$this->_show_message($this->lang->line('auth_message_password_changed'));
					return;

				} else {														// fail
					$errors = $this->tank_auth->get_error_message();
					foreach ($errors as $k => $v)	$data['errors'][$k] = $this->lang->line($v);
				}
			}

			if($this->user_agent_mobile && !$this->user_agent_mobile_bypass)
			{
				$data['current_view'] = "mobile/auth/change_password_form";
				$this->load->view('mobile/includes/template',$data);
			}
			else
			{
				$data['current_view'] = "auth/change_password_form";
				$this->load->view('includes/template',$data);
			}
		}
	}

	/**
	 * Change user email
	 *
	 * @return void
	 *//*
	      function change_email()
	      {
	      if (!$this->tank_auth->is_logged_in()) {								// not logged in or not activated
	      redirect('/connexion/');

	      } else {
	      $this->form_validation->set_rules('password', 'Password', 'trim|required|xss_clean');
	      $this->form_validation->set_rules('email', 'Email', 'trim|required|xss_clean|valid_email');

	      $data['errors'] = array();

	      if ($this->form_validation->run()) {								// validation ok
	      if (!is_null($data = $this->tank_auth->set_new_email(
	      $this->form_validation->set_value('email'),
	      $this->form_validation->set_value('password')))) {			// success

	      $data['site_name'] = $this->config->item('site_name');

	// Send email with new email address and its activation link
	$this->_send_email('change_email', $data['new_email'], $data);

	$this->_show_message(sprintf($this->lang->line('auth_message_new_email_sent'), $data['new_email']));
	return;

	} else {
	$errors = $this->tank_auth->get_error_message();
	foreach ($errors as $k => $v)	$data['errors'][$k] = $this->lang->line($v);
	}
	}
	$this->load->view('auth/change_email_form', $data);
	}
	}
	    */
	/**
	 * Replace user email with a new one.
	 * User is verified by user_id and authentication code in the URL.
	 * Can be called by clicking on link in mail.
	 *
	 * @return void
	 *//*
	      function reset_email()
	      {
	      $user_id		= $this->uri->segment(3);
	      $new_email_key	= $this->uri->segment(4);

	// Reset email
	if ($this->tank_auth->activate_new_email($user_id, $new_email_key)) {	// success
	$this->tank_auth->logout();
	$this->_show_message($this->lang->line('auth_message_new_email_activated').' '.anchor('/connexion/', 'Login'));

	} else {																// fail
	$this->_show_message($this->lang->line('auth_message_new_email_failed'));
	}
	}
	    */
	/**
	 * Delete user from the site (only when user is logged in)
	 *
	 * @return void
	 *//*
	      function unregister()
	      {
	      if (!$this->tank_auth->is_logged_in()) {								// not logged in or not activated
	      redirect('/connexion/');

	      } else {
	      $this->form_validation->set_rules('password', 'Password', 'trim|required|xss_clean');

	      $data['errors'] = array();

	      if ($this->form_validation->run()) {								// validation ok
	      if ($this->tank_auth->delete_user(
	      $this->form_validation->set_value('password'))) {		// success
	      $this->_show_message($this->lang->line('auth_message_unregistered'));
	      return;

	      } else {														// fail
	      $errors = $this->tank_auth->get_error_message();
	      foreach ($errors as $k => $v)	$data['errors'][$k] = $this->lang->line($v);
	      }
	      }
	      $this->load->view('auth/unregister_form', $data);
	      }
	      }
	    */
	/**
	 * Show info message
	 *
	 * @param	string
	 * @return	void
	 */
	function _show_message($message,$warning = NULL)
	{
		//$this->load->view('auth/general_message', array('message' => $message));
		if(!is_null($warning))
		{
			$data['warning']         = true;
			$data['warning_message'] = $warning;
		}

		$data['message'] = $message;

		if($this->user_agent_mobile && !$this->user_agent_mobile_bypass)
		{
			$data['current_view'] = "mobile/auth/general_message";
			$this->load->view('mobile/includes/template',$data);
		}
		else
		{
			$data['current_view'] = "auth/general_message";
			$this->load->view('includes/template',$data);
		}
		//redirect(base_url());
	}

	/**
	 * Send email message of given type (activate, forgot_password, etc.)
	 *
	 * @param	string
	 * @param	string
	 * @param	array
	 * @return	void
	 */
	function _send_email($type, $email, &$data)
	{
		$this->load->library('email');
		$this->email->from($this->config->item('email_users_admin'), $this->config->item('site_name'));
		$this->email->reply_to($this->config->item('email_users_admin'), $this->config->item('site_name'));
		$this->email->to($email);
		$this->email->subject(sprintf($this->lang->line('auth_subject_'.$type), $this->config->item('site_name')));
		$this->email->message($this->load->view('email/'.$type.'-html', $data, TRUE));
		$this->email->set_alt_message($this->load->view('email/'.$type.'-txt', $data, TRUE));
		$this->email->send();
	}

	/**
	 * Create CAPTCHA image to verify user as a human
	 *
	 * @return	string
	 */
	function _create_captcha()
	{
		$this->load->plugin('captcha');

		$cap = create_captcha(array(
					'img_path'		=> './'.$this->config->item('captcha_path', 'tank_auth'),
					'img_url'		=> base_url().$this->config->item('captcha_path', 'tank_auth'),
					'font_path'		=> './'.$this->config->item('captcha_fonts_path', 'tank_auth'),
					'font_size'		=> $this->config->item('captcha_font_size', 'tank_auth'),
					'img_width'		=> $this->config->item('captcha_width', 'tank_auth'),
					'img_height'	=> $this->config->item('captcha_height', 'tank_auth'),
					'show_grid'		=> $this->config->item('captcha_grid', 'tank_auth'),
					'expiration'	=> $this->config->item('captcha_expire', 'tank_auth'),
					));

		// Save captcha params in session
		$this->session->set_flashdata(array(
					'captcha_word' => $cap['word'],
					'captcha_time' => $cap['time'],
					));

		return $cap['image'];
	}

	/**
	 * Callback function. Check if CAPTCHA test is passed.
	 *
	 * @param	string
	 * @return	bool
	 */
	function _check_captcha($code)
	{
		$time = $this->session->flashdata('captcha_time');
		$word = $this->session->flashdata('captcha_word');

		list($usec, $sec) = explode(" ", microtime());
		$now = ((float)$usec + (float)$sec);

		if ($now - $time > $this->config->item('captcha_expire', 'tank_auth')) {
			$this->form_validation->set_message('_check_captcha', $this->lang->line('auth_captcha_expired'));
			return FALSE;

		} elseif (($this->config->item('captcha_case_sensitive', 'tank_auth') AND
					$code != $word) OR
				strtolower($code) != strtolower($word)) {
			$this->form_validation->set_message('_check_captcha', $this->lang->line('auth_incorrect_captcha'));
			return FALSE;
		}
		return TRUE;
	}

	/**
	 * Create reCAPTCHA JS and non-JS HTML to verify user as a human
	 *
	 * @return	string
	 */
	function _create_recaptcha()
	{
		$this->load->helper('recaptcha');

		$lang = 'en';
		if(strcasecmp($this->config->item('language'),'french')==0)
		{
			$lang = 'fr';
		}

		// Add custom theme so we can get only image
		$options = "<script>var RecaptchaOptions = {theme: 'custom', custom_theme_widget: 'recaptcha_widget', lang: '$lang'};</script>\n";

		// Get reCAPTCHA JS and non-JS HTML
		$html = recaptcha_get_html($this->config->item('recaptcha_public_key', 'tank_auth'));

		return $options.$html;
	}

	/**
	 * Callback function. Check if reCAPTCHA test is passed.
	 *
	 * @return	bool
	 */
	function _check_recaptcha()
	{
		$this->load->helper('recaptcha');

		$resp = recaptcha_check_answer($this->config->item('recaptcha_private_key', 'tank_auth'),
				$_SERVER['REMOTE_ADDR'],
				$_POST['recaptcha_challenge_field'],
				$_POST['recaptcha_response_field']);

		if (!$resp->is_valid) {
			$this->form_validation->set_message('_check_recaptcha', $this->lang->line('auth_incorrect_captcha'));
			return FALSE;
		}
		return TRUE;
	}

}

/* End of file auth.php */
/* Location: ./application/controllers/auth.php */
