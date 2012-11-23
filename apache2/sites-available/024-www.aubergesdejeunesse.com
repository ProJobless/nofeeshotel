NameVirtualHost 92.243.23.28:80

<VirtualHost 92.243.23.28:80>
        ServerName      www.aubergesdejeunesse.com
        ServerAlias     www.aubergesdejeunesse.com
        ServerAlias     aubergesdejeunesse.com
        ServerAdmin     gbourdages@graphem.ca

        DocumentRoot "/srv/d_mcweb2/www/ajroot/htdocs"
    <Directory "/srv/d_mcweb2/www/ajroot/htdocs">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        Allow from all
    </Directory>

    ScriptAlias /cgi-bin/ /srv/d_mcweb2/www/ajroot/cgi-bin/
    <Directory "/srv/d_mcweb2/www/ajroot/cgi-bin/">
        AllowOverride None
        Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
        Order allow,deny
        Allow from all
    </Directory>

    ErrorLog /srv/d_mcweb2/www/ajroot/logs/www.aubergesdejeunesse.com-error.log
    LogLevel warn

    SetEnvIf Remote_Addr "127\.0\.0\.1" loopback
    #CustomLog /srv/d_mcweb2/www/ajroot/logs/www.aubergesdejeunesse.com-access.log combined env=!loopback
    ServerSignature On

    <IfModule mod_dav.c>
        DAVLockDB /srv/d_mcweb2/www/ajroot/db/DAVLock
    </IfModule>

    <IfModule mpm_peruser_module>
        ServerEnvironment adminftp_www-adminftp
        MaxProcessors 40
    </IfModule>
    

</VirtualHost>

NameVirtualHost 92.243.23.28:443

<VirtualHost 92.243.23.28:443>

        ServerName      www.aubergesdejeunesse.com
        ServerAlias     www.aubergesdejeunesse.com
        ServerAlias     aubergesdejeunesse.com
        ServerAdmin     gbourdages@graphem.ca

        DocumentRoot "/srv/d_mcweb2/www/ajroot/htdocs"
    <Directory "/srv/d_mcweb2/www/ajroot/htdocs">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        Allow from all
    </Directory>

    ScriptAlias /cgi-bin/ /srv/d_mcweb2/www/ajroot/cgi-bin/
    <Directory "/srv/d_mcweb2/www/ajroot/cgi-bin/">
        AllowOverride None
        Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
        Order allow,deny
        Allow from all
    </Directory>

    ErrorLog /srv/d_mcweb2/www/ajroot/logs/www.aubergesdejeunesse.com-error.log
    LogLevel warn

    SetEnvIf Remote_Addr "127\.0\.0\.1" loopback
    #CustomLog /srv/d_mcweb2/www/ajroot/logs/www.aubergesdejeunesse.com-access.log combined env=!loopback
    ServerSignature On

    <IfModule mod_dav.c>
        DAVLockDB /srv/d_mcweb2/www/ajroot/db/DAVLock
    </IfModule>

    <IfModule mpm_peruser_module>
        ServerEnvironment adminftp_www-adminftp
        MaxProcessors 40
    </IfModule>

    
    SSLEngine on

    SSLCertificateFile      /etc/apache2/ssl-cert/aubergesdejeunesse-new.com.crt
    SSLCACertificateFile    /etc/apache2/ssl-cert/aubergesdejeunesse-new.com.pem
    SSLCertificateKeyFile   /etc/apache2/ssl-cert/aubergesdejeunesse-new.com.key

</VirtualHost>

