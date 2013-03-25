
<VirtualHost *:80>
        ServerName      www.hostelli.com
        ServerAlias     www.hostelli.com
        ServerAlias    hostelli.com
        ServerAdmin     technical@mcwebmanagement.com

        DocumentRoot "/opt/web"
        <Directory "/opt/web">
                Options Indexes FollowSymLinks MultiViews
                AllowOverride All
                Order allow,deny
                Allow from all
        </Directory>

        CustomLog /opt/logs/hostelli.com-access.log combined
        ErrorLog /opt/logs/hostelli.com-error.log
        LogLevel warn

</VirtualHost>

