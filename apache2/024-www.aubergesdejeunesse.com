
<VirtualHost *:80>
        ServerName      www.aubergesdejeunesse.com
        ServerAlias     www.aubergesdejeunesse.com
        ServerAlias     aubergesdejeunesse.com
        ServerAdmin     technical@mcwebmanagement.com

        DocumentRoot "/opt/web"
        <Directory "/opt/web">
                Options Indexes FollowSymLinks MultiViews
                AllowOverride All
                Order allow,deny
                Allow from all
        </Directory>

        CustomLog /opt/logs/aubergesdejeunesse.com-access.log combined
        ErrorLog /opt/logs/aubergesdejeunesse.com-error.log
        LogLevel warn
 

</VirtualHost>
