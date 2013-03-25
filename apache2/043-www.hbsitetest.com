
<VirtualHost *:80>

    ServerName      www.hbsitetest.com
    ServerAlias     hbsitetest.com
    ServerAdmin     technical@mcwebmanagement.com

    DocumentRoot "/opt/web"
    <Directory "/opt/web">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
	AuthUserFile /etc/apache2/users.conf
	AuthName "This is a protected area" 
	AuthGroupFile /dev/null 
	AuthType Basic 
	Require valid-user 
    </Directory>

    CustomLog /opt/logs/hbsitetest.com-access.log combined
    ErrorLog /opt/logs/hbsitetest.com-error.log
    LogLevel warn

</VirtualHost>
